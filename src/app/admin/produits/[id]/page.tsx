import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { Flash, PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Modifier le lot" };

const eur = (c: number) => (c / 100).toString().replace(".", ",");

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const [p, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!p) notFound();
  return (
    <>
      <Link href="/admin/produits" className="text-sm text-ink-500 hover:text-ink-900">← Lots</Link>
      <PageTitle title={p.name} subtitle={p.reference} actions={<Link href={`/admin/tirages/nouveau?lot=${p.id}`} className="btn-primary btn-sm">Créer un tirage pour ce lot</Link>} />
      <Flash ok={sp.ok} okText="Lot enregistré." />
      <ProductForm
        key={p.updatedAt.toISOString()}
        categories={categories}
        initial={{ ...p, displayValue: eur(p.displayValue), purchaseCost: eur(p.purchaseCost), images: p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt })) }}
      />
    </>
  );
}
