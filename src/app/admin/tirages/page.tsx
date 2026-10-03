import Link from "next/link";
import { clsx } from "clsx";
import { db } from "@/server/db";
import { processDueDraws } from "@/server/draws/engine";
import { Flash, PageTitle, Panel } from "@/components/admin/ui";
import { StatusBadge } from "@/components/draw/StatusBadge";
import { Progress } from "@/components/draw/Progress";
import { getDisplayStatus } from "@/lib/draw-status";
import { drawEconomics } from "@/lib/economics";
import { formatEuro, formatShortDateTime } from "@/lib/format";

export const metadata = { title: "Tirages" };

const TABS = [
  { k: "actifs", l: "Actifs" },
  { k: "a-venir", l: "À venir" },
  { k: "termines", l: "Terminés" },
  { k: "desactives", l: "Désactivés" },
  { k: "tous", l: "Tous" },
];

export default async function AdminDraws({ searchParams }: { searchParams: Promise<{ vue?: string; supprime?: string }> }) {
  await processDueDraws();
  const sp = await searchParams;
  const vue = sp.vue ?? "tous";
  const now = Date.now();
  const all = await db.draw.findMany({ include: { product: { select: { name: true, reference: true, purchaseCost: true } } }, orderBy: [{ number: "desc" }] });
  const rows = all
    .map((d) => ({ d, s: getDisplayStatus(d, now), e: drawEconomics({ ...d, purchaseCost: d.product.purchaseCost }) }))
    .filter(({ s }) =>
      vue === "actifs" ? ["live", "ending", "soldout"].includes(s) : vue === "a-venir" ? s === "upcoming" : vue === "termines" ? ["drawn", "cancelled", "closed"].includes(s) : vue === "desactives" ? s === "disabled" : true,
    );

  return (
    <>
      <PageTitle title="Tirages" subtitle={`${all.length} tirages au total`} actions={<Link href="/admin/tirages/nouveau" className="btn-primary btn-sm">Créer un tirage</Link>} />
      <Flash ok={sp.supprime} okText="Tirage supprimé." />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.k} href={`/admin/tirages?vue=${t.k}`} className={clsx("rounded-full px-3.5 py-1.5 text-sm font-medium", vue === t.k ? "bg-ink-950 text-white" : "bg-white text-ink-700 ring-1 ring-ink-200")}>{t.l}</Link>
        ))}
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="table-admin min-w-[900px]">
            <thead><tr><th>N°</th><th>Lot</th><th>Statut</th><th>Ticket</th><th>Ventes</th><th>Revenus</th><th>Résultat</th><th>Début</th><th>Fin</th><th /></tr></thead>
            <tbody>
              {rows.map(({ d, s, e }) => (
                <tr key={d.id}>
                  <td className="font-mono text-xs">{d.number}</td>
                  <td><Link href={`/admin/tirages/${d.id}`} className="font-medium text-ink-950 hover:underline">{d.product.name}</Link><div className="text-xs text-ink-400">{d.product.reference}</div></td>
                  <td><StatusBadge status={s} /></td>
                  <td>{formatEuro(d.ticketPrice)}</td>
                  <td className="w-36"><div className="mb-1 text-xs tabular">{d.soldTickets}/{d.maxTickets}</div><Progress sold={d.soldTickets} max={d.maxTickets} size="sm" /></td>
                  <td className="tabular">{formatEuro(e.revenue)}</td>
                  <td className={clsx("tabular font-medium", e.marginCurrent >= 0 ? "text-brand-700" : "text-ember-600")}>{formatEuro(e.marginCurrent)}</td>
                  <td className="text-xs whitespace-nowrap">{formatShortDateTime(d.startsAt)}</td>
                  <td className="text-xs whitespace-nowrap">{formatShortDateTime(d.endsAt)}</td>
                  <td><Link href={`/admin/tirages/${d.id}`} className="btn-secondary btn-sm">Gérer</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
