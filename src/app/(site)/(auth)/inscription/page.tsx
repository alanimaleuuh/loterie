import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { safeNext } from "@/lib/validation";

export const metadata: Metadata = { title: "Créer un compte", description: "Créez votre compte Lotelia en une minute." };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/mon-compte");
  const sp = await searchParams;
  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Une minute suffit. Vos données sont protégées et ne sont jamais affichées publiquement."
      footer={<>Déjà inscrit ? <Link href="/connexion" className="font-semibold text-brand-700 hover:underline">Se connecter</Link></>}
    >
      <RegisterForm next={sp.next ? safeNext(sp.next) : undefined} />
    </AuthShell>
  );
}
