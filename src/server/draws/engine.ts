import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { computeResultHash, drawWinner, GENESIS_HASH } from "@/lib/fairness";
import { MAX_TICKETS_PER_ORDER, REMINDER_BEFORE_MS } from "@/lib/config";
import { getPaymentProvider } from "@/server/payments";
import { sendNotification } from "@/server/mail";
import { templates } from "@/server/mail/templates";
import { logActivity } from "@/server/audit";

export class PurchaseError extends Error {}

type LockedDraw = {
  id: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  maxTickets: number;
  soldTickets: number;
  ticketPrice: number;
};

async function lockDraw(tx: Prisma.TransactionClient, drawId: string): Promise<LockedDraw | null> {
  const rows = await tx.$queryRaw<LockedDraw[]>`
    SELECT id, status::text AS status, "startsAt", "endsAt", "maxTickets", "soldTickets", "ticketPrice"
    FROM draws WHERE id = ${drawId} FOR UPDATE`;
  return rows[0] ?? null;
}

/**
 * Achat de tickets.
 * 1. Vérifications préalables (tirage ouvert, quantité disponible).
 * 2. Paiement auprès du prestataire (simulé).
 * 3. Transaction : verrou de ligne sur le tirage, nouvelle vérification, attribution
 *    de numéros séquentiels, création participation + tickets.
 * 4. Si l'attribution échoue après paiement → remboursement automatique (compensation).
 */
export async function purchaseTickets(opts: {
  userId: string;
  drawId: string;
  quantity: number;
  testCardNumber: string;
  idempotencyKey: string;
}) {
  const { userId, drawId, quantity } = opts;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_ORDER) {
    throw new PurchaseError(`Vous pouvez acheter entre 1 et ${MAX_TICKETS_PER_ORDER} tickets par commande.`);
  }

  const draw = await db.draw.findUnique({ where: { id: drawId }, include: { product: true } });
  if (!draw || draw.status !== "SCHEDULED" || draw.product.status !== "ACTIVE") throw new PurchaseError("Ce tirage n'est pas disponible.");
  const now = Date.now();
  if (now < draw.startsAt.getTime()) throw new PurchaseError("Ce tirage n'a pas encore commencé.");
  if (now >= draw.endsAt.getTime()) throw new PurchaseError("Ce tirage est terminé.");
  const remaining = draw.maxTickets - draw.soldTickets;
  if (remaining <= 0) throw new PurchaseError("Tous les tickets ont été vendus.");
  if (quantity > remaining) throw new PurchaseError(`Il ne reste que ${remaining} ticket(s) disponible(s).`);

  // Idempotence : un double-clic ne doit pas créer deux paiements
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(opts.idempotencyKey)) throw new PurchaseError("Requête invalide, rechargez la page.");
  const existing = await db.payment.findUnique({ where: { idempotencyKey: opts.idempotencyKey } });
  if (existing) throw new PurchaseError("Cette commande a déjà été traitée. Consultez vos participations.");

  const amount = quantity * draw.ticketPrice;
  const provider = getPaymentProvider();
  const charge = await provider.charge({
    amount,
    currency: "EUR",
    description: `Tirage n°${draw.number} — ${quantity} ticket(s)`,
    testCardNumber: opts.testCardNumber,
    idempotencyKey: opts.idempotencyKey,
  });

  if (!charge.ok) {
    await db.payment.create({
      data: {
        userId,
        amount,
        provider: provider.name,
        status: "FAILED",
        idempotencyKey: opts.idempotencyKey,
        failureReason: charge.reason,
        cardBrand: charge.cardBrand,
        cardLast4: charge.cardLast4,
        isDemo: provider.isDemo,
      },
    });
    throw new PurchaseError(charge.reason);
  }

  const payment = await db.payment.create({
    data: {
      userId,
      amount,
      provider: provider.name,
      providerRef: charge.providerRef,
      idempotencyKey: opts.idempotencyKey,
      status: "SUCCEEDED",
      cardBrand: charge.cardBrand,
      cardLast4: charge.cardLast4,
      isDemo: provider.isDemo,
    },
  });

  try {
    const result = await db.$transaction(async (tx) => {
      const locked = await lockDraw(tx, drawId);
      if (!locked || locked.status !== "SCHEDULED") throw new PurchaseError("Ce tirage n'est plus disponible.");
      const t = Date.now();
      if (t < locked.startsAt.getTime() || t >= locked.endsAt.getTime()) throw new PurchaseError("Ce tirage est fermé.");
      const left = locked.maxTickets - locked.soldTickets;
      if (quantity > left) throw new PurchaseError(left > 0 ? `Il ne reste que ${left} ticket(s).` : "Tous les tickets ont été vendus.");

      const participation = await tx.participation.create({
        data: {
          userId,
          drawId,
          paymentId: payment.id,
          quantity,
          unitPrice: locked.ticketPrice,
          totalAmount: quantity * locked.ticketPrice,
        },
      });
      const numbers = Array.from({ length: quantity }, (_, i) => locked.soldTickets + i + 1);
      await tx.ticket.createMany({
        data: numbers.map((number) => ({ drawId, number, participationId: participation.id, userId })),
      });
      await tx.draw.update({ where: { id: drawId }, data: { soldTickets: { increment: quantity } } });
      return { participation, numbers };
    });

    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    await sendNotification({
      userId,
      to: user.email,
      type: "PARTICIPATION_CONFIRMED",
      drawId,
      content: templates.participationConfirmed({
        firstName: user.firstName,
        productName: draw.product.name,
        drawNumber: draw.number,
        tickets: result.numbers,
        total: amount,
        endsAt: draw.endsAt,
        drawId,
      }),
    });
    return { participationId: result.participation.id, ticketNumbers: result.numbers, amount };
  } catch (e) {
    // Compensation : remboursement si l'attribution des tickets a échoué
    await provider.refund(charge.providerRef, amount);
    await db.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED", refundedAt: new Date(), failureReason: "Attribution impossible — remboursé automatiquement" } });
    if (e instanceof PurchaseError) throw e;
    console.error("[purchase] erreur", e);
    throw new PurchaseError("Une erreur est survenue. Vous n'avez pas été débité.");
  }
}

