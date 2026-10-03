import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="container-page max-w-3xl pt-10 sm:pt-14">
      <p className="eyebrow mb-3">Informations</p>
      <h1 className="h-display text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-500">Dernière mise à jour : {updated}</p>
      <div className="mt-8 flex gap-3 rounded-2xl border border-[#f0d9b5] bg-[#fdf6ea] p-4 text-sm text-[#7a5418]">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <strong>Document modèle — prototype de démonstration.</strong> Ce texte n&apos;a fait l&apos;objet d&apos;aucune validation juridique.
          Il devra être rédigé ou revu par un professionnel du droit, selon le pays ciblé, avant toute mise en production. Les mentions
          entre crochets sont à compléter.
        </p>
      </div>
      <article className="prose-legal mt-8">{children}</article>
    </div>
  );
}
