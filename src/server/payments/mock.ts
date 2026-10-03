import { randomBytes } from "node:crypto";
import type { ChargeInput, ChargeResult, PaymentProvider } from "./provider";

/** Cartes de test acceptées par le fournisseur simulé (mêmes conventions que Stripe) */
export const TEST_CARDS: Record<string, { brand: string; outcome: "success" | "declined" | "insufficient" }> = {
  "4242424242424242": { brand: "Visa", outcome: "success" },
  "5555555555554444": { brand: "Mastercard", outcome: "success" },
  "4000000000000002": { brand: "Visa", outcome: "declined" },
  "4000000000009995": { brand: "Visa", outcome: "insufficient" },
};

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  readonly isDemo = true;

  async charge(input: ChargeInput): Promise<ChargeResult> {
    const digits = input.testCardNumber.replace(/\D/g, "");
    const card = TEST_CARDS[digits];
    // Tout numéro qui n'est pas une carte de test est refusé : aucune vraie carte
    // ne peut être saisie, traitée ou conservée par le prototype.
    if (!card) {
      return { ok: false, reason: "Seules les cartes de test sont acceptées en mode démo (ex. 4242 4242 4242 4242)." };
    }
    await new Promise((r) => setTimeout(r, 350)); // latence simulée
    const last4 = digits.slice(-4);
    if (card.outcome === "declined") return { ok: false, reason: "Paiement refusé par la banque (simulation).", cardBrand: card.brand, cardLast4: last4 };
    if (card.outcome === "insufficient") return { ok: false, reason: "Fonds insuffisants (simulation).", cardBrand: card.brand, cardLast4: last4 };
    return { ok: true, providerRef: `mock_pi_${randomBytes(10).toString("hex")}`, cardBrand: card.brand, cardLast4: last4 };
  }

  async refund(_providerRef: string, _amount: number) {
    return { ok: true };
  }
}
