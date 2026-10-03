import type { DrawFilters } from "./queries";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const euros = (v?: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 1_000_000 ? Math.round(n * 100) : undefined;
};

const VIEWS = ["open", "upcoming", "ending", "new", "finished", "all"] as const;
const SORTS = ["recent", "ending", "price_asc", "price_desc", "popular", "value_desc"] as const;

/** Paramètres d'URL → filtres validés (liste blanche) */
export function parseFilters(sp: SP): DrawFilters {
  const view = one(sp.view);
  const sort = one(sp.sort);
  const category = one(sp.category);
  return {
    q: one(sp.q)?.slice(0, 80) || undefined,
    category: category && /^[a-z0-9-]{1,40}$/.test(category) ? category : undefined,
    maxTicketPrice: euros(one(sp.maxPrice)),
    minValue: euros(one(sp.minValue)),
    maxValue: euros(one(sp.maxValue)),
    view: (VIEWS as readonly string[]).includes(view ?? "") ? (view as DrawFilters["view"]) : "open",
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as DrawFilters["sort"]) : undefined,
  };
}
