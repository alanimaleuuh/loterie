#!/usr/bin/env bash
# Préparation automatique du Codespace : dépendances, base, données de démo.
set -e
npm install
[ -f .env ] || cp .env.example .env
# Le site est servi via l'URL *.app.github.dev du Codespace
if [ -n "$CODESPACE_NAME" ]; then
  sed -i "s#^APP_URL=.*#APP_URL=\"https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}\"#" .env
fi
until npx prisma migrate deploy; do echo "Attente de PostgreSQL…"; sleep 2; done
npm run db:seed
npm run build
echo "✔ Prêt — le site démarre avec : npm start"
