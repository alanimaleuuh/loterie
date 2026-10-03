# Architecture technique

## Vue d'ensemble

Il s'agit d'un monolithe modulaire Next.js. Les pages sont rendues côté serveur (React Server Components). Toutes les écritures passent par des **Server Actions** qui suivent toujours les mêmes étapes :
1. vérification de la session et du rôle ;
2. limitation de débit ;
3. validation Zod ;
4. appel au domaine (`src/server/*`) ;
5. inscription au journal d'activité.

Le code des composants client se limite à l'interactivité : compte à rebours, galerie, sélection des tickets, formulaires, filtres. **Aucune décision métier n'est prise côté client.**

## Base de données

```
users ──< sessions
  │  ──< password_reset_tokens
  │  ──< payments ──1 participations >── draws >── products >── categories
  │  ──< participations ──< tickets >───┘   │         └──< product_images
  │  ──< tickets                             │
  │  ──< winners (1 par tirage) ─────────────┘ (winners.ticket_id → tickets)
  │  ──< notifications >── draws (optionnel)
  └──< admin_logs
```

| Table | Rôle |
|---|---|
| `users` | Compte, rôle (`USER`/`ADMIN`), statut (`ACTIVE`/`SUSPENDED`), pseudonyme public, mot de passe bcrypt |
| `sessions` | Sessions serveur. L'identifiant est le SHA-256 du jeton : le jeton brut n'existe que dans le cookie |
| `password_reset_tokens` | Jetons de réinitialisation hachés, valables 1 h, à usage unique |
| `categories`, `products`, `product_images` | Catalogue. `purchase_cost` (interne) et `display_value` (public) en centimes |
| `draws` | Tirage d'un produit : prix du ticket, nombre max./min. de tickets, dates, statut, `seed_hash` (engagement public), `server_seed` (secret jusqu'au tirage), suivi de remise du lot |
| `payments` | Paiement (simulé) : montant, statut, marque + 4 derniers chiffres uniquement, clé d'idempotence |
| `participations` | Une commande : utilisateur × tirage × paiement, quantité, montant |
| `tickets` | Un ticket = un numéro unique par tirage (`UNIQUE(draw_id, number)`) |
| `winners` | Résultat : ticket gagnant, index, empreintes, graine révélée, chaînage `previous_hash` → `result_hash` |
| `notifications` | Journal des e-mails envoyés et centre de notifications in-app |
| `admin_logs` | Journal d'activité (admin, système, sécurité), en ajout seul |

Les montants sont des entiers en centimes.

### Garde-fous SQL (migration `init`)

- `winners` : tout `UPDATE` ou `DELETE` est **interdit** par un trigger.
- `tickets` : création impossible hors de la fenêtre de dates, si le tirage n'est pas ouvert ou au-delà de `max_tickets`. Modification et suppression impossibles une fois le tirage clôturé.
- `draws` : la graine et son empreinte sont **immuables**. Un tirage `DRAWN` ne peut plus changer (prix, dates, tickets, statut), seul le suivi de livraison reste modifiable. Un tirage clôturé ne peut pas être rouvert, et un tirage `CLOSED`/`DRAWN` ne peut pas être supprimé.

## Statuts

Statut stocké : `SCHEDULED`, `CLOSED`, `DRAWN`, `CANCELLED`, `DISABLED`.

Le statut affiché est dérivé dans `src/lib/draw-status.ts` à partir du statut stocké et des dates :
- **À venir**, **En cours**, **Complet** ;
- **Presque terminé** : moins de 24 h ou moins de 15 % de tickets restants ;
- **Terminé**, **Gagnant annoncé**, **Annulé**.

## Moteur de tirage (`src/server/draws/engine.ts`)

### Achat
1. Vérifications préalables.
2. Paiement via `PaymentProvider`, avec clé d'idempotence.
3. Transaction avec `SELECT … FOR UPDATE` sur le tirage, nouvelle vérification du stock, attribution de numéros séquentiels, puis création de la participation et des tickets.
4. Si l'attribution échoue après le paiement, **remboursement automatique** (compensation).

### Clôture (`executeDraw`)
- Exécution idempotente, sous verrou de ligne et verrou consultatif global, ce qui garantit un chaînage linéaire.
- Le statut passe à `CLOSED` et la liste des tickets valides est figée.
- Si aucun ticket n'est vendu ou si le minimum n'est pas atteint : statut `CANCELLED`, remboursements simulés et e-mails.
- Sinon :
  - `index = HMAC-SHA256(server_seed, "<n° tirage>:<SHA-256(liste)>") mod N` ;
  - insertion dans `winners` avec `result_hash = SHA-256(… | previous_hash)` ;
  - statut `DRAWN` et envoi des e-mails : gagnant d'un côté, autres participants de l'autre.

### Déclenchement
- Planificateur interne (`instrumentation.ts`).
- Cron (`/api/cron/draws`).
- À la volée, à l'ouverture des pages.
- Quand le compte à rebours client arrive à zéro, il rafraîchit la page, mais **c'est le serveur qui tire**.

### Vérification publique
Page `/verification/[id]`, avec un recalcul côté serveur et un recalcul indépendant dans le navigateur (WebCrypto).

## Sécurité

| Exigence | Mise en œuvre |
|---|---|
| Mots de passe | bcrypt (coût 12), 10 caractères minimum dont lettres et chiffres ; hash factice pour un temps de réponse constant |
| Sessions | Jeton aléatoire de 256 bits, stocké haché, cookie `httpOnly` / `SameSite=Lax` / `Secure` (prod), 7 jours glissants. Toutes les sessions sont invalidées lors d'un changement ou d'une réinitialisation du mot de passe, ou d'une suspension |
| Injection SQL | Prisma (requêtes paramétrées) ; les rares requêtes brutes utilisent des templates taggés paramétrés |
| XSS | Échappement React, aucun HTML utilisateur rendu, JSON-LD échappé, CSP stricte (`default-src 'self'`, `frame-ancestors 'none'`…) |
| CSRF | Server Actions protégées par Next (contrôle `Origin`/`Host`) et cookie `SameSite=Lax` ; l'endpoint cron est protégé par un secret, comparé en temps constant |
| Validation | Zod côté serveur pour toutes les entrées ; listes blanches pour les filtres d'URL ; redirections `next` limitées aux chemins internes |
| Rate limiting | Connexion (IP + e-mail), inscription, mot de passe oublié, achat, compte, admin |
| Permissions | `requireAdmin()` dans le layout admin **et** dans chaque action admin |
| Uploads | Taille maximale de 3 Mo, contrôle de la signature binaire (JPEG, PNG, WebP), nom aléatoire, `nosniff` et CSP `default-src 'none'` à la diffusion |
| Énumération | Réponse identique au « mot de passe oublié », que le compte existe ou non ; message de connexion générique |
| Données personnelles | E-mails masqués dans les listes admin ; consultation d'une fiche journalisée ; date de naissance non affichée ; seuls le pseudonyme et l'initiale sont publics ; jeton de réinitialisation masqué dans le journal des e-mails admin |
| Paiement | Seuls les numéros de test sont acceptés ; seuls la marque et les 4 derniers chiffres sont stockés ; garde-fou contre tout fournisseur réel |
| Journalisation | `admin_logs` : actions admin, tirages, échecs de connexion, changements de mot de passe |
| En-têtes | CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS (prod) |
