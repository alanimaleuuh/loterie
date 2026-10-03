import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { PageTitle, Panel, maskEmail } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatEuro } from "@/lib/format";

export const metadata = { title: "Utilisateurs" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; statut?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 80);
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }, { displayName: { contains: q, mode: "insensitive" } }] } : {}),
    ...(sp.statut === "suspendus" ? { status: "SUSPENDED" } : {}),
  };
  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, firstName: true, lastName: true, displayName: true, email: true, role: true, status: true, createdAt: true, lastLoginAt: true,
      _count: { select: { participations: true, wins: true } },
      payments: { where: { status: "SUCCEEDED" }, select: { amount: true } },
    },
  });
  return (
    <>
      <PageTitle title="Utilisateurs" subtitle={`${users.length} comptes`} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Rechercher par nom, pseudonyme ou e-mail…" className="input max-w-md" />
        <select name="statut" defaultValue={sp.statut ?? ""} className="input w-auto"><option value="">Tous</option><option value="suspendus">Suspendus</option></select>
        <button className="btn-primary">Rechercher</button>
      </form>
      <Panel>
        <div className="overflow-x-auto">
          <table className="table-admin min-w-[860px]">
            <thead><tr><th>Utilisateur</th><th>E-mail</th><th>Inscription</th><th>Dernière connexion</th><th>Participations</th><th>Dépensé (démo)</th><th>Statut</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><Link href={`/admin/utilisateurs/${u.id}`} className="font-medium text-ink-950 hover:underline">{u.firstName} {u.lastName}</Link><div className="text-xs text-ink-400">@{u.displayName}{u.role === "ADMIN" && " · admin"}</div></td>
                  <td className="text-xs">{maskEmail(u.email)}</td>
                  <td className="text-xs">{formatDate(u.createdAt)}</td>
                  <td className="text-xs">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}</td>
                  <td>{u._count.participations}{u._count.wins > 0 && <span className="ml-2 text-xs text-brand-700">🏆 {u._count.wins}</span>}</td>
                  <td className="tabular">{formatEuro(u.payments.reduce((s, p) => s + p.amount, 0))}</td>
                  <td><Badge tone={u.status === "ACTIVE" ? "success" : "danger"}>{u.status === "ACTIVE" ? "Actif" : "Suspendu"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <p className="mt-3 text-xs text-ink-500">Les adresses e-mail sont partiellement masquées dans les listes (minimisation des données). L&apos;adresse complète est visible sur la fiche, pour le support uniquement.</p>
    </>
  );
}
