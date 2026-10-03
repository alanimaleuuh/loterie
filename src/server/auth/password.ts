import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

let dummy: string | null = null;
/** Hash factice : égalise le temps de réponse quand l'e-mail n'existe pas (anti-énumération) */
export function dummyHash() {
  dummy ??= bcrypt.hashSync("lotelia-dummy-password", COST);
  return dummy;
}
