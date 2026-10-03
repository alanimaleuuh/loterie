import Link from "next/link";
import { notFound } from "next/navigation";
import { clsx } from "clsx";
import { Copy, ExternalLink, Pencil, Play, Power, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { db } from "@/server/db";
import { processDueDraws } from "@/server/draws/engine";
import { Flash, Kpi, PageTitle, Panel, maskEmail } from "@/components/admin/ui";
import { StatusBadge } from "@/components/draw/StatusBadge";
import { Progress } from "@/components/draw/Progress";
import { cancelDrawAction, deleteDrawAction, duplicateDrawAction, runDrawNowAction, toggleDrawAction, updatePrizeStatusAction } from "@/app/actions/admin";
import { getDisplayStatus } from "@/lib/draw-status";
import { drawEconomics } from "@/lib/economics";
import { formatDateTime, formatEuro, formatShortDateTime, percent, ticketLabel } from "@/lib/format";

export const metadata = { title: "Détail du tirage" };

export default async function AdminDrawDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  await processDueDraws();
  const d = await db.draw.findUnique({
    where: { id },
    include: {
      product: true,
      winner: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      participations: { orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, displayName: true, email: true } }, payment: { select: { status: true, cardLast4: true } } } },
    },
  });
  if (!d) notFound();
  const tickets = await db.ticket.findMany({ where: { drawId: id }, orderBy: { number: "asc" }, select: { number: true, userId: true, participation: { select: { status: true } } } });
  const now = Date.now();
  const s = getDisplayStatus(d, now);
  const e = drawEconomics({ ...d, purchaseCost: d.product.purchaseCost });
  const editable = d.status === "SCHEDULED" || d.status === "DISABLED";
  const participants = new Set(d.participations.filter((p) => p.status === "CONFIRMED").map((p) => p.userId)).size;

  return (
    <>
      <Link href="/admin/tirages" className="text-sm text-ink-500 hover:text-ink-900">← Tirages</Link>
      <PageTitle
        title={`Tirage n°${d.number} — ${d.product.name}`}
        subtitle={<span className="flex items-center gap-2"><StatusBadge status={s} /> Réf. {d.product.reference} · du {formatDateTime(d.startsAt)} au {formatDateTime(d.endsAt)}</span>}
        actions={
          <>
            <Link href={`/tirages/${d.id}`} className="btn-secondary btn-sm"><ExternalLink className="h-3.5 w-3.5" /> Page publique</Link>
            {editable && <Link href={`/admin/tirages/${d.id}/modifier`} className="btn-secondary btn-sm"><Pencil className="h-3.5 w-3.5" /> Modifier</Link>}
            <form action={duplicateDrawAction}><input type="hidden" name="id" value={d.id} /><button className="btn-secondary btn-sm"><Copy className="h-3.5 w-3.5" /> Dupliquer</button></form>
            {editable && (
              <form action={toggleDrawAction}><input type="hidden" name="id" value={d.id} /><button className="btn-secondary btn-sm"><Power className="h-3.5 w-3.5" /> {d.status === "DISABLED" ? "Activer" : "Désactiver"}</button></form>
            )}
            {editable && d.participations.length === 0 && (
              <form action={deleteDrawAction}><input type="hidden" name="id" value={d.id} /><button className="btn-danger btn-sm"><Trash2 className="h-3.5 w-3.5" /> Supprimer</button></form>
            )}
          </>
        }
      />
      <Flash ok={sp.ok} error={sp.erreur} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi label="Tickets vendus" value={`${d.soldTickets} / ${d.maxTickets}`} hint={`${percent(d.soldTickets, d.maxTickets)} % · ${participants} participants`} />
        <Kpi label="Prix du ticket" value={formatEuro(d.ticketPrice)} hint={d.minTickets ? `minimum ${d.minTickets} tickets` : "sans minimum"} />
        <Kpi label="Revenus (simulés)" value={formatEuro(e.revenue)} hint={`max. ${formatEuro(e.revenueMax)}`} />
        <Kpi label="Prix d'achat du lot" value={formatEuro(e.cost)} hint={`valeur affichée ${formatEuro(d.product.displayValue)}`} />
        <Kpi label={d.status === "DRAWN" ? "Marge brute réalisée" : "Résultat actuel"} value={formatEuro(e.marginCurrent)} tone={e.marginCurrent >= 0 ? "pos" : "neg"} hint="avant frais, non garanti" />
        <Kpi label="Marge max. théorique" value={formatEuro(e.marginMax)} hint={`seuil : ${e.breakEvenTickets} tickets`} />
      </div>
      <div className="mt-3"><Progress sold={d.soldTickets} max={d.maxTickets} /></div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title={`Participations (${d.participations.length})`}>
            <div className="max-h-[480px] overflow-auto">
              <table className="table-admin min-w-[640px]">
                <thead className="sticky top-0 bg-white"><tr><th>Participant</th><th>Tickets</th><th>Montant</th><th>Paiement</th><th>Date</th></tr></thead>
                <tbody>
                  {d.participations.map((p) => (
                    <tr key={p.id}>
                      <td><Link href={`/admin/utilisateurs/${p.user.id}`} className="font-medium hover:underline">{p.user.displayName}</Link><div className="text-xs text-ink-400">{maskEmail(p.user.email)}</div></td>
                      <td>{p.quantity}</td>
                      <td className="tabular">{formatEuro(p.totalAmount)}</td>
                      <td className="text-xs">{p.status === "REFUNDED" ? "Remboursé" : p.payment.status === "SUCCEEDED" ? `Démo •••• ${p.payment.cardLast4}` : p.payment.status}</td>
                      <td className="text-xs whitespace-nowrap">{formatShortDateTime(p.createdAt)}</td>
                    </tr>
                  ))}
                  {d.participations.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-ink-500">Aucune participation.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title={`Tickets attribués (${tickets.length})`}>
            <div className="flex max-h-72 flex-wrap gap-1 overflow-auto p-5">
              {tickets.map((t) => (
                <span key={t.number} className={clsx("rounded-md px-1.5 py-0.5 font-mono text-[11px]", d.winner?.ticketNumber === t.number ? "bg-brand-600 text-white" : t.participation.status === "REFUNDED" ? "bg-ink-100 text-ink-400 line-through" : "bg-paper text-ink-700 ring-1 ring-ink-200")}>
                  {ticketLabel(t.number)}
                </span>
              ))}
              {tickets.length === 0 && <p className="text-sm text-ink-500">Aucun ticket.</p>}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          {d.winner ? (
            <Panel title="Résultat">
              <div className="space-y-3 p-5 text-sm">
                <p className="text-lg font-semibold">Ticket {ticketLabel(d.winner.ticketNumber)} — {d.winner.publicName}</p>
                <p className="text-ink-600">Gagnant : <Link href={`/admin/utilisateurs/${d.winner.user.id}`} className="font-medium underline">{d.winner.user.firstName} {d.winner.user.lastName}</Link> ({maskEmail(d.winner.user.email)})</p>
                <p className="text-ink-600">Tiré le {formatDateTime(d.winner.drawnAt)} parmi {d.winner.ticketCount} tickets valides.</p>
                <p className="font-mono text-[11px] break-all text-ink-500">Empreinte : {d.winner.resultHash}</p>
                <Link href={`/verification/${d.id}`} className="btn-secondary btn-sm"><ShieldCheck className="h-3.5 w-3.5" /> Vérification publique</Link>
                <form action={updatePrizeStatusAction} className="flex items-end gap-2 border-t border-ink-100 pt-4">
                  <input type="hidden" name="id" value={d.id} />
                  <label className="flex-1"><span className="label">Suivi de remise du lot</span>
                    <select name="prizeStatus" defaultValue={d.prizeStatus} className="input">
                      <option value="PENDING">En attente</option><option value="CONTACTED">Gagnant contacté</option><option value="SHIPPED">Lot expédié</option><option value="DELIVERED">Lot remis</option>
                    </select>
                  </label>
                  <button className="btn-primary">Mettre à jour</button>
                </form>
                <p className="text-xs text-ink-400">Le gagnant reçoit une notification à chaque changement.</p>
              </div>
            </Panel>
          ) : d.status === "CANCELLED" ? (
            <Panel title="Tirage annulé"><p className="p-5 text-sm text-ink-600">{d.cancelReason} — participants remboursés (simulation).</p></Panel>
          ) : (
            <Panel title="Exécution du tirage">
              <div className="space-y-4 p-5 text-sm text-ink-600">
                <p>Le tirage est effectué <strong>automatiquement</strong> par le serveur à la date de fin ({formatDateTime(d.endsAt)}) : verrouillage des participations, tirage, enregistrement du résultat et envoi des notifications.</p>
                {d.endsAt.getTime() <= now && d.status === "SCHEDULED" && (
                  <form action={runDrawNowAction}><input type="hidden" name="id" value={d.id} /><button className="btn-brand w-full"><Play className="h-4 w-4" /> Effectuer le tirage maintenant</button></form>
                )}
                {d.status === "SCHEDULED" && (
                  <form action={cancelDrawAction} className="space-y-2 border-t border-ink-100 pt-4">
                    <input type="hidden" name="id" value={d.id} />
                    <label className="label" htmlFor="reason">Annuler le tirage (remboursement de tous les participants)</label>
                    <input id="reason" name="reason" className="input" placeholder="Motif de l'annulation" required minLength={3} />
                    <button className="btn-danger w-full"><XCircle className="h-4 w-4" /> Annuler et rembourser</button>
                  </form>
                )}
              </div>
            </Panel>
          )}
          <Panel title="Équité">
            <div className="space-y-2 p-5 text-xs">
              <p className="text-ink-500">Engagement publié (SHA-256 de la graine)</p>
              <p className="font-mono break-all text-ink-800">{d.seedHash}</p>
              <p className="pt-2 text-ink-500">La graine n&apos;est affichée nulle part avant le tirage (pas même ici) et ne peut pas être modifiée (trigger base de données).</p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
