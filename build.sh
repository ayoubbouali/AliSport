#!/usr/bin/env bash
# Gym Manager — production build: one executable jar containing the API and the Angular UI.
# Result: backend/target/gym-manager-1.0.0.jar  →  java -jar backend/target/gym-manager-1.0.0.jar
set -euo pipefail
cd "$(dirname "$0")"
(cd frontend && npm ci && npx ng build)
(cd backend && ./mvnw -q clean package)
echo "✔ backend/target/gym-manager-1.0.0.jar"
