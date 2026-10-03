import { ENDING_SOON_MS, ENDING_SOON_RATIO } from "./config";

export type DisplayStatus =
  | "upcoming"
  | "live"
  | "ending"
  | "soldout"
  | "closed"
  | "drawn"
  | "cancelled"
  | "disabled";

export type DrawLike = {
  status: "SCHEDULED" | "CLOSED" | "DRAWN" | "CANCELLED" | "DISABLED";
  startsAt: Date | string;
  endsAt: Date | string;
  soldTickets: number;
  maxTickets: number;
};

export function getDisplayStatus(d: DrawLike, now: number = Date.now()): DisplayStatus {
  switch (d.status) {
    case "DISABLED":
      return "disabled";
    case "CANCELLED":
      return "cancelled";
    case "DRAWN":
      return "drawn";
    case "CLOSED":
      return "closed";
  }
  const start = new Date(d.startsAt).getTime();
  const end = new Date(d.endsAt).getTime();
  if (now < start) return "upcoming";
  if (now >= end) return "closed";
  if (d.soldTickets >= d.maxTickets) return "soldout";
  const remaining = d.maxTickets - d.soldTickets;
  if (end - now <= ENDING_SOON_MS || remaining <= Math.ceil(d.maxTickets * ENDING_SOON_RATIO))
    return "ending";
  return "live";
}

export function isOpenForSale(s: DisplayStatus) {
  return s === "live" || s === "ending";
}

export const STATUS_META: Record<DisplayStatus, { label: string; tone: string }> = {
  upcoming: { label: "À venir", tone: "info" },
  live: { label: "En cours", tone: "success" },
  ending: { label: "Presque terminé", tone: "warning" },
  soldout: { label: "Complet", tone: "neutral" },
  closed: { label: "Terminé", tone: "neutral" },
  drawn: { label: "Gagnant annoncé", tone: "brand" },
  cancelled: { label: "Annulé", tone: "danger" },
  disabled: { label: "Désactivé", tone: "neutral" },
};
