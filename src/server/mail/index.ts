import type { NotificationType } from "@prisma/client";
import { db } from "@/server/db";
import { getMailTransport } from "./transport";
import type { MailContent } from "./templates";

/**
 * Enregistre la notification (centre de notifications + journal d'envoi) puis
 * l'envoie via le transport configuré. Un échec d'envoi n'interrompt jamais le
 * parcours utilisateur : il est tracé avec le statut FAILED.
 */
export async function sendNotification(opts: {
  userId?: string | null;
  to: string;
  type: NotificationType;
  content: MailContent;
  drawId?: string | null;
}) {
  const transport = getMailTransport();
  const notif = await db.notification.create({
    data: {
      userId: opts.userId ?? null,
      drawId: opts.drawId ?? null,
      toEmail: opts.to,
      type: opts.type,
      subject: opts.content.subject,
      bodyText: opts.content.text,
      transport: transport.name,
    },
  });
  try {
    await transport.send({
      to: opts.to,
      from: process.env.MAIL_FROM ?? "Lotelia <no-reply@lotelia.demo>",
      subject: opts.content.subject,
      text: opts.content.text,
    });
    await db.notification.update({ where: { id: notif.id }, data: { status: "SENT", sentAt: new Date() } });
  } catch (e) {
    await db.notification.update({
      where: { id: notif.id },
      data: { status: "FAILED", error: e instanceof Error ? e.message : String(e) },
    });
  }
}
