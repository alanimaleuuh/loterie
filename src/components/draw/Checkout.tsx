"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Check, CreditCard, FlaskConical, Lock, Minus, Plus, ShieldCheck, Ticket } from "lucide-react";
import { clsx } from "clsx";
import { purchaseAction, type PurchaseState } from "@/app/actions/purchase";
import { formatEuro, ticketLabel } from "@/lib/format";
import { LotImage } from "./LotImage";
import { Countdown } from "./Countdown";

type Props = {
  drawId: string;
  drawNumber: number;
  productName: string;
  image?: string;
  ticketPrice: number;
  remaining: number;
  maxPerOrder: number;
  packs: number[];
  endsAt: string;
  serverNow: number;
  owned: number;
};

const newKey = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^A-Za-z0-9_-]/g, "");

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function PayButton({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-brand btn-lg w-full">
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Traitement du paiement simulé…
        </>
      ) : (
        <>
          <Lock className="h-4 w-4" /> Payer {formatEuro(total)} (démo)
        </>
      )}
    </button>
  );
}

export function Checkout(p: Props) {
  const limit = Math.min(p.remaining, p.maxPerOrder);
  const [qty, setQty] = useState(Math.min(5, limit) || 1);
  const [step, setStep] = useState<1 | 2>(1);
  const [key, setKey] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [state, action] = useActionState<PurchaseState, FormData>(purchaseAction, { status: "idle" });

  useEffect(() => setKey(newKey()), []);
  useEffect(() => {
    if (state.status === "error") setKey(newKey()); // nouvelle tentative = nouvelle clé d'idempotence
    if (state.status === "success") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state]);

  const total = qty * p.ticketPrice;

  if (state.status === "success") {
    return (
      <div className="mx-auto max-w-2xl animate-fade-up text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_12px_30px_-10px_rgb(15_107_87/0.7)]">
          <Check className="h-8 w-8" strokeWidth={2.5} />
        </div>
        <h1 className="h-display mt-6 text-5xl">Participation confirmée</h1>
        <p className="mt-3 text-ink-600">
          {state.ticketNumbers.length} ticket{state.ticketNumbers.length > 1 ? "s" : ""} pour <strong>{p.productName}</strong> · {formatEuro(state.amount)} (paiement de démonstration)
        </p>
        <div className="card mt-8 p-6 text-left">
          <p className="text-sm font-semibold text-ink-900">Vos numéros de tickets</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {state.ticketNumbers.map((n) => (
              <span key={n} className="rounded-xl bg-ink-950 px-3 py-2 font-mono text-sm text-white">{ticketLabel(n)}</span>
            ))}
          </div>
          <p className="mt-5 text-sm text-ink-600">Un e-mail de confirmation vous a été envoyé (simulé). Le tirage aura lieu automatiquement à la fin du compte à rebours :</p>
          <div className="mt-3">
            <Countdown target={p.endsAt} serverNow={p.serverNow} variant="boxes" />
          </div>
        </div>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/tirages/${p.drawId}`} className="btn-primary">Retour au tirage</Link>
          <Link href="/mes-participations" className="btn-secondary">Mes participations</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <ol className="mb-6 flex items-center gap-3 text-sm" aria-label="Étapes">
          {["Tickets", "Paiement démo", "Confirmation"].map((l, i) => (
            <li key={l} className="flex items-center gap-2">
              <span className={clsx("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", i + 1 <= step ? "bg-ink-950 text-white" : "bg-ink-100 text-ink-500")}>{i + 1}</span>
              <span className={clsx("hidden sm:inline", i + 1 === step ? "font-semibold text-ink-950" : "text-ink-500")}>{l}</span>
              {i < 2 && <span className="mx-1 h-px w-6 bg-ink-200 sm:w-10" />}
            </li>
          ))}
        </ol>

        {step === 1 ? (
          <div className="card animate-fade-up p-5 sm:p-7">
            <h2 className="text-xl font-semibold text-ink-950">Combien de tickets souhaitez-vous ?</h2>
            <p className="mt-1 text-sm text-ink-500">
              {p.remaining} ticket{p.remaining > 1 ? "s" : ""} encore disponible{p.remaining > 1 ? "s" : ""} · maximum {p.maxPerOrder} par commande
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {p.packs.map((n) => {
                const disabled = n > limit;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={disabled}
                    onClick={() => setQty(n)}
                    className={clsx(
                      "rounded-2xl border-2 px-3 py-4 text-center transition",
                      qty === n ? "border-ink-950 bg-ink-950 text-white" : "border-ink-200 bg-white hover:border-ink-400",
                      disabled && "cursor-not-allowed opacity-35 hover:border-ink-200",
                    )}
                    aria-pressed={qty === n}
                  >
                    <span className="block text-2xl font-semibold">{n}</span>
                    <span className={clsx("block text-xs", qty === n ? "text-white/70" : "text-ink-500")}>ticket{n > 1 ? "s" : ""}</span>
                    <span className="mt-1 block text-sm font-semibold">{formatEuro(n * p.ticketPrice)}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-paper p-4">
              <span className="text-sm font-medium text-ink-700">Quantité personnalisée</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white disabled:opacity-40" aria-label="Retirer un ticket">
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={limit}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.min(limit, parseInt(e.target.value || "1", 10) || 1)))}
                  className="h-10 w-16 rounded-xl border border-ink-200 bg-white text-center font-semibold tabular"
                  aria-label="Nombre de tickets"
                />
                <button type="button" onClick={() => setQty((q) => Math.min(limit, q + 1))} disabled={qty >= limit} className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white disabled:opacity-40" aria-label="Ajouter un ticket">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            {qty >= limit && <p className="mt-3 text-xs text-ember-600">Vous avez atteint le nombre maximum de tickets disponibles pour cette commande.</p>}
            <button type="button" onClick={() => setStep(2)} className="btn-primary btn-lg mt-6 w-full">Continuer</button>
          </div>
        ) : (
          <form action={action} className="card animate-fade-up p-5 sm:p-7" noValidate>
            <button type="button" onClick={() => setStep(1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900">
              <ArrowLeft className="h-4 w-4" /> Modifier la quantité
            </button>
            <div className="flex items-start gap-3 rounded-2xl border border-[#f0d9b5] bg-[#fdf6ea] p-4 text-sm text-[#7a5418]">
              <FlaskConical className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Paiement de démonstration</p>
                <p className="mt-0.5">Aucune transaction réelle n&apos;est effectuée. Seules les cartes de test sont acceptées ; aucune donnée de carte n&apos;est conservée.</p>
                <button
                  type="button"
                  onClick={() => setCard({ number: "4242 4242 4242 4242", name: "Démo Lotelia", expiry: "12/30", cvc: "123" })}
                  className="mt-2 font-semibold underline underline-offset-2"
                >
                  Utiliser la carte de test 4242 4242 4242 4242
                </button>
              </div>
            </div>

            <input type="hidden" name="drawId" value={p.drawId} />
            <input type="hidden" name="quantity" value={qty} />
            <input type="hidden" name="idempotencyKey" value={key} />

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="cardNumber" className="label">Numéro de carte (test)</label>
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input id="cardNumber" name="cardNumber" inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" className="input pl-11 font-mono" value={card.number} onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })} aria-invalid={state.status === "error" && !!state.fieldErrors?.cardNumber} />
                </div>
                {state.status === "error" && state.fieldErrors?.cardNumber && <p className="mt-1 text-xs text-ember-600">{state.fieldErrors.cardNumber}</p>}
              </div>
              <div>
                <label htmlFor="cardName" className="label">Nom sur la carte</label>
                <input id="cardName" name="cardName" autoComplete="off" className="input" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                {state.status === "error" && state.fieldErrors?.cardName && <p className="mt-1 text-xs text-ember-600">{state.fieldErrors.cardName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cardExpiry" className="label">Expiration</label>
                  <input id="cardExpiry" name="cardExpiry" inputMode="numeric" autoComplete="off" placeholder="MM/AA" className="input font-mono" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} />
                  {state.status === "error" && state.fieldErrors?.cardExpiry && <p className="mt-1 text-xs text-ember-600">{state.fieldErrors.cardExpiry}</p>}
                </div>
                <div>
                  <label htmlFor="cardCvc" className="label">CVC</label>
                  <input id="cardCvc" name="cardCvc" inputMode="numeric" autoComplete="off" placeholder="123" maxLength={4} className="input font-mono" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
                  {state.status === "error" && state.fieldErrors?.cardCvc && <p className="mt-1 text-xs text-ember-600">{state.fieldErrors.cardCvc}</p>}
                </div>
              </div>
            </div>

            {state.status === "error" && (
              <p role="alert" className="mt-5 rounded-xl bg-ember-50 px-4 py-3 text-sm font-medium text-ember-600">{state.error}</p>
            )}

            <div className="mt-6"><PayButton total={total} /></div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-500">
              <ShieldCheck className="h-3.5 w-3.5" /> Autres cartes de test : 4000 0000 0000 0002 (refusée), 5555 5555 5555 4444 (acceptée)
            </p>
          </form>
        )}
      </div>

      {/* Récapitulatif */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card overflow-hidden">
          <div className="flex gap-4 border-b border-ink-100 p-5">
            <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-sand-100">
              <LotImage src={p.image} alt={p.productName} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ink-500">Tirage n°{p.drawNumber}</p>
              <p className="font-semibold text-ink-950">{p.productName}</p>
              <div className="mt-1"><Countdown target={p.endsAt} serverNow={p.serverNow} label="Fin dans" /></div>
            </div>
          </div>
          <dl className="space-y-3 p-5 text-sm">
            <div className="flex justify-between"><dt className="text-ink-600">Nombre de tickets</dt><dd className="font-semibold tabular">{qty}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-600">Prix unitaire</dt><dd className="font-semibold">{formatEuro(p.ticketPrice)}</dd></div>
            {p.owned > 0 && <div className="flex justify-between"><dt className="text-ink-600">Tickets déjà possédés</dt><dd className="font-semibold">{p.owned}</dd></div>}
            <div className="flex items-baseline justify-between border-t border-ink-100 pt-3">
              <dt className="font-semibold text-ink-900">Total</dt>
              <dd className="text-2xl font-semibold text-ink-950">{formatEuro(total)}</dd>
            </div>
          </dl>
          <p className="flex items-center gap-2 bg-paper px-5 py-3 text-xs text-ink-500">
            <Ticket className="h-3.5 w-3.5" /> Chaque ticket a une chance égale d&apos;être tiré.
          </p>
        </div>
      </aside>
    </div>
  );
}
