import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Règlement des tirages", description: "Règles applicables à chaque tirage au sort Lotelia (prototype).", alternates: { canonical: "/reglement" } };

export default function RulesPage() {
  return (
    <LegalPage title="Règlement des tirages" updated="3 octobre 2026">
      <h2>1. Objet</h2>
      <p>Le présent règlement décrit les règles techniques communes à tous les tirages proposés sur le prototype Lotelia. Les paramètres propres à chaque tirage (lot, valeur, prix du ticket, nombre de tickets, minimum éventuel, dates) sont affichés sur sa fiche et font partie intégrante du règlement.</p>
      <h2>2. Participation</h2>
      <ul>
        <li>La participation nécessite un compte personnel. Elle est réservée aux personnes majeures [conditions à valider selon le pays].</li>
        <li>Chaque ticket porte un numéro unique dans le tirage. Le nombre de tickets est limité au maximum affiché.</li>
        <li>Les participations ne sont acceptées qu&apos;entre la date de début et la date de fin du tirage.</li>
        <li>[Une modalité de participation gratuite, si elle est juridiquement requise, devra être décrite ici.]</li>
      </ul>
      <h2>3. Clôture et tirage</h2>
      <ul>
        <li>À la date et l&apos;heure de fin, les participations sont verrouillées automatiquement.</li>
        <li>Le tirage est effectué par le serveur, uniquement parmi les tickets valides effectivement attribués. Chaque ticket a la même probabilité d&apos;être désigné.</li>
        <li>Le procédé (engagement cryptographique publié avant la vente, puis révélation) est décrit sur la page « Comment ça marche ». Chaque résultat est vérifiable publiquement.</li>
        <li>Le résultat est enregistré de façon définitive : identifiant du tirage, date et heure, tickets participants, ticket gagnant, utilisateur gagnant.</li>
      </ul>
      <h2>4. Nombre minimum de tickets</h2>
      <p>Lorsqu&apos;un minimum est indiqué et n&apos;est pas atteint à la clôture, le tirage est annulé et les participants sont intégralement remboursés. Un tirage sans aucun ticket vendu est annulé.</p>
      <h2>5. Gagnant et remise du lot</h2>
      <ul>
        <li>Le gagnant est informé par e-mail. Son pseudonyme et l&apos;initiale de son nom sont publiés sur la page des gagnants ; aucune autre donnée personnelle n&apos;est rendue publique.</li>
        <li>[Délai pour réclamer le lot, modalités de livraison, justificatifs d&apos;identité, sort du lot non réclamé : à définir.]</li>
      </ul>
      <h2>6. Annulation par l&apos;organisateur</h2>
      <p>[Cas d&apos;annulation exceptionnelle (fraude, incident technique, indisponibilité du lot) et modalités de remboursement : à définir.]</p>
      <h2>7. Mode démonstration</h2>
      <p>Dans le cadre du présent prototype, aucun paiement réel n&apos;est effectué et aucun lot n&apos;est réellement attribué.</p>
    </LegalPage>
  );
}
