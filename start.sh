#!/usr/bin/env bash
# Gym Manager — build the Angular UI (first time or after changes) and start the server.
# Usage: ./start.sh            → http://localhost:8090
#        PORT=9000 ./start.sh  → other port
#        ./start.sh --rebuild  → force the UI rebuild
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f backend/src/main/resources/static/index.html || "${1:-}" == "--rebuild" ]]; then
  echo "▶ Construction de l'interface Angular…"
  (cd frontend && { [[ -d node_modules ]] || npm ci; } && npx ng build)
fi

echo "▶ Démarrage du serveur sur http://localhost:${PORT:-8090}"
cd backend && ./mvnw -q spring-boot:run
