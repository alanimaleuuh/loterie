import { db } from "@/server/db";
import { PageTitle } from "@/components/admin/ui";
import { DrawForm } from "@/components/admin/DrawForm";
import { toParisInputValue } from "@/lib/format";

export const metadata = { title: "Créer un tirage" };

export default async function NewDraw({ searchParams }: { searchParams: Promise<{ lot?: string }> }) {
  const { lot } = await searchParams;
  const products = await db.product.findMany({ where: { status: "ACTIVE" }, orderBy: { reference: "asc" }, select: { id: true, name: true, reference: true, purchaseCost: true, displayValue: true } });
  const start = new Date(Date.now() + 3600_000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 7 * 86400_000);
  return (
    <>
      <PageTitle title="Créer un tirage" subtitle="Choisissez un lot et définissez les règles du tirage." />
      <DrawForm products={products} initial={{ productId: lot, startsAt: toParisInputValue(start), endsAt: toParisInputValue(end) }} />
    </>
  );
}
