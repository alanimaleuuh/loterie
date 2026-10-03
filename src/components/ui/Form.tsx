"use client";

import { useFormStatus } from "react-dom";
import { clsx } from "clsx";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

export function Field({
  label,
  name,
  error,
  hint,
  className,
  ...rest
}: { label: string; name: string; error?: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const isPwd = rest.type === "password";
  return (
    <div className={className}>
      <label htmlFor={name} className="label">{label}</label>
      <div className="relative">
        <input
          id={name}
          name={name}
          {...rest}
          type={isPwd && show ? "text" : rest.type}
          className={clsx("input", isPwd && "pr-12")}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        />
        {isPwd && (
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-xs font-medium text-ember-600">{error}</p>
      ) : hint ? (
        <p id={`${name}-hint`} className="mt-1.5 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function SubmitButton({ children, className, pendingLabel = "Veuillez patienter…" }: { children: ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={clsx("btn-primary w-full", className)}>
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormAlert({ error, message }: { error?: string; message?: string }) {
  if (error) return <p role="alert" className="rounded-xl bg-ember-50 px-4 py-3 text-sm font-medium text-ember-600">{error}</p>;
  if (message) return <p role="status" className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{message}</p>;
  return null;
}
