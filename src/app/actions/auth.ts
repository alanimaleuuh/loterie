"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { db } from "@/server/db";
import { hashPassword, verifyPassword, dummyHash } from "@/server/auth/password";
import { createSession, destroySession, destroyAllSessions } from "@/server/auth/session";
import { rateLimit, RATE_RULES } from "@/server/security/rate-limit";
import { getRequestMeta } from "@/server/security/request";
import { logActivity } from "@/server/audit";
import { sendNotification } from "@/server/mail";
import { templates } from "@/server/mail/templates";
import { sha256 } from "@/lib/fairness";
import { SITE } from "@/lib/config";
import { fieldErrors, forgotSchema, loginSchema, registerSchema, resetSchema, safeNext } from "@/lib/validation";
import type { FormState } from "./types";

const pick = (fd: FormData, keys: string[]) => Object.fromEntries(keys.map((k) => [k, String(fd.get(k) ?? "")]));

export async function registerAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { ip } = await getRequestMeta();
  const values = pick(fd, ["firstName", "lastName", "displayName", "email", "birthDate", "terms", "marketing"]);
  const parsed = registerSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const d = parsed.data;
  // Limitation comptée sur les tentatives valides (celles qui touchent la base)
  const rl = rateLimit(`register:${ip}`, RATE_RULES.register);
  if (!rl.ok) return { error: `Trop de tentatives. Réessayez dans ${rl.retryAfterSec} s.`, values };

  const exists = await db.user.findUnique({ where: { email: d.email }, select: { id: true } });
  if (exists) return { fieldErrors: { email: "Un compte existe déjà avec cette adresse. Connectez-vous." }, values };

  const user = await db.user.create({
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      displayName: d.displayName || d.firstName,
      email: d.email,
      passwordHash: await hashPassword(d.password),
      birthDate: new Date(d.birthDate),
      termsAcceptedAt: new Date(),
      marketingOptIn: d.marketing === "on",
    },
  });
  await createSession(user.id);
  await logActivity({ id: user.id, displayName: user.displayName }, "user.registered", "user", user.id, undefined, ip);
  await sendNotification({ userId: user.id, to: user.email, type: "ACCOUNT_CREATED", content: templates.accountCreated({ firstName: user.firstName }) });
  redirect(safeNext(fd.get("next"), "/tirages?bienvenue=1"));
}

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { ip } = await getRequestMeta();
  const values = pick(fd, ["email"]);
  const parsed = loginSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const { email, password } = parsed.data;

  const rlIp = rateLimit(`login:ip:${ip}`, RATE_RULES.login);
  const rlEmail = rateLimit(`login:email:${email}`, RATE_RULES.login);
  if (!rlIp.ok || !rlEmail.ok) {
    return { error: `Trop de tentatives de connexion. Réessayez dans ${Math.max(rlIp.retryAfterSec, rlEmail.retryAfterSec)} s.`, values };
  }

  const user = await db.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash ?? dummyHash());
  if (!user || !valid) {
    await logActivity("system", "auth.login_failed", "user", user?.id ?? null, { email: email.replace(/(.{2}).*@/, "$1***@") }, ip);
    return { error: "Adresse e-mail ou mot de passe incorrect.", values };
  }
  if (user.status !== "ACTIVE") return { error: "Ce compte est suspendu. Contactez le support.", values };

  await createSession(user.id);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  if (user.role === "ADMIN") await logActivity({ id: user.id, displayName: user.displayName }, "auth.admin_login", "user", user.id, undefined, ip);
  redirect(safeNext(parsed.data.next, user.role === "ADMIN" ? "/admin" : "/tirages"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { ip } = await getRequestMeta();
  const rl = rateLimit(`forgot:${ip}`, RATE_RULES.forgot);
  if (!rl.ok) return { error: `Trop de demandes. Réessayez dans ${rl.retryAfterSec} s.` };
  const parsed = forgotSchema.safeParse({ email: fd.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: pick(fd, ["email"]) };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user && user.status === "ACTIVE") {
    const token = randomBytes(32).toString("base64url");
    await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 3600_000) },
    });
    await sendNotification({
      userId: user.id,
      to: user.email,
      type: "PASSWORD_RESET",
      content: templates.passwordReset({ firstName: user.firstName, link: `${SITE.url}/reinitialiser-mot-de-passe?token=${token}` }),
    });
  }
  // Réponse identique que le compte existe ou non (anti-énumération)
  return { ok: true, message: "Si un compte correspond à cette adresse, un e-mail de réinitialisation vient d'être envoyé." };
}

export async function resetPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "Ce lien est invalide ou a expiré. Faites une nouvelle demande." };
  }
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await destroyAllSessions(record.userId);
  await logActivity({ id: record.userId }, "auth.password_reset", "user", record.userId);
  redirect("/connexion?reinitialise=1");
}
