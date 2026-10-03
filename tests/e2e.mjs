/**
 * Tests de bout en bout des parcours principaux (Playwright).
 * Prérequis : serveur lancé (npm run dev ou npm start) + données de démo (npm run db:seed).
 * Usage : node tests/e2e.mjs   [BASE_URL=http://localhost:3000] [SHOTS=dossier]
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS;
const DB = process.env.DATABASE_URL ?? "postgresql://loterie:loterie@localhost:5432/loterie";
const sql = (q) => execSync(`psql "${DB}" -At -c ${JSON.stringify(q)}`).toString().trim();
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const ok = (name) => console.log(`  ✔ ${name}`);
const fail = (name, e) => { failures++; console.log(`  ✘ ${name}\n    ${e?.message ?? e}`); };
async function step(name, fn) { try { await fn(); ok(name); } catch (e) { fail(name, e); } }
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" });
const errors = [];
async function newPage(viewport = { width: 1366, height: 900 }) {
  const ctx = await browser.newContext({ viewport, locale: "fr-FR", timezoneId: "Europe/Paris" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${page.url()} → ${e.message}`));
  page.on("console", (m) => m.type() === "error" && !m.text().includes("404") && errors.push(`${page.url()} → console: ${m.text()}`));
  return page;
}
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

const liveDraw = sql(`select id from draws where status='SCHEDULED' and "startsAt"<now() and "endsAt">now()+interval '1 hour' and "soldTickets"+30<"maxTickets" order by "endsAt" desc limit 1`);
const email = `test.${Date.now()}@exemple.fr`;

console.log("Parcours visiteur");
const p = await newPage();
await step("accueil : hero, cartes et compte à rebours", async () => {
  await p.goto(BASE);
  expect(await p.getByRole("heading", { level: 1 }).textContent().then((t) => t.includes("Votre prochain cadeau")), "titre hero manquant");
  expect((await p.locator("article").count()) >= 6, "cartes de lots manquantes");
  const t1 = await p.getByRole("timer").first().getAttribute("aria-label");
  await p.waitForTimeout(1500);
  expect(t1 !== (await p.getByRole("timer").first().getAttribute("aria-label")), "le compte à rebours ne défile pas");
  await shot(p, "01-accueil");
});
await step("recherche + filtres", async () => {
  await p.goto(`${BASE}/tirages?view=all&q=iphone`);
  expect((await p.locator("article").count()) >= 1, "aucun résultat pour iphone");
  await p.goto(`${BASE}/tirages?view=ending&sort=ending`);
  await p.goto(`${BASE}/categories/mobilier?view=all`);
  expect((await p.locator("article").count()) >= 1, "catégorie mobilier vide");
});
await step("page détail + participer redirige vers connexion", async () => {
  await p.goto(`${BASE}/tirages/${liveDraw}`);
  await p.getByRole("link", { name: "Choisir mes tickets" }).click();
  await p.waitForURL(/\/connexion\?next=/);
});
await step("page gagnants sans e-mail public", async () => {
  await p.goto(`${BASE}/gagnants`);
  const html = await p.content();
  expect(!/@demo\.lotelia\.fr/.test(html), "e-mail exposé sur la page gagnants");
  await shot(p, "02-gagnants");
});
await step("vérification d'un tirage (serveur + navigateur)", async () => {
  const drawn = sql(`select "drawId" from winners limit 1`);
  await p.goto(`${BASE}/verification/${drawn}`);
  await p.getByText("Tirage vérifié").waitFor();
  await p.getByRole("button", { name: "Lancer la vérification" }).click();
  await p.getByText("Le ticket gagnant est correct").waitFor();
  expect((await p.locator(".bg-ember-50").count()) === 0, "une vérification navigateur a échoué");
});

console.log("Inscription et achat");
await step("inscription : validation serveur (mineur refusé)", async () => {
  await p.goto(`${BASE}/inscription`);
  await p.fill("#firstName", "Test"); await p.fill("#lastName", "Utilisateur"); await p.fill("#email", email);
  await p.fill("#birthDate", "2015-01-01"); await p.fill("#password", "Motdepasse123"); await p.fill("#confirmPassword", "Motdepasse123");
  await p.check("input[name=terms]");
  await p.getByRole("button", { name: "Créer mon compte" }).click();
  await p.getByText("au moins 18 ans").waitFor();
});
await step("inscription réussie", async () => {
  await p.fill("#birthDate", "1990-05-05");
  await p.fill("#password", "Motdepasse123"); await p.fill("#confirmPassword", "Motdepasse123");
  await p.getByRole("button", { name: "Créer mon compte" }).click();
  await p.waitForURL(/bienvenue=1/);
});
await step("achat : carte refusée", async () => {
  await p.goto(`${BASE}/tirages/${liveDraw}/participer`);
  await p.getByRole("button", { name: /^2\s*tickets/ }).click();
  await p.getByRole("button", { name: "Continuer" }).click();
  await p.fill("#cardNumber", "4000000000000002"); await p.fill("#cardName", "Test"); await p.fill("#cardExpiry", "1230"); await p.fill("#cardCvc", "123");
  await p.getByRole("button", { name: /Payer/ }).click();
  await p.getByText("Paiement refusé").waitFor();
});
await step("achat : vraie carte non-test refusée", async () => {
  await p.fill("#cardNumber", "4970101234567890");
  await p.getByRole("button", { name: /Payer/ }).click();
  await p.getByText("Seules les cartes de test").waitFor();
});
let bought = [];
await step("achat : 2 tickets avec la carte de test", async () => {
  const before = Number(sql(`select "soldTickets" from draws where id='${liveDraw}'`));
  await p.getByRole("button", { name: /Utiliser la carte de test/ }).click();
  await p.getByRole("button", { name: /Payer/ }).click();
  await p.getByText("Participation confirmée").waitFor({ timeout: 15000 });
  bought = await p.locator(".font-mono.text-sm").allTextContents();
  expect(bought.length === 2, `2 tickets attendus, reçus ${bought.length}`);
  expect(Number(sql(`select "soldTickets" from draws where id='${liveDraw}'`)) === before + 2, "compteur de tickets non incrémenté");
  expect(sql(`select count(*) from payments where "cardLast4"='4242' and "userId"=(select id from users where email='${email}')`) === "1", "paiement non enregistré");
  await shot(p, "03-confirmation");
});
await step("aucun numéro de carte complet stocké", async () => {
  expect(sql(`select count(*) from payments where "cardLast4" ~ '\\d{5,}'`) === "0", "numéro complet stocké");
});
await step("mes participations / achats / notifications", async () => {
  await p.goto(`${BASE}/mes-participations`);
  await p.getByText("2 tickets").first().waitFor();
  await p.goto(`${BASE}/mon-compte/achats`);
  await p.getByText("Refusé").first().waitFor();
  await p.goto(`${BASE}/mon-compte/notifications`);
  await p.getByText("Participation confirmée").first().waitFor();
});
await step("modification du profil", async () => {
  await p.goto(`${BASE}/mon-compte`);
  await p.fill("#displayName", "Testeur");
  await p.getByRole("button", { name: "Enregistrer" }).click();
  await p.getByText("Profil mis à jour").waitFor();
});
await step("mot de passe oublié (réponse neutre)", async () => {
  const p2 = await newPage();
  await p2.goto(`${BASE}/mot-de-passe-oublie`);
  await p2.fill("#email", "inconnu@exemple.fr");
  await p2.getByRole("button", { name: "Envoyer le lien" }).click();
  await p2.getByText("Si un compte correspond").waitFor();
});
await step("non-admin bloqué sur /admin", async () => {
  await p.goto(`${BASE}/admin`);
  expect(!p.url().includes("/admin"), "un utilisateur standard accède à l'admin");
});

console.log("Compte de démo gagnant");
await step("Claire voit « Gagné 🎉 »", async () => {
  const c = await newPage();
  await c.goto(`${BASE}/connexion`);
  await c.fill("#email", "claire@demo.lotelia.fr"); await c.fill("#password", "Demo12345!");
  await c.getByRole("button", { name: "Se connecter" }).click();
  await c.waitForURL(/\/tirages/);
  await c.goto(`${BASE}/mes-participations?filtre=gagnes`);
  await c.getByText("Gagné 🎉").first().waitFor();
  await shot(c, "04-participations");
});
await step("connexion : mauvais mot de passe", async () => {
  const c = await newPage();
  await c.goto(`${BASE}/connexion`);
  await c.fill("#email", "claire@demo.lotelia.fr"); await c.fill("#password", "mauvais");
  await c.getByRole("button", { name: "Se connecter" }).click();
  await c.getByText("incorrect").waitFor();
});

console.log("Administration");
const a = await newPage({ width: 1440, height: 900 });
await step("connexion admin + dashboard", async () => {
  await a.goto(`${BASE}/connexion`);
  await a.fill("#email", "admin@lotelia.demo"); await a.fill("#password", "Admin12345!");
  await a.getByRole("button", { name: "Se connecter" }).click();
  await a.waitForURL(/\/admin$/);
  await a.getByText("Marge brute (avant frais)").waitFor();
  await shot(a, "05-admin");
});
let productId;
await step("création d'un lot avec photo", async () => {
  await a.goto(`${BASE}/admin/produits/nouveau`);
  await a.fill("#name", "Robot pâtissier test");
  await a.selectOption("#categoryId", { label: "Électroménager" });
  await a.fill("#shortDescription", "Robot pâtissier 1000 W, bol 5 L");
  await a.fill("#description", "Un robot pâtissier puissant pour toutes vos préparations.");
  await a.fill("#displayValue", "100"); await a.fill("#purchaseCost", "100");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  await a.setInputFiles("input[type=file]", { name: "photo.png", mimeType: "image/png", buffer: png });
  await a.getByRole("button", { name: "Créer le lot" }).click();
  await a.waitForURL(/\/admin\/produits\/\w+\?ok=1/);
  productId = a.url().split("/produits/")[1].split("?")[0];
  expect(sql(`select count(*) from product_images where "productId"='${productId}' and url like '/api/uploads/%'`) === "1", "photo non enregistrée");
});
await step("upload refusé si le fichier n'est pas une image", async () => {
  await a.setInputFiles("input[type=file]", { name: "fake.png", mimeType: "image/png", buffer: Buffer.from("<script>alert(1)</script>") });
  await a.getByRole("button", { name: "Enregistrer le lot" }).click();
  await a.getByText("Format non supporté").waitFor();
});
let newDraw;
await step("création d'un tirage (3 €, 40 tickets) + simulation économique", async () => {
  await a.goto(`${BASE}/admin/tirages/nouveau?lot=${productId}`);
  await a.fill("#ticketPrice", "3"); await a.fill("#maxTickets", "40");
  await a.getByText("120 €").first().waitFor();
  await a.getByText("20 €").first().waitFor();
  await a.getByRole("button", { name: "Créer le tirage" }).click();
  await a.waitForURL(/\/admin\/tirages\/\w+\?ok=1/);
  newDraw = a.url().split("/tirages/")[1].split("?")[0];
});
await step("participation au nouveau tirage puis tirage automatique à zéro", async () => {
  sql(`update draws set "startsAt"=now()-interval '1 minute' where id='${newDraw}'`);
  await p.goto(`${BASE}/tirages/${newDraw}/participer`);
  await p.getByRole("button", { name: /^5\s*tickets/ }).click();
  await p.getByRole("button", { name: "Continuer" }).click();
  await p.getByRole("button", { name: /Utiliser la carte de test/ }).click();
  await p.getByRole("button", { name: /Payer/ }).click();
  await p.getByText("Participation confirmée").waitFor({ timeout: 15000 });
  sql(`update draws set "endsAt"=now()+interval '8 seconds' where id='${newDraw}'`);
  await p.goto(`${BASE}/tirages/${newDraw}`);
  await p.getByText("Félicitations, vous avez gagné").waitFor({ timeout: 45000 }); // seul participant → gagnant
  expect(sql(`select status from draws where id='${newDraw}'`) === "DRAWN", "tirage non effectué");
  await shot(p, "06-resultat");
});
await step("résultat immuable (trigger)", async () => {
  let blocked = false;
  try { sql(`update winners set "ticketNumber"=1 where "drawId"='${newDraw}'`); } catch { blocked = true; }
  expect(blocked, "la mise à jour du résultat n'a pas été bloquée");
});
await step("e-mail gagnant enregistré", async () => {
  expect(sql(`select count(*) from notifications where "drawId"='${newDraw}' and type='DRAW_WON'`) === "1", "notification gagnant absente");
});
await step("pages admin (tirages, lots, utilisateurs, e-mails, journal)", async () => {
  for (const path of ["/admin/tirages", `/admin/tirages/${newDraw}`, "/admin/produits", "/admin/utilisateurs?q=claire", "/admin/notifications", "/admin/journal"]) {
    const r = await a.goto(`${BASE}${path}`);
    expect(r.status() === 200, `${path} → ${r.status()}`);
  }
  await a.goto(`${BASE}/admin/utilisateurs?q=claire`);
  await a.getByText("Claire Martin").click();
  await a.getByText("Historique des participations").waitFor();
});
await step("suivi de remise du lot", async () => {
  await a.goto(`${BASE}/admin/tirages/${newDraw}`);
  await a.selectOption("select[name=prizeStatus]", "SHIPPED");
  await a.getByRole("button", { name: "Mettre à jour" }).click();
  await a.waitForURL(/ok=1/);
  expect(sql(`select count(*) from notifications where "drawId"='${newDraw}' and type='PRIZE_DELIVERY'`) === "1", "notification livraison absente");
});
await step("dupliquer et supprimer un tirage vide", async () => {
  await a.goto(`${BASE}/admin/tirages/${newDraw}`);
  await a.getByRole("button", { name: "Dupliquer" }).click();
  await a.waitForURL(/modifier/);
  const dup = a.url().split("/tirages/")[1].split("/")[0];
  await a.goto(`${BASE}/admin/tirages/${dup}`);
  await a.getByRole("button", { name: "Supprimer" }).click();
  await a.waitForURL(/supprime=1/);
});

// Nettoyage : le lot de test est masqué du site public
sql(`update products set status='INACTIVE' where name='Robot pâtissier test'`);

console.log("Mobile");
await step("menu hamburger + page détail mobile", async () => {
  const m = await newPage({ width: 390, height: 844 });
  await m.goto(BASE);
  await m.getByRole("button", { name: "Ouvrir le menu" }).click();
  await m.getByRole("link", { name: "Électroménager" }).first().click();
  await m.waitForURL(/electromenager/);
  await m.goto(`${BASE}/tirages/${liveDraw}`);
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(!overflow, "défilement horizontal sur mobile");
  await shot(m, "07-mobile-detail");
});

await browser.close();
if (errors.length) { console.log("\nErreurs navigateur :"); for (const e of errors) console.log("  - " + e); }
console.log(failures || errors.length ? `\n${failures} échec(s), ${errors.length} erreur(s) navigateur` : "\nTous les parcours sont OK ✔");
process.exit(failures ? 1 : 0);
