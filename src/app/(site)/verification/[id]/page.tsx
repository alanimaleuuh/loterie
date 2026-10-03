import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { db } from "@/server/db";
import { computeResultHash, computeTicketsDigest, computeWinningIndex, sha256, ticketsCanonical } from "@/lib/fairness";
import { formatDateTime, ticketLabel } from "@/lib/format";
import { BrowserVerifier } from "@/components/draw/BrowserVerifier";

export const metadata: Metadata = { title: "Vérification du tirage", robots: { index: false } };

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-1 border-b border-ink-100 py-3 last:border-0 sm:grid-cols-[220px_1fr] sm:gap-4">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className={`text-sm break-all text-ink-900 ${mono ? "font-mono text-[12.5px]" : "font-medium"}`}>{value}</dd>
    </div>
  );
}

export default async function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) notFound();
  const draw = await db.draw.findUnique({ where: { id }, include: { product: { select: { name: true } }, winner: true } });
  if (!draw || draw.status === "DISABLED") notFound();

  const w = draw.winner;
  const header = (
    <header className="mb-8">
      <Link href={`/tirages/${draw.id}`} className="text-sm font-medium text-ink-500 hover:text-ink-900">← {draw.product.name}</Link>
      <h1 className="h-display mt-3 text-5xl">Vérification du tirage n°{draw.number}</h1>
    </header>
  );

  if (!w) {
    return (
      <div className="container-page max-w-4xl pt-10">
        {header}
        <div className="card p-6">
          <p className="flex items-center gap-2 font-semibold text-ink-900"><Clock className="h-5 w-5 text-ink-400" /> {draw.status === "CANCELLED" ? "Tirage annulé — aucun gagnant." : "Le tirage n'a pas encore eu lieu."}</p>
          <dl className="mt-4">
            <Row label="Engagement (SHA-256 de la graine)" value={draw.seedHash} />
            <Row label="Date prévue du tirage" value={formatDateTime(draw.endsAt)} mono={false} />
          </dl>
          <p className="mt-4 text-sm text-ink-600">La graine secrète sera révélée ici après le tirage. Notez dès maintenant cette empreinte : elle prouvera que la graine n&apos;a pas été choisie après coup.</p>
        </div>
      </div>
    );
  }

  // Vérification côté serveur, à partir des données brutes
  const tickets = await db.ticket.findMany({ where: { drawId: draw.id, participation: { status: "CONFIRMED" } }, select: { id: true, number: true }, orderBy: { number: "asc" } });
  const canonical = ticketsCanonical(tickets);
  const digest = computeTicketsDigest(tickets);
  const index = computeWinningIndex(w.serverSeed, draw.number, digest, tickets.length);
  const resultHash = computeResultHash({
    drawId: draw.id, drawNumber: draw.number, ticketId: w.ticketId, ticketNumber: w.ticketNumber, ticketCount: w.ticketCount,
    winningIndex: w.winningIndex, ticketsDigest: w.ticketsDigest, seedHash: w.seedHash, serverSeed: w.serverSeed,
    drawnAt: w.drawnAt.toISOString(), previousHash: w.previousHash,
  });
  const checks = [
    { ok: sha256(w.serverSeed) === draw.seedHash, label: "Graine conforme à l'engagement publié avant la vente" },
    { ok: digest === w.ticketsDigest && tickets.length === w.ticketCount, label: "Liste des tickets identique à celle figée lors du tirage" },
    { ok: index === w.winningIndex && tickets[index]?.id === w.ticketId, label: "Ticket gagnant recalculé identique" },
    { ok: resultHash === w.resultHash, label: "Empreinte du résultat intacte (chaînage)" },
  ];
  const allOk = checks.every((c) => c.ok);

  return (
    <div className="container-page max-w-4xl pt-10">
      {header}
      <div className={`mb-6 flex items-center gap-3 rounded-2xl px-5 py-4 ${allOk ? "bg-brand-600 text-white" : "bg-ember-600 text-white"}`}>
        {allOk ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
        <p className="font-semibold">{allOk ? "Tirage vérifié : le résultat est conforme et n'a pas été modifié." : "Anomalie détectée lors de la vérification."}</p>
      </div>
      <ul className="mb-6 grid gap-2 sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-ink-200/70">
            {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-ember-600" />}
            {c.label}
          </li>
        ))}
      </ul>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink-950">Données publiques du tirage</h2>
        <dl className="mt-3">
          <Row label="Ticket gagnant" value={`${ticketLabel(w.ticketNumber)} — ${w.publicName}`} mono={false} />
          <Row label="Date et heure du tirage" value={formatDateTime(w.drawnAt)} mono={false} />
          <Row label="Tickets participants" value={`${w.ticketCount} tickets valides`} mono={false} />
          <Row label="Engagement publié (seedHash)" value={w.seedHash} />
          <Row label="Graine révélée (serverSeed)" value={w.serverSeed} />
          <Row label="Empreinte des tickets" value={w.ticketsDigest} />
          <Row label="Index gagnant" value={`${w.winningIndex} (position dans la liste triée, à partir de 0)`} />
          <Row label="Empreinte précédente" value={w.previousHash} />
          <Row label="Empreinte du résultat" value={w.resultHash} />
        </dl>
      </section>

      <div className="mt-6">
        <BrowserVerifier
          serverSeed={w.serverSeed}
          seedHash={w.seedHash}
          drawNumber={draw.number}
          canonical={canonical}
          ticketsDigest={w.ticketsDigest}
          ticketCount={w.ticketCount}
          winningIndex={w.winningIndex}
          ticketNumber={w.ticketNumber}
          numbers={tickets.map((t) => t.number)}
        />
      </div>

      <section className="card mt-6 p-6">
        <h2 className="text-lg font-semibold text-ink-950">Méthode de calcul</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-700">
          <li>Vérifier que <code className="font-mono text-xs">SHA-256(serverSeed)</code> est égal à l&apos;engagement publié avant la vente.</li>
          <li>Trier les tickets valides par numéro et former la liste <code className="font-mono text-xs">numéro:identifiant</code>, une ligne par ticket ; calculer son SHA-256.</li>
          <li>Calculer <code className="font-mono text-xs">HMAC-SHA256(clé = serverSeed, message = &quot;{draw.number}:&lt;empreinte des tickets&gt;&quot;)</code>.</li>
          <li>Interpréter le résultat comme un entier et prendre le reste de la division par le nombre de tickets : c&apos;est l&apos;index du ticket gagnant.</li>
        </ol>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-brand-700">Liste complète des tickets ({tickets.length})</summary>
          <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-paper p-4 font-mono text-[11px] leading-5 text-ink-700">{canonical}</pre>
        </details>
      </section>
    </div>
  );
}
