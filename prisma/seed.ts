/**
 * Données de démonstration Lotelia.
 * Usage : npm run db:seed   (efface puis recrée toutes les données)
 *
 * Les tirages terminés sont réellement exécutés par le moteur de tirage
 * (src/server/draws/engine.ts) : résultats, empreintes et chaînage sont authentiques.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { drawWinner, generateSeed, sha256 } from "../src/lib/fairness";

const db = new PrismaClient();

// PRNG déterministe (répartition des achats de démo)
let s = 20261003;
const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pickInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const H = 3600_000;
const D = 24 * H;
const NOW = Date.now();
const at = (offsetMs: number) => new Date(NOW + offsetMs);
const id = (prefix: string) => `${prefix}${randomBytes(12).toString("hex")}`;

const DEMO_PASSWORD = "Demo12345!";
const ADMIN_PASSWORD = "Admin12345!";

const categories = [
  { slug: "electromenager", name: "Électroménager", icon: "cooking-pot", description: "Cafetières, robots, aspirateurs : le meilleur de l'équipement de la maison." },
  { slug: "informatique", name: "Informatique", icon: "laptop", description: "Ordinateurs portables, écrans et accessoires pour travailler et créer." },
  { slug: "high-tech", name: "High-Tech", icon: "smartphone", description: "Smartphones, téléviseurs, consoles et audio haut de gamme." },
  { slug: "maison", name: "Maison", icon: "lamp", description: "Objets connectés et confort au quotidien." },
  { slug: "mobilier", name: "Mobilier", icon: "sofa", description: "Canapés, tables et pièces de design pour votre intérieur." },
  { slug: "autres", name: "Autres", icon: "sparkles", description: "Mobilité, loisirs et coups de cœur." },
];

type P = {
  key: string; ref: string; name: string; brand: string; cat: string; img: string;
  value: number; cost: number; short: string; desc: string;
};

const products: P[] = [
  { key: "tv", ref: "LOT-1024", name: "TV Samsung 55\" 4K QLED", brand: "Samsung", cat: "high-tech", img: "tv-4k", value: 59900, cost: 47900,
    short: "Téléviseur 55 pouces QLED, 4K UHD, HDR10+, Smart TV.",
    desc: "Un téléviseur 55 pouces à la dalle QLED lumineuse et contrastée. Résolution 4K UHD, compatibilité HDR10+ et processeur d'upscaling pour sublimer tous vos contenus.\n\nCaractéristiques :\n• Diagonale 138 cm (55\")\n• Dalle QLED 4K UHD 3840 × 2160\n• HDR10+, mode jeu 120 Hz\n• Smart TV avec applications de streaming\n• 4 ports HDMI 2.1\n\nLot neuf, sous emballage d'origine, garantie constructeur 2 ans." },
  { key: "iphone", ref: "LOT-1025", name: "iPhone 16 Pro 256 Go", brand: "Apple", cat: "high-tech", img: "iphone", value: 132900, cost: 115000,
    short: "Titane naturel, 256 Go, triple capteur photo 48 Mpx.",
    desc: "Le smartphone phare d'Apple, en titane naturel. Écran Super Retina XDR 6,3\" ProMotion, puce de dernière génération et système photo pro à trois capteurs.\n\nCaractéristiques :\n• Stockage 256 Go\n• Écran 6,3\" ProMotion 120 Hz\n• Triple capteur 48 Mpx, zoom optique 5×\n• USB-C, Wi-Fi 7\n\nLot neuf, scellé, garantie constructeur." },
  { key: "macbook", ref: "LOT-1026", name: "MacBook Air 13\" M4", brand: "Apple", cat: "informatique", img: "macbook", value: 119900, cost: 99900,
    short: "Puce M4, 16 Go de mémoire, SSD 512 Go.",
    desc: "Ultra-fin, silencieux et endurant : le MacBook Air 13\" équipé de la puce M4 est le compagnon idéal pour travailler, étudier et créer.\n\nCaractéristiques :\n• Puce M4 (CPU 10 cœurs)\n• 16 Go de mémoire unifiée\n• SSD 512 Go\n• Écran Liquid Retina 13,6\"\n• Jusqu'à 18 h d'autonomie\n\nLot neuf, clavier AZERTY français." },
  { key: "cafe", ref: "LOT-1027", name: "Machine à café grain De'Longhi", brand: "De'Longhi", cat: "electromenager", img: "machine-cafe", value: 49900, cost: 38900,
    short: "Broyeur intégré, buse vapeur, 13 réglages de mouture.",
    desc: "Un espresso fraîchement moulu à chaque tasse. Broyeur conique en acier, 13 niveaux de mouture et buse vapeur pour cappuccinos et lattes.\n\nCaractéristiques :\n• Pression 15 bars\n• Réservoir 1,8 L\n• Écran de contrôle tactile\n• Programmes : espresso, lungo, cappuccino\n\nLot neuf, garantie 2 ans." },
  { key: "aspi", ref: "LOT-1028", name: "Aspirateur robot laveur Roborock", brand: "Roborock", cat: "electromenager", img: "aspirateur", value: 69900, cost: 52000,
    short: "Aspiration 8 000 Pa, lavage, station d'autovidage.",
    desc: "Il aspire, il lave, il se vide tout seul. Navigation laser LiDAR, cartographie multi-étages et station d'autovidage pour jusqu'à 7 semaines sans intervention.\n\nCaractéristiques :\n• Aspiration 8 000 Pa\n• Serpillière vibrante\n• Évitement d'obstacles\n• Application mobile\n\nLot neuf, garantie constructeur." },
  { key: "canape", ref: "LOT-1029", name: "Canapé 3 places en velours", brand: "Atelier Maison", cat: "mobilier", img: "canape", value: 89900, cost: 64000,
    short: "Velours côtelé vert sauge, pieds en chêne, assise profonde.",
    desc: "Un canapé trois places généreux, au velours côtelé doux et résistant. Assise profonde, coussins déhoussables et piètement en chêne massif.\n\nDimensions : L 218 × P 95 × H 82 cm\nLivraison à domicile incluse (France métropolitaine) pour le gagnant." },
  { key: "table", ref: "LOT-1030", name: "Table à manger en chêne massif", brand: "Atelier Maison", cat: "mobilier", img: "table-manger", value: 74900, cost: 52000,
    short: "6 à 8 couverts, chêne massif huilé, fabrication européenne.",
    desc: "Une table conviviale en chêne massif huilé, pensée pour durer. Plateau de 4 cm d'épaisseur, finition naturelle.\n\nDimensions : 200 × 95 cm, hauteur 76 cm\nLivraison incluse pour le gagnant." },
  { key: "console", ref: "LOT-1031", name: "Console PlayStation 5 Pro", brand: "Sony", cat: "high-tech", img: "console", value: 79999, cost: 74999,
    short: "2 To, ray tracing avancé, manette DualSense incluse.",
    desc: "La console nouvelle génération dans sa version Pro : graphismes améliorés, ray tracing avancé et SSD ultra-rapide de 2 To.\n\nContenu : console, manette DualSense, câbles.\nLot neuf, garantie constructeur." },
  { key: "casque", ref: "LOT-1032", name: "Casque Sony WH-1000XM5", brand: "Sony", cat: "high-tech", img: "casque-audio", value: 37900, cost: 28900,
    short: "Réduction de bruit de référence, 30 h d'autonomie.",
    desc: "Le casque sans fil à réduction de bruit active de référence. Son haute résolution, 8 microphones et 30 heures d'autonomie.\n\nLot neuf, étui de transport inclus." },
  { key: "ecran", ref: "LOT-1033", name: "Écran PC 27\" 4K UHD", brand: "LG", cat: "informatique", img: "ecran-pc", value: 44900, cost: 33000,
    short: "Dalle IPS 4K, USB-C 90 W, calibré d'usine.",
    desc: "Un moniteur 27 pouces 4K à la colorimétrie précise : idéal pour la photo, la vidéo et la productivité. Connexion USB-C avec charge 90 W.\n\nLot neuf, garantie 3 ans." },
  { key: "purif", ref: "LOT-1034", name: "Purificateur d'air connecté", brand: "Dyson", cat: "maison", img: "purificateur", value: 54900, cost: 42000,
    short: "Filtre HEPA H13, capteurs de qualité de l'air, silencieux.",
    desc: "Respirez mieux chez vous. Filtration HEPA H13, capteurs en temps réel et pilotage depuis l'application.\n\nSurface recommandée : jusqu'à 80 m². Lot neuf." },
  { key: "trott", ref: "LOT-1035", name: "Trottinette électrique Xiaomi", brand: "Xiaomi", cat: "autres", img: "trottinette", value: 49900, cost: 36000,
    short: "Autonomie 45 km, pliable, pneus 10\".",
    desc: "Une trottinette électrique robuste et pliable pour vos trajets quotidiens. Autonomie jusqu'à 45 km, freinage double, application connectée.\n\nLot neuf, conforme à la réglementation en vigueur." },
];

const users = [
  ["Claire", "Martin", "Claire"], ["Julien", "Bernard", "JulienB"], ["Sofia", "Haddad", "Sofia"], ["Thomas", "Petit", "Tom"],
  ["Inès", "Moreau", "Ines_M"], ["Lucas", "Lefèvre", "Lucas"], ["Camille", "Garcia", "Camille"], ["Hugo", "Roux", "Hugo.R"],
  ["Léa", "Fontaine", "Léa"], ["Nathan", "Chevalier", "Nathan"], ["Manon", "Girard", "Manon"], ["Karim", "Benali", "Karim"],
];

type DrawSpec = {
  product: string; price: number; max: number; min?: number; start: number; end: number; sold: number;
  featured?: boolean; claireWins?: boolean; claireQty?: number;
};

const draws: DrawSpec[] = [
  { product: "iphone", price: 500, max: 280, start: -21 * D, end: -14 * D, sold: 252, claireQty: 4 },
  { product: "tv", price: 400, max: 150, start: -16 * D, end: -10 * D, sold: 150, claireQty: 5 },
  { product: "casque", price: 200, max: 160, start: -12 * D, end: -6 * D, sold: 149, claireWins: true, claireQty: 6 },
  { product: "ecran", price: 200, max: 190, start: -9 * D, end: -3 * D, sold: 176, claireQty: 3 },
  { product: "trott", price: 300, max: 140, min: 100, start: -8 * D, end: -2 * D, sold: 41, claireQty: 2 },
  { product: "tv", price: 400, max: 150, start: -3 * D, end: 2 * D + 5 * H, sold: 97, featured: true, claireQty: 5 },
  { product: "iphone", price: 500, max: 280, start: -2 * D, end: 5 * D, sold: 164, claireQty: 3 },
  { product: "macbook", price: 500, max: 240, start: -5 * D, end: 5 * H, sold: 221 },
  { product: "cafe", price: 300, max: 150, start: -1 * D, end: 3 * D, sold: 58, claireQty: 2 },
  { product: "aspi", price: 300, max: 200, start: -4 * D, end: 12 * 60_000, sold: 141, claireQty: 3 },
  { product: "console", price: 300, max: 280, start: -6 * D, end: 20 * H, sold: 280 },
  { product: "purif", price: 300, max: 160, start: -6 * H, end: 6 * D, sold: 12 },
  { product: "canape", price: 400, max: 190, start: 1 * D, end: 8 * D, sold: 0 },
  { product: "table", price: 300, max: 200, min: 120, start: 3 * D, end: 10 * D, sold: 0 },
];

async function main() {
  console.log("→ Nettoyage…");
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE winners, tickets, participations, payments, notifications, admin_logs, draws, product_images, products, categories, sessions, password_reset_tokens, users RESTART IDENTITY CASCADE`,
  );

  console.log("→ Catégories, utilisateurs, lots…");
  for (const [i, c] of categories.entries()) await db.category.create({ data: { ...c, sortOrder: i } });
  const cats = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));

  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const admin = await db.user.create({
    data: {
      firstName: "Alex", lastName: "Admin", displayName: "Équipe Lotelia", email: "admin@lotelia.demo",
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), role: "ADMIN", birthDate: new Date("1988-04-12"),
      termsAcceptedAt: at(-60 * D), createdAt: at(-60 * D),
    },
  });
  const players = [];
  for (const [i, [firstName, lastName, displayName]] of users.entries()) {
    const email = `${firstName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@demo.lotelia.fr`;
    players.push(
      await db.user.create({
        data: {
          firstName, lastName, displayName, email, passwordHash: demoHash,
          birthDate: new Date(1975 + (i * 3) % 25, i % 12, 1 + i), termsAcceptedAt: at(-(50 - i * 3) * D),
          createdAt: at(-(50 - i * 3) * D), lastLoginAt: at(-pickInt(0, 72) * H), marketingOptIn: i % 3 === 0,
          status: i === 11 ? "SUSPENDED" : "ACTIVE",
        },
      }),
    );
  }
  const claire = players[0];
  const buyers = players.filter((u) => u.status === "ACTIVE");

  const prodIds: Record<string, string> = {};
  for (const p of products) {
    const created = await db.product.create({
      data: {
        reference: p.ref, name: p.name, brand: p.brand, categoryId: cats[p.cat], shortDescription: p.short, description: p.desc,
        purchaseCost: p.cost, displayValue: p.value, createdAt: at(-30 * D),
        images: {
          create: [
            { url: `/lots/${p.img}-1.svg`, alt: `${p.name} — vue studio`, sortOrder: 0 },
            { url: `/lots/${p.img}-2.svg`, alt: `${p.name} — ambiance`, sortOrder: 1 },
            { url: `/lots/${p.img}-3.svg`, alt: `${p.name} — détail`, sortOrder: 2 },
          ],
        },
      },
    });
    prodIds[p.key] = created.id;
  }

  console.log("→ Tirages et participations…");
  const { executeDraw } = await import("../src/server/draws/engine");
  let number = 1001;
  const finished: { id: string; end: Date }[] = [];

  for (const spec of [...draws].sort((a, b) => a.start - b.start)) {
    const drawNumber = number++;
    const startsAt = at(spec.start);
    const endsAt = at(spec.end);
    const isPast = spec.end < 0;
    const drawId = id("d");

    // Répartition des achats
    type Order = { userId: string; qty: number; at: Date };
    const orders: Order[] = [];
    let remaining = spec.sold;
    if (spec.claireQty && remaining > 0) {
      const q = Math.min(spec.claireQty, remaining);
      orders.push({ userId: claire.id, qty: q, at: new Date(startsAt.getTime() + 3 * H) });
      remaining -= q;
    }
    const salesEnd = Math.min(endsAt.getTime(), NOW) - 60_000;
    while (remaining > 0) {
      const q = Math.min(pickInt(1, 10), remaining);
      const u = buyers[pickInt(1, buyers.length - 1)];
      orders.push({ userId: u.id, qty: q, at: new Date(startsAt.getTime() + rand() * (salesEnd - startsAt.getTime())) });
      remaining -= q;
    }
    orders.sort((a, b) => a.at.getTime() - b.at.getTime());

    // Tickets (identifiants générés ici pour pouvoir figer la liste)
    let n = 0;
    const plan = orders.map((o) => ({
      ...o,
      partId: id("p"),
      payId: id("pay"),
      tickets: Array.from({ length: o.qty }, () => ({ id: id("t"), number: ++n })),
    }));

    let { serverSeed, seedHash } = generateSeed();
    if (spec.claireWins) {
      // ⚠️ Fixture de démonstration uniquement : on choisit une graine pour laquelle le
      // compte de démo « Claire » gagne, afin d'illustrer l'état « Gagné 🎉 » de l'espace
      // participant. Le moteur de production ne fait JAMAIS cela : la graine est fixée et
      // publiée (seedHash) avant la vente, et le trigger SQL interdit de la modifier.
      const all = plan.flatMap((o) => o.tickets.map((t) => ({ ...t, userId: o.userId })));
      for (let i = 0; i < 10_000; i++) {
        const w = drawWinner(serverSeed, drawNumber, all);
        if (all.find((t) => t.id === w.ticket.id)?.userId === claire.id) break;
        ({ serverSeed, seedHash } = generateSeed());
      }
    }

    await db.draw.create({
      data: {
        id: drawId, number: drawNumber, productId: prodIds[spec.product], ticketPrice: spec.price, maxTickets: spec.max,
        minTickets: spec.min ?? null, startsAt: spec.start > 0 ? startsAt : at(-1000 * D),
        // Ouvert temporairement pour que le trigger SQL autorise l'insertion des tickets
        endsAt: isPast ? at(H) : endsAt, featured: spec.featured ?? false, serverSeed, seedHash,
        createdAt: new Date(Math.min(startsAt.getTime(), NOW) - 2 * D),
      },
    });

    for (const o of plan) {
      const amount = o.qty * spec.price;
      await db.payment.create({
        data: { id: o.payId, userId: o.userId, amount, provider: "mock", providerRef: `mock_pi_${randomBytes(10).toString("hex")}`,
          idempotencyKey: sha256(o.payId).slice(0, 32), status: "SUCCEEDED", cardBrand: "Visa", cardLast4: "4242", isDemo: true, createdAt: o.at },
      });
      await db.participation.create({
        data: { id: o.partId, userId: o.userId, drawId, paymentId: o.payId, quantity: o.qty, unitPrice: spec.price, totalAmount: amount, createdAt: o.at },
      });
      await db.ticket.createMany({
        data: o.tickets.map((t) => ({ id: t.id, drawId, number: t.number, participationId: o.partId, userId: o.userId, createdAt: o.at })),
      });
    }
    await db.draw.update({ where: { id: drawId }, data: { soldTickets: spec.sold, startsAt, endsAt } });
    if (isPast) finished.push({ id: drawId, end: endsAt });
  }
  await db.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('draws', 'number'), (SELECT MAX(number) FROM draws))`);

  console.log("→ Exécution des tirages terminés (moteur réel)…");
  for (const f of finished.sort((a, b) => a.end.getTime() - b.end.getTime())) {
    const r = await executeDraw(f.id, { clock: new Date(f.end.getTime() + 2_000) });
    console.log(`   ${f.id} → ${r?.kind}`);
  }
  // Suivi de remise pour les plus anciens gagnants
  const oldWinners = await db.draw.findMany({ where: { status: "DRAWN" }, orderBy: { endsAt: "asc" } });
  for (const [i, d] of oldWinners.entries()) {
    await db.draw.update({ where: { id: d.id }, data: { prizeStatus: i === 0 ? "DELIVERED" : i === 1 ? "SHIPPED" : "CONTACTED" } });
  }

  await db.adminLog.create({ data: { actorId: admin.id, actorLabel: admin.displayName, action: "seed.completed", entityType: "system", details: { draws: draws.length } } });

  console.log("\n✔ Données de démonstration créées");
  console.log(`  Admin   : admin@lotelia.demo / ${ADMIN_PASSWORD}`);
  console.log(`  Joueuse : claire@demo.lotelia.fr / ${DEMO_PASSWORD}  (11 autres comptes : <prénom>@demo.lotelia.fr)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
