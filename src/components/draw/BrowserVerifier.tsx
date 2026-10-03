"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Cpu } from "lucide-react";

type Props = {
  serverSeed: string;
  seedHash: string;
  drawNumber: number;
  canonical: string; // liste des tickets "numéro:id" séparés par \n
  ticketsDigest: string;
  ticketCount: number;
  winningIndex: number;
  ticketNumber: number;
  numbers: number[];
};

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Recalcule le tirage dans le navigateur avec WebCrypto, indépendamment du serveur. */
export function BrowserVerifier(p: Props) {
  const [res, setRes] = useState<null | { checks: { label: string; ok: boolean; detail: string }[] }>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const enc = new TextEncoder();
    const seedHash = hex(await crypto.subtle.digest("SHA-256", enc.encode(p.serverSeed)));
    const digest = hex(await crypto.subtle.digest("SHA-256", enc.encode(p.canonical)));
    const key = await crypto.subtle.importKey("raw", enc.encode(p.serverSeed), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const mac = hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${p.drawNumber}:${digest}`)));
    const index = Number(BigInt("0x" + mac) % BigInt(p.ticketCount));
    const winning = p.numbers[index];
    setRes({
      checks: [
        { label: "La graine révélée correspond à l'engagement publié", ok: seedHash === p.seedHash, detail: `SHA-256(graine) = ${seedHash.slice(0, 16)}…` },
        { label: "La liste des tickets n'a pas été modifiée", ok: digest === p.ticketsDigest, detail: `Empreinte = ${digest.slice(0, 16)}…` },
        { label: "L'index gagnant est correct", ok: index === p.winningIndex, detail: `HMAC mod ${p.ticketCount} = ${index}` },
        { label: "Le ticket gagnant est correct", ok: winning === p.ticketNumber, detail: `Ticket #${String(winning).padStart(4, "0")}` },
      ],
    });
    setBusy(false);
  }

  return (
    <div className="card p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">Vérifier dans mon navigateur</h2>
          <p className="text-sm text-ink-500">Le calcul est refait localement (WebCrypto), sans faire confiance au serveur.</p>
        </div>
        <button onClick={run} disabled={busy} className="btn-primary shrink-0"><Cpu className="h-4 w-4" /> {busy ? "Calcul…" : "Lancer la vérification"}</button>
      </div>
      {res && (
        <ul className="mt-5 space-y-2">
          {res.checks.map((c) => (
            <li key={c.label} className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${c.ok ? "bg-brand-50 text-brand-800" : "bg-ember-50 text-ember-600"}`}>
              {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span><span className="font-semibold">{c.label}</span><span className="block font-mono text-xs opacity-75">{c.detail}</span></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
