import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, Trophy, Wallet, Timer } from "lucide-react";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { AccountHeader } from "@/components/account/AccountHeader";
import { ProfileForm, PasswordForm } from "@/components/account/ProfileForms";
import { formatDate, formatEuro } from "@/lib/format";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

export default async function AccountPage() {
  const session = await requireUser("/mon-compte");
  const [user, tickets, active, wins, spent] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.id } }),
    db.ticket.count({ where: { userId: session.id, participation: { status: "CONFIRMED" } } }),
    db.participation.groupBy({ by: ["drawId"], where: { userId: session.id, status: "CONFIRMED", draw: { status: "SCHEDULED" } } }).then((r) => r.length),
    db.winner.count({ where: { userId: session.id } }),
    db.payment.aggregate({ where: { userId: session.id, status: "SUCCEEDED" }, _sum: { amount: true } }),
  ]);

  const stats = [
    { icon: Ticket, label: "Tickets possédés", value: tickets },
    { icon: Timer, label: "Tirages en cours", value: active },
    { icon: Trophy, label: "Tirages gagnés", value: wins },
    { icon: Wallet, label: "Dépensé (démo)", value: formatEuro(spent._sum.amount ?? 0) },
  ];

  return (
    <div className="container-page">
      <AccountHeader title={`Bonjour ${user.firstName}`} subtitle={`Membre depuis le ${formatDate(user.createdAt)}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <s.icon className="h-5 w-5 text-brand-600" />
            <p className="mt-3 text-2xl font-semibold text-ink-950 tabular">{s.value}</p>
            <p className="text-sm text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>
      {wins > 0 && (
        <Link href="/mes-participations?filtre=gagnes" className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 px-6 py-4 text-white">
          <span className="font-semibold">🎉 Vous avez gagné {wins} tirage{wins > 1 ? "s" : ""} ! Voir le suivi de vos lots</span>
          <span aria-hidden>→</span>
        </Link>
      )}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-ink-950">Informations personnelles</h2>
          <p className="mt-1 mb-6 text-sm text-ink-500">Ces informations ne sont jamais affichées publiquement.</p>
          <ProfileForm user={user} />
        </section>
        <section className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-ink-950">Sécurité</h2>
          <p className="mt-1 mb-6 text-sm text-ink-500">Changer votre mot de passe déconnecte vos autres appareils.</p>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
