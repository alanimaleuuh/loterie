import { clsx } from "clsx";
import type { ReactNode } from "react";

const tones = {
  neutral: "bg-ink-100 text-ink-700 ring-ink-200",
  success: "bg-brand-50 text-brand-700 ring-brand-100",
  warning: "bg-ember-50 text-ember-600 ring-ember-100",
  danger: "bg-red-50 text-red-700 ring-red-100",
  info: "bg-sky-50 text-sky-600 ring-sky-100",
  brand: "bg-ink-950 text-white ring-ink-950",
  sand: "bg-sand-100 text-ink-800 ring-sand-200",
} as const;

export type Tone = keyof typeof tones;

export function Badge({ tone = "neutral", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
