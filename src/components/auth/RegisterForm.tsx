"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import type { FormState } from "@/app/actions/types";
import { Field, FormAlert, SubmitButton } from "@/components/ui/Form";

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(registerAction, {});
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  const maxBirth = new Date(Date.now() - 18 * 365.25 * 24 * 3600_000).toISOString().slice(0, 10);
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormAlert error={state.error} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Prénom" name="firstName" autoComplete="given-name" required defaultValue={v.firstName} error={e.firstName} />
        <Field label="Nom" name="lastName" autoComplete="family-name" required defaultValue={v.lastName} error={e.lastName} />
      </div>
      <Field label="Pseudonyme public (facultatif)" name="displayName" defaultValue={v.displayName} error={e.displayName} hint="Affiché sur la page des gagnants à la place de votre nom. Par défaut : votre prénom." maxLength={30} />
      <Field label="Adresse e-mail" name="email" type="email" autoComplete="email" required defaultValue={v.email} error={e.email} />
      <Field label="Date de naissance" name="birthDate" type="date" required max={maxBirth} defaultValue={v.birthDate} error={e.birthDate} hint="Participation réservée aux personnes majeures." />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Mot de passe" name="password" type="password" autoComplete="new-password" required error={e.password} hint="10 caractères min., lettres et chiffres" />
        <Field label="Confirmation" name="confirmPassword" type="password" autoComplete="new-password" required error={e.confirmPassword} />
      </div>
      <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-ink-200/70">
        <label className="flex items-start gap-3 text-sm text-ink-700">
          <input type="checkbox" name="terms" defaultChecked={v.terms === "on"} className="mt-0.5 h-4 w-4 rounded accent-brand-600" aria-invalid={!!e.terms} />
          <span>
            J&apos;ai lu et j&apos;accepte les <Link href="/cgu" target="_blank" className="font-medium text-brand-700 underline">conditions générales</Link> et la{" "}
            <Link href="/confidentialite" target="_blank" className="font-medium text-brand-700 underline">politique de confidentialité</Link>. Je certifie être majeur(e).
          </span>
        </label>
        {e.terms && <p className="text-xs font-medium text-ember-600">{e.terms}</p>}
        <label className="flex items-start gap-3 text-sm text-ink-600">
          <input type="checkbox" name="marketing" defaultChecked={v.marketing === "on"} className="mt-0.5 h-4 w-4 rounded accent-brand-600" />
          <span>Je souhaite recevoir les nouveaux tirages par e-mail (facultatif).</span>
        </label>
      </div>
      <SubmitButton pendingLabel="Création du compte…" className="btn-lg">Créer mon compte</SubmitButton>
    </form>
  );
}
