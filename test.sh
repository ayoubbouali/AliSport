#!/usr/bin/env bash
# Runs every test: UI unit tests (Angular / Vitest) then business rules + acceptance criteria (Java).
set -euo pipefail
cd "$(dirname "$0")"
./mvnw -q clean verify
