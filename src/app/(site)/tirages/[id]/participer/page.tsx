import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getDrawDetail } from "@/server/draws/detail";
import { requireUser } from "@/server/auth/session";
import { getDisplayStatus, isOpenForSale } from "@/lib/draw-status";
import { MAX_TICKETS_PER_ORDER, TICKET_PACKS } from "@/lib/config";
import { Checkout } from "@/components/draw/Checkout";

export const metadata: Metadata = { title: "Choisir mes tickets", robots: { index: false } };

export default async function ParticiperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/tirages/${id}/participer`);
  const draw = await getDrawDetail(id);
  if (!draw || draw.status === "DISABLED") notFound();
  const now = Date.now();
  const status = getDisplayStatus(draw, now);

  if (!isOpenForSale(status)) {
    return (
      <div className="container-page max-w-xl py-24 text-center">
        <h1 className="h-display text-4xl">Participations fermées</h1>
        <p className="mt-3 text-ink-600">Ce tirage n&apos;accepte pas de participation pour le moment.</p>
        <Link href={`/tirages/${id}`} className="btn-primary mt-8">Voir le tirage</Link>
      </div>
    );
  }

  const owned = await db.ticket.count({ where: { drawId: id, userId: user.id } });

  return (
    <div className="container-page pt-8 sm:pt-12">
      <Link href={`/tirages/${id}`} className="text-sm font-medium text-ink-500 hover:text-ink-900">← {draw.product.name}</Link>
      <h1 className="h-display mt-3 mb-8 text-4xl sm:text-5xl">Choisir mes tickets</h1>
      <Checkout
        drawId={draw.id}
        drawNumber={draw.number}
        productName={draw.product.name}
        image={draw.product.images[0]?.url}
        ticketPrice={draw.ticketPrice}
        remaining={draw.maxTickets - draw.soldTickets}
        maxPerOrder={MAX_TICKETS_PER_ORDER}
        packs={TICKET_PACKS}
        endsAt={draw.endsAt.toISOString()}
        serverNow={now}
        owned={owned}
      />
    </div>
  );
}
