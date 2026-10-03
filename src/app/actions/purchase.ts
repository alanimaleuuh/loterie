"use server";

import { getCurrentUser } from "@/server/auth/session";
import { purchaseTickets, PurchaseError } from "@/server/draws/engine";
import { rateLimit, RATE_RULES } from "@/server/security/rate-limit";
import { fieldErrors, purchaseSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export type PurchaseState =
  | { status: "idle" }
  | { status: "error"; error: string; fieldErrors?: Record<string, string> }
  | { status: "success"; participationId: string; ticketNumbers: number[]; amount: number };

export async function purchaseAction(_prev: PurchaseState, fd: FormData): Promise<PurchaseState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", error: "Votre session a expiré. Reconnectez-vous." };

  const rl = rateLimit(`purchase:${user.id}`, RATE_RULES.purchase);
  if (!rl.ok) return { status: "error", error: `Trop de tentatives. Réessayez dans ${rl.retryAfterSec} s.` };

  const parsed = purchaseSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { status: "error", error: "Vérifiez les informations saisies.", fieldErrors: fieldErrors(parsed.error) };

  const [mm, yy] = parsed.data.cardExpiry.split("/").map((s) => parseInt(s.trim(), 10));
  const expiry = new Date(2000 + yy, mm, 1);
  if (expiry <= new Date()) return { status: "error", error: "Vérifiez les informations saisies.", fieldErrors: { cardExpiry: "Carte expirée" } };

  try {
    const res = await purchaseTickets({
      userId: user.id,
      drawId: parsed.data.drawId,
      quantity: parsed.data.quantity,
      testCardNumber: parsed.data.cardNumber,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    revalidatePath(`/tirages/${parsed.data.drawId}`);
    return { status: "success", ...res };
  } catch (e) {
    if (e instanceof PurchaseError) return { status: "error", error: e.message };
    console.error("[purchaseAction]", e);
    return { status: "error", error: "Une erreur inattendue est survenue. Vous n'avez pas été débité." };
  }
}
