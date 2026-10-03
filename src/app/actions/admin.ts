"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth/session";
import { logActivity } from "@/server/audit";
import { getRequestMeta } from "@/server/security/request";
import { rateLimit, RATE_RULES } from "@/server/security/rate-limit";
import { saveImageUpload } from "@/server/storage";
import { cancelDraw, executeDraw } from "@/server/draws/engine";
import { sendNotification } from "@/server/mail";
import { templates } from "@/server/mail/templates";
import { generateSeed } from "@/lib/fairness";
import { fieldErrors } from "@/lib/validation";
import { fromParisInputValue } from "@/lib/format";
import type { FormState } from "./types";

async function admin() {
  const user = await requireAdmin();
  const { ip } = await getRequestMeta();
  if (!rateLimit(`admin:${user.id}`, RATE_RULES.admin).ok) throw new Error("Trop de requêtes");
  return { user, ip };
}

const euros = z
  .string()
  .trim()
  .regex(/^\d{1,7}([.,]\d{1,2})?$/, "Montant invalide (ex. 3 ou 3,50)")
  .transform((v) => Math.round(parseFloat(v.replace(",", ".")) * 100));

const idSchema = z.string().regex(/^[a-z0-9]{10,40}$/i);

// ─────────────────────────────── Lots (produits) ───────────────────────────────

const productSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(120),
  reference: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,20}$/, "Lettres, chiffres et tirets (ex. LOT-1040)"),
  brand: z.string().trim().max(60).optional(),
  categoryId: z.string().min(1, "Catégorie requise"),
  shortDescription: z.string().trim().min(5, "Résumé requis").max(200),
  description: z.string().trim().min(10, "Description requise").max(5000),
  displayValue: euros.refine((v) => v > 0, "Valeur requise"),
  purchaseCost: euros,
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

async function handleImages(fd: FormData, productId: string) {
  const files = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const existing = await db.productImage.count({ where: { productId } });
  let order = existing;
  for (const file of files.slice(0, 8)) {
    const url = await saveImageUpload(file);
    await db.productImage.create({ data: { productId, url, alt: String(fd.get("name") ?? "Photo du lot"), sortOrder: order++ } });
  }
  const remove = fd.getAll("removeImage").map(String).filter((x) => /^[a-z0-9]+$/i.test(x));
  if (remove.length) await db.productImage.deleteMany({ where: { productId, id: { in: remove } } });
}

export async function saveProductAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { user, ip } = await admin();
  const id = fd.get("id") ? String(fd.get("id")) : null;
  const parsed = productSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const data = { ...parsed.data, brand: parsed.data.brand || null };

  const dup = await db.product.findFirst({ where: { reference: data.reference, ...(id ? { NOT: { id } } : {}) } });
  if (dup) return { fieldErrors: { reference: "Référence déjà utilisée" } };

  let productId = id;
  try {
    if (id) {
      idSchema.parse(id);
      await db.product.update({ where: { id }, data });
      await logActivity(user, "product.updated", "product", id, { reference: data.reference }, ip);
    } else {
      const p = await db.product.create({ data });
      productId = p.id;
      await logActivity(user, "product.created", "product", p.id, { reference: data.reference }, ip);
    }
    await handleImages(fd, productId!);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur lors de l'enregistrement" };
  }
  revalidatePath("/admin/produits");
  redirect(`/admin/produits/${productId}?ok=1`);
}

export async function duplicateProductAction(fd: FormData) {
  const { user, ip } = await admin();
  const id = idSchema.parse(fd.get("id"));
  const p = await db.product.findUniqueOrThrow({ where: { id }, include: { images: true } });
  let n = 2;
  let reference = `${p.reference}-C`;
  while (await db.product.findUnique({ where: { reference } })) reference = `${p.reference}-C${n++}`;
  const copy = await db.product.create({
    data: {
      reference, name: `${p.name} (copie)`, brand: p.brand, shortDescription: p.shortDescription, description: p.description,
      categoryId: p.categoryId, purchaseCost: p.purchaseCost, displayValue: p.displayValue, status: "INACTIVE",
      images: { create: p.images.map((i) => ({ url: i.url, alt: i.alt, sortOrder: i.sortOrder })) },
    },
  });
  await logActivity(user, "product.duplicated", "product", copy.id, { from: id }, ip);
  redirect(`/admin/produits/${copy.id}`);
}

export async function toggleProductAction(fd: FormData) {
  const { user, ip } = await admin();
  const id = idSchema.parse(fd.get("id"));
  const p = await db.product.findUniqueOrThrow({ where: { id } });
  const status = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await db.product.update({ where: { id }, data: { status } });
  await logActivity(user, status === "ACTIVE" ? "product.enabled" : "product.disabled", "product", id, undefined, ip);
  revalidatePath("/admin/produits");
}

export async function deleteProductAction(fd: FormData) {
  const { user, ip } = await admin();
  const id = idSchema.parse(fd.get("id"));
  const draws = await db.draw.count({ where: { productId: id } });
  if (draws > 0) redirect(`/admin/produits?erreur=${encodeURIComponent("Ce lot est lié à des tirages : désactivez-le plutôt que de le supprimer.")}`);
  await db.product.delete({ where: { id } });
  await logActivity(user, "product.deleted", "product", id, undefined, ip);
  redirect("/admin/produits?supprime=1");
}

