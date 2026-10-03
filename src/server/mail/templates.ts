import { SITE } from "@/lib/config";
import { formatDateTime, formatEuro, ticketLabel } from "@/lib/format";

export type MailContent = { subject: string; text: string };

const footer = `\n\n—\nL'équipe ${SITE.name}\n${SITE.url}\n\nCe message provient d'un prototype de démonstration. Aucun paiement réel n'a été effectué.`;

export const templates = {
  accountCreated(p: { firstName: string }): MailContent {
    return {
      subject: `Bienvenue sur ${SITE.name}, ${p.firstName} !`,
      text: `Bonjour ${p.firstName},\n\nVotre compte a bien été créé. Vous pouvez dès maintenant découvrir les tirages en cours :\n${SITE.url}/tirages${footer}`,
    };
  },
  passwordReset(p: { firstName: string; link: string }): MailContent {
    return {
      subject: "Réinitialisation de votre mot de passe",
      text: `Bonjour ${p.firstName},\n\nPour choisir un nouveau mot de passe, utilisez ce lien (valable 1 heure) :\n${p.link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.${footer}`,
    };
  },
  participationConfirmed(p: {
    firstName: string;
    productName: string;
    drawNumber: number;
    tickets: number[];
    total: number;
    endsAt: Date;
    drawId: string;
  }): MailContent {
    return {
      subject: `Participation confirmée — ${p.productName}`,
      text: `Bonjour ${p.firstName},\n\nVotre participation au tirage n°${p.drawNumber} (${p.productName}) est confirmée.\n\nTickets : ${p.tickets.map(ticketLabel).join(", ")}\nMontant (démo) : ${formatEuro(p.total)}\nFin du tirage : ${formatDateTime(p.endsAt)}\n\nSuivre le tirage : ${SITE.url}/tirages/${p.drawId}${footer}`,
    };
  },
  drawReminder(p: { firstName: string; productName: string; endsAt: Date; drawId: string }): MailContent {
    return {
      subject: `Plus que quelques heures — ${p.productName}`,
      text: `Bonjour ${p.firstName},\n\nLe tirage « ${p.productName} » auquel vous participez se termine le ${formatDateTime(p.endsAt)}.\n\nVoir le tirage : ${SITE.url}/tirages/${p.drawId}${footer}`,
    };
  },
  drawResult(p: { firstName: string; productName: string; winnerName: string; ticketNumber: number; drawId: string }): MailContent {
    return {
      subject: `Résultat du tirage — ${p.productName}`,
      text: `Bonjour ${p.firstName},\n\nLe tirage « ${p.productName} » a eu lieu. Le ticket gagnant est le ${ticketLabel(p.ticketNumber)} (${p.winnerName}).\n\nCette fois, la chance ne vous a pas souri — merci pour votre participation !\n\nVérifier le tirage : ${SITE.url}/verification/${p.drawId}${footer}`,
    };
  },
  drawWon(p: { firstName: string; productName: string; ticketNumber: number; drawId: string }): MailContent {
    return {
      subject: `🎉 Félicitations ${p.firstName}, vous avez gagné : ${p.productName} !`,
      text: `Bonjour ${p.firstName},\n\nVotre ticket ${ticketLabel(p.ticketNumber)} a été tiré au sort : vous remportez « ${p.productName} » !\n\nNotre équipe va vous contacter pour organiser la remise du lot. Aucun frais ne vous sera demandé pour recevoir votre lot.\n\nVérifier le tirage : ${SITE.url}/verification/${p.drawId}${footer}`,
    };
  },
  drawCancelled(p: { firstName: string; productName: string; reason: string; amount: number }): MailContent {
    return {
      subject: `Tirage annulé — ${p.productName}`,
      text: `Bonjour ${p.firstName},\n\nLe tirage « ${p.productName} » a été annulé : ${p.reason}.\nVotre participation (${formatEuro(p.amount)}, démo) a été intégralement remboursée.${footer}`,
    };
  },
  prizeDelivery(p: { firstName: string; productName: string; status: string }): MailContent {
    return {
      subject: `Suivi de votre lot — ${p.productName}`,
      text: `Bonjour ${p.firstName},\n\nLe statut de remise de votre lot « ${p.productName} » est désormais : ${p.status}.${footer}`,
    };
  },
};
