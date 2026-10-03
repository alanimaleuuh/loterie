"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

const SUGGESTIONS = ["TV 4K", "iPhone", "MacBook", "Machine à café", "Console", "Canapé"];

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = (term: string) => {
    setOpen(false);
    router.push(`/tirages?view=all&q=${encodeURIComponent(term.trim())}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-100 2xl:w-auto 2xl:gap-2 2xl:border 2xl:border-ink-200 2xl:bg-white 2xl:pr-4 2xl:pl-3 2xl:text-sm 2xl:text-ink-500"
        aria-label="Rechercher un lot"
      >
        <Search className="h-[18px] w-[18px]" />
        <span className="hidden 2xl:inline">Rechercher</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/40 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl animate-fade-up rounded-3xl bg-white p-3 shadow-lift" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Recherche">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                go(q);
              }}
              className="flex items-center gap-3 rounded-2xl bg-paper px-4"
            >
              <Search className="h-5 w-5 shrink-0 text-ink-400" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un lot, une marque, une référence…"
                className="h-14 w-full bg-transparent text-base outline-none placeholder:text-ink-400"
                maxLength={80}
                aria-label="Terme de recherche"
              />
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </form>
            <div className="px-2 pt-4 pb-2">
              <p className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => go(s)} className="rounded-full border border-ink-200 px-3.5 py-1.5 text-sm text-ink-700 transition hover:border-ink-300 hover:bg-ink-100">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
