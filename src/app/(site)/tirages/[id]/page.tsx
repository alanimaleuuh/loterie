import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Fingerprint, Hash, Info, ShieldCheck, Ticket, Trophy, Users, Lock } from "lucide-react";
import { db } from "@/server/db";
import { getDrawDetail } from "@/server/draws/detail";
import { processDueDraws } from "@/server/draws/engine";
import { getCurrentUser } from "@/server/auth/session";
import { listDraws } from "@/server/draws/queries";
import { getDisplayStatus, isOpenForSale } from "@/lib/draw-status";
import { formatDateTime, formatEuro, percent, ticketLabel } from "@/lib/format";
import { SITE } from "@/lib/config";
import { Gallery } from "@/components/draw/Gallery";
import { Countdown } from "@/components/draw/Countdown";
import { Progress } from "@/components/draw/Progress";
import { StatusBadge } from "@/components/draw/StatusBadge";
import { DrawCard } from "@/components/draw/DrawCard";
import { SectionHeader } from "@/components/ui/Section";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const d = await getDrawDetail(id);
  if (!d || d.status === "DISABLED") return { title: "Tirage introuvable" };
  const title = `${d.product.name} — Tirage n°${d.number}`;
  const description = `Gagnez ${d.product.name} (valeur ${formatEuro(d.product.displayValue)}). Ticket à ${formatEuro(d.ticketPrice)}, ${d.maxTickets} tickets maximum. ${d.product.shortDescription}`;
  return {
    title,
    description,
    alternates: { canonical: `/tirages/${d.id}` },
    openGraph: { title, description, images: d.product.images[0] ? [{ url: d.product.images[0].url }] : undefined },
  };
}

