import { AccountNav } from "./AccountNav";

export function AccountHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <header className="pt-10 pb-6 sm:pt-14">
        <p className="eyebrow mb-3">Espace personnel</p>
        <h1 className="h-display text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 text-ink-600">{subtitle}</p>}
      </header>
      <AccountNav />
    </>
  );
}
