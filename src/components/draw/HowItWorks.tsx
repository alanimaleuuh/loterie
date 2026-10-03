import { Gift, Ticket, Users, Timer, Mail } from "lucide-react";

export const STEPS = [
  { icon: Gift, title: "Choisissez un lot", text: "Parcourez le catalogue : valeur, prix du ticket et nombre de tickets sont affichés clairement." },
  { icon: Ticket, title: "Choisissez vos tickets", text: "Sélectionnez le nombre de tickets souhaité. Chaque ticket reçoit un numéro unique." },
  { icon: Users, title: "Participez au tirage", text: "Vos tickets sont enregistrés. Suivez la progression et le compte à rebours en temps réel." },
  { icon: Timer, title: "Le tirage est effectué", text: "À zéro, les participations sont verrouillées et le serveur désigne un ticket gagnant au hasard." },
  { icon: Mail, title: "Le gagnant est contacté", text: "Le gagnant est prévenu par e-mail. Le résultat et sa preuve sont publiés." },
];

export function HowItWorks() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {STEPS.map((s, i) => (
        <li key={s.title} className="card relative p-6">
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <s.icon className="h-5 w-5" />
            </span>
            <span className="font-display text-4xl text-ink-200">{String(i + 1).padStart(2, "0")}</span>
          </div>
          <p className="mt-5 text-xs font-semibold tracking-widest text-ink-400 uppercase">Étape {i + 1}</p>
          <h3 className="mt-1 text-[17px] font-semibold text-ink-950">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