// ─────────────────────────────── Tirages ───────────────────────────────

const drawSchema = z
  .object({
    productId: z.string().min(1, "Choisissez un lot"),
    ticketPrice: euros.refine((v) => v >= 50, "Minimum 0,50 €"),
    maxTickets: z.coerce.number().int().min(2, "Minimum 2").max(100_000),
    minTickets: z.union([z.literal(""), z.coerce.number().int().min(1)]).optional(),
    startsAt: z.string().min(1, "Date requise"),
    endsAt: z.string().min(1, "Date requise"),
    featured: z.literal("on").optional(),
  })
  .transform((d) => ({
    ...d,
    minTickets: d.minTickets === "" || d.minTickets === undefined ? null : d.minTickets,
    start: fromParisInputValue(d.startsAt),
    end: fromParisInputValue(d.endsAt),
  }))
  .refine((d) => !Number.isNaN(d.start.getTime()) && !Number.isNaN(d.end.getTime()), { path: ["startsAt"], message: "Date invalide" })
  .refine((d) => d.end.getTime() - d.start.getTime() >= 10 * 60_000, { path: ["endsAt"], message: "La fin doit être au moins 10 min après le début" })
  .refine((d) => d.minTickets === null || d.minTickets <= d.maxTickets, { path: ["minTickets"], message: "Le minimum dépasse le maximum" });

export async function saveDrawAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { user, ip } = await admin();
  const id = fd.get("id") ? idSchema.parse(fd.get("id")) : null;
  const parsed = drawSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const product = await db.product.findUnique({ where: { id: d.productId } });
  if (!product) return { fieldErrors: { productId: "Lot introuvable" } };

  if (!id) {
    if (d.end.getTime() <= Date.now()) return { fieldErrors: { endsAt: "La date de fin doit être dans le futur" } };
    const draw = await db.draw.create({
      data: {
        productId: d.productId, ticketPrice: d.ticketPrice, maxTickets: d.maxTickets, minTickets: d.minTickets,
        startsAt: d.start, endsAt: d.end, featured: d.featured === "on", ...generateSeed(),
      },
    });
    await logActivity(user, "draw.created", "draw", draw.id, { number: draw.number, product: product.reference }, ip);
    redirect(`/admin/tirages/${draw.id}?ok=1`);
  }

  const current = await db.draw.findUniqueOrThrow({ where: { id } });
  if (current.status !== "SCHEDULED" && current.status !== "DISABLED") return { error: "Ce tirage est clôturé : il ne peut plus être modifié." };
  const started = current.soldTickets > 0;
  // Une fois des tickets vendus, les règles annoncées ne peuvent plus être durcies.
  if (started) {
    if (d.ticketPrice !== current.ticketPrice) return { fieldErrors: { ticketPrice: "Prix verrouillé : des tickets ont déjà été vendus" } };
    if (d.productId !== current.productId) return { fieldErrors: { productId: "Lot verrouillé : des tickets ont déjà été vendus" } };
    if (d.maxTickets < current.maxTickets) return { fieldErrors: { maxTickets: "Impossible de réduire le nombre de tickets après le début des ventes" } };
    if ((d.minTickets ?? 0) > (current.minTickets ?? 0)) return { fieldErrors: { minTickets: "Impossible d'augmenter le minimum après le début des ventes" } };
    if (d.end.getTime() < current.endsAt.getTime()) return { fieldErrors: { endsAt: "Impossible d'avancer la fin après le début des ventes" } };
    if (d.start.getTime() !== current.startsAt.getTime()) return { fieldErrors: { startsAt: "Date de début verrouillée" } };
  }
  if (d.end.getTime() <= Date.now()) return { fieldErrors: { endsAt: "La date de fin doit être dans le futur" } };
  await db.draw.update({
    where: { id },
    data: { productId: d.productId, ticketPrice: d.ticketPrice, maxTickets: d.maxTickets, minTickets: d.minTickets, startsAt: d.start, endsAt: d.end, featured: d.featured === "on" },
  });
  await logActivity(user, "draw.updated", "draw", id, { before: { endsAt: current.endsAt, maxTickets: current.maxTickets, ticketPrice: current.ticketPrice }, after: { endsAt: d.end, maxTickets: d.maxTickets, ticketPrice: d.ticketPrice } }, ip);
  redirect(`/admin/tirages/${id}?ok=1`);
}

export async function toggleDrawAction(fd: FormData) {
  const { user, ip } = await admin();
  const id = idSchema.parse(fd.get("id"));
  const d = await db.draw.findUniqueOrThrow({ where: { id } });
  if (d.status === "SCHEDULED") {
    if (d.soldTickets > 0) redirect(`/admin/tirages/${id}?erreur=${encodeURIComponent("Des tickets ont été vendus : annulez le tirage (avec remboursement) au lieu de le désactiver.")}`);
    await db.draw.update({ where: { id }, data: { status: "DISABLED" } });
    await logActivity(user, "draw.disabled", "draw", id, undefined, ip);
  } else if (d.status === "DISABLED") {
    await db.draw.update({ where: { id }, data: { status: "SCHEDULED" } });
    await logActivity(user, "draw.enabled", "draw", id, undefined, ip);
  }
  revalidatePath(`/admin/tirages/${id}`);
}

