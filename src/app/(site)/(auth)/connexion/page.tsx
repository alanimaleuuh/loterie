import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNext } from "@/lib/validation";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reinitialise?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(sp.next, "/mon-compte"));
  const next = sp.next ? safeNext(sp.next) : undefined;
  return (
    <AuthShell
      title="Connexion"
      subtitle="Heureux de vous revoir. Connectez-vous pour participer et suivre vos tirages."
      footer={<>Pas encore de compte ? <Link href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-700 hover:underline">Créer un compte</Link></>}
    >
      <LoginForm next={next} notice={sp.reinitialise ? "Mot de passe modifié. Vous pouvez vous connecter." : next ? "Connectez-vous pour continuer." : undefined} />
    </AuthShell>
  );
}
