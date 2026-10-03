import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { db } from "@/server/db";
import { processDueDraws } from "@/server/draws/engine";
import { Kpi, PageTitle, Panel } from "@/components/admin/ui";
import { StatusBadge } from "@/components/draw/StatusBadge";
import { Progress } from "@/components/draw/Progress";
import { drawEconomics } from "@/lib/economics";
import { getDisplayStatus } from "@/lib/draw-status";
import { formatEuro, formatShortDateTime, percent } from "@/lib/format";

export const metadata = { title: "Tableau de bord" };

export default async function AdminDashboard() {
  await processDueDraws();
  const now = Date.now();
  const [users, newUsers, draws, winners, recentLogs] = await Promise.all([
    db.user.count({ where: { role: "USER" } }),
    db.user.count({ where: { role: "USER", createdAt: { gte: new Date(now - 7 * 86400_000) } } }),
    db.draw.findMany({ include: { product: { select: { name: true, purchaseCost: true, reference: true } } }, orderBy: { endsAt: "asc" } }),
    db.winner.count(),
    db.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const eco = draws.map((d) => ({ d, e: drawEconomics({ ...d, purchaseCost: d.product.purchaseCost }), s: getDisplayStatus(d, now) }));
  const active = eco.filter((x) => x.s === "live" || x.s === "ending" || x.s === "soldout");
  const finished = eco.filter((x) => x.d.status === "DRAWN" || x.d.status === "CANCELLED");
  const drawn = eco.filter((x) => x.d.status === "DRAWN");
  const ticketsSold = eco.filter((x) => x.d.status !== "CANCELLED").reduce((s, x) => s + x.d.soldTickets, 0);
  const revenue = eco.reduce((s, x) => s + x.e.revenue, 0);
  const revenueDrawn = drawn.reduce((s, x) => s + x.e.revenue, 0);
  const costDrawn = drawn.reduce((s, x) => s + x.e.cost, 0);
  const marginDrawn = revenueDrawn - costDrawn;
  const revenueActive = active.reduce((s, x) => s + x.e.revenue, 0);
  const costActive = active.reduce((s, x) => s + x.e.cost, 0);

  return (
    <>
      <PageTitle title="Tableau de bord" subtitle="Vue d'ensemble de la plateforme (données de démonstration)" actions={<Link href="/admin/tirages/nouveau" className="btn-primary btn-sm">Nouveau tirage</Link>} />

      <div className="mb-6 flex gap-3 rounded-2xl border border-[#f0d9b5] bg-[#fdf6ea] p-4 text-sm text-[#7a5418]">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Les montants sont <strong>simulés</strong> et calculés selon les tickets effectivement vendus. Les marges indiquées sont <strong>brutes, avant frais</strong> (paiement, livraison, taxes, frais juridiques) et ne sont jamais garanties.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Utilisateurs" value={users} hint={`+${newUsers} cette semaine`} />
        <Kpi label="Tirages" value={draws.length} hint={`${active.length} actifs`} />
        <Kpi label="Tirages actifs" value={active.length} />
        <Kpi label="Tickets vendus" value={ticketsSold.toLocaleString("fr-FR")} hint="hors tirages annulés" />
        <Kpi label="Tirages terminés" value={finished.length} hint={`${winners} gagnants`} />
      </div>

      <h2 className="mt-10 mb-3 text-sm font-semibold tracking-wider text-ink-500 uppercase">Résultats — tirages terminés (gagnant désigné)</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Revenus (simulés)" value={formatEuro(revenueDrawn)} hint={`${drawn.length} tirage(s)`} />
        <Kpi label="Coût des lots" value={formatEuro(costDrawn)} />
        <Kpi label="Marge brute (avant frais)" value={formatEuro(marginDrawn)} tone={marginDrawn >= 0 ? "pos" : "neg"} />
        <Kpi label="Gagnants" value={winners} />
      </div>

      <h2 className="mt-10 mb-3 text-sm font-semibold tracking-wider text-ink-500 uppercase">Tirages actifs — situation actuelle</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Revenus encaissés (simulés)" value={formatEuro(revenueActive)} />
        <Kpi label="Coût des lots en jeu" value={formatEuro(costActive)} />
        <Kpi label="Résultat si tirage maintenant" value={formatEuro(revenueActive - costActive)} tone={revenueActive - costActive >= 0 ? "pos" : "neg"} hint="peut être négatif" />
        <Kpi label="Revenus totaux (simulés)" value={formatEuro(revenue)} hint="tous tirages, hors remboursés" />
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Tirages actifs" actions={<Link href="/admin/tirages" className="text-sm font-medium text-brand-700">Tout voir</Link>}>
          <div className="overflow-x-auto">
            <table className="table-admin min-w-[720px]">
              <thead><tr><th>Tirage</th><th>Ventes</th><th>Revenus</th><th>Coût</th><th>Résultat actuel</th><th>Seuil</th><th>Fin</th></tr></thead>
              <tbody>
                {active.map(({ d, e, s }) => (
                  <tr key={d.id}>
                    <td>
                      <Link href={`/admin/tirages/${d.id}`} className="font-medium text-ink-950 hover:underline">{d.product.name}</Link>
                      <div className="mt-1 flex items-center gap-2"><StatusBadge status={s} /><span className="text-xs text-ink-400">n°{d.number}</span></div>
                    </td>
                    <td className="w-40">
                      <div className="mb-1 text-xs tabular">{d.soldTickets}/{d.maxTickets} · {percent(d.soldTickets, d.maxTickets)} %</div>
                      <Progress sold={d.soldTickets} max={d.maxTickets} size="sm" />
                    </td>
                    <td className="tabular">{formatEuro(e.revenue)}</td>
                    <td className="tabular">{formatEuro(e.cost)}</td>
                    <td className={`font-semibold tabular ${e.marginCurrent >= 0 ? "text-brand-700" : "text-ember-600"}`}>{formatEuro(e.marginCurrent)}</td>
                    <td className="text-xs">{e.breakEvenReached ? <span className="text-brand-700">atteint</span> : `${e.breakEvenTickets} tickets`}</td>
                    <td className="text-xs whitespace-nowrap">{formatShortDateTime(d.endsAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Activité récente" actions={<Link href="/admin/journal" className="text-sm font-medium text-brand-700">Journal</Link>}>
          <ul className="divide-y divide-ink-100">
            {recentLogs.map((l) => (
              <li key={l.id} className="px-5 py-3 text-sm">
                <p className="font-medium text-ink-900">{l.action}</p>
                <p className="text-xs text-ink-500">{l.actorLabel} · {formatShortDateTime(l.createdAt)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
