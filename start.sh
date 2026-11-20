#!/usr/bin/env bash
# Gym Manager — build the Angular UI (first time or after changes) and start the server.
# Usage: ./start.sh            → http://localhost:8090
#        PORT=9000 ./start.sh  → other port
#        ./start.sh --rebuild  → force the UI rebuild
set -euo pipefail
cd "$(dirname "$0")"

FRONT_JAR="$HOME/.m2/repository/com/alisport/gym-manager-frontend/1.0.0/gym-manager-frontend-1.0.0.jar"
if [[ ! -f "$FRONT_JAR" || "${1:-}" == "--rebuild" ]]; then
  echo "▶ Construction de l'interface Angular…"
  # Installs the parent pom and the frontend jar in ~/.m2, where the backend module resolves it.
  ./mvnw -q -pl frontend -am install -DskipTests
fi

echo "▶ Démarrage du serveur sur http://localhost:${PORT:-8090}"
./mvnw -q -pl backend spring-boot:run
