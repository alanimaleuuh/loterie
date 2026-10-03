import type { Metadata } from "next";
import Link from "next/link";
import { clsx } from "clsx";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { processDueDraws } from "@/server/draws/engine";
import { AccountHeader } from "@/components/account/AccountHeader";
import { LotImage } from "@/components/draw/LotImage";
import { StatusBadge } from "@/components/draw/StatusBadge";
import { Countdown } from "@/components/draw/Countdown";
import { EmptyState } from "@/components/ui/Section";
import { getDisplayStatus } from "@/lib/draw-status";
import { formatDate, formatEuro, ticketLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Mes participations", robots: { index: false } };

const PRIZE = { PENDING: "En attente de contact", CONTACTED: "Gagnant contacté", SHIPPED: "Lot expédié", DELIVERED: "Lot remis" } as const;

export default async function ParticipationsPage({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const user = await requireUser("/mes-participations");
  await processDueDraws();
  const { filtre = "tous" } = await searchParams;

  const parts = await db.participation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      tickets: { select: { number: true }, orderBy: { number: "asc" } },
      draw: { include: { product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } }, winner: true } },
    },
  });

  // Regroupement par tirage
  const byDraw = new Map<string, { draw: (typeof parts)[number]["draw"]; qty: number; amount: number; first: Date; tickets: number[]; refunded: boolean }>();
  for (const p of parts) {
    const g = byDraw.get(p.drawId) ?? { draw: p.draw, qty: 0, amount: 0, first: p.createdAt, tickets: [], refunded: p.status === "REFUNDED" };
    g.qty += p.quantity;
    g.amount += p.totalAmount;
    if (p.createdAt < g.first) g.first = p.createdAt;
    g.tickets.push(...p.tickets.map((t) => t.number));
    byDraw.set(p.drawId, g);
  }
  const now = Date.now();
  let rows = [...byDraw.values()];
  const counts = {
    tous: rows.length,
    "en-cours": rows.filter((r) => r.draw.status === "SCHEDULED").length,
    termines: rows.filter((r) => r.draw.status !== "SCHEDULED").length,
    gagnes: rows.filter((r) => r.draw.winner?.userId === user.id).length,
  };
  if (filtre === "en-cours") rows = rows.filter((r) => r.draw.status === "SCHEDULED");
  if (filtre === "termines") rows = rows.filter((r) => r.draw.status !== "SCHEDULED");
  if (filtre === "gagnes") rows = rows.filter((r) => r.draw.winner?.userId === user.id);

  const filters = [
    { k: "tous", l: "Tous" },
    { k: "en-cours", l: "En cours" },
    { k: "termines", l: "Terminés" },
    { k: "gagnes", l: "Gagnés" },
  ] as const;

  return (
    <div className="container-page">
      <AccountHeader title="Mes participations" subtitle="Tous vos tirages, vos tickets et leurs résultats." />
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link key={f.k} href={f.k === "tous" ? "/mes-participations" : `/mes-participations?filtre=${f.k}`} className={clsx("rounded-full px-4 py-2 text-sm font-medium transition", filtre === f.k ? "bg-ink-950 text-white" : "bg-white text-ink-700 ring-1 ring-ink-200 hover:ring-ink-300")}>
            {f.l} <span className="ml-1 opacity-60">{counts[f.k]}</span>
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Aucune participation ici" description="Choisissez un lot et participez à votre premier tirage." action={<Link href="/tirages" className="btn-primary">Voir les tirages</Link>} />
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => {
            const status = getDisplayStatus(r.draw, now);
            const won = r.draw.winner?.userId === user.id;
            return (
              <li key={r.draw.id} className={clsx("card overflow-hidden", won && "ring-2 ring-brand-500")}>
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
                  <Link href={`/tirages/${r.draw.id}`} className="h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-sand-100 sm:h-24 sm:w-32">
                    <LotImage src={r.draw.product.images[0]?.url} alt={r.draw.product.name} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={status} />
                      <span className="text-xs text-ink-400">Tirage n°{r.draw.number}</span>
                    </div>
                    <Link href={`/tirages/${r.draw.id}`} className="mt-2 block text-lg font-semibold text-ink-950 hover:underline">{r.draw.product.name}</Link>
                    <p className="mt-1 text-sm text-ink-600">
                      {r.qty} ticket{r.qty > 1 ? "s" : ""} · {formatEuro(r.amount)} (démo) · participation du {formatDate(r.first)}
                    </p>
                  </div>
                  <div className="shrink-0 sm:w-64 sm:text-right">
                    {won ? (
                      <div>
                        <p className="text-lg font-semibold text-brand-700">Gagné 🎉</p>
                        <p className="text-sm text-ink-600">Ticket {ticketLabel(r.draw.winner!.ticketNumber)}</p>
                        <p className="mt-1 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{PRIZE[r.draw.prizeStatus]}</p>
                      </div>
                    ) : r.draw.status === "DRAWN" ? (
                      <div>
                        <p className="font-semibold text-ink-900">Tirage terminé</p>
                        <p className="text-sm text-ink-500">Gagnant : autre participant ({ticketLabel(r.draw.winner!.ticketNumber)})</p>
                      </div>
                    ) : r.draw.status === "CANCELLED" ? (
                      <div>
                        <p className="font-semibold text-ink-900">Tirage annulé</p>
                        <p className="text-sm text-ink-500">Remboursé intégralement (démo)</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-ink-500">{status === "upcoming" ? "Ouverture dans" : "Résultat dans"}</p>
                        <Countdown target={r.draw.endsAt.toISOString()} serverNow={now} />
                      </div>
                    )}
                  </div>
                </div>
                <details className="group border-t border-ink-100 bg-paper/60 px-5 py-3">
                  <summary className="cursor-pointer list-none text-sm font-medium text-ink-600 hover:text-ink-900">
                    <span className="group-open:hidden">Voir mes {r.tickets.length} numéros de tickets ▾</span>
                    <span className="hidden group-open:inline">Masquer les numéros ▴</span>
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-1.5 pb-1">
                    {r.tickets.sort((a, b) => a - b).map((n) => (
                      <span key={n} className={clsx("rounded-lg px-2 py-1 font-mono text-xs", r.draw.winner?.ticketNumber === n ? "bg-brand-600 text-white" : "bg-white text-ink-700 ring-1 ring-ink-200")}>
                        {ticketLabel(n)}
                      </span>
                    ))}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
