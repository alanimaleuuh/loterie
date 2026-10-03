/**
 * Indicateurs économiques d'un tirage — calculés à partir des tickets EFFECTIVEMENT vendus.
 * Aucune marge n'est garantie : les montants sont des estimations brutes, avant frais
 * (paiement, livraison, taxes, frais juridiques…).
 */
export type DrawEconomicsInput = {
  ticketPrice: number;
  maxTickets: number;
  soldTickets: number;
  purchaseCost: number;
  status: string;
};

export function drawEconomics(d: DrawEconomicsInput) {
  const refunded = d.status === "CANCELLED";
  const revenue = refunded ? 0 : d.soldTickets * d.ticketPrice;
  const revenueMax = d.maxTickets * d.ticketPrice;
  // Le coût du lot n'est engagé que si un gagnant est désigné
  const committedCost = d.status === "DRAWN" ? d.purchaseCost : 0;
  const breakEvenTickets = Math.ceil(d.purchaseCost / d.ticketPrice);
  return {
    revenue,
    revenueMax,
    cost: d.purchaseCost,
    committedCost,
    /** Résultat brut si le tirage avait lieu avec les ventes actuelles */
    marginCurrent: refunded ? 0 : revenue - d.purchaseCost,
    /** Maximum théorique si 100 % des tickets étaient vendus */
    marginMax: revenueMax - d.purchaseCost,
    breakEvenTickets,
    breakEvenReachable: breakEvenTickets <= d.maxTickets,
    breakEvenReached: d.soldTickets >= breakEvenTickets,
  };
}
