import Link from "next/link";
import { clsx } from "clsx";
import { Trophy, Ticket } from "lucide-react";
import type { DrawCardData } from "@/server/draws/queries";
import { getDisplayStatus, isOpenForSale } from "@/lib/draw-status";
import { formatEuro, formatDate, percent, ticketLabel } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { Progress } from "./Progress";
import { Countdown } from "./Countdown";
import { LotImage } from "./LotImage";

export function DrawCard({ draw, now, className }: { draw: DrawCardData; now: number; className?: string }) {
  const status = getDisplayStatus(draw, now);
  const open = isOpenForSale(status);
  const remaining = Math.max(0, draw.maxTickets - draw.soldTickets);
  const pct = percent(draw.soldTickets, draw.maxTickets);
  const img = draw.product.images[0];
  const href = `/tirages/${draw.id}`;

  return (
    <article
      className={clsx(
        "group card relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
    >
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-sand-100" tabIndex={-1} aria-hidden>
        <LotImage src={img?.url} alt={img?.alt ?? draw.product.name} className="transition duration-700 group-hover:scale-[1.04]" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <StatusBadge status={status} className="shadow-sm" />
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink-700 shadow-sm backdrop-blur">
            {draw.product.category.name}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-semibold text-ink-950">
              <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
                {draw.product.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-sm text-ink-500">
              Valeur du lot <span className="font-semibold text-ink-800">{formatEuro(draw.product.displayValue)}</span>
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-sand-100 px-3 py-2 text-center">
            <p className="text-[10px] font-semibold tracking-wider text-ink-500 uppercase">Ticket</p>
            <p className="text-lg leading-tight font-bold text-ink-950">{formatEuro(draw.ticketPrice)}</p>
          </div>
        </div>

        {status === "drawn" && draw.winner ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-ink-950 px-4 py-3 text-white">
            <Trophy className="h-5 w-5 text-[#f4c99b]" />
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold">Gagnant : {draw.winner.publicName}</p>
              <p className="text-white/60">
                Ticket {ticketLabel(draw.winner.ticketNumber)} · {formatDate(draw.winner.drawnAt)}
              </p>
            </div>
          </div>
        ) : status === "cancelled" ? (
          <p className="mt-5 rounded-2xl bg-ink-100 px-4 py-3 text-sm text-ink-600">Tirage annulé — participants remboursés.</p>
        ) : (
          <>
            <div className="mt-5">
              <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className="font-semibold text-ink-900">
                  {draw.soldTickets} / {draw.maxTickets} <span className="font-normal text-ink-500">tickets</span>
                </span>
                <span className="font-semibold text-ink-700 tabular">{pct} %</span>
              </div>
              <Progress sold={draw.soldTickets} max={draw.maxTickets} tone={status === "ending" ? "ember" : "brand"} />
              <p className="mt-2 text-xs text-ink-500">
                {remaining > 0 ? (
                  <>
                    Encore <span className="font-semibold text-ink-800">{remaining}</span> ticket{remaining > 1 ? "s" : ""}
                  </>
                ) : (
                  "Complet — tirage à la date prévue"
                )}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl border border-ink-100 bg-paper px-4 py-3">
              <span className="text-xs font-medium text-ink-500">{status === "upcoming" ? "Ouverture dans" : "Fin dans"}</span>
              <Countdown
                target={(status === "upcoming" ? draw.startsAt : draw.endsAt).toISOString()}
                serverNow={now}
                expiredLabel={status === "upcoming" ? "Ouverture…" : "Tirage en cours…"}
              />
            </div>
          </>
        )}

        <div className="relative z-10 mt-auto pt-5">
          {open ? (
            <Link href={`/tirages/${draw.id}/participer`} className="btn-brand w-full">
              <Ticket className="h-4 w-4" /> Participer
            </Link>
          ) : (
            <Link href={href} className="btn-secondary w-full">
              {status === "upcoming" ? "Découvrir le lot" : status === "drawn" ? "Voir le résultat" : "Voir le tirage"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
