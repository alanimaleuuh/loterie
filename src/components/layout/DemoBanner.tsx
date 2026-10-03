import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { SECONDARY_NAV } from "./nav";

export function DemoBanner() {
  return (
    <div className="bg-ink-950 text-white">
      <div className="container-page flex h-9 items-center justify-between gap-4 text-xs">
        <p className="flex min-w-0 items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f4c99b] px-2 py-0.5 text-[10px] font-bold tracking-wider text-ink-950 uppercase">
            <FlaskConical className="h-3 w-3" /> Démo
          </span>
          <span className="truncate text-white/80">
            Prototype de démonstration — aucun paiement réel, aucun lot réellement attribué.
          </span>
        </p>
        <nav className="hidden items-center gap-5 md:flex" aria-label="Liens secondaires">
          {SECONDARY_NAV.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/70 transition hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
