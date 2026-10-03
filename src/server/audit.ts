import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";

type Actor = { id: string; email?: string; displayName?: string } | "system";

export async function logActivity(
  actor: Actor,
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: Prisma.InputJsonValue,
  ip?: string,
) {
  try {
    await db.adminLog.create({
      data: {
        actorId: actor === "system" ? null : actor.id,
        actorLabel: actor === "system" ? "Système" : (actor.displayName ?? actor.email ?? actor.id),
        action,
        entityType,
        entityId: entityId ?? null,
        details,
        ip,
      },
    });
  } catch (e) {
    console.error("[audit] échec d'écriture du journal", e);
  }
}
