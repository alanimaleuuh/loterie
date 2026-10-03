"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "@/app/actions/account";
import type { FormState } from "@/app/actions/types";
import { Field, FormAlert, SubmitButton } from "@/components/ui/Form";

export function ProfileForm({ user }: { user: { firstName: string; lastName: string; displayName: string; email: string; marketingOptIn: boolean } }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfileAction, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormAlert error={state.error} message={state.message} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Prénom" name="firstName" defaultValue={user.firstName} error={e.firstName} />
        <Field label="Nom" name="lastName" defaultValue={user.lastName} error={e.lastName} />
      </div>
      <Field label="Pseudonyme public" name="displayName" defaultValue={user.displayName} error={e.displayName} hint="Seul ce pseudonyme (+ initiale du nom) est affiché si vous gagnez." />
      <Field label="Adresse e-mail" name="emailDisplay" defaultValue={user.email} disabled hint="Pour modifier votre e-mail, contactez le support (vérification requise)." />
      <label className="flex items-center gap-3 text-sm text-ink-700">
        <input type="checkbox" name="marketing" defaultChecked={user.marketingOptIn} className="h-4 w-4 accent-brand-600" />
        Recevoir les nouveaux tirages par e-mail
      </label>
      <SubmitButton className="w-auto">Enregistrer</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePasswordAction, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate key={state.ok ? "done" : "form"}>
      <FormAlert error={state.error} message={state.message} />
      <Field label="Mot de passe actuel" name="currentPassword" type="password" autoComplete="current-password" error={e.currentPassword} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nouveau mot de passe" name="password" type="password" autoComplete="new-password" error={e.password} hint="10 caractères min., lettres et chiffres" />
        <Field label="Confirmation" name="confirmPassword" type="password" autoComplete="new-password" error={e.confirmPassword} />
      </div>
      <SubmitButton className="w-auto">Modifier le mot de passe</SubmitButton>
    </form>
  );
}
