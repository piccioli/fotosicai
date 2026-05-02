#!/usr/bin/env bash
# Usage: ./scripts/stress_test.sh [USERS] [PHOTOS_PER_USER]
# Defaults: 5 users, 10 photos each
set -euo pipefail

USERS="${1:-5}"
PHOTOS="${2:-10}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
JS_SRC="$SCRIPT_DIR/stress_test.js"
FIXTURES_SRC="$REPO_ROOT/apps/backend/tests/fixtures"

CONTAINER=$(docker compose ps -q backend 2>/dev/null | head -1)
if [[ -z "$CONTAINER" ]]; then
  echo "Error: backend container is not running. Run: docker compose up -d" >&2
  exit 1
fi

echo "Copying stress_test.js into container ${CONTAINER}..."
docker cp "$JS_SRC" "$CONTAINER:/tmp/stress_test.js"

echo "Syncing fixtures ($(ls "$FIXTURES_SRC"/*.{jpg,jpeg,png,JPG,JPEG,PNG} 2>/dev/null | wc -l | tr -d ' ') file) into container..."
docker cp "$FIXTURES_SRC/." "$CONTAINER:/tmp/stress_fixtures/"

echo "Running stress test: $USERS utenti × $PHOTOS foto ciascuno"
docker compose exec -e FIXTURE_DIR=/tmp/stress_fixtures backend node /tmp/stress_test.js "$USERS" "$PHOTOS"
