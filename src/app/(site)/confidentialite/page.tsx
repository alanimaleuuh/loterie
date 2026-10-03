import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/confidentialite" } };

export default function Page() {
  return (
    <LegalPage title="Politique de confidentialité" updated="3 octobre 2026">
      <h2>Responsable du traitement</h2>
      <p>[Raison sociale, adresse, contact du délégué à la protection des données le cas échéant]</p>
      <h2>Données collectées</h2>
      <ul>
        <li>Compte : prénom, nom, pseudonyme, adresse e-mail, date de naissance (vérification de la majorité), mot de passe (stocké uniquement sous forme hachée).</li>
        <li>Participations : tirages, tickets, montants (simulés), historique.</li>
        <li>Paiement : marque de la carte et 4 derniers chiffres uniquement. Le numéro complet n&apos;est jamais stocké.</li>
        <li>Sécurité : adresse IP et navigateur associés aux sessions et à certains évènements (connexion, actions d&apos;administration).</li>
      </ul>
      <h2>Finalités et bases légales</h2>
      <p>[Gestion du compte et des participations (exécution du contrat), sécurité et prévention de la fraude (intérêt légitime), obligations légales, communications commerciales (consentement) : à valider.]</p>
      <h2>Données publiques</h2>
      <p>Si vous gagnez, seuls votre pseudonyme et l&apos;initiale de votre nom sont publiés. Votre e-mail et vos coordonnées ne sont jamais rendus publics.</p>
      <h2>Durées de conservation</h2>
      <p>[À définir pour chaque catégorie de données.]</p>
      <h2>Destinataires et sous-traitants</h2>
      <p>[Hébergeur, prestataire e-mail, prestataire de paiement : à lister, avec localisation et garanties en cas de transfert hors UE.]</p>
      <h2>Vos droits</h2>
      <p>Vous disposez de droits d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de portabilité, ainsi que du droit d&apos;introduire une réclamation auprès de l&apos;autorité de contrôle compétente. [Modalités d&apos;exercice à préciser.]</p>
      <h2>Cookies</h2>
      <p>Le prototype n&apos;utilise qu&apos;un cookie strictement nécessaire : le cookie de session (httpOnly, sécurisé), indispensable à la connexion. Aucun cookie publicitaire ou de mesure d&apos;audience n&apos;est déposé.</p>
    </LegalPage>
  );
}
