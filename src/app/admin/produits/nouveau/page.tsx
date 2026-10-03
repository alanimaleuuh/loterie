import { db } from "@/server/db";
import { PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Ajouter un lot" };

export default async function NewProduct() {
  const [categories, last] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({ where: { reference: { startsWith: "LOT-" } }, select: { reference: true } }),
  ]);
  const next = Math.max(1000, ...last.map((p) => parseInt(p.reference.slice(4), 10) || 0)) + 1;
  return (
    <>
      <PageTitle title="Ajouter un lot" />
      <ProductForm categories={categories} initial={{ reference: `LOT-${next}` }} />
    </>
  );
}
