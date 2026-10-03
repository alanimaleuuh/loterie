#!/usr/bin/env bash
# Démarrage du site dans le Codespace. Prépare automatiquement ce qui manque
# (dépendances, build, base, données de démo) puis lance le serveur.
cd "$(dirname "$0")/.."

fail() { echo; echo "✘ $1"; echo "  Relancez : bash .devcontainer/start.sh  (et envoyez ces lignes si l'erreur persiste)"; exit 1; }

[ -d node_modules ] || { echo "→ Installation des dépendances…"; npm install || fail "Installation des dépendances impossible"; }
[ -f .env ] || cp .env.example .env
if [ -n "$CODESPACE_NAME" ]; then
  sed -i "s#^APP_URL=.*#APP_URL=\"https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}\"#" .env
fi

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

echo "✔ Site prêt sur le port 3000 (onglet « Ports » → 🌐)"
exec npm start
