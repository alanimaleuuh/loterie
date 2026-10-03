import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { listDraws, getCategories } from "@/server/draws/queries";
import { processDueDraws } from "@/server/draws/engine";
import { parseFilters } from "@/server/draws/params";
import { DrawCard } from "@/components/draw/DrawCard";
import { Filters } from "@/components/draw/Filters";
import { EmptyState } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Tous les tirages",
  description: "Tous les tirages au sort en cours, à venir et terminés : TV, smartphones, informatique, électroménager, mobilier.",
  alternates: { canonical: "/tirages" },
};

export default async function DrawsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await processDueDraws();
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [draws, categories] = await Promise.all([listDraws(filters), getCategories()]);
  const now = Date.now();

  return (
    <div className="container-page pt-10 sm:pt-14">
      {sp.bienvenue && (
        <div className="mb-8 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 text-sm text-brand-800">
          🎉 Bienvenue ! Votre compte est créé. Choisissez un lot pour participer à votre premier tirage.
        </div>
      )}
      <header className="mb-8">
        <p className="eyebrow mb-3">Catalogue</p>
        <h1 className="h-display text-5xl sm:text-6xl">Tous les tirages</h1>
        <p className="mt-3 max-w-2xl text-ink-600">
          Valeur du lot, prix du ticket, tickets restants et date de fin : tout est affiché avant de participer.
        </p>
      </header>
      <Suspense>
        <Filters categories={categories} />
      </Suspense>
      <p className="mt-6 mb-4 text-sm text-ink-500">
        {draws.length} tirage{draws.length > 1 ? "s" : ""}
        {filters.q && <> pour « <span className="font-semibold text-ink-800">{filters.q}</span> »</>}
      </p>
      {draws.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {draws.map((d) => (
            <DrawCard key={d.id} draw={d} now={now} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucun tirage ne correspond"
          description="Essayez d'élargir votre recherche ou de consulter les tirages à venir."
          action={<Link href="/tirages?view=all" className="btn-primary">Voir tous les tirages</Link>}
        />
      )}
    </div>
  );
}
