import type { Metadata } from "next";
import Link from "next/link";
import { Fingerprint, ListOrdered, Lock, Shuffle, Eye, Link2 } from "lucide-react";
import { HowItWorks } from "@/components/draw/HowItWorks";

export const metadata: Metadata = {
  title: "Comment ça marche ?",
  description: "Choisissez un lot, vos tickets, et suivez le tirage. Découvrez comment chaque tirage est effectué côté serveur et vérifiable par tous.",
  alternates: { canonical: "/comment-ca-marche" },
};

const FAIR = [
  { icon: Fingerprint, t: "1. Engagement avant la vente", d: "À la création du tirage, le serveur génère une graine aléatoire secrète de 256 bits. Seule son empreinte SHA-256 est publiée sur la page du tirage — avant la vente du premier ticket." },
  { icon: ListOrdered, t: "2. Numéros uniques", d: "Chaque ticket acheté reçoit un numéro unique et séquentiel (#0001, #0002…). Un ticket ne peut pas être créé en dehors des dates du tirage, ni au-delà du nombre maximum : la base de données l'interdit." },
  { icon: Lock, t: "3. Verrouillage", d: "À zéro, les participations sont verrouillées. La liste des tickets valides est figée et résumée par une empreinte cryptographique." },
  { icon: Shuffle, t: "4. Tirage côté serveur", d: "L'index du ticket gagnant est calculé par HMAC-SHA256(graine, n° du tirage + empreinte des tickets) modulo le nombre de tickets vendus. Seuls les tickets effectivement attribués participent." },
  { icon: Eye, t: "5. Révélation", d: "La graine est publiée. N'importe qui peut recalculer le résultat — directement dans son navigateur sur la page de vérification." },
  { icon: Link2, t: "6. Résultat immuable", d: "Chaque résultat est chaîné au précédent par une empreinte. La table des résultats est protégée en écriture unique : aucune modification n'est possible après le tirage." },
];

export default function HowPage() {
  return (
    <div className="container-page pt-10 sm:pt-14">
      <header className="max-w-3xl">
        <p className="eyebrow mb-3">Fonctionnement</p>
        <h1 className="h-display text-5xl sm:text-6xl">Comment ça marche ?</h1>
        <p className="mt-4 text-lg text-ink-600">Vous savez toujours ce que vous pouvez gagner, combien coûte la participation, combien de tickets sont disponibles, quand le tirage aura lieu et comment le gagnant est déterminé.</p>
      </header>
      <div className="mt-12"><HowItWorks /></div>

      <section className="mt-20 grid gap-6 lg:grid-cols-3">
        {[
          { q: "Qu'est-ce que je peux gagner ?", a: "Le lot présenté sur la fiche : photos, description, référence et valeur affichée." },
          { q: "Combien coûte la participation ?", a: "Le prix d'un ticket est fixe et affiché. Vous choisissez librement le nombre de tickets." },
          { q: "Quelles sont mes chances ?", a: "Chaque ticket a la même chance : 1 sur le nombre total de tickets vendus à la clôture." },
        ].map((x) => (
          <div key={x.q} className="card p-6">
            <h3 className="font-semibold text-ink-950">{x.q}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{x.a}</p>
          </div>
        ))}
      </section>

      <section id="verification" className="mt-20 scroll-mt-28">
        <p className="eyebrow mb-3">Transparence</p>
        <h2 className="h-display text-4xl sm:text-5xl">Comment le gagnant est déterminé</h2>
        <p className="mt-3 max-w-3xl text-ink-600">
          Le tirage n&apos;est jamais effectué dans votre navigateur : il est réalisé par le serveur, selon un protocole dit « engagement puis révélation » (commit-reveal) qui permet à chacun de contrôler le résultat.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FAIR.map((f) => (
            <div key={f.t} className="card p-6">
              <f.icon className="h-6 w-6 text-brand-600" />
              <h3 className="mt-4 font-semibold text-ink-950">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5 text-sm leading-relaxed text-ink-600">
          <strong className="text-ink-900">Limite connue (prototype).</strong> Dans ce modèle, l&apos;opérateur connaît la graine avant le tirage. Pour une exploitation réelle,
          il est recommandé d&apos;y ajouter une source d&apos;aléa publique et imprévisible publiée après la clôture (balise d&apos;aléa publique type drand) et/ou un contrôle par un tiers indépendant
          (par exemple un commissaire de justice), selon les exigences légales applicables.
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/gagnants" className="btn-primary">Vérifier un tirage terminé</Link>
          <Link href="/reglement" className="btn-secondary">Lire le règlement</Link>
        </div>
      </section>
    </div>
  );
}
