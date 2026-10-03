"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import type { FormState } from "@/app/actions/types";
import { Field, FormAlert, SubmitButton } from "@/components/ui/Form";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      {notice && !state.error && <FormAlert message={notice} />}
      <FormAlert error={state.error} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Adresse e-mail" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} error={state.fieldErrors?.email} />
      <div>
        <Field label="Mot de passe" name="password" type="password" autoComplete="current-password" required error={state.fieldErrors?.password} />
        <div className="mt-2 text-right">
          <Link href="/mot-de-passe-oublie" className="text-sm font-medium text-brand-700 hover:underline">Mot de passe oublié ?</Link>
        </div>
      </div>
      <SubmitButton pendingLabel="Connexion…" className="btn-lg">Se connecter</SubmitButton>
      <div className="rounded-2xl border border-dashed border-ink-300 bg-white/60 p-4 text-xs leading-relaxed text-ink-600">
        <p className="font-semibold text-ink-800">Comptes de démonstration</p>
        <p className="mt-1">Joueuse : <code className="font-mono">claire@demo.lotelia.fr</code> / <code className="font-mono">Demo12345!</code></p>
        <p>Admin : <code className="font-mono">admin@lotelia.demo</code> / <code className="font-mono">Admin12345!</code></p>
      </div>
    </form>
  );
}
