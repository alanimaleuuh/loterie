"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { LayoutDashboard, Ticket, Package, Users, Mail, ScrollText, ExternalLink } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/tirages", label: "Tirages", icon: Ticket },
  { href: "/admin/produits", label: "Lots", icon: Package },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/notifications", label: "E-mails", icon: Mail },
  { href: "/admin/journal", label: "Journal d'activité", icon: ScrollText },
];

export function AdminNav() {
  const p = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col [&::-webkit-scrollbar]:hidden" aria-label="Administration">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? p === href : p.startsWith(href);
        return (
          <Link key={href} href={href} className={clsx("flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}>
            <Icon className="h-4 w-4" /> {label}
          </Link>
        );
      })}
      <Link href="/" className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:text-white lg:mt-6">
        <ExternalLink className="h-4 w-4" /> Voir le site
      </Link>
    </nav>
  );
}
