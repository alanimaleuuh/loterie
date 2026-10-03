"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { Logo } from "@/components/ui/Logo";
import { SECONDARY_NAV } from "./nav";
import { logoutAction } from "@/app/actions/auth";

export function MobileMenu({ items, user }: { items: { href: string; label: string }[]; user: { firstName: string; isAdmin: boolean } | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-800 hover:bg-ink-100 xl:hidden"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className={clsx("fixed inset-0 z-50 xl:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
        <div className={clsx("absolute inset-0 bg-ink-950/40 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <aside
          className={clsx(
            "absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-paper shadow-lift transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label="Menu mobile"
        >
          <div className="flex h-16 items-center justify-between border-b border-ink-200/70 px-4">
            <Logo />
            <button onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink-100" aria-label="Fermer le menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {items.map((it) => (
              <Link key={it.href} href={it.href} className="flex items-center justify-between rounded-xl px-3 py-3.5 text-[15px] font-medium text-ink-900 hover:bg-ink-100">
                {it.label}
                <ArrowRight className="h-4 w-4 text-ink-300" />
              </Link>
            ))}
            <div className="my-3 border-t border-ink-200/70" />
            {SECONDARY_NAV.map((it) => (
              <Link key={it.href} href={it.href} className="block rounded-xl px-3 py-3 text-[15px] text-ink-600 hover:bg-ink-100">
                {it.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-2 border-t border-ink-200/70 p-4">
            {user ? (
              <>
                <Link href="/mon-compte" className="btn-primary w-full">Mon compte</Link>
                <Link href="/mes-participations" className="btn-secondary w-full">Mes participations</Link>
                {user.isAdmin && <Link href="/admin" className="btn-secondary w-full">Administration</Link>}
                <form action={logoutAction}>
                  <button className="btn-ghost w-full">Déconnexion</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/inscription" className="btn-primary w-full">Créer un compte</Link>
                <Link href="/connexion" className="btn-secondary w-full">Connexion</Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
