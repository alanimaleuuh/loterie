import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "@/components/auth/PasswordForms";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Nouveau mot de passe" subtitle="Choisissez un mot de passe robuste que vous n'utilisez nulle part ailleurs.">
      {token ? <ResetForm token={token} /> : (
        <p className="text-ink-600">Lien invalide. <Link href="/mot-de-passe-oublie" className="font-semibold text-brand-700 underline">Faire une nouvelle demande</Link></p>
      )}
    </AuthShell>
  );
}
