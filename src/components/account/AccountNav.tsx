"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const TABS = [
  { href: "/mon-compte", label: "Profil" },
  { href: "/mes-participations", label: "Mes participations" },
  { href: "/mon-compte/achats", label: "Achats (démo)" },
  { href: "/mon-compte/notifications", label: "Notifications" },
];

export function AccountNav() {
  const p = usePathname();
  return (
    <nav className="-mx-4 mb-8 flex gap-1 overflow-x-auto border-b border-ink-200 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden" aria-label="Espace personnel">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={clsx(
            "-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition",
            p === t.href ? "border-ink-950 text-ink-950" : "border-transparent text-ink-500 hover:text-ink-900",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
