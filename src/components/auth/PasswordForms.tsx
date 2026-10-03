"use client";

import { useActionState } from "react";
import { forgotPasswordAction, resetPasswordAction } from "@/app/actions/auth";
import type { FormState } from "@/app/actions/types";
import { Field, FormAlert, SubmitButton } from "@/components/ui/Form";

export function ForgotForm() {
  const [state, action] = useActionState<FormState, FormData>(forgotPasswordAction, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormAlert error={state.error} message={state.message} />
      <Field label="Adresse e-mail" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} error={state.fieldErrors?.email} />
      <SubmitButton className="btn-lg">Envoyer le lien</SubmitButton>
      <p className="text-xs text-ink-500">Mode démo : l&apos;e-mail est simulé. Il est consultable dans vos notifications et dans le journal d&apos;envoi (storage/mail/outbox.log).</p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetPasswordAction, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormAlert error={state.error} />
      <input type="hidden" name="token" value={token} />
      <Field label="Nouveau mot de passe" name="password" type="password" autoComplete="new-password" required error={state.fieldErrors?.password} hint="10 caractères min., lettres et chiffres" />
      <Field label="Confirmation" name="confirmPassword" type="password" autoComplete="new-password" required error={state.fieldErrors?.confirmPassword} />
      <SubmitButton className="btn-lg">Changer mon mot de passe</SubmitButton>
    </form>
  );
}
