"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { saveProductAction } from "@/app/actions/admin";
import type { FormState } from "@/app/actions/types";
import { FormAlert, SubmitButton } from "@/components/ui/Form";

type Initial = {
  id?: string; name?: string; reference?: string; brand?: string | null; categoryId?: string; shortDescription?: string; description?: string;
  displayValue?: string; purchaseCost?: string; status?: "ACTIVE" | "INACTIVE"; images?: { id: string; url: string; alt: string }[];
};

export function ProductForm({ categories, initial = {} }: { categories: { id: string; name: string }[]; initial?: Initial }) {
  const [state, action] = useActionState<FormState, FormData>(saveProductAction, {});
  const [removed, setRemoved] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const e = state.fieldErrors ?? {};
  const err = (k: string) => (e[k] ? <p className="mt-1.5 text-xs font-medium text-ember-600">{e[k]}</p> : null);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_380px]" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {removed.map((r) => <input key={r} type="hidden" name="removeImage" value={r} />)}
      <div className="card space-y-5 p-6">
        <FormAlert error={state.error} />
        <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
          <div><label className="label" htmlFor="name">Nom du lot</label><input id="name" name="name" className="input" defaultValue={initial.name} />{err("name")}</div>
          <div><label className="label" htmlFor="reference">Référence</label><input id="reference" name="reference" className="input font-mono uppercase" defaultValue={initial.reference} placeholder="LOT-1040" />{err("reference")}</div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className="label" htmlFor="brand">Marque</label><input id="brand" name="brand" className="input" defaultValue={initial.brand ?? ""} /></div>
          <div>
            <label className="label" htmlFor="categoryId">Catégorie</label>
            <select id="categoryId" name="categoryId" className="input" defaultValue={initial.categoryId ?? ""}>
              <option value="">— Choisir —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {err("categoryId")}
          </div>
        </div>
        <div><label className="label" htmlFor="shortDescription">Résumé (cartes et SEO)</label><input id="shortDescription" name="shortDescription" className="input" maxLength={200} defaultValue={initial.shortDescription} />{err("shortDescription")}</div>
        <div><label className="label" htmlFor="description">Description complète</label><textarea id="description" name="description" rows={9} className="input" defaultValue={initial.description} />{err("description")}</div>
      </div>

      <aside className="space-y-6">
        <div className="card space-y-5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label" htmlFor="displayValue">Valeur affichée (€)</label><input id="displayValue" name="displayValue" inputMode="decimal" className="input" defaultValue={initial.displayValue} />{err("displayValue")}</div>
            <div><label className="label" htmlFor="purchaseCost">Prix d&apos;achat (€)</label><input id="purchaseCost" name="purchaseCost" inputMode="decimal" className="input" defaultValue={initial.purchaseCost} />{err("purchaseCost")}</div>
          </div>
          <p className="text-xs text-ink-500">Le prix d&apos;achat est une donnée interne, jamais affichée au public.</p>
          <div>
            <label className="label" htmlFor="status">Statut</label>
            <select id="status" name="status" className="input" defaultValue={initial.status ?? "ACTIVE"}>
              <option value="ACTIVE">Actif</option><option value="INACTIVE">Désactivé (masqué)</option>
            </select>
          </div>
        </div>
        <div className="card p-6">
          <p className="label">Photos</p>
          <div className="grid grid-cols-3 gap-2">
            {initial.images?.filter((i) => !removed.includes(i.id)).map((img) => (
              <div key={img.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-sand-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
                <button type="button" onClick={() => setRemoved((r) => [...r, img.id])} className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-ink-700 shadow" aria-label="Retirer la photo"><X className="h-3 w-3" /></button>
              </div>
            ))}
            {previews.map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt="" className="aspect-[4/3] rounded-lg object-cover ring-2 ring-brand-300" />
            ))}
          </div>
          <input
            type="file"
            name="images"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="mt-3 block w-full text-sm text-ink-600 file:mr-3 file:rounded-full file:border-0 file:bg-ink-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            onChange={(ev) => setPreviews(Array.from(ev.target.files ?? []).map((f) => URL.createObjectURL(f)))}
          />
          <p className="mt-2 text-xs text-ink-500">JPEG, PNG ou WebP, 3 Mo max. par photo. Le format réel du fichier est vérifié côté serveur.</p>
        </div>
        <SubmitButton>{initial.id ? "Enregistrer le lot" : "Créer le lot"}</SubmitButton>
      </aside>
    </form>
  );
}
