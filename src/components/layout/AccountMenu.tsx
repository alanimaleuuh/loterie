"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Ticket, User, Bell, Receipt } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export function AccountMenu({ firstName, isAdmin }: { firstName: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const items = [
    { href: "/mon-compte", label: "Mon compte", icon: User },
    { href: "/mes-participations", label: "Mes participations", icon: Ticket },
    { href: "/mon-compte/achats", label: "Mes achats (démo)", icon: Receipt },
    { href: "/mon-compte/notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1.5 pr-3 pl-1.5 text-sm font-medium text-ink-800 transition hover:border-ink-300"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {firstName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:inline">Mon compte</span>
        <ChevronDown className="h-4 w-4 text-ink-400" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 animate-fade-up overflow-hidden rounded-2xl border border-ink-200 bg-white p-1.5 shadow-lift">
          <p className="px-3 pt-2 pb-2 text-xs text-ink-500">
            Bonjour <span className="font-semibold text-ink-800">{firstName}</span>
          </p>
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-100" role="menuitem">
              <Icon className="h-4 w-4 text-ink-400" /> {label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50" role="menuitem">
              <LayoutDashboard className="h-4 w-4" /> Administration
            </Link>
          )}
          <form action={logoutAction} className="mt-1 border-t border-ink-100 pt-1">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-100" role="menuitem">
              <LogOut className="h-4 w-4 text-ink-400" /> Déconnexion
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
