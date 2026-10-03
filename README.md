# Lotelia — prototype de plateforme de tirages au sort

> ⚠️ **PROTOTYPE DE DÉMONSTRATION.** Aucun paiement réel n'est possible : seul un fournisseur de paiement simulé existe, et un garde-fou bloque tout autre fournisseur.
> Avant toute exploitation, une validation juridique complète est indispensable : voir [`docs/VALIDATION_JURIDIQUE.md`](docs/VALIDATION_JURIDIQUE.md).

Catalogue de lots (high-tech, informatique, électroménager, maison, mobilier…), tirages au sort avec compte à rebours, achat de tickets (paiement simulé), tirage côté serveur vérifiable, espace participant et back-office complet.

## Démarrage rapide

Prérequis : **Node.js ≥ 20**, **PostgreSQL ≥ 14**.

```bash
# 1. Dépendances
npm install

# 2. Base de données (exemple local)
createuser -P loterie            # mot de passe : loterie
createdb -O loterie loterie
cp .env.example .env             # ajuster DATABASE_URL si besoin

# 3. Schéma + données de démonstration
npm run db:deploy                # applique les migrations (tables + triggers d'intégrité)
npm run db:seed                  # 12 lots, 14 tirages, 13 comptes

# 4. Lancer
npm run dev                      # http://localhost:3000
# ou en production :
npm run build && npm start
```

### Comptes de démonstration

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Administrateur | `admin@lotelia.demo` | `Admin12345!` |
| Joueuse (a gagné un tirage) | `claire@demo.lotelia.fr` | `Demo12345!` |
| Autres joueurs | `julien@`, `sofia@`, `thomas@`, `ines@`… `@demo.lotelia.fr` | `Demo12345!` |

`karim@demo.lotelia.fr` est **suspendu** (démonstration de la gestion des statuts).

### Cartes de test (paiement simulé)

| Numéro | Résultat |
|---|---|
| `4242 4242 4242 4242` | Accepté (Visa) |
| `5555 5555 5555 4444` | Accepté (Mastercard) |
| `4000 0000 0000 0002` | Refusé |
| `4000 0000 0000 9995` | Fonds insuffisants |

Tout autre numéro est refusé : une vraie carte ne peut être ni traitée ni conservée.

### États des tirages de démonstration

Le seed crée des tirages **à venir**, **en cours**, **presque terminés**, **complet**, **terminés avec gagnant** et **annulé** (minimum non atteint). Le tirage « Aspirateur robot » **se termine environ 12 minutes après le seed** : il suffit de laisser la page ouverte pour voir le compte à rebours arriver à zéro, puis le tirage automatique et l'affichage du résultat.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` / `build` / `start` | Développement / build / production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:deploy` | Applique les migrations |
| `npm run db:seed` | **Efface** puis recrée les données de démonstration |
| `npm run db:backup` | Sauvegarde `pg_dump` dans `backups/` (rotation sur 14 fichiers) |
| `npm run draws:run` | Traite les tirages échus (à brancher sur un cron en production) |
| `npm run test:e2e` | 30 parcours de bout en bout (Playwright), serveur lancé et données de démo chargées |
| `npm run illustrations` | Régénère les visuels SVG des lots |

## Architecture

Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour le détail (base de données, sécurité, moteur de tirage).

- **Next.js 16** (App Router, Server Components, Server Actions), **React 19**, **TypeScript**, **Tailwind CSS 4**
- **PostgreSQL** + **Prisma 6** ; toutes les requêtes sont paramétrées
- Authentification maison : mots de passe **bcrypt**, sessions en base (jeton haché SHA-256, cookie `httpOnly` / `SameSite=Lax` / `Secure` en production)
- **Zod** pour la validation serveur de toutes les entrées

```
src/
  app/(site)/        pages publiques et espace utilisateur
  app/admin/         back-office (protégé par rôle ADMIN)
  app/actions/       Server Actions (auth, compte, achat, admin)
  app/api/           cron, uploads, health
  components/        UI (draw/, layout/, account/, admin/, ui/)
  lib/               logique pure : statuts, équité (commit-reveal), économie, formats, validation
  server/            accès DB, auth, moteur de tirage, paiement, e-mail, stockage, audit, rate limit
prisma/              schéma, migrations (dont triggers SQL), seed
tests/e2e.mjs        tests de parcours
```

## Ce qui est simulé et ce qu'il faudra brancher en production

| Fonction | Prototype | À brancher en production |
|---|---|---|
| Paiement | `MockPaymentProvider` (`src/server/payments/mock.ts`) | Prestataire conforme (Stripe, Adyen, Mollie…) **après validation juridique** : champs de carte hébergés / tokenisation (PCI-DSS SAQ A), webhooks signés, remboursements réels. Implémenter `PaymentProvider` et lever le garde-fou de `src/server/payments/index.ts`. |
| E-mails | `LogTransport` : table `notifications` + fichier `storage/mail/outbox.log` | SMTP ou API (Resend, Postmark, Brevo, SES) : implémenter `MailTransport` (`src/server/mail/transport.ts`) et le sélectionner via `MAIL_TRANSPORT`. Déporter l'envoi dans une file (BullMQ, SQS). |
| Photos | Disque local `storage/uploads`, servi par `/api/uploads` | Stockage objet + CDN (S3, R2, Cloudinary) : implémenter `StorageProvider`. |
| Planificateur | `setInterval` dans `src/instrumentation.ts` (15 s) | Cron externe vers `POST /api/cron/draws` (en-tête `Authorization: Bearer $CRON_SECRET`) ou `npm run draws:run`. Le moteur est idempotent et protégé par des verrous, donc le planificateur et le cron peuvent coexister. |
| Rate limiting | Mémoire du processus | Redis / Upstash si plusieurs instances. |
| Aléa du tirage | Graine serveur avec engagement publié (commit-reveal) | Ajouter une source d'aléa publique postérieure à la clôture (drand) et/ou un constat par un tiers (commissaire de justice), selon les exigences légales. |
| Vérification d'âge | Date de naissance déclarative (≥ 18 ans) | Selon les obligations applicables (vérification d'identité / KYC). |
| Sauvegardes | `npm run db:backup` | Sauvegardes managées + PITR, chiffrées, hors site. |

Voir aussi [`docs/PRODUCTION.md`](docs/PRODUCTION.md).

## Tester sans rien installer (GitHub Codespaces)

1. Sur la page GitHub du dépôt, choisir la branche `claude/prototype-lotelia`.
2. Cliquer sur **Code → Codespaces → Create codespace on claude/prototype-lotelia**.
3. Attendre la préparation automatique (≈ 3 à 5 min : dépendances, base PostgreSQL, données de démo, build).
4. Le site s'ouvre dans un nouvel onglet ; sinon, onglet **Ports** → port 3000 → icône 🌐.
