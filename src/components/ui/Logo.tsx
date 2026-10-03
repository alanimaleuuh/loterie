import Link from "next/link";
import { clsx } from "clsx";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={clsx("shrink-0", className)} aria-hidden>
      {/* Ticket stylisé avec encoches */}
      <path
        d="M8 4h24a4 4 0 0 1 4 4v7a5 5 0 0 0 0 10v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-7a5 5 0 0 0 0-10V8a4 4 0 0 1 4-4Z"
        fill="#0f6b57"
      />
      <path d="M15 12v16h11" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26" cy="13.5" r="2.4" fill="#f4c99b" />
    </svg>
  );
}

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={clsx("group inline-flex items-center gap-2.5", className)} aria-label="Lotelia — accueil">
      <LogoMark className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-6" />
      <span className={clsx("text-[1.35rem] font-semibold tracking-tight", light ? "text-white" : "text-ink-950")}>
        Lotelia
      </span>
    </Link>
  );
}
