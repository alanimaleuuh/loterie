"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { clsx } from "clsx";

const VIEWS = [
  { v: "open", l: "En cours" },
  { v: "ending", l: "Bientôt terminés" },
  { v: "new", l: "Nouveaux" },
  { v: "upcoming", l: "À venir" },
  { v: "finished", l: "Terminés" },
  { v: "all", l: "Tous" },
];

const SORTS = [
  { v: "recent", l: "Plus récents" },
  { v: "ending", l: "Fin prochaine" },
  { v: "price_asc", l: "Prix du ticket croissant" },
  { v: "price_desc", l: "Prix du ticket décroissant" },
  { v: "value_desc", l: "Valeur du lot" },
  { v: "popular", l: "Popularité" },
];

export function Filters({ categories, hideCategory }: { categories: { slug: string; name: string }[]; hideCategory?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [panel, setPanel] = useState(false);

  useEffect(() => setQ(sp.get("q") ?? ""), [sp]);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const view = sp.get("view") ?? "open";
  const activeCount = ["category", "maxPrice", "minValue", "maxValue"].filter((k) => sp.get(k)).length;

  return (
    <div className={clsx("space-y-4 transition-opacity", pending && "opacity-60")}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            set({ q: q.trim() || null });
          }}
          className="relative flex-1"
          role="search"
        >
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par nom, marque ou référence…"
            className="input rounded-full pl-11"
            maxLength={80}
            aria-label="Rechercher un lot"
          />
        </form>
        <div className="flex gap-2">
          <select value={sp.get("sort") ?? "recent"} onChange={(e) => set({ sort: e.target.value })} className="input w-auto flex-1 rounded-full pr-10 lg:flex-none" aria-label="Trier">
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>{s.l}</option>
            ))}
          </select>
          <button type="button" onClick={() => setPanel((v) => !v)} className={clsx("btn-secondary", (panel || activeCount > 0) && "border-ink-950")} aria-expanded={panel}>
            <SlidersHorizontal className="h-4 w-4" /> Filtres
            {activeCount > 0 && <span className="rounded-full bg-ink-950 px-1.5 text-[11px] text-white">{activeCount}</span>}
          </button>
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        {VIEWS.map((v) => (
          <button
            key={v.v}
            type="button"
            onClick={() => set({ view: v.v === "open" ? null : v.v })}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
              view === v.v ? "bg-ink-950 text-white" : "bg-white text-ink-700 ring-1 ring-ink-200 hover:ring-ink-300",
            )}
          >
            {v.l}
          </button>
        ))}
      </div>

      {panel && (
        <div className="card grid animate-fade-up gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {!hideCategory && (
            <label className="block">
              <span className="label">Catégorie</span>
              <select value={sp.get("category") ?? ""} onChange={(e) => set({ category: e.target.value })} className="input">
                <option value="">Toutes</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="label">Prix du ticket max.</span>
            <select value={sp.get("maxPrice") ?? ""} onChange={(e) => set({ maxPrice: e.target.value })} className="input">
              <option value="">Indifférent</option>
              {[2, 3, 4, 5, 10].map((p) => (
                <option key={p} value={p}>≤ {p} €</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Valeur du lot min.</span>
            <select value={sp.get("minValue") ?? ""} onChange={(e) => set({ minValue: e.target.value })} className="input">
              <option value="">Indifférent</option>
              {[300, 500, 800, 1000].map((p) => (
                <option key={p} value={p}>≥ {p} €</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Valeur du lot max.</span>
            <select value={sp.get("maxValue") ?? ""} onChange={(e) => set({ maxValue: e.target.value })} className="input">
              <option value="">Indifférent</option>
              {[400, 600, 800, 1000, 1500].map((p) => (
                <option key={p} value={p}>≤ {p} €</option>
              ))}
            </select>
          </label>
          {activeCount > 0 && (
            <button type="button" onClick={() => set({ category: null, maxPrice: null, minValue: null, maxValue: null })} className="btn-ghost justify-start sm:col-span-2 lg:col-span-4">
              <X className="h-4 w-4" /> Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}
