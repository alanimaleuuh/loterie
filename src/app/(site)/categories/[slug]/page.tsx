import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { listDraws, getCategories } from "@/server/draws/queries";
import { processDueDraws } from "@/server/draws/engine";
import { parseFilters } from "@/server/draws/params";
import { DrawCard } from "@/components/draw/DrawCard";
import { Filters } from "@/components/draw/Filters";
import { EmptyState } from "@/components/ui/Section";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await db.category.findUnique({ where: { slug } });
  if (!cat) return {};
  return { title: `Tirages ${cat.name}`, description: cat.description, alternates: { canonical: `/categories/${slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const cat = await db.category.findUnique({ where: { slug } });
  if (!cat) notFound();
  await processDueDraws();
  const filters = { ...parseFilters(await searchParams), category: slug };
  const [draws, categories] = await Promise.all([listDraws(filters), getCategories()]);
  const now = Date.now();

  return (
    <div className="container-page pt-10 sm:pt-14">
      <nav className="mb-6 text-sm text-ink-500" aria-label="Fil d'Ariane">
        <Link href="/" className="hover:text-ink-900">Accueil</Link> <span className="mx-1.5">/</span>
        <Link href="/tirages" className="hover:text-ink-900">Tirages</Link> <span className="mx-1.5">/</span>
        <span className="text-ink-800">{cat.name}</span>
      </nav>
      <header className="mb-8 flex items-start gap-5">
        <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-sand-100 text-ink-800 sm:flex">
          <CategoryIcon name={cat.icon} className="h-7 w-7" />
        </span>
        <div>
          <h1 className="h-display text-5xl sm:text-6xl">{cat.name}</h1>
          <p className="mt-2 max-w-2xl text-ink-600">{cat.description}</p>
        </div>
      </header>
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <Link key={c.slug} href={`/categories/${c.slug}`} className={c.slug === slug ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>
            {c.name}
          </Link>
        ))}
      </div>
      <Suspense>
        <Filters categories={categories} hideCategory />
      </Suspense>
      <div className="mt-8">
        {draws.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {draws.map((d) => (
              <DrawCard key={d.id} draw={d} now={now} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={`Aucun tirage ${cat.name.toLowerCase()} pour ces critères`}
            description="De nouveaux lots arrivent régulièrement. Consultez les tirages à venir ou les autres catégories."
            action={<Link href={`/categories/${slug}?view=all`} className="btn-primary">Voir tout dans {cat.name}</Link>}
          />
        )}
      </div>
    </div>
  );
}
