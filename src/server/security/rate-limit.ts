import "server-only";

/**
 * Limiteur de débit à fenêtre glissante, en mémoire.
 * Production multi-instance : remplacer par un stockage partagé (Redis / Upstash).
 */
type Bucket = number[];
const store: Map<string, Bucket> = (globalThis as { __rl?: Map<string, Bucket> }).__rl ?? new Map();
(globalThis as { __rl?: Map<string, Bucket> }).__rl = store;

export type RateRule = { limit: number; windowMs: number };

export const RATE_RULES = {
  login: { limit: 8, windowMs: 60_000 },
  register: { limit: 5, windowMs: 10 * 60_000 },
  forgot: { limit: 4, windowMs: 10 * 60_000 },
  purchase: { limit: 15, windowMs: 60_000 },
  account: { limit: 20, windowMs: 60_000 },
  admin: { limit: 120, windowMs: 60_000 },
} satisfies Record<string, RateRule>;

// En développement, limites assouplies (tests répétés) ; valeurs nominales en production.
const FACTOR = process.env.NODE_ENV === "production" ? 1 : 5;

export function rateLimit(key: string, baseRule: RateRule): { ok: boolean; retryAfterSec: number } {
  const rule = { ...baseRule, limit: baseRule.limit * FACTOR };
  const now = Date.now();
  const bucket = (store.get(key) ?? []).filter((t) => now - t < rule.windowMs);
  if (bucket.length >= rule.limit) {
    store.set(key, bucket);
    return { ok: false, retryAfterSec: Math.ceil((rule.windowMs - (now - bucket[0])) / 1000) };
  }
  bucket.push(now);
  store.set(key, bucket);
  if (store.size > 10_000) {
    for (const [k, v] of store) if (v.every((t) => now - t > 3_600_000)) store.delete(k);
  }
  return { ok: true, retryAfterSec: 0 };
}