export async function duplicateDrawAction(fd: FormData) {
  const { user, ip } = await admin();
  const id = idSchema.parse(fd.get("id"));
  const d = await db.draw.findUniqueOrThrow({ where: { id } });
  const duration = d.endsAt.getTime() - d.startsAt.getTime();
  const start = new Date(Date.now() + 24 * 3600_000);
  const copy = await db.draw.create({
    data: {
      productId: d.productId, ticketPrice: d.ticketPrice, maxTickets: d.maxTickets, minTickets: d.minTickets,
      startsAt: start, endsAt: new Date(start.getTime() + duration), status: "DISABLED", ...generateSeed(),
    },
  });
  await logActivity(user, "draw.duplicated", "draw", copy.id, { from: id }, ip);
  redirect(`/admin/tirages/${copy.id}/modifier`);
}

export async function deleteDrawAction(fd: FormData) {
  const { user, ip } = await admin();
  const id = idSchema.parse(fd.get("id"));
  const d = await db.draw.findUniqueOrThrow({ where: { id } });
  const parts = await db.participation.count({ where: { drawId: id } });
  if (parts > 0 || d.status === "DRAWN" || d.status === "CLOSED") {
    redirect(`/admin/tirages/${id}?erreur=${encodeURIComponent("Suppression impossible : ce tirage a des participations. Utilisez l'annulation.")}`);
  }
  await db.notification.updateMany({ where: { drawId: id }, data: { drawId: null } });
  await db.draw.delete({ where: { id } });
  await logActivity(user, "draw.deleted", "draw", id, { number: d.number }, ip);
  redirect("/admin/tirages?supprime=1");
}

export async function cancelDrawAction(fd: FormData) {
  const { user } = await admin();
  const id = idSchema.parse(fd.get("id"));
  const reason = z.string().trim().min(3).max(200).safeParse(fd.get("reason"));
  if (!reason.success) redirect(`/admin/tirages/${id}?erreur=${encodeURIComponent("Indiquez un motif d'annulation.")}`);
  await cancelDraw(id, reason.data, user);
  redirect(`/admin/tirages/${id}?ok=1`);
}

export async function runDrawNowAction(fd: FormData) {
  const { user } = await admin();
  const id = idSchema.parse(fd.get("id"));
  const d = await db.draw.findUniqueOrThrow({ where: { id } });
  // L'admin ne peut pas avancer un tirage : seulement déclencher un tirage déjà échu.
  if (d.endsAt.getTime() > Date.now()) redirect(`/admin/tirages/${id}?erreur=${encodeURIComponent("Le tirage ne peut être effectué qu'après la date de fin annoncée.")}`);
  await executeDraw(id, { actor: user });
  redirect(`/admin/tirages/${id}?ok=1`);
}

const PRIZE_LABEL = { PENDING: "en attente", CONTACTED: "gagnant contacté", SHIPPED: "lot expédié", DELIVERED: "lot remis" } as const;

export async function updatePrizeStatusAction(fd: FormData) {
  const { user, ip } = await admin();
  const id = idSchema.parse(fd.get("id"));
  const status = z.enum(["PENDING", "CONTACTED", "SHIPPED", "DELIVERED"]).parse(fd.get("prizeStatus"));
  const d = await db.draw.findUniqueOrThrow({ where: { id }, include: { winner: { include: { user: true } }, product: true } });
  if (d.status !== "DRAWN" || !d.winner) redirect(`/admin/tirages/${id}`);
  await db.draw.update({ where: { id }, data: { prizeStatus: status } });
  await logActivity(user, "draw.prize_status", "draw", id, { status }, ip);
  await sendNotification({
    userId: d.winner.userId, to: d.winner.user.email, type: "PRIZE_DELIVERY", drawId: id,
    content: templates.prizeDelivery({ firstName: d.winner.user.firstName, productName: d.product.name, status: PRIZE_LABEL[status] }),
  });
  redirect(`/admin/tirages/${id}?ok=1`);
}

// ─────────────────────────────── Utilisateurs ───────────────────────────────

export async function toggleUserStatusAction(fd: FormData) {
  const { user, ip } = await admin();
  const id = idSchema.parse(fd.get("id"));
  if (id === user.id) redirect(`/admin/utilisateurs/${id}`);
  const u = await db.user.findUniqueOrThrow({ where: { id } });
  const status = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  await db.user.update({ where: { id }, data: { status } });
  if (status === "SUSPENDED") await db.session.deleteMany({ where: { userId: id } });
  await logActivity(user, status === "SUSPENDED" ? "user.suspended" : "user.reactivated", "user", id, undefined, ip);
  revalidatePath(`/admin/utilisateurs/${id}`);
}
