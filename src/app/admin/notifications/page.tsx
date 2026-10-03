import Link from "next/link";
import { clsx } from "clsx";
import type { NotificationType } from "@prisma/client";
import { db } from "@/server/db";
import { PageTitle, Panel, maskEmail } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { formatShortDateTime } from "@/lib/format";

export const metadata = { title: "E-mails" };

const TYPES: Record<NotificationType, string> = {
  ACCOUNT_CREATED: "Création de compte",
  PASSWORD_RESET: "Mot de passe",
  PARTICIPATION_CONFIRMED: "Participation",
  DRAW_REMINDER: "Rappel",
  DRAW_RESULT: "Résultat",
  DRAW_WON: "Gagnant",
  DRAW_CANCELLED: "Annulation",
  PRIZE_DELIVERY: "Livraison du lot",
};

export default async function AdminNotifications({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const t = type && type in TYPES ? (type as NotificationType) : undefined;
  const [notifs, counts] = await Promise.all([
    db.notification.findMany({ where: t ? { type: t } : undefined, orderBy: { createdAt: "desc" }, take: 150 }),
    db.notification.groupBy({ by: ["type"], _count: true }),
  ]);
  return (
    <>
      <PageTitle title="E-mails envoyés" subtitle={<>Transport actuel : <code className="font-mono">{process.env.MAIL_TRANSPORT ?? "log"}</code> — e-mails simulés (journal + fichier storage/mail/outbox.log). À connecter : SMTP / Resend / Postmark.</>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/notifications" className={clsx("rounded-full px-3.5 py-1.5 text-sm font-medium", !t ? "bg-ink-950 text-white" : "bg-white ring-1 ring-ink-200")}>Tous</Link>
        {Object.entries(TYPES).map(([k, l]) => (
          <Link key={k} href={`/admin/notifications?type=${k}`} className={clsx("rounded-full px-3.5 py-1.5 text-sm font-medium", t === k ? "bg-ink-950 text-white" : "bg-white ring-1 ring-ink-200")}>
            {l} <span className="opacity-60">{counts.find((c) => c.type === k)?._count ?? 0}</span>
          </Link>
        ))}
      </div>
      <Panel>
        <ul className="divide-y divide-ink-100">
          {notifs.map((n) => (
            <li key={n.id} className="px-5 py-3">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 text-sm">
                  <Badge tone={n.status === "SENT" ? "success" : n.status === "FAILED" ? "danger" : "neutral"}>{n.status === "SENT" ? "Envoyé" : n.status === "FAILED" ? "Échec" : "En file"}</Badge>
                  <span className="text-xs text-ink-400">{TYPES[n.type]}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-ink-900">{n.subject}</span>
                  <span className="text-xs text-ink-500">{maskEmail(n.toEmail)} · {formatShortDateTime(n.createdAt)}</span>
                </summary>
                <pre className="mt-3 rounded-xl bg-paper p-4 font-sans text-sm whitespace-pre-wrap text-ink-700">{n.type === "PASSWORD_RESET" ? n.bodyText.replace(/token=[\w-]+/g, "token=•••• (masqué)") : n.bodyText}</pre>
              </details>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
