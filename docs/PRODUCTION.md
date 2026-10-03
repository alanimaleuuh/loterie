# Passage en production — liste de contrôle technique

> Aucune de ces étapes ne doit être engagée pour des paiements réels avant la validation juridique (`docs/VALIDATION_JURIDIQUE.md`).

## Infrastructure
- [ ] PostgreSQL managé (sauvegardes automatiques et PITR, chiffrement au repos, réplique).
- [ ] Hébergement Node avec HTTPS obligatoire ; `APP_URL` en https.
- [ ] Variables : `DATABASE_URL`, `APP_URL`, `CRON_SECRET` (long, aléatoire), `MAIL_TRANSPORT`, `MAIL_FROM`, `DISABLE_DRAW_SCHEDULER=true` si un cron externe est utilisé.
- [ ] Cron toutes les minutes : `POST /api/cron/draws` avec `Authorization: Bearer $CRON_SECRET`.
- [ ] Rate limiting partagé (Redis) si plusieurs instances.
- [ ] Stockage objet + CDN pour les photos (`StorageProvider`).
- [ ] Supervision : `/api/health`, logs centralisés, alertes sur les échecs de tirage et d'e-mail (`notifications.status = FAILED`).

## Sécurité
- [ ] CSP à nonce (supprimer `'unsafe-inline'` des scripts) via `proxy.ts`.
- [ ] Double authentification pour les comptes administrateurs.
- [ ] Vérification de l'adresse e-mail à l'inscription.
- [ ] Revue de sécurité / test d'intrusion.
- [ ] Politique de rétention et purge des sessions, jetons et journaux.

## Paiement (après validation juridique)
- [ ] Implémenter `PaymentProvider` pour le prestataire retenu (Payment Intents, champs hébergés, 3-D Secure).
- [ ] Réserver les tickets pendant le paiement (expiration) et confirmer par **webhook signé**.
- [ ] Remboursements réels, rapprochement comptable, gestion des litiges et des rétrofacturations.
- [ ] Retirer le garde-fou de `src/server/payments/index.ts` **seulement** à ce moment-là.

## Équité du tirage
- [ ] Combiner la graine serveur avec une valeur d'aléa publique publiée après la clôture (balise drand, round fixé à l'avance).
- [ ] Le cas échéant, procédure de constat par un tiers indépendant.

## E-mails
- [ ] Transport réel (SMTP / Resend / Postmark…), domaine authentifié (SPF, DKIM, DMARC).
- [ ] File d'envoi avec retries ; modèles HTML ; lien de désinscription pour les e-mails marketing.
