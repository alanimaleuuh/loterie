/**
 * Planificateur interne : clôture et tire au sort les tirages arrivés à échéance,
 * et envoie les rappels. En production multi-instance, préférer le cron externe
 * (POST /api/cron/draws ou `npm run draws:run`) — le moteur est idempotent dans les deux cas.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_DRAW_SCHEDULER === "true") return;
  const g = globalThis as { __drawScheduler?: NodeJS.Timeout };
  if (g.__drawScheduler) return;
  const { processDueDraws } = await import("./server/draws/engine");
  const interval = Math.max(5, Number(process.env.DRAW_SCHEDULER_INTERVAL ?? 15)) * 1000;
  g.__drawScheduler = setInterval(() => {
    processDueDraws().catch((e) => console.error("[scheduler]", e));
  }, interval);
  console.info(`[scheduler] tirages automatiques actifs (toutes les ${interval / 1000} s)`);
}
