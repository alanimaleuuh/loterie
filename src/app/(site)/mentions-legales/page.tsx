import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Mentions légales", alternates: { canonical: "/mentions-legales" } };

export default function Page() {
  return (
    <LegalPage title="Mentions légales" updated="3 octobre 2026">
      <h2>Éditeur du site</h2>
      <p>[Raison sociale] — [forme juridique] au capital de [montant] €<br />Siège social : [adresse]<br />RCS / numéro d&apos;immatriculation : [numéro]<br />TVA intracommunautaire : [numéro]<br />Contact : [e-mail] — [téléphone]</p>
      <h2>Directeur de la publication</h2>
      <p>[Nom, qualité]</p>
      <h2>Hébergement</h2>
      <p>[Nom de l&apos;hébergeur, adresse, téléphone]</p>
      <h2>Statut du site</h2>
      <p>Ce site est un <strong>prototype technique de démonstration</strong>. Il ne constitue pas une offre commerciale ni un jeu ou une loterie légalement exploitable. Aucun paiement réel n&apos;est accepté et aucun lot n&apos;est attribué.</p>
      <h2>Propriété intellectuelle</h2>
      <p>Les marques et noms de produits cités le sont à titre purement illustratif et appartiennent à leurs propriétaires respectifs ; aucun partenariat n&apos;est sous-entendu. Les illustrations de démonstration sont des créations originales.</p>
    </LegalPage>
  );
}
