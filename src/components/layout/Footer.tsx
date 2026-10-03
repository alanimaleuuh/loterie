import Link from "next/link";
import { ShieldCheck, Lock, FlaskConical } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SITE } from "@/lib/config";

const cols = [
  {
    title: "Tirages",
    links: [
      { href: "/tirages", label: "Tirages en cours" },
      { href: "/tirages?view=upcoming", label: "À venir" },
      { href: "/tirages?view=ending", label: "Bientôt terminés" },
      { href: "/tirages?view=finished", label: "Tirages terminés" },
      { href: "/gagnants", label: "Nos gagnants" },
    ],
  },
  {
    title: "Catégories",
    links: [
      { href: "/categories/high-tech", label: "High-Tech" },
      { href: "/categories/informatique", label: "Informatique" },
      { href: "/categories/electromenager", label: "Électroménager" },
      { href: "/categories/maison", label: "Maison" },
      { href: "/categories/mobilier", label: "Mobilier" },
    ],
  },
  {
    title: "Transparence",
    links: [
      { href: "/comment-ca-marche", label: "Comment ça marche" },
      { href: "/reglement", label: "Règlement des tirages" },
      { href: "/comment-ca-marche#verification", label: "Vérifier un tirage" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Informations",
    links: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/cgu", label: "Conditions générales" },
      { href: "/confidentialite", label: "Confidentialité" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-200/70 bg-white">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-ink-600">
              Des lots soigneusement sélectionnés, des règles claires et des tirages vérifiables par tous.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-ink-600">
              <li className="flex items-center gap-2.5"><ShieldCheck className="h-4 w-4 text-brand-600" /> Tirages côté serveur, vérifiables</li>
              <li className="flex items-center gap-2.5"><Lock className="h-4 w-4 text-brand-600" /> Données personnelles protégées</li>
              <li className="flex items-center gap-2.5"><FlaskConical className="h-4 w-4 text-brand-600" /> Prototype — paiements simulés</li>
            </ul>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-sm font-semibold text-ink-950">{c.title}</p>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ink-600 transition hover:text-ink-950">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-sand-200 bg-sand-50 p-5 text-xs leading-relaxed text-ink-600">
          <strong className="text-ink-800">Avertissement — mode démonstration.</strong> {SITE.name} est un prototype technique. Il ne constitue
          pas une offre de jeu ou de loterie légalement exploitable. Aucun paiement réel n&apos;est accepté et aucun lot n&apos;est
          réellement attribué. Toute exploitation commerciale nécessiterait une validation juridique préalable selon le pays
          ciblé. Réservé aux personnes majeures.
        </div>
        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-ink-100 pt-6 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name} — Prototype de démonstration.</p>
          <p>Fait avec soin. Aucune donnée bancaire n&apos;est conservée.</p>
        </div>
      </div>
    </footer>
  );
}
