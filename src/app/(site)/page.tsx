import Link from "next/link";
import { ArrowRight, ShieldCheck, Fingerprint, Scale, Trophy, Ticket } from "lucide-react";
import { db } from "@/server/db";
import { listDraws, getCategories, publicDrawWhere } from "@/server/draws/queries";
import { processDueDraws } from "@/server/draws/engine";
import { DrawCard } from "@/components/draw/DrawCard";
import { Countdown } from "@/components/draw/Countdown";
import { Progress } from "@/components/draw/Progress";
import { LotImage } from "@/components/draw/LotImage";
import { StatusBadge } from "@/components/draw/StatusBadge";
import { HowItWorks } from "@/components/draw/HowItWorks";
import { SectionHeader } from "@/components/ui/Section";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { getDisplayStatus } from "@/lib/draw-status";
import { formatDate, formatEuro, percent, ticketLabel } from "@/lib/format";
import { SITE } from "@/lib/config";

export default async function HomePage() {
  await processDueDraws();
  const now = Date.now();
  const [open, ending, upcoming, categories, winners, stats] = await Promise.all([
    listDraws({ view: "open", sort: "popular" }, 8),
    listDraws({ view: "ending", sort: "ending" }, 4),
    listDraws({ view: "upcoming", sort: "recent" }, 3),
    getCategories(),
    db.winner.findMany({
      orderBy: { drawnAt: "desc" },
      take: 4,
      include: { draw: { include: { product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } } } } },
    }),
    Promise.all([
      db.draw.count({ where: { ...publicDrawWhere, status: "SCHEDULED", startsAt: { lte: new Date() }, endsAt: { gt: new Date() } } }),
      db.winner.count(),
      db.product.count({ where: { status: "ACTIVE" } }),
    ]),
  ]);
  const featured = open.find((d) => d.featured) ?? open[0];
  const others = open.filter((d) => d.id !== featured?.id).slice(0, 6);
  const [activeCount, winnersCount] = stats;
  const catCounts = await db.draw.groupBy({
    by: ["productId"],
    where: { ...publicDrawWhere, status: "SCHEDULED", endsAt: { gt: new Date() } },
    _count: true,
  });
  const productCats = await db.product.findMany({ where: { id: { in: catCounts.map((c) => c.productId) } }, select: { id: true, categoryId: true } });
  const countByCat = new Map<string, number>();
  for (const c of catCounts) {
    const cat = productCats.find((p) => p.id === c.productId)?.categoryId;
    if (cat) countByCat.set(cat, (countByCat.get(cat) ?? 0) + c._count);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    potentialAction: { "@type": "SearchAction", target: `${SITE.url}/tirages?view=all&q={search_term_string}`, "query-input": "required name=search_term_string" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-brand-100/60 blur-3xl" />
          <div className="absolute top-20 -right-40 h-[480px] w-[480px] rounded-full bg-sand-200/70 blur-3xl" />
        </div>
        <div className="container-page relative grid items-center gap-12 pt-10 pb-16 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20 lg:pb-24">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand-700 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> Tirages transparents et vérifiables
            </p>
            <h1 className="h-display mt-6 text-[3.1rem] leading-[0.98] sm:text-7xl lg:text-[5.4rem]">
              Votre prochain cadeau est <em className="text-brand-700">peut-être ici.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
              Découvrez nos prochains tirages : high-tech, maison, électroménager… Des règles claires, un nombre de tickets limité et
              un résultat que chacun peut vérifier.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/tirages" className="btn-primary btn-lg">
                Voir les tirages <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/comment-ca-marche" className="btn-secondary btn-lg">
                Comment ça marche ?
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-ink-200/70 pt-6">
              <div>
                <dt className="text-xs text-ink-500">Tirages en cours</dt>
                <dd className="mt-1 text-2xl font-semibold text-ink-950 tabular">{activeCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Gagnants désignés</dt>
                <dd className="mt-1 text-2xl font-semibold text-ink-950 tabular">{winnersCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Tirages vérifiables</dt>
                <dd className="mt-1 text-2xl font-semibold text-ink-950">100 %</dd>
              </div>
            </dl>
          </div>

          {featured && (
            <div className="relative animate-fade-up [animation-delay:120ms]">
              <div className="card overflow-hidden shadow-lift">
                <Link href={`/tirages/${featured.id}`} className="relative block aspect-[16/11] overflow-hidden bg-sand-100">
                  <LotImage src={featured.product.images[0]?.url} alt={featured.product.name} priority className="transition duration-700 hover:scale-[1.03]" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="rounded-full bg-ink-950 px-3 py-1 text-xs font-semibold text-white">À la une</span>
                    <StatusBadge status={getDisplayStatus(featured, now)} />
                  </div>
                </Link>
                <div className="p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-ink-400 uppercase">
                        {featured.product.category.name} · Tirage n°{featured.number}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-ink-950 sm:text-2xl">{featured.product.name}</h2>
                      <p className="mt-1 text-sm text-ink-500">
                        Valeur <span className="font-semibold text-ink-800">{formatEuro(featured.product.displayValue)}</span>
                      </p>
                    </div>
                    <div className="rounded-2xl bg-brand-50 px-4 py-2.5 text-center">
                      <p className="text-[10px] font-semibold tracking-wider text-brand-700 uppercase">Ticket</p>
                      <p className="text-2xl leading-tight font-bold text-brand-800">{formatEuro(featured.ticketPrice)}</p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <Countdown target={featured.endsAt.toISOString()} serverNow={now} variant="boxes" />
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-ink-700">
                        {featured.soldTickets} / {featured.maxTickets} tickets
                      </span>
                      <span className="font-semibold text-ink-900">{percent(featured.soldTickets, featured.maxTickets)} %</span>
                    </div>
                    <Progress sold={featured.soldTickets} max={featured.maxTickets} />
                  </div>
                  <Link href={`/tirages/${featured.id}/participer`} className="btn-brand btn-lg mt-6 w-full">
                    <Ticket className="h-4 w-4" /> Participer
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CATÉGORIES */}
      <section className="container-page" aria-label="Catégories">
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="group card flex min-w-[150px] snap-start items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-200"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sand-100 text-ink-800 transition group-hover:bg-brand-600 group-hover:text-white">
                <CategoryIcon name={c.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink-900">{c.name}</span>
                <span className="text-xs text-ink-500">{countByCat.get(c.id) ?? 0} tirage(s)</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* TIRAGES EN COURS */}
      <section className="container-page mt-20" id="tirages-en-cours">
        <SectionHeader eyebrow="En ce moment" title="Tirages en cours" description="Les lots les plus suivis du moment. Le nombre de tickets est limité pour chaque tirage." href="/tirages" hrefLabel="Voir tous les tirages" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((d) => (
            <DrawCard key={d.id} draw={d} now={now} />
          ))}
        </div>
      </section>

      {/* BIENTÔT TERMINÉS */}
      {ending.length > 0 && (
        <section className="container-page mt-20">
          <SectionHeader eyebrow="Dernière ligne droite" title={<>Bientôt <em>terminés</em></>} href="/tirages?view=ending" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ending.map((d) => (
              <DrawCard key={d.id} draw={d} now={now} />
            ))}
          </div>
        </section>
      )}

      {/* COMMENT ÇA MARCHE */}
      <section className="container-page mt-24">
        <SectionHeader eyebrow="Simple et clair" title="Comment ça marche ?" description="Cinq étapes, aucune surprise. Les règles de chaque tirage sont affichées avant toute participation." href="/comment-ca-marche" hrefLabel="En savoir plus" />
        <HowItWorks />
      </section>

      {/* TRANSPARENCE */}
      <section className="container-page mt-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink-950 px-6 py-12 text-white sm:px-12 sm:py-16">
          <div aria-hidden className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-brand-300 uppercase">Transparence</p>
              <h2 className="h-display mt-3 text-4xl leading-tight text-white sm:text-5xl">Un tirage que vous pouvez vérifier vous-même.</h2>
              <p className="mt-4 max-w-lg leading-relaxed text-white/70">
                Avant l&apos;ouverture de chaque tirage, nous publions l&apos;empreinte cryptographique d&apos;une graine secrète. Après le
                tirage, la graine est révélée : chacun peut recalculer le ticket gagnant et constater que rien n&apos;a été modifié.
              </p>
              <Link href="/comment-ca-marche#verification" className="btn mt-7 bg-white text-ink-950 hover:bg-sand-100">
                Comprendre la vérification <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="grid gap-3">
              {[
                { icon: Fingerprint, t: "Engagement publié à l'avance", d: "SHA-256 de la graine affiché sur chaque tirage, avant la vente." },
                { icon: Scale, t: "Tirage côté serveur", d: "Seuls les tickets valides participent. Aucun calcul côté navigateur." },
                { icon: ShieldCheck, t: "Résultat immuable", d: "Résultats chaînés et protégés en base : toute modification est impossible." },
              ].map((i) => (
                <li key={i.t} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <i.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
                  <div>
                    <p className="font-semibold">{i.t}</p>
                    <p className="mt-1 text-sm text-white/60">{i.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* GAGNANTS */}
      {winners.length > 0 && (
        <section className="container-page mt-24">
          <SectionHeader eyebrow="Ils ont gagné" title="Nos derniers gagnants" href="/gagnants" hrefLabel="Tous les gagnants" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {winners.map((w) => (
              <Link key={w.id} href={`/tirages/${w.drawId}`} className="group card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="aspect-[4/3] overflow-hidden bg-sand-100">
                  <LotImage src={w.draw.product.images[0]?.url} alt={w.draw.product.name} className="transition duration-700 group-hover:scale-[1.04]" />
                </div>
                <div className="p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink-950">
                    <Trophy className="h-4 w-4 text-[#c89a5b]" /> {w.publicName}
                  </p>
                  <p className="mt-1 truncate text-sm text-ink-600">{w.draw.product.name}</p>
                  <p className="mt-3 text-xs text-ink-400">
                    Ticket {ticketLabel(w.ticketNumber)} · {formatDate(w.drawnAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* À VENIR */}
      {upcoming.length > 0 && (
        <section className="container-page mt-24">
          <SectionHeader eyebrow="Bientôt" title="Prochains tirages" href="/tirages?view=upcoming" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((d) => (
              <DrawCard key={d.id} draw={d} now={now} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container-page mt-24">
        <div className="card flex flex-col items-start justify-between gap-6 bg-gradient-to-br from-white to-sand-50 p-8 sm:p-12 lg:flex-row lg:items-center">
          <div>
            <h2 className="h-display text-4xl">Prêt à tenter votre chance ?</h2>
            <p className="mt-2 text-ink-600">Créez votre compte en une minute. Mode démo : aucun paiement réel.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/inscription" className="btn-primary btn-lg">Créer un compte</Link>
            <Link href="/faq" className="btn-secondary btn-lg">Questions fréquentes</Link>
          </div>
        </div>
      </section>
    </>
  );
}
