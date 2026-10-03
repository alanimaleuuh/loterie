import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = { title: "Questions fréquentes", description: "Toutes les réponses sur les tirages, les tickets, les paiements de démonstration et la vérification des résultats.", alternates: { canonical: "/faq" } };

const FAQ = [
  { c: "Participation", q: "Comment participer à un tirage ?", a: "Créez un compte, choisissez un lot, sélectionnez le nombre de tickets souhaité puis validez le paiement (simulé en mode démo). Vos numéros de tickets s'affichent immédiatement." },
  { c: "Participation", q: "Combien de tickets puis-je acheter ?", a: "Jusqu'à 50 tickets par commande, dans la limite des tickets encore disponibles. Le site empêche de sélectionner davantage que le stock restant." },
  { c: "Participation", q: "Que se passe-t-il quand tous les tickets sont vendus ?", a: "Le tirage passe en statut « Complet ». Il a lieu à la date et l'heure de fin annoncées, qui ne changent jamais une fois les ventes ouvertes." },
  { c: "Tirage", q: "Comment le gagnant est-il désigné ?", a: "Par le serveur, à la fin du compte à rebours, uniquement parmi les tickets valides. Le procédé cryptographique permet à chacun de recalculer le résultat. Voir « Comment ça marche »." },
  { c: "Tirage", q: "Quelles sont mes chances de gagner ?", a: "Votre nombre de tickets divisé par le nombre total de tickets vendus à la clôture. Exemple : 5 tickets sur 100 vendus = 5 % de chances." },
  { c: "Tirage", q: "Le résultat peut-il être modifié après le tirage ?", a: "Non. Les résultats sont enregistrés en écriture unique (la base de données refuse toute modification) et chaînés entre eux par empreintes cryptographiques." },
  { c: "Tirage", q: "Que se passe-t-il si le minimum de tickets n'est pas atteint ?", a: "Le tirage est annulé et chaque participant est intégralement remboursé. Vous êtes prévenu par e-mail." },
  { c: "Paiement", q: "Mes paiements sont-ils réels ?", a: "Non. Ce site est un prototype : tous les paiements sont simulés avec des cartes de test (ex. 4242 4242 4242 4242). Aucune vraie carte n'est acceptée et aucune donnée bancaire n'est conservée." },
  { c: "Gagnants", q: "Comment suis-je prévenu si je gagne ?", a: "Par e-mail, et dans vos notifications. Votre espace « Mes participations » indique « Gagné 🎉 » et le suivi de la remise du lot." },
  { c: "Gagnants", q: "Mon nom sera-t-il publié ?", a: "Seuls votre pseudonyme et l'initiale de votre nom apparaissent sur la page des gagnants. Votre e-mail et vos coordonnées ne sont jamais publiés." },
  { c: "Compte", q: "J'ai oublié mon mot de passe.", a: "Utilisez le lien « Mot de passe oublié » sur la page de connexion : un lien de réinitialisation valable une heure vous est envoyé." },
  { c: "Compte", q: "Comment supprimer mon compte ?", a: "Contactez le support. [Procédure d'exercice des droits RGPD à finaliser avant mise en production.]" },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const cats = [...new Set(FAQ.map((f) => f.c))];
  return (
    <div className="container-page max-w-3xl pt-10 sm:pt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <p className="eyebrow mb-3">Aide</p>
      <h1 className="h-display text-5xl sm:text-6xl">Questions fréquentes</h1>
      {cats.map((c) => (
        <section key={c} className="mt-10">
          <h2 className="mb-3 text-sm font-semibold tracking-widest text-ink-400 uppercase">{c}</h2>
          <div className="card divide-y divide-ink-100">
            {FAQ.filter((f) => f.c === c).map((f) => (
              <details key={f.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink-950">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-ink-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 leading-relaxed text-ink-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <p className="mt-10 text-center text-ink-600">Une autre question ? <Link href="/comment-ca-marche" className="font-semibold text-brand-700 underline">Découvrez le fonctionnement détaillé</Link>.</p>
    </div>
  );
}
