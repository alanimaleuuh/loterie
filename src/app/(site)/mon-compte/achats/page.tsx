import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { AccountHeader } from "@/components/account/AccountHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Section";
import { formatEuroPrecise, formatShortDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Mes achats (démo)", robots: { index: false } };

const ST = {
  SUCCEEDED: { l: "Payé (démo)", t: "success" },
  FAILED: { l: "Refusé", t: "danger" },
  REFUNDED: { l: "Remboursé", t: "info" },
  PENDING: { l: "En attente", t: "neutral" },
} as const;

export default async function PurchasesPage() {
  const user = await requireUser("/mon-compte/achats");
  const payments = await db.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { participation: { include: { draw: { include: { product: { select: { name: true } } } } } } },
  });
  return (
    <div className="container-page">
      <AccountHeader title="Historique des achats" subtitle="Achats simulés — aucune transaction réelle n'a été effectuée." />
      {payments.length === 0 ? (
        <EmptyState title="Aucun achat pour le moment" action={<Link href="/tirages" className="btn-primary">Voir les tirages</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-admin min-w-[680px]">
            <thead>
              <tr><th>Date</th><th>Tirage</th><th>Tickets</th><th>Moyen</th><th>Montant</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap">{formatShortDateTime(p.createdAt)}</td>
                  <td>
                    {p.participation ? (
                      <Link href={`/tirages/${p.participation.drawId}`} className="font-medium hover:underline">{p.participation.draw.product.name}</Link>
                    ) : (
                      <span className="text-ink-500">{p.failureReason ?? "—"}</span>
                    )}
                  </td>
                  <td>{p.participation?.quantity ?? "—"}</td>
                  <td className="whitespace-nowrap font-mono text-xs">{p.cardBrand ? `${p.cardBrand} •••• ${p.cardLast4}` : "—"}</td>
                  <td className="font-semibold">{formatEuroPrecise(p.amount)}</td>
                  <td><Badge tone={ST[p.status].t}>{ST[p.status].l}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
