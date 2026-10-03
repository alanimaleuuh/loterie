const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const euroRound = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Formate un montant en centimes. Les montants ronds sont affichés sans décimales. */
export function formatEuro(cents: number): string {
  return cents % 100 === 0 ? euroRound.format(cents / 100) : euro.format(cents / 100);
}

export function formatEuroPrecise(cents: number): string {
  return euro.format(cents / 100);
}

const TZ = "Europe/Paris";

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: TZ }).format(new Date(d));
}

export function formatDateTime(d: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: TZ,
  }).format(new Date(d));
}

export function formatShortDateTime(d: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(d));
}

export function ticketLabel(n: number): string {
  return `#${String(n).padStart(4, "0")}`;
}

export function drawLabel(n: number): string {
  return `Tirage n°${n}`;
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

export function plural(n: number, singular: string, pluralForm?: string): string {
  return `${n} ${n > 1 ? (pluralForm ?? singular + "s") : singular}`;
}

/** Valeur d'un <input type="datetime-local"> en heure de Paris */
export function toParisInputValue(d: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return parts.replace(" ", "T");
}

/** Interprète une valeur datetime-local comme une heure de Paris */
export function fromParisInputValue(v: string): Date {
  const naive = new Date(v + ":00Z");
  if (Number.isNaN(naive.getTime())) return naive;
  // Décalage Paris/UTC à cette date
  const paris = new Date(naive.toLocaleString("en-US", { timeZone: TZ }));
  const utc = new Date(naive.toLocaleString("en-US", { timeZone: "UTC" }));
  const offset = paris.getTime() - utc.getTime();
  return new Date(naive.getTime() - offset);
}
