import type { ReactNode } from "react";
import { clsx } from "clsx";

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "pos" | "neg" }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className={clsx("mt-2 text-2xl font-semibold tabular", tone === "neg" ? "text-ember-600" : tone === "pos" ? "text-brand-700" : "text-ink-950")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

export function Panel({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("card overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <h2 className="font-semibold text-ink-950">{title}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Flash({ ok, error, okText = "Modifications enregistrées." }: { ok?: string; error?: string; okText?: string }) {
  if (error) return <p className="mb-6 rounded-xl bg-ember-50 px-4 py-3 text-sm font-medium text-ember-600" role="alert">{error}</p>;
  if (ok) return <p className="mb-6 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700" role="status">{okText}</p>;
  return null;
}

/** Masque partiellement un e-mail : cl***@demo.fr */
export function maskEmail(email: string) {
  const [u, d] = email.split("@");
  return `${u.slice(0, 2)}${"*".repeat(Math.max(1, Math.min(5, u.length - 2)))}@${d}`;
}
