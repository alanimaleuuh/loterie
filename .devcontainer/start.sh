#!/usr/bin/env bash
# Démarrage du site dans le Codespace. Prépare automatiquement ce qui manque
# (dépendances, build, base, données de démo) puis lance le serveur.
cd "$(dirname "$0")/.."
exec > >(tee -a /tmp/lotelia-start.log) 2>&1
echo "=== Démarrage $(date) ==="

URL="http://localhost:3000"
if [ -n "$CODESPACE_NAME" ]; then URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"; fi

fail() { echo; echo "✘ $1"; echo "  Relancez : bash .devcontainer/start.sh  (et envoyez ces lignes si l'erreur persiste)"; exit 1; }

# Site déjà lancé ? On affiche simplement le lien.
if curl -s -o /dev/null --max-time 3 http://localhost:3000/api/health; then
  echo "✔ Le site tourne déjà. Ouvrez : $URL"
  exit 0
fi

# Un seul démarrage à la fois (le Codespace en lance déjà un automatiquement)
exec 9>/tmp/lotelia-start.lock
if ! flock -n 9; then
  echo "⏳ Le site est déjà en cours de démarrage dans un autre terminal."
  echo "   Attente de la fin de la préparation (jusqu'à 10 min)…"
  for i in $(seq 1 200); do
    if curl -s -o /dev/null --max-time 3 http://localhost:3000/api/health; then
      echo; echo "✔ Site prêt. Ouvrez : $URL"; exit 0
    fi
    sleep 3
  done
  fail "Le démarrage en cours n'a pas abouti : regardez l'autre terminal (onglet Terminal, liste à droite)"
fi

[ -d node_modules ] || { echo "→ Installation des dépendances…"; npm install || fail "Installation des dépendances impossible"; }
[ -f .env ] || cp .env.example .env
if [ -n "$CODESPACE_NAME" ]; then
  sed -i "s#^APP_URL=.*#APP_URL=\"https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}\"#" .env
fi

# Charge la configuration pour toutes les commandes suivantes
set -a; . ./.env; set +a

if [ ! -f .next/BUILD_ID ]; then
  echo "→ Construction du site (1 à 3 minutes)…"
  npm run build || fail "La construction du site a échoué"
fi

echo "→ Connexion à la base de données…"
ok=""
for i in $(seq 1 60); do
  if npx prisma migrate deploy >/tmp/migrate.log 2>&1; then ok=1; break; fi
  echo "  attente de PostgreSQL ($i/60)…"; sleep 3
done
[ -n "$ok" ] || { cat /tmp/migrate.log; fail "Base de données injoignable (le service « db » du Codespace ne répond pas). Essayez : menu Codespaces → « Rebuild Container »"; }

if [ ! -f .devcontainer/.seeded ]; then
  echo "→ Données de démonstration…"
  npm run db:seed || fail "Création des données de démonstration impossible"
  touch .devcontainer/.seeded
fi

echo
echo "✔ Site prêt. Ouvrez ce lien (Ctrl+clic / Cmd+clic) :"
echo
echo "    $URL"
echo
echo "  (ou onglet « Ports » → port 3000 → icône 🌐). Laissez ce terminal ouvert."
echo
exec npm start -- -p 3000
