#!/usr/bin/env bash
# Sauvegarde de la base PostgreSQL (format custom, compressé) dans backups/
# Usage : npm run db:backup      Restauration : pg_restore -d "$DATABASE_URL" --clean backups/<fichier>.dump
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
mkdir -p backups
FILE="backups/lotelia-$(date +%Y%m%d-%H%M%S).dump"
pg_dump --format=custom --no-owner "${DATABASE_URL%%\?*}" > "$FILE"
# Rotation : conserve les 14 dernières sauvegardes
ls -1t backups/*.dump 2>/dev/null | tail -n +15 | xargs -r rm --
echo "Sauvegarde créée : $FILE"
