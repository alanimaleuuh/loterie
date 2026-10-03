export const SITE = {
  name: "Lotelia",
  tagline: "Tirages au sort transparents, lots d'exception",
  url: process.env.APP_URL ?? "http://localhost:3000",
  description:
    "Découvrez des lots high-tech, maison et électroménager et participez à des tirages au sort transparents et vérifiables. Prototype de démonstration — aucun paiement réel.",
  supportEmail: "contact@lotelia.demo",
};

/**
 * Mode démo. Tant qu'aucune validation juridique n'a été réalisée pour le pays ciblé,
 * cette valeur doit rester vraie : aucun paiement réel n'est possible.
 */
export const DEMO_MODE = process.env.DEMO_MODE !== "false";

/** Ticket packs proposés à l'utilisateur */
export const TICKET_PACKS = [1, 2, 5, 10, 20];
export const MAX_TICKETS_PER_ORDER = 50;

/** Seuils du statut « Presque terminé » */
export const ENDING_SOON_MS = 24 * 60 * 60 * 1000;
export const ENDING_SOON_RATIO = 0.15;

/** Rappel envoyé aux participants avant la fin du tirage */
export const REMINDER_BEFORE_MS = 2 * 60 * 60 * 1000;
