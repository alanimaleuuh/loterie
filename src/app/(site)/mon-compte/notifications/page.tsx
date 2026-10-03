import type { Metadata } from "next";
import { Bell, Mail } from "lucide-react";
import { clsx } from "clsx";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { markAllNotificationsReadAction } from "@/app/actions/account";
import { AccountHeader } from "@/components/account/AccountHeader";
import { EmptyState } from "@/components/ui/Section";
import { formatShortDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function NotificationsPage() {
  const user = await requireUser("/mon-compte/notifications");
  const notifs = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = notifs.filter((n) => !n.readAt).length;
  return (
    <div className="container-page">
      <AccountHeader title="Notifications" subtitle="Copie des e-mails qui vous ont été envoyés (simulés en mode démo)." />
      {unread > 0 && (
        <form action={markAllNotificationsReadAction} className="mb-4 flex items-center justify-between rounded-2xl bg-white px-5 py-3 ring-1 ring-ink-200/70">
          <span className="text-sm text-ink-600">{unread} notification{unread > 1 ? "s" : ""} non lue{unread > 1 ? "s" : ""}</span>
          <button className="btn-secondary btn-sm">Tout marquer comme lu</button>
        </form>
      )}
      {notifs.length === 0 ? (
        <EmptyState title="Aucune notification" />
      ) : (
        <ul className="space-y-3">
          {notifs.map((n) => (
            <li key={n.id} className={clsx("card p-5", !n.readAt && "border-l-4 border-l-brand-500")}>
              <details>
                <summary className="flex cursor-pointer list-none items-start gap-4">
                  <span className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", n.type === "DRAW_WON" ? "bg-brand-600 text-white" : "bg-sand-100 text-ink-700")}>
                    {n.type === "DRAW_WON" ? <Bell className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink-950">{n.subject}</span>
                    <span className="text-xs text-ink-500">{formatShortDateTime(n.createdAt)} · {n.status === "SENT" ? "e-mail envoyé (simulé)" : n.status === "FAILED" ? "échec d'envoi" : "en file d'attente"}</span>
                  </span>
                </summary>
                <pre className="mt-4 rounded-xl bg-paper p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-ink-700">{n.bodyText}</pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
