import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "Tout voir",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  href?: string;
  hrefLabel?: string;
  className?: string;
}) {
  return (
    <div className={clsx("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="h-display text-[2.1rem] leading-[1.05] sm:text-5xl">{title}</h2>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink-900 hover:text-brand-700">
          {hrefLabel}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-ink-300 bg-white/60 px-6 py-16 text-center">
      <p className="text-lg font-semibold text-ink-900">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
