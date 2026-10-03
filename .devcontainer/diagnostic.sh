#!/usr/bin/env bash
# Diagnostic du Codespace : copiez-collez TOUTE la sortie de cette commande.
cd "$(dirname "$0")/.."
echo "===== DIAGNOSTIC LOTELIA ====="
echo "--- version du code"; git log -1 --oneline 2>&1
echo "--- node"; node -v 2>&1
echo "--- .env présent"; [ -f .env ] && grep -E "^(DATABASE_URL|APP_URL)" .env | sed 's#://[^@]*@#://***@#' || echo "NON"
echo "--- build présent"; [ -f .next/BUILD_ID ] && echo "oui" || echo "NON"
echo "--- processus du site"; ps -eo pid,etime,args | grep -E "next|start.sh" | grep -v grep || echo "aucun"
echo "--- ports en écoute"; (ss -ltn 2>/dev/null || netstat -ltn 2>/dev/null) | grep -E ":3000|:5432" || echo "ni 3000 ni 5432"
echo "--- réponse locale du site"; curl -s -m 5 -o /dev/null -w "http://localhost:3000 → %{http_code}\n" http://localhost:3000/ || echo "pas de réponse"
curl -s -m 5 -o /dev/null -w "http://127.0.0.1:3000 → %{http_code}\n" http://127.0.0.1:3000/ || echo "127.0.0.1 : pas de réponse"
echo "--- base de données"; set -a; . ./.env 2>/dev/null; set +a; npx prisma migrate status 2>&1 | grep -vE "^$|prisma.config|pris.ly|deprecated" | tail -3
echo "--- 40 dernières lignes du démarrage"; tail -n 40 /tmp/lotelia-start.log 2>/dev/null | tr -d '\r' | grep -v "^\s*$" || echo "aucun journal (start.sh jamais lancé ?)"
echo "===== FIN ====="
