"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="ml-4 hidden items-center gap-0 xl:flex" aria-label="Navigation principale">
      {items.map((it) => {
        const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={clsx(
              "rounded-full px-2.5 py-2 text-[13px] font-medium whitespace-nowrap transition",
              active ? "bg-ink-950 text-white" : "text-ink-700 hover:bg-ink-100 hover:text-ink-950",
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
