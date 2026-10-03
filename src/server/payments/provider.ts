/**
 * Abstraction du prestataire de paiement.
 *
 * ⚠️ PROTOTYPE : seul le fournisseur "mock" existe. Aucun argent réel n'est encaissé.
 * Avant d'activer un prestataire réel (Stripe, Adyen, Mollie…), une validation
 * juridique complète est obligatoire (voir docs/VALIDATION_JURIDIQUE.md).
 *
 * En production, les données de carte ne doivent JAMAIS transiter par ce serveur :
 * utiliser les champs hébergés / la tokenisation du prestataire (PCI-DSS SAQ A)
 * et confirmer les paiements via webhooks signés.
 */
export type ChargeInput = {
  amount: number; // centimes
  currency: "EUR";
  description: string;
  /** Prototype uniquement : numéro de carte de TEST. En production → token du prestataire */
  testCardNumber: string;
  idempotencyKey: string;
};

export type ChargeResult =
  | { ok: true; providerRef: string; cardBrand: string; cardLast4: string }
  | { ok: false; reason: string; cardBrand?: string; cardLast4?: string };

export interface PaymentProvider {
  readonly name: string;
  readonly isDemo: boolean;
  charge(input: ChargeInput): Promise<ChargeResult>;
  refund(providerRef: string, amount: number): Promise<{ ok: boolean }>;
}
