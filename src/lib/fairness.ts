import { createHash, createHmac, randomBytes } from "node:crypto";

/**
 * Tirage « commit-reveal » :
 *  1. À la création du tirage, une graine secrète (serverSeed) est générée et seul
 *     son empreinte SHA-256 (seedHash) est publiée.
 *  2. À la clôture, la liste ordonnée des tickets valides est figée et résumée par
 *     une empreinte (ticketsDigest).
 *  3. L'index gagnant = HMAC-SHA256(serverSeed, "<n° tirage>:<ticketsDigest>") mod N.
 *  4. La graine est révélée : tout le monde peut recalculer le résultat.
 *  5. Chaque résultat est chaîné au précédent (resultHash) — toute altération
 *     a posteriori casse la chaîne.
 */

export const GENESIS_HASH = "0".repeat(64);

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function generateSeed() {
  const serverSeed = randomBytes(32).toString("hex");
  return { serverSeed, seedHash: sha256(serverSeed) };
}

export type TicketRef = { id: string; number: number };

export function ticketsCanonical(tickets: TicketRef[]): string {
  return [...tickets]
    .sort((a, b) => a.number - b.number)
    .map((t) => `${t.number}:${t.id}`)
    .join("\n");
}

export function computeTicketsDigest(tickets: TicketRef[]): string {
  return sha256(ticketsCanonical(tickets));
}

export function computeWinningIndex(serverSeed: string, drawNumber: number, ticketsDigest: string, count: number): number {
  if (count <= 0) throw new Error("Aucun ticket");
  const mac = createHmac("sha256", serverSeed).update(`${drawNumber}:${ticketsDigest}`).digest("hex");
  return Number(BigInt("0x" + mac) % BigInt(count));
}

export type ResultPayload = {
  drawId: string;
  drawNumber: number;
  ticketId: string;
  ticketNumber: number;
  ticketCount: number;
  winningIndex: number;
  ticketsDigest: string;
  seedHash: string;
  serverSeed: string;
  drawnAt: string;
  previousHash: string;
};

export function computeResultHash(p: ResultPayload): string {
  const canonical = [
    p.drawId,
    p.drawNumber,
    p.ticketId,
    p.ticketNumber,
    p.ticketCount,
    p.winningIndex,
    p.ticketsDigest,
    p.seedHash,
    p.serverSeed,
    p.drawnAt,
    p.previousHash,
  ].join("|");
  return sha256(canonical);
}

export function drawWinner(serverSeed: string, drawNumber: number, tickets: TicketRef[]) {
  const sorted = [...tickets].sort((a, b) => a.number - b.number);
  const ticketsDigest = computeTicketsDigest(sorted);
  const winningIndex = computeWinningIndex(serverSeed, drawNumber, ticketsDigest, sorted.length);
  return { ticket: sorted[winningIndex], winningIndex, ticketsDigest, ticketCount: sorted.length };
}
