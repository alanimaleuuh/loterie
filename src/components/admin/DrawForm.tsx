"use client";

import { useActionState, useMemo, useState } from "react";
import { saveDrawAction } from "@/app/actions/admin";
import type { FormState } from "@/app/actions/types";
import { FormAlert, SubmitButton } from "@/components/ui/Form";
import { formatEuro } from "@/lib/format";

type Product = { id: string; name: string; reference: string; purchaseCost: number; displayValue: number };
type Initial = { id?: string; productId?: string; ticketPrice?: string; maxTickets?: number; minTickets?: number | null; startsAt?: string; endsAt?: string; featured?: boolean; locked?: boolean };

const toCents = (v: string) => Math.round(parseFloat((v || "0").replace(",", ".")) * 100) || 0;

export function DrawForm({ products, initial = {} }: { products: Product[]; initial?: Initial }) {
  const [state, action] = useActionState<FormState, FormData>(saveDrawAction, {});
  const e = state.fieldErrors ?? {};
  const [productId, setProductId] = useState(initial.productId ?? "");
  const [price, setPrice] = useState(initial.ticketPrice ?? "3");
  const [max, setMax] = useState(String(initial.maxTickets ?? 40));
  const [min, setMin] = useState(initial.minTickets ? String(initial.minTickets) : "");
  const p = products.find((x) => x.id === productId);

  const eco = useMemo(() => {
    const priceC = toCents(price);
    const maxN = parseInt(max || "0", 10) || 0;
    const cost = p?.purchaseCost ?? 0;
    const revenueMax = priceC * maxN;
    return {
      revenueMax,
      cost,
      marginMax: revenueMax - cost,
      breakEven: priceC > 0 ? Math.ceil(cost / priceC) : 0,
      minRevenue: (parseInt(min || "0", 10) || 0) * priceC,
      priceC,
      maxN,
    };
  }, [price, max, min, p]);

  const field = (name: string) => (e[name] ? <p className="mt-1.5 text-xs font-medium text-ember-600">{e[name]}</p> : null);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_360px]" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="card space-y-5 p-6">
        <FormAlert error={state.error} />
        {initial.locked && <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-600">Des tickets ont été vendus : le lot, le prix et la date de début sont verrouillés ; le nombre de tickets ne peut qu&apos;augmenter et la fin qu&apos;être repoussée.</p>}
        <div>
          <label className="label" htmlFor="productId">Lot</label>
          <select id="productId" name="productId" className="input" value={productId} onChange={(ev) => setProductId(ev.target.value)} disabled={initial.locked}>
            <option value="">— Choisir un lot —</option>
            {products.map((x) => <option key={x.id} value={x.id}>{x.reference} · {x.name}</option>)}
          </select>
          {initial.locked && <input type="hidden" name="productId" value={productId} />}
          {field("productId")}
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="ticketPrice">Prix du ticket (€)</label>
            <input id="ticketPrice" name="ticketPrice" className="input" inputMode="decimal" value={price} onChange={(ev) => setPrice(ev.target.value)} readOnly={initial.locked} />
            {field("ticketPrice")}
          </div>
          <div>
            <label className="label" htmlFor="maxTickets">Nombre max. de tickets</label>
            <input id="maxTickets" name="maxTickets" type="number" min={2} className="input" value={max} onChange={(ev) => setMax(ev.target.value)} />
            {field("maxTickets")}
          </div>
          <div>
            <label className="label" htmlFor="minTickets">Minimum requis (facultatif)</label>
            <input id="minTickets" name="minTickets" type="number" min={1} className="input" value={min} onChange={(ev) => setMin(ev.target.value)} placeholder="Aucun" />
            {field("minTickets")}
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="startsAt">Début (heure de Paris)</label>
            <input id="startsAt" name="startsAt" type="datetime-local" className="input" defaultValue={initial.startsAt} readOnly={initial.locked} />
            {field("startsAt")}
          </div>
          <div>
            <label className="label" htmlFor="endsAt">Fin et tirage (heure de Paris)</label>
            <input id="endsAt" name="endsAt" type="datetime-local" className="input" defaultValue={initial.endsAt} />
            {field("endsAt")}
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm text-ink-700">
          <input type="checkbox" name="featured" defaultChecked={initial.featured} className="h-4 w-4 accent-brand-600" /> Mettre en avant sur la page d&apos;accueil
        </label>
        <p className="text-xs text-ink-500">Une graine secrète est générée automatiquement à la création ; son empreinte est publiée immédiatement et ne peut plus être modifiée.</p>
        <SubmitButton className="w-auto">{initial.id ? "Enregistrer le tirage" : "Créer le tirage"}</SubmitButton>
      </div>

      <aside className="card h-fit p-6 xl:sticky xl:top-8">
        <h2 className="font-semibold text-ink-950">Simulation économique</h2>
        <p className="mt-1 text-xs text-ink-500">Estimation brute, avant frais. Aucune marge n&apos;est garantie : le résultat dépend des tickets réellement vendus.</p>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-ink-600">Valeur affichée</dt><dd className="font-medium">{p ? formatEuro(p.displayValue) : "—"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-600">Prix d&apos;achat du lot</dt><dd className="font-medium">{p ? formatEuro(eco.cost) : "—"}</dd></div>
          <div className="flex justify-between border-t border-ink-100 pt-3"><dt className="text-ink-600">Revenus max. ({eco.maxN} × {formatEuro(eco.priceC)})</dt><dd className="font-semibold">{formatEuro(eco.revenueMax)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-600">Marge brute max. théorique</dt><dd className={`font-semibold ${eco.marginMax >= 0 ? "text-brand-700" : "text-ember-600"}`}>{formatEuro(eco.marginMax)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-600">Seuil de rentabilité</dt><dd className="font-medium">{p ? `${eco.breakEven} tickets` : "—"}</dd></div>
          {min && <div className="flex justify-between"><dt className="text-ink-600">Revenus au minimum requis</dt><dd className="font-medium">{formatEuro(eco.minRevenue)}</dd></div>}
        </dl>
        {p && eco.marginMax < 0 && <p className="mt-4 rounded-xl bg-ember-50 px-3 py-2 text-xs text-ember-600">Même avec 100 % des tickets vendus, les revenus ne couvrent pas le coût du lot.</p>}
        {p && eco.marginMax >= 0 && eco.breakEven > 0 && (
          <p className="mt-4 rounded-xl bg-ink-100 px-3 py-2 text-xs text-ink-600">
            En dessous de {eco.breakEven} tickets vendus, le tirage est déficitaire.{min && parseInt(min) < eco.breakEven ? " Le minimum requis est inférieur au seuil de rentabilité." : ""}
          </p>
        )}
      </aside>
    </form>
  );
}
