#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "⚠️  Questo comando elimina TUTTO: database SQLite e immagini caricate."
read -r -p "Sei sicuro? [s/N] " confirm
if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
  echo "Annullato."
  exit 0
fi

# Stop containers if running (ignore errors if not running)
docker compose -f "$ROOT/docker-compose.yml" stop backend 2>/dev/null || true

# Remove database
if find "$ROOT/db" -name "*.sqlite" | grep -q .; then
  rm -f "$ROOT/db"/*.sqlite
  echo "✓ Database eliminato"
else
  echo "  (nessun database trovato)"
fi

# Remove uploaded images (keep directory structure with .gitkeep)
if [ -d "$ROOT/storage/foto" ]; then
  rm -rf "$ROOT/storage/foto"
  echo "✓ Immagini eliminate"
else
  echo "  (nessuna immagine trovata)"
fi

# Restart backend so it recreates the schema
docker compose -f "$ROOT/docker-compose.yml" start backend 2>/dev/null || true

echo "✓ Reset completato."
