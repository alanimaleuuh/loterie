import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { LogoMark } from "@/components/ui/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { logoutAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: { default: "Administration", template: "%s · Admin Lotelia" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-dvh bg-ink-100/50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-ink-950 px-4 py-4 text-white lg:sticky lg:top-0 lg:h-dvh lg:py-6">
        <div className="mb-4 flex items-center justify-between lg:mb-8 lg:block">
          <div className="flex items-center gap-2.5 px-2">
            <LogoMark className="h-8 w-8" />
            <div>
              <p className="text-sm font-semibold">Lotelia</p>
              <p className="text-[11px] text-white/50">Administration</p>
            </div>
          </div>
          <span className="rounded-full bg-[#f4c99b] px-2 py-0.5 text-[10px] font-bold tracking-wider text-ink-950 uppercase lg:mt-4 lg:ml-2 lg:inline-block">Mode démo</span>
        </div>
        <AdminNav />
        <div className="mt-4 hidden border-t border-white/10 pt-4 lg:absolute lg:inset-x-4 lg:bottom-6 lg:block">
          <p className="px-2 text-xs text-white/50">Connecté : <span className="text-white/80">{user.email}</span></p>
          <form action={logoutAction}><button className="mt-2 w-full rounded-xl px-2 py-2 text-left text-sm text-white/60 hover:bg-white/5 hover:text-white">Déconnexion</button></form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 lg:py-10">{children}</main>
    </div>
  );
}
