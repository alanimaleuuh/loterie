import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, ShieldCheck } from "lucide-react";
import { db } from "@/server/db";
import { processDueDraws } from "@/server/draws/engine";
import { LotImage } from "@/components/draw/LotImage";
import { EmptyState } from "@/components/ui/Section";
import { formatDate, formatEuro, ticketLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Nos derniers gagnants",
  description: "Les derniers gagnants des tirages Lotelia, avec le lot remporté, la date du tirage et sa preuve de vérification.",
  alternates: { canonical: "/gagnants" },
};

export default async function WinnersPage() {
  await processDueDraws();
  // Uniquement des données publiques : pseudonyme + initiale. Jamais d'e-mail ni de nom complet.
  const winners = await db.winner.findMany({
    orderBy: { drawnAt: "desc" },
    take: 60,
    select: {
      id: true, drawId: true, publicName: true, ticketNumber: true, ticketCount: true, drawnAt: true,
      draw: { select: { number: true, product: { select: { name: true, displayValue: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } } } } },
    },
  });
  const totalValue = winners.reduce((s, w) => s + w.draw.product.displayValue, 0);

  return (
    <div className="container-page pt-10 sm:pt-14">
      <header className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow mb-3">Ils ont gagné</p>
          <h1 className="h-display text-5xl sm:text-6xl">Nos derniers gagnants</h1>
          <p className="mt-3 max-w-2xl text-ink-600">Chaque résultat est public et vérifiable. Par respect de la vie privée, seul le pseudonyme choisi par le gagnant est affiché.</p>
        </div>
        <dl className="flex gap-8">
          <div><dt className="text-xs text-ink-500">Gagnants</dt><dd className="text-3xl font-semibold">{winners.length}</dd></div>
          <div><dt className="text-xs text-ink-500">Valeur des lots</dt><dd className="text-3xl font-semibold">{formatEuro(totalValue)}</dd></div>
        </dl>
      </header>
      {winners.length === 0 ? (
        <EmptyState title="Aucun gagnant pour l'instant" description="Les premiers résultats apparaîtront ici dès la fin des tirages en cours." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {winners.map((w) => (
            <article key={w.id} className="card overflow-hidden">
              <div className="relative aspect-[16/10] bg-sand-100">
                <LotImage src={w.draw.product.images[0]?.url} alt={w.draw.product.name} />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-ink-950 px-3 py-1 text-xs font-semibold text-white">
                  <Trophy className="h-3.5 w-3.5 text-[#f4c99b]" /> Gagnant
                </span>
              </div>
              <div className="p-5">
                <p className="text-xl font-semibold text-ink-950">{w.publicName}</p>
                <p className="mt-0.5 text-ink-700">{w.draw.product.name}</p>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div><dt className="text-ink-400">Date</dt><dd className="font-medium text-ink-800">{formatDate(w.drawnAt)}</dd></div>
                  <div><dt className="text-ink-400">Ticket</dt><dd className="font-mono font-medium text-ink-800">{ticketLabel(w.ticketNumber)}</dd></div>
                  <div><dt className="text-ink-400">Parmi</dt><dd className="font-medium text-ink-800">{w.ticketCount} tickets</dd></div>
                </dl>
                <div className="mt-5 flex gap-2">
                  <Link href={`/tirages/${w.drawId}`} className="btn-secondary btn-sm flex-1">Voir le tirage</Link>
                  <Link href={`/verification/${w.drawId}`} className="btn-ghost btn-sm flex-1"><ShieldCheck className="h-3.5 w-3.5" /> Vérifier</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
