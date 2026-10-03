import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { db } from "@/server/db";
import { sha256 } from "@/lib/fairness";
import { getRequestMeta } from "@/server/security/request";

export const SESSION_COOKIE = "lotelia_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RENEW_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  role: "USER" | "ADMIN";
};

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const { ip, userAgent } = await getRequestMeta();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { id: sha256(token), userId, expiresAt, ip, userAgent } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

/** Utilisateur courant (mis en cache pour la durée de la requête) */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const session = await db.session.findUnique({
    where: { id: sha256(token) },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, displayName: true, email: true, role: true, status: true },
      },
    },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now() || session.user.status !== "ACTIVE") {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  // Renouvellement glissant (en base uniquement : les cookies ne sont pas modifiables pendant le rendu)
  if (session.expiresAt.getTime() - Date.now() < SESSION_TTL_MS - RENEW_THRESHOLD_MS) {
    await db.session
      .update({ where: { id: session.id }, data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) } })
      .catch(() => {});
  }
  const { status: _status, ...user } = session.user;
  return user;
});

export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/admin");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
