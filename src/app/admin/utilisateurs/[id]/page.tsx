import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { logActivity } from "@/server/audit";
import { Kpi, PageTitle, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/draw/StatusBadge";
import { toggleUserStatusAction } from "@/app/actions/admin";
import { getDisplayStatus } from "@/lib/draw-status";
import { formatDate, formatEuro, formatShortDateTime } from "@/lib/format";

export const metadata = { title: "Fiche utilisateur" };

export default async function AdminUser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getCurrentUser();
  const u = await db.user.findUnique({
    where: { id },
    select: {
      id: true, firstName: true, lastName: true, displayName: true, email: true, role: true, status: true, createdAt: true, lastLoginAt: true, marketingOptIn: true,
      participations: { orderBy: { createdAt: "desc" }, include: { draw: { include: { product: { select: { name: true } }, winner: { select: { userId: true } } } } } },
      _count: { select: { wins: true, sessions: true } },
    },
  });
  if (!u) notFound();
  // Traçabilité : la consultation d'une fiche (données personnelles) est journalisée
  if (me) await logActivity(me, "user.viewed", "user", u.id);
  const now = Date.now();
  const spent = u.participations.filter((p) => p.status === "CONFIRMED").reduce((s, p) => s + p.totalAmount, 0);
  const tickets = u.participations.filter((p) => p.status === "CONFIRMED").reduce((s, p) => s + p.quantity, 0);

  return (
    <>
      <Link href="/admin/utilisateurs" className="text-sm text-ink-500 hover:text-ink-900">← Utilisateurs</Link>
      <PageTitle
        title={`${u.firstName} ${u.lastName}`}
        subtitle={<span className="flex items-center gap-2"><Badge tone={u.status === "ACTIVE" ? "success" : "danger"}>{u.status === "ACTIVE" ? "Actif" : "Suspendu"}</Badge> @{u.displayName} · {u.role === "ADMIN" ? "Administrateur" : "Utilisateur"}</span>}
        actions={me?.id !== u.id && (
          <form action={toggleUserStatusAction}><input type="hidden" name="id" value={u.id} /><button className={u.status === "ACTIVE" ? "btn-danger btn-sm" : "btn-primary btn-sm"}>{u.status === "ACTIVE" ? "Suspendre le compte" : "Réactiver le compte"}</button></form>
        )}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Participations" value={u.participations.length} />
        <Kpi label="Tickets valides" value={tickets} />
        <Kpi label="Dépensé (démo)" value={formatEuro(spent)} />
        <Kpi label="Tirages gagnés" value={u._count.wins} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_2fr]">
        <Panel title="Profil">
          <dl className="space-y-3 p-5 text-sm">
            <div><dt className="text-ink-500">E-mail</dt><dd className="font-medium">{u.email}</dd></div>
            <div><dt className="text-ink-500">Inscription</dt><dd>{formatDate(u.createdAt)}</dd></div>
            <div><dt className="text-ink-500">Dernière connexion</dt><dd>{u.lastLoginAt ? formatShortDateTime(u.lastLoginAt) : "—"}</dd></div>
            <div><dt className="text-ink-500">Sessions actives</dt><dd>{u._count.sessions}</dd></div>
            <div><dt className="text-ink-500">Communications marketing</dt><dd>{u.marketingOptIn ? "Acceptées" : "Refusées"}</dd></div>
            <p className="pt-2 text-xs text-ink-400">Date de naissance et mot de passe (haché) ne sont pas affichés : données non nécessaires à la gestion courante.</p>
          </dl>
        </Panel>
        <Panel title="Historique des participations">
          <div className="overflow-x-auto">
            <table className="table-admin min-w-[600px]">
              <thead><tr><th>Tirage</th><th>Tickets</th><th>Montant</th><th>Date</th><th>Statut</th><th>Résultat</th></tr></thead>
              <tbody>
                {u.participations.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/admin/tirages/${p.drawId}`} className="font-medium hover:underline">{p.draw.product.name}</Link><div className="text-xs text-ink-400">n°{p.draw.number}</div></td>
                    <td>{p.quantity}</td>
                    <td className="tabular">{formatEuro(p.totalAmount)}</td>
                    <td className="text-xs whitespace-nowrap">{formatShortDateTime(p.createdAt)}</td>
                    <td><StatusBadge status={getDisplayStatus(p.draw, now)} /></td>
                    <td className="text-xs">{p.status === "REFUNDED" ? "Remboursé" : p.draw.winner ? (p.draw.winner.userId === u.id ? <span className="font-semibold text-brand-700">Gagné 🎉</span> : "Perdu") : "—"}</td>
                  </tr>
                ))}
                {u.participations.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-ink-500">Aucune participation.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