export default async function DrawPage({ params }: Props) {
  const { id } = await params;
  await processDueDraws();
  const [draw, user] = await Promise.all([getDrawDetail(id), getCurrentUser()]);
  if (!draw || (draw.status === "DISABLED" && user?.role !== "ADMIN")) notFound();

  const now = Date.now();
  const status = getDisplayStatus(draw, now);
  const open = isOpenForSale(status);
  const remaining = Math.max(0, draw.maxTickets - draw.soldTickets);
  const [myTickets, participants, similar] = await Promise.all([
    user ? db.ticket.findMany({ where: { drawId: draw.id, userId: user.id, participation: { status: "CONFIRMED" } }, orderBy: { number: "asc" }, select: { number: true } }) : [],
    db.participation.groupBy({ by: ["userId"], where: { drawId: draw.id, status: "CONFIRMED" } }).then((r) => r.length),
    listDraws({ view: "open", category: draw.product.category.slug }, 4).then((l) => l.filter((d) => d.id !== draw.id).slice(0, 3)),
  ]);
  const iWon = !!user && draw.winner?.userId === user.id;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: draw.product.name,
    brand: draw.product.brand ? { "@type": "Brand", name: draw.product.brand } : undefined,
    sku: draw.product.reference,
    description: draw.product.shortDescription,
    image: draw.product.images.map((i) => `${SITE.url}${i.url}`),
    category: draw.product.category.name,
  };

  return (
    <div className="container-page pt-8 sm:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="mb-6 text-sm text-ink-500" aria-label="Fil d'Ariane">
        <Link href="/tirages" className="hover:text-ink-900">Tirages</Link> <span className="mx-1.5">/</span>
        <Link href={`/categories/${draw.product.category.slug}`} className="hover:text-ink-900">{draw.product.category.name}</Link>
        <span className="mx-1.5">/</span> <span className="text-ink-800">{draw.product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Gallery images={draw.product.images} name={draw.product.name} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-ink-700">Tirage n°{draw.number}</span>
            <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-ink-700">Réf. {draw.product.reference}</span>
          </div>
          <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-ink-950 sm:text-4xl">{draw.product.name}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{draw.product.shortDescription}</p>

          <dl className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-ink-200/70 bg-white p-4">
              <dt className="text-xs font-medium text-ink-500">Valeur du lot</dt>
              <dd className="mt-1 text-2xl font-semibold text-ink-950">{formatEuro(draw.product.displayValue)}</dd>
            </div>
            <div className="rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
              <dt className="text-xs font-medium text-brand-700">Prix d&apos;un ticket</dt>
              <dd className="mt-1 text-2xl font-semibold text-brand-800">{formatEuro(draw.ticketPrice)}</dd>
            </div>
          </dl>

          {/* Bloc compte à rebours / résultat */}
          <div className="card mt-4 p-5 sm:p-6">
            {status === "drawn" && draw.winner ? (
              <div>
                <div className={iWon ? "rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white" : "rounded-2xl bg-ink-950 p-5 text-white"}>
                  <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-white/60 uppercase">
                    <Trophy className="h-4 w-4 text-[#f4c99b]" /> Résultat du tirage
                  </p>
                  <p className="mt-3 text-2xl font-semibold">{iWon ? "Félicitations, vous avez gagné ! 🎉" : `Gagnant : ${draw.winner.publicName}`}</p>
                  <p className="mt-1 text-white/70">
                    Ticket gagnant <span className="font-semibold text-white">{ticketLabel(draw.winner.ticketNumber)}</span> parmi {draw.winner.ticketCount} tickets valides
                  </p>
                  <p className="mt-1 text-sm text-white/50">Tiré le {formatDateTime(draw.winner.drawnAt)}</p>
                </div>
                <Link href={`/verification/${draw.id}`} className="btn-secondary mt-4 w-full">
                  <ShieldCheck className="h-4 w-4" /> Vérifier ce tirage
                </Link>
              </div>
            ) : status === "cancelled" ? (
              <div className="rounded-2xl bg-ink-100 p-5">
                <p className="font-semibold text-ink-900">Tirage annulé</p>
                <p className="mt-1 text-sm text-ink-600">
                  Motif : {draw.cancelReason}. Tous les participants ont été intégralement remboursés (simulation).
                </p>
              </div>
            ) : (
              <>
                <Countdown
                  target={(status === "upcoming" ? draw.startsAt : draw.endsAt).toISOString()}
                  serverNow={now}
                  variant="boxes"
                  label={status === "upcoming" ? "Ouverture des participations dans" : "Fin du tirage dans"}
                  expiredLabel={status === "upcoming" ? "Ouverture en cours…" : "Participations verrouillées — tirage en cours…"}
                />
                <div className="mt-6">
                  <div className="mb-2 flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-ink-900">
                      {draw.soldTickets} / {draw.maxTickets} <span className="font-normal text-ink-500">tickets vendus</span>
                    </span>
                    <span className="font-semibold tabular">{percent(draw.soldTickets, draw.maxTickets)} %</span>
                  </div>
                  <Progress sold={draw.soldTickets} max={draw.maxTickets} size="lg" tone={status === "ending" ? "ember" : "brand"} />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-ink-500">
                    <p><span className="block text-base font-semibold text-ink-900">{draw.maxTickets}</span>tickets au total</p>
                    <p><span className="block text-base font-semibold text-ink-900">{draw.soldTickets}</span>vendus</p>
                    <p><span className="block text-base font-semibold text-ink-900">{remaining}</span>restants</p>
                  </div>
                </div>
                {open ? (
                  <Link href={`/tirages/${draw.id}/participer`} className="btn-brand btn-lg mt-6 w-full">
                    <Ticket className="h-5 w-5" /> Choisir mes tickets
                  </Link>
                ) : status === "upcoming" ? (
                  <p className="mt-6 rounded-2xl bg-sky-50 px-4 py-3 text-center text-sm text-sky-600">
                    Les participations ouvriront le {formatDateTime(draw.startsAt)}.
                  </p>
                ) : (
                  <p className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-ink-100 px-4 py-3 text-center text-sm text-ink-700">
                    <Lock className="h-4 w-4" />
                    {status === "soldout" ? `Complet — tirage le ${formatDateTime(draw.endsAt)}` : "Participations fermées"}
                  </p>
                )}
              </>
            )}

            {myTickets.length > 0 && (
              <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                <p className="text-sm font-semibold text-brand-800">Vos tickets ({myTickets.length})</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {myTickets.slice(0, 40).map((t) => (
                    <span key={t.number} className={`rounded-lg px-2 py-1 font-mono text-xs ${draw.winner?.ticketNumber === t.number ? "bg-brand-600 text-white" : "bg-white text-ink-800 ring-1 ring-brand-100"}`}>
                      {ticketLabel(t.number)}
                    </span>
                  ))}
                  {myTickets.length > 40 && <span className="text-xs text-ink-500">+{myTickets.length - 40}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Informations clés */}
          <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <li className="flex gap-3 rounded-2xl border border-ink-200/70 bg-white p-4">
              <CalendarClock className="h-5 w-5 shrink-0 text-ink-400" />
              <span><span className="block text-ink-500">Début</span><span className="font-medium text-ink-900">{formatDateTime(draw.startsAt)}</span></span>
            </li>
            <li className="flex gap-3 rounded-2xl border border-ink-200/70 bg-white p-4">
              <CalendarClock className="h-5 w-5 shrink-0 text-ink-400" />
              <span><span className="block text-ink-500">Fin et tirage</span><span className="font-medium text-ink-900">{formatDateTime(draw.endsAt)}</span></span>
            </li>
            <li className="flex gap-3 rounded-2xl border border-ink-200/70 bg-white p-4">
              <Users className="h-5 w-5 shrink-0 text-ink-400" />
              <span><span className="block text-ink-500">Participants</span><span className="font-medium text-ink-900">{participants}</span></span>
            </li>
            <li className="flex gap-3 rounded-2xl border border-ink-200/70 bg-white p-4">
              <Hash className="h-5 w-5 shrink-0 text-ink-400" />
              <span><span className="block text-ink-500">Minimum requis</span><span className="font-medium text-ink-900">{draw.minTickets ? `${draw.minTickets} tickets` : "Aucun"}</span></span>
            </li>
          </ul>
        </div>
      </div>

      {/* Description + règles */}
      <div className="mt-16 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <section>
          <h2 className="text-xl font-semibold text-ink-950">Description du lot</h2>
          <div className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-ink-700">{draw.product.description}</div>
        </section>
        <section className="space-y-4">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950"><Info className="h-5 w-5 text-brand-600" /> Règles de ce tirage</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-700">
              <li>• <strong>{draw.maxTickets} tickets maximum</strong> à {formatEuro(draw.ticketPrice)} l&apos;unité. Chaque ticket porte un numéro unique (#0001 à {ticketLabel(draw.maxTickets)}).</li>
              <li>• Les participations sont ouvertes du {formatDateTime(draw.startsAt)} au {formatDateTime(draw.endsAt)}.</li>
              <li>• À la fin du compte à rebours, les participations sont verrouillées et le tirage est effectué <strong>automatiquement par le serveur</strong>, uniquement parmi les tickets effectivement attribués.</li>
              <li>• Chaque ticket a exactement la même probabilité de gagner : 1 chance sur le nombre de tickets vendus.</li>
              {draw.minTickets ? (
                <li>• Si moins de <strong>{draw.minTickets} tickets</strong> sont vendus, le tirage est annulé et tous les participants sont intégralement remboursés.</li>
              ) : (
                <li>• Si aucun ticket n&apos;est vendu, le tirage est annulé.</li>
              )}
              <li>• Le gagnant est prévenu par e-mail ; son pseudonyme est publié sur la page des gagnants. Aucune donnée personnelle n&apos;est rendue publique.</li>
            </ul>
            <Link href="/reglement" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">Lire le règlement complet →</Link>
          </div>
          <div className="rounded-[var(--radius-card)] bg-ink-950 p-6 text-white">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Fingerprint className="h-5 w-5 text-brand-300" /> Engagement d&apos;équité</h2>
            <p className="mt-2 text-sm text-white/65">
              Empreinte SHA-256 de la graine secrète, publiée avant l&apos;ouverture. Elle sera révélée après le tirage pour permettre la vérification.
            </p>
            <code className="mt-4 block rounded-xl bg-white/5 p-3 font-mono text-[11px] break-all text-brand-200">{draw.seedHash}</code>
            <Link href={`/verification/${draw.id}`} className="mt-4 inline-block text-sm font-semibold text-brand-300 hover:underline">Page de vérification →</Link>
          </div>
        </section>
      </div>

      {similar.length > 0 && (
        <section className="mt-20">
          <SectionHeader title="Vous aimerez aussi" href={`/categories/${draw.product.category.slug}`} hrefLabel={`Tout ${draw.product.category.name}`} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((d) => (
              <DrawCard key={d.id} draw={d} now={now} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
