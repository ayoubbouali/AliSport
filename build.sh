#!/usr/bin/env bash
# Gym Manager — production build: one executable jar containing the API and the Angular UI.
# Maven reactor: frontend (Angular → gym-manager-frontend.jar, /static) then backend (Spring Boot jar embedding it).
# Node is downloaded by Maven into frontend/node: no local Node install is required.
# Result: backend/target/gym-manager-1.0.0.jar  →  java -jar backend/target/gym-manager-1.0.0.jar
set -euo pipefail
cd "$(dirname "$0")"
./mvnw -q clean package -DskipTests
echo "✔ backend/target/gym-manager-1.0.0.jar"
