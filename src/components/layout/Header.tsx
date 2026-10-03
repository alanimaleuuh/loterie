import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { MAIN_NAV } from "./nav";
import { NavLinks } from "./NavLinks";
import { SearchButton } from "./SearchButton";
import { MobileMenu } from "./MobileMenu";
import { AccountMenu } from "./AccountMenu";

export async function Header() {
  const user = await getCurrentUser();
  const unread = user ? await db.notification.count({ where: { userId: user.id, readAt: null } }) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-paper/85 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/75">
      <div className="container-page flex h-16 items-center gap-4 lg:h-[72px]">
        <MobileMenu
          items={MAIN_NAV}
          user={user ? { firstName: user.firstName, isAdmin: user.role === "ADMIN" } : null}
        />
        <Logo />
        <NavLinks items={MAIN_NAV} />
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <SearchButton />
          {user ? (
            <>
              <Link
                href="/mon-compte/notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-100"
                aria-label={`Notifications${unread ? ` (${unread} non lues)` : ""}`}
              >
                <Bell className="h-[19px] w-[19px]" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <AccountMenu firstName={user.firstName} isAdmin={user.role === "ADMIN"} />
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn-ghost hidden sm:inline-flex">
                Connexion
              </Link>
              <Link href="/inscription" className="btn-primary btn-sm sm:px-5 sm:py-2.5 sm:text-sm">
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
