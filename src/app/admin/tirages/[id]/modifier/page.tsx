import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { PageTitle } from "@/components/admin/ui";
import { DrawForm } from "@/components/admin/DrawForm";
import { toParisInputValue } from "@/lib/format";

export const metadata = { title: "Modifier le tirage" };

export default async function EditDraw({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await db.draw.findUnique({ where: { id } });
  if (!d) notFound();
  if (d.status !== "SCHEDULED" && d.status !== "DISABLED") {
    return <PageTitle title={`Tirage n°${d.number}`} subtitle="Ce tirage est clôturé : il ne peut plus être modifié." />;
  }
  const products = await db.product.findMany({ orderBy: { reference: "asc" }, select: { id: true, name: true, reference: true, purchaseCost: true, displayValue: true } });
  return (
    <>
      <PageTitle title={`Modifier le tirage n°${d.number}`} />
      <DrawForm
        products={products}
        initial={{
          id: d.id, productId: d.productId, ticketPrice: (d.ticketPrice / 100).toString().replace(".", ","), maxTickets: d.maxTickets, minTickets: d.minTickets,
          startsAt: toParisInputValue(d.startsAt), endsAt: toParisInputValue(d.endsAt), featured: d.featured, locked: d.soldTickets > 0,
        }}
      />
    </>
  );
}
