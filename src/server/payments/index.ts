import { DEMO_MODE } from "@/lib/config";
import { MockPaymentProvider } from "./mock";
import type { PaymentProvider } from "./provider";

let provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;
  const kind = process.env.PAYMENT_PROVIDER ?? "mock";
  if (kind !== "mock" || !DEMO_MODE) {
    // Garde-fou : aucun prestataire réel n'est branché tant que la validation juridique
    // n'est pas effectuée. Voir docs/VALIDATION_JURIDIQUE.md.
    throw new Error(
      "Paiements réels désactivés : seul PAYMENT_PROVIDER=mock avec DEMO_MODE=true est autorisé dans ce prototype.",
    );
  }
  provider = new MockPaymentProvider();
  return provider;
}
