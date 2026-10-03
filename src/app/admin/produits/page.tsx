import Link from "next/link";
import { Copy, Pencil, Power, Trash2 } from "lucide-react";
import { db } from "@/server/db";
import { Flash, PageTitle, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { LotImage } from "@/components/draw/LotImage";
import { deleteProductAction, duplicateProductAction, toggleProductAction } from "@/app/actions/admin";
import { formatEuro } from "@/lib/format";

export const metadata = { title: "Lots" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; erreur?: string; supprime?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 80);
  const products = await db.product.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { reference: { contains: q, mode: "insensitive" } }] } : undefined,
    include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } }, _count: { select: { draws: true } } },
    orderBy: { reference: "desc" },
  });
  return (
    <>
      <PageTitle title="Gestion des lots" subtitle={`${products.length} lots`} actions={<Link href="/admin/produits/nouveau" className="btn-primary btn-sm">Ajouter un lot</Link>} />
      <Flash error={sp.erreur} ok={sp.supprime} okText="Lot supprimé." />
      <form className="mb-4"><input name="q" defaultValue={q} placeholder="Rechercher par nom ou référence…" className="input max-w-md" /></form>
      <Panel>
        <div className="overflow-x-auto">
          <table className="table-admin min-w-[900px]">
            <thead><tr><th>Lot</th><th>Catégorie</th><th>Valeur</th><th>Prix d&apos;achat</th><th>Écart</th><th>Tirages</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-sand-100"><LotImage src={p.images[0]?.url} alt="" /></div>
                      <div><Link href={`/admin/produits/${p.id}`} className="font-medium text-ink-950 hover:underline">{p.name}</Link><div className="font-mono text-xs text-ink-400">{p.reference}</div></div>
                    </div>
                  </td>
                  <td>{p.category.name}</td>
                  <td className="tabular">{formatEuro(p.displayValue)}</td>
                  <td className="tabular">{formatEuro(p.purchaseCost)}</td>
                  <td className="text-xs text-ink-500 tabular">{formatEuro(p.displayValue - p.purchaseCost)}</td>
                  <td><Link href={`/admin/tirages/nouveau?lot=${p.id}`} className="text-sm text-brand-700 hover:underline">{p._count.draws} · créer</Link></td>
                  <td><Badge tone={p.status === "ACTIVE" ? "success" : "neutral"}>{p.status === "ACTIVE" ? "Actif" : "Désactivé"}</Badge></td>
                  <td>
                    <div className="flex gap-1">
                      <Link href={`/admin/produits/${p.id}`} className="btn-ghost btn-sm" title="Modifier" aria-label="Modifier"><Pencil className="h-3.5 w-3.5" /></Link>
                      <form action={duplicateProductAction}><input type="hidden" name="id" value={p.id} /><button className="btn-ghost btn-sm" title="Dupliquer" aria-label="Dupliquer"><Copy className="h-3.5 w-3.5" /></button></form>
                      <form action={toggleProductAction}><input type="hidden" name="id" value={p.id} /><button className="btn-ghost btn-sm" title={p.status === "ACTIVE" ? "Désactiver" : "Activer"} aria-label="Activer ou désactiver"><Power className="h-3.5 w-3.5" /></button></form>
                      <form action={deleteProductAction}><input type="hidden" name="id" value={p.id} /><button className="btn-ghost btn-sm text-ember-600" title="Supprimer" aria-label="Supprimer" disabled={p._count.draws > 0}><Trash2 className="h-3.5 w-3.5" /></button></form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