async function refundDraw(drawId: string) {
  const provider = getPaymentProvider();
  const participations = await db.participation.findMany({
    where: { drawId, status: "CONFIRMED" },
    include: { payment: true, user: true },
  });
  for (const p of participations) {
    if (p.payment.providerRef) await provider.refund(p.payment.providerRef, p.totalAmount);
    await db.$transaction([
      db.payment.update({ where: { id: p.paymentId }, data: { status: "REFUNDED", refundedAt: new Date() } }),
      db.participation.update({ where: { id: p.id }, data: { status: "REFUNDED" } }),
    ]);
  }
  return participations;
}

/**
 * Clôture et tirage d'un tirage arrivé à échéance. Idempotent et sûr en concurrence :
 * verrou de ligne + verrou consultatif global pour un chaînage des résultats linéaire.
 */
export async function executeDraw(drawId: string, opts: { force?: boolean; actor?: { id: string; displayName: string }; clock?: Date } = {}) {
  const outcome = await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(424242)`;
      const locked = await lockDraw(tx, drawId);
      if (!locked || locked.status !== "SCHEDULED") return null;
      if (!opts.force && locked.endsAt.getTime() > Date.now()) return null;

      const draw = await tx.draw.findUniqueOrThrow({ where: { id: drawId }, include: { product: true } });
      const closedAt = opts.clock ?? new Date();
      await tx.draw.update({ where: { id: drawId }, data: { status: "CLOSED", closedAt } });

      const tickets = await tx.ticket.findMany({
        where: { drawId, participation: { status: "CONFIRMED" } },
        select: { id: true, number: true, userId: true },
        orderBy: { number: "asc" },
      });

      if (tickets.length === 0 || (draw.minTickets && tickets.length < draw.minTickets)) {
        const reason =
          tickets.length === 0
            ? "aucun ticket vendu"
            : `minimum de ${draw.minTickets} tickets non atteint (${tickets.length} vendus)`;
        await tx.draw.update({ where: { id: drawId }, data: { status: "CANCELLED", cancelledAt: closedAt, cancelReason: reason } });
        return { kind: "cancelled" as const, draw, reason };
      }

      const result = drawWinner(draw.serverSeed, draw.number, tickets);
      const winnerTicket = tickets.find((t) => t.id === result.ticket.id)!;
      const winnerUser = await tx.user.findUniqueOrThrow({ where: { id: winnerTicket.userId } });
      const last = await tx.winner.findFirst({ orderBy: { drawnAt: "desc" }, select: { resultHash: true } });
      const previousHash = last?.resultHash ?? GENESIS_HASH;
      const drawnAt = opts.clock ?? new Date();
      const resultHash = computeResultHash({
        drawId,
        drawNumber: draw.number,
        ticketId: winnerTicket.id,
        ticketNumber: winnerTicket.number,
        ticketCount: result.ticketCount,
        winningIndex: result.winningIndex,
        ticketsDigest: result.ticketsDigest,
        seedHash: draw.seedHash,
        serverSeed: draw.serverSeed,
        drawnAt: drawnAt.toISOString(),
        previousHash,
      });
      const winner = await tx.winner.create({
        data: {
          drawId,
          ticketId: winnerTicket.id,
          userId: winnerUser.id,
          publicName: publicWinnerName(winnerUser.displayName, winnerUser.lastName),
          ticketNumber: winnerTicket.number,
          ticketCount: result.ticketCount,
          winningIndex: result.winningIndex,
          ticketsDigest: result.ticketsDigest,
          serverSeed: draw.serverSeed,
          seedHash: draw.seedHash,
          previousHash,
          resultHash,
          drawnAt,
        },
      });
      await tx.draw.update({ where: { id: drawId }, data: { status: "DRAWN", drawnAt } });
      return { kind: "drawn" as const, draw, winner, winnerUser };
    },
    { timeout: 20_000 },
  );

  if (!outcome) return null;
  const actor = opts.actor ?? "system";

  if (outcome.kind === "cancelled") {
    const refunded = await refundDraw(drawId);
    await logActivity(actor, "draw.cancelled", "draw", drawId, { reason: outcome.reason, refunds: refunded.length });
    const byUser = new Map<string, { email: string; firstName: string; amount: number }>();
    for (const p of refunded) {
      const cur = byUser.get(p.userId) ?? { email: p.user.email, firstName: p.user.firstName, amount: 0 };
      cur.amount += p.totalAmount;
      byUser.set(p.userId, cur);
    }
    for (const [userId, u] of byUser) {
      await sendNotification({
        userId,
        to: u.email,
        type: "DRAW_CANCELLED",
        drawId,
        content: templates.drawCancelled({ firstName: u.firstName, productName: outcome.draw.product.name, reason: outcome.reason, amount: u.amount }),
      });
    }
    return outcome;
  }

  await logActivity(actor, "draw.executed", "draw", drawId, {
    winningTicket: outcome.winner.ticketNumber,
    ticketCount: outcome.winner.ticketCount,
    resultHash: outcome.winner.resultHash,
  });

  const participants = await db.user.findMany({
    where: { participations: { some: { drawId, status: "CONFIRMED" } } },
    select: { id: true, email: true, firstName: true },
  });
  for (const u of participants) {
    const won = u.id === outcome.winnerUser.id;
    await sendNotification({
      userId: u.id,
      to: u.email,
      type: won ? "DRAW_WON" : "DRAW_RESULT",
      drawId,
      content: won
        ? templates.drawWon({ firstName: u.firstName, productName: outcome.draw.product.name, ticketNumber: outcome.winner.ticketNumber, drawId })
        : templates.drawResult({
            firstName: u.firstName,
            productName: outcome.draw.product.name,
            winnerName: outcome.winner.publicName,
            ticketNumber: outcome.winner.ticketNumber,
            drawId,
          }),
    });
  }
  return outcome;
}

/** Nom public du gagnant : pseudonyme + initiale. Jamais d'e-mail ni de nom complet. */
export function publicWinnerName(displayName: string, lastName: string) {
  const initial = lastName.trim().charAt(0).toUpperCase();
  return initial ? `${displayName} ${initial}.` : displayName;
}

/** Annulation manuelle par l'administrateur (remboursement simulé de tous les participants) */
export async function cancelDraw(drawId: string, reason: string, actor: { id: string; displayName: string }) {
  const done = await db.$transaction(async (tx) => {
    const locked = await lockDraw(tx, drawId);
    if (!locked || locked.status !== "SCHEDULED") return false;
    await tx.draw.update({ where: { id: drawId }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason } });
    return true;
  });
  if (!done) return false;
  const draw = await db.draw.findUniqueOrThrow({ where: { id: drawId }, include: { product: true } });
  const refunded = await refundDraw(drawId);
  const notified = new Set<string>();
  for (const p of refunded) {
    if (notified.has(p.userId)) continue;
    notified.add(p.userId);
    const amount = refunded.filter((r) => r.userId === p.userId).reduce((s, r) => s + r.totalAmount, 0);
    await sendNotification({
      userId: p.userId,
      to: p.user.email,
      type: "DRAW_CANCELLED",
      drawId,
      content: templates.drawCancelled({ firstName: p.user.firstName, productName: draw.product.name, reason, amount }),
    });
  }
  await logActivity(actor, "draw.cancelled_manual", "draw", drawId, { reason, refunds: refunded.length });
  return true;
}

/** Rappels avant la fin du tirage */
export async function sendDueReminders() {
  const now = new Date();
  const due = await db.draw.findMany({
    where: {
      status: "SCHEDULED",
      reminderSentAt: null,
      startsAt: { lte: now },
      endsAt: { gt: now, lte: new Date(now.getTime() + REMINDER_BEFORE_MS) },
    },
    include: { product: true },
    take: 20,
  });
  for (const d of due) {
    const claimed = await db.draw.updateMany({ where: { id: d.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (claimed.count === 0) continue;
    const users = await db.user.findMany({
      where: { participations: { some: { drawId: d.id, status: "CONFIRMED" } } },
      select: { id: true, email: true, firstName: true },
    });
    for (const u of users) {
      await sendNotification({
        userId: u.id,
        to: u.email,
        type: "DRAW_REMINDER",
        drawId: d.id,
        content: templates.drawReminder({ firstName: u.firstName, productName: d.product.name, endsAt: d.endsAt, drawId: d.id }),
      });
    }
  }
  return due.length;
}

let running: Promise<number> | null = null;

/** Traite tous les tirages arrivés à échéance. Appelé par le planificateur, le cron et à la volée. */
export function processDueDraws(): Promise<number> {
  if (running) return running;
  running = (async () => {
    try {
      const due = await db.draw.findMany({
        where: { status: "SCHEDULED", endsAt: { lte: new Date() } },
        select: { id: true },
        orderBy: { endsAt: "asc" },
        take: 25,
      });
      for (const d of due) {
        try {
          await executeDraw(d.id);
        } catch (e) {
          console.error(`[draws] échec du tirage ${d.id}`, e);
        }
      }
      await sendDueReminders().catch((e) => console.error("[draws] rappels", e));
      return due.length;
    } finally {
      running = null;
    }
  })();
  return running;
}
