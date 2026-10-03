import type { ReactNode } from "react";
import { ShieldCheck, Ticket, Trophy } from "lucide-react";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="container-page grid min-h-[calc(100dvh-110px)] items-center gap-12 py-12 lg:grid-cols-[1fr_1fr]">
      <div className="mx-auto w-full max-w-md">
        <h1 className="h-display text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 text-ink-600">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-ink-600">{footer}</div>}
      </div>
      <aside className="relative hidden h-full min-h-[560px] overflow-hidden rounded-[2rem] bg-ink-950 p-10 text-white lg:flex lg:flex-col lg:justify-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lots/iphone-2.svg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent" />
        <div className="relative">
          <p className="h-display text-4xl text-white">Des tirages clairs, des règles visibles, des résultats vérifiables.</p>
          <ul className="mt-6 space-y-3 text-sm text-white/75">
            <li className="flex items-center gap-3"><Ticket className="h-4 w-4 text-brand-300" /> Nombre de tickets limité et affiché</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-brand-300" /> Tirage effectué côté serveur, vérifiable</li>
            <li className="flex items-center gap-3"><Trophy className="h-4 w-4 text-brand-300" /> Gagnant prévenu par e-mail</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
