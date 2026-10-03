import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(1, "Champ requis")
  .max(50, "50 caractères maximum")
  .regex(/^[\p{L}][\p{L}' -]*$/u, "Caractères non autorisés");

export const passwordSchema = z
  .string()
  .min(10, "10 caractères minimum")
  .max(128, "128 caractères maximum")
  .regex(/[a-zA-Z]/, "Au moins une lettre")
  .regex(/[0-9]/, "Au moins un chiffre");

const email = z.string().trim().toLowerCase().max(254).email("Adresse e-mail invalide");

export const MIN_AGE = 18;

function ageOn(birth: Date, now = new Date()) {
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export const registerSchema = z
  .object({
    firstName: name,
    lastName: name,
    displayName: z
      .string()
      .trim()
      .max(30, "30 caractères maximum")
      .regex(/^[\p{L}\p{N} _.-]*$/u, "Lettres, chiffres, espaces, . _ - uniquement")
      .optional()
      .or(z.literal("")),
    email,
    password: passwordSchema,
    confirmPassword: z.string(),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
      .refine((v) => {
        const d = new Date(v);
        return !Number.isNaN(d.getTime()) && d.getFullYear() > 1900 && d < new Date();
      }, "Date invalide")
      .refine((v) => ageOn(new Date(v)) >= MIN_AGE, `Vous devez avoir au moins ${MIN_AGE} ans`),
    terms: z.literal("on", { message: "Vous devez accepter les conditions générales" }),
    marketing: z.literal("on").optional(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Les mots de passe ne correspondent pas" });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Champ requis").max(128),
  next: z.string().optional(),
});

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({
    token: z.string().min(20).max(100),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Les mots de passe ne correspondent pas" });

export const profileSchema = z.object({
  firstName: name,
  lastName: name,
  displayName: z
    .string()
    .trim()
    .min(2, "2 caractères minimum")
    .max(30, "30 caractères maximum")
    .regex(/^[\p{L}\p{N} _.-]+$/u, "Lettres, chiffres, espaces, . _ - uniquement"),
  marketing: z.literal("on").optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Champ requis"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Les mots de passe ne correspondent pas" });

export const purchaseSchema = z.object({
  drawId: z.string().min(1).max(40),
  quantity: z.coerce.number().int().min(1).max(50),
  cardNumber: z.string().trim().max(23).regex(/^[\d ]+$/, "Numéro de carte invalide"),
  cardName: z.string().trim().min(2, "Nom requis").max(60),
  cardExpiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/, "Format MM/AA"),
  cardCvc: z.string().trim().regex(/^\d{3,4}$/, "CVC invalide"),
  idempotencyKey: z.string().min(16).max(64),
});

/** Transforme une erreur Zod en dictionnaire champ → premier message */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? "_");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

/** Sécurise un paramètre de redirection : chemin interne uniquement */
export function safeNext(next: unknown, fallback = "/"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next.slice(0, 200);
}
