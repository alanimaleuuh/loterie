import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "@/components/auth/PasswordForms";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPage() {
  return (
    <AuthShell title="Mot de passe oublié" subtitle="Indiquez votre adresse e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe." footer={<Link href="/connexion" className="font-semibold text-brand-700 hover:underline">← Retour à la connexion</Link>}>
      <ForgotForm />
    </AuthShell>
  );
}
