#!/usr/bin/env bash
# Runs every test: business rules + acceptance criteria (Java) and UI unit tests (Angular).
set -euo pipefail
cd "$(dirname "$0")"
(cd backend && ./mvnw -q test)
(cd frontend && npx ng test --watch=false)
