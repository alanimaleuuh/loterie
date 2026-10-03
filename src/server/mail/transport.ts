import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type OutgoingMail = { to: string; from: string; subject: string; text: string };

/**
 * Interface d'envoi d'e-mails. Pour la production, implémenter un transport
 * SMTP (nodemailer) ou API (Resend, Postmark, Brevo, SES) et le sélectionner
 * via MAIL_TRANSPORT.
 */
export interface MailTransport {
  readonly name: string;
  send(mail: OutgoingMail): Promise<void>;
}

/** Transport de démonstration : écrit l'e-mail dans storage/mail/outbox.log et la console */
class LogTransport implements MailTransport {
  readonly name = "log";
  async send(mail: OutgoingMail) {
    const dir = path.join(process.cwd(), "storage", "mail");
    await mkdir(dir, { recursive: true });
    const entry =
      `\n=== ${new Date().toISOString()} ===\nFrom: ${mail.from}\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`;
    await appendFile(path.join(dir, "outbox.log"), entry, "utf8");
    if (process.env.NODE_ENV !== "test") console.info(`[mail:log] → ${mail.to} · ${mail.subject}`);
  }
}

let transport: MailTransport | null = null;

export function getMailTransport(): MailTransport {
  if (transport) return transport;
  const kind = process.env.MAIL_TRANSPORT ?? "log";
  switch (kind) {
    case "log":
      transport = new LogTransport();
      break;
    // case "smtp": transport = new SmtpTransport(...); break;   // À connecter en production
    // case "resend": transport = new ResendTransport(...); break;
    default:
      console.warn(`[mail] transport "${kind}" non implémenté — repli sur "log"`);
      transport = new LogTransport();
  }
  return transport;
}
