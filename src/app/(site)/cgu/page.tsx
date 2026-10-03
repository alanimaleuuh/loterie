import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Conditions générales", alternates: { canonical: "/cgu" } };

export default function Page() {
  return (
    <LegalPage title="Conditions générales d'utilisation" updated="3 octobre 2026">
      <h2>1. Objet</h2>
      <p>Les présentes conditions encadrent l&apos;utilisation du prototype Lotelia, plateforme de démonstration présentant des lots et des tirages au sort associés.</p>
      <h2>2. Statut de démonstration</h2>
      <p>Le service est fourni à titre de démonstration uniquement. Les paiements sont simulés, aucun lot n&apos;est attribué et aucune somme n&apos;est encaissée. Toute exploitation réelle est subordonnée à une validation juridique préalable portant notamment sur la qualification juridique de l&apos;opération au regard du droit applicable aux jeux et loteries.</p>
      <h2>3. Compte utilisateur</h2>
      <ul>
        <li>L&apos;inscription est réservée aux personnes majeures [âge et contrôle à valider selon le pays].</li>
        <li>L&apos;utilisateur s&apos;engage à fournir des informations exactes et à garder son mot de passe confidentiel.</li>
        <li>Un seul compte par personne. L&apos;éditeur peut suspendre un compte en cas d&apos;usage frauduleux.</li>
      </ul>
      <h2>4. Participation aux tirages</h2>
      <p>Les règles de participation et de tirage sont décrites dans le <a href="/reglement">règlement des tirages</a>.</p>
      <h2>5. Prix, paiement, remboursement</h2>
      <p>[Conditions tarifaires, moyens de paiement, droit de rétractation et ses exceptions éventuelles, politique de remboursement : à rédiger après validation juridique.]</p>
      <h2>6. Responsabilité</h2>
      <p>[Clauses de responsabilité : à rédiger.]</p>
      <h2>7. Jeu responsable</h2>
      <p>[Mesures de jeu responsable, limites de dépense, auto-exclusion, ressources d&apos;aide : à définir selon les obligations applicables.]</p>
      <h2>8. Droit applicable et litiges</h2>
      <p>[Droit applicable, médiation de la consommation, juridiction compétente : à compléter.]</p>
    </LegalPage>
  );
}
