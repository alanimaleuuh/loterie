"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { LotImage } from "./LotImage";

export function Gallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [i, setI] = useState(0);
  const list = images.length ? images : [{ url: "/lots/placeholder.svg", alt: name }];
  return (
    <div>
      <div className="card relative aspect-[4/3] overflow-hidden bg-sand-100">
        {list.map((img, idx) => (
          <div key={img.url} className={clsx("absolute inset-0 transition-opacity duration-500", idx === i ? "opacity-100" : "opacity-0")} aria-hidden={idx !== i}>
            <LotImage src={img.url} alt={img.alt} priority={idx === 0} />
          </div>
        ))}
        {list.length > 1 && (
          <div className="absolute right-4 bottom-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink-700 backdrop-blur">
            {i + 1} / {list.length}
          </div>
        )}
      </div>
      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {list.map((img, idx) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setI(idx)}
              className={clsx(
                "aspect-[4/3] overflow-hidden rounded-xl bg-sand-100 ring-2 transition",
                idx === i ? "ring-ink-950" : "ring-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`Voir la photo ${idx + 1}`}
              aria-pressed={idx === i}
            >
              <LotImage src={img.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
