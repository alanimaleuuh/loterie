"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireUser, destroyAllSessions, createSession } from "@/server/auth/session";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { rateLimit, RATE_RULES } from "@/server/security/rate-limit";
import { logActivity } from "@/server/audit";
import { changePasswordSchema, fieldErrors, profileSchema } from "@/lib/validation";
import type { FormState } from "./types";

export async function updateProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!rateLimit(`account:${user.id}`, RATE_RULES.account).ok) return { error: "Trop de requêtes, patientez un instant." };
  const parsed = profileSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  await db.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      displayName: parsed.data.displayName,
      marketingOptIn: parsed.data.marketing === "on",
    },
  });
  revalidatePath("/mon-compte");
  return { ok: true, message: "Profil mis à jour." };
}

export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!rateLimit(`pwd:${user.id}`, RATE_RULES.login).ok) return { error: "Trop de tentatives, patientez une minute." };
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(parsed.data.currentPassword, record.passwordHash))) {
    return { fieldErrors: { currentPassword: "Mot de passe actuel incorrect" } };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  // Invalide toutes les sessions (autres appareils) puis reconnecte l'appareil courant
  await destroyAllSessions(user.id);
  await createSession(user.id);
  await logActivity(user, "auth.password_changed", "user", user.id);
  return { ok: true, message: "Mot de passe modifié. Vos autres sessions ont été déconnectées." };
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}
