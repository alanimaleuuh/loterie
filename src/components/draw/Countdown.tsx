"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

type Parts = { d: number; h: number; m: number; s: number; total: number };

function split(ms: number): Parts {
  const total = Math.max(0, ms);
  const sec = Math.floor(total / 1000);
  return { d: Math.floor(sec / 86400), h: Math.floor((sec % 86400) / 3600), m: Math.floor((sec % 3600) / 60), s: sec % 60, total };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Compte à rebours synchronisé sur l'heure du serveur (corrige la dérive de l'horloge client).
 * À zéro, la page est rafraîchie : le serveur clôture le tirage et effectue le tirage au sort.
 * Le résultat n'est JAMAIS calculé côté client.
 */
export function Countdown({
  target,
  serverNow,
  variant = "inline",
  label,
  expiredLabel = "Tirage en cours…",
  urgentBelowMs = 60 * 60 * 1000,
}: {
  target: string;
  serverNow: number;
  variant?: "inline" | "boxes" | "hero";
  label?: string;
  expiredLabel?: string;
  urgentBelowMs?: number;
}) {
  const router = useRouter();
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState(serverNow);
  const offset = useRef(0);
  const refreshed = useRef(0);

  useEffect(() => {
    offset.current = serverNow - Date.now();
    const id = setInterval(() => setNow(Date.now() + offset.current), 1000);
    return () => clearInterval(id);
  }, [serverNow]);

  const parts = split(targetMs - now);
  const expired = parts.total <= 0;

  // À zéro : rafraîchit la page (1,5 s puis toutes les 4 s, 8 fois max.) le temps que le serveur effectue le tirage
  useEffect(() => {
    if (!expired) return;
    const first = setTimeout(() => router.refresh(), 1500);
    const every = setInterval(() => {
      if (refreshed.current++ < 8) router.refresh();
    }, 4000);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [expired, router]);

  const urgent = !expired && parts.total < urgentBelowMs;

  if (variant === "inline") {
    if (expired)
      return <span className="text-sm font-semibold text-ink-600">{expiredLabel}</span>;
    return (
      <span className={clsx("tabular text-sm font-semibold", urgent ? "text-ember-600" : "text-ink-900")} aria-live="off">
        {label && <span className="mr-1 font-medium text-ink-500">{label}</span>}
        {parts.d > 0 && <>{parts.d}j </>}
        {pad(parts.h)}h {pad(parts.m)}min {pad(parts.s)}s
      </span>
    );
  }

  const units = [
    { v: parts.d, l: parts.d > 1 ? "Jours" : "Jour" },
    { v: parts.h, l: "Heures" },
    { v: parts.m, l: "Minutes" },
    { v: parts.s, l: "Secondes" },
  ];

  if (expired) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-ink-950 px-5 py-4 text-white">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-300" />
        <span className="font-semibold">{expiredLabel}</span>
      </div>
    );
  }

  return (
    <div>
      {label && <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-ink-500 uppercase">{label}</p>}
      <div className={clsx("grid grid-cols-4", variant === "hero" ? "gap-2 sm:gap-3" : "gap-2")} role="timer" aria-label={`${parts.d} jours ${parts.h} heures ${parts.m} minutes ${parts.s} secondes`}>
        {units.map((u, i) => (
          <div
            key={u.l}
            className={clsx(
              "flex flex-col items-center justify-center rounded-2xl text-center",
              variant === "hero" ? "py-3 sm:py-4" : "py-3",
              urgent ? "bg-ember-600 text-white" : "bg-ink-950 text-white",
            )}
          >
            <span
              key={i === 3 ? u.v : undefined}
              className={clsx("tabular font-semibold leading-none", variant === "hero" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl", i === 3 && "animate-tick")}
            >
              {pad(u.v)}
            </span>
            <span className="mt-1.5 text-[10px] font-medium tracking-[0.12em] text-white/60 uppercase sm:text-[11px]">{u.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
