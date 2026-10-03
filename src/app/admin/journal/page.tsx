import { db } from "@/server/db";
import { PageTitle, Panel } from "@/components/admin/ui";
import { formatShortDateTime } from "@/lib/format";

export const metadata = { title: "Journal d'activité" };

export default async function AdminJournal({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const logs = await db.adminLog.findMany({
    where: q ? { OR: [{ action: { contains: q.slice(0, 60) } }, { actorLabel: { contains: q.slice(0, 60), mode: "insensitive" } }] } : undefined,
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return (
    <>
      <PageTitle title="Journal d'activité" subtitle="Actions d'administration, tirages exécutés et évènements de sécurité. Journal en ajout seul." />
      <form className="mb-4"><input name="q" defaultValue={q} placeholder="Filtrer (ex. draw., auth., product.)" className="input max-w-md" /></form>
      <Panel>
        <div className="overflow-x-auto">
          <table className="table-admin min-w-[820px]">
            <thead><tr><th>Date</th><th>Acteur</th><th>Action</th><th>Objet</th><th>Détails</th><th>IP</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="text-xs whitespace-nowrap">{formatShortDateTime(l.createdAt)}</td>
                  <td className="text-sm">{l.actorLabel}</td>
                  <td><code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">{l.action}</code></td>
                  <td className="text-xs text-ink-500">{l.entityType}{l.entityId ? ` · ${l.entityId.slice(0, 10)}…` : ""}</td>
                  <td className="max-w-xs truncate font-mono text-[11px] text-ink-500">{l.details ? JSON.stringify(l.details) : ""}</td>
                  <td className="font-mono text-[11px] text-ink-400">{l.ip ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
