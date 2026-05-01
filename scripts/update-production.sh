#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
ENV_EXAMPLE="$ROOT_DIR/.env.example"

usage() {
  cat <<'EOF'
Usage:
  scripts/update-production.sh

What it does:
  1) Checks missing variables from .env.example into .env
  2) Prompts for missing values (fallback to example default if present)
  3) Appends missing keys to .env
  4) Builds updated images
  5) Runs backend DB migrations (ALTER TABLE idempotenti) without dropping data
  6) Restarts services with docker compose up -d
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Comando richiesto non trovato: $1"
    exit 1
  fi
}

trim_spaces() {
  local s="$1"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

get_env_value() {
  local key="$1"
  local file="$2"
  local line
  line="$(rg -n "^${key}=" "$file" -m 1 || true)"
  if [[ -z "$line" ]]; then
    printf ''
    return
  fi
  line="${line#*:}"
  printf '%s' "${line#*=}"
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

require_cmd rg
require_cmd docker

if [[ ! -f "$ENV_EXAMPLE" ]]; then
  echo "File mancante: $ENV_EXAMPLE"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "Creato $ENV_FILE da .env.example"
fi

echo "== Verifica variabili mancanti in .env =="
echo

missing_count=0

while IFS= read -r raw_line; do
  line="$(trim_spaces "$raw_line")"

  # Skip empty or comment lines
  [[ -z "$line" ]] && continue
  [[ "$line" == \#* ]] && continue
  [[ "$line" != *=* ]] && continue

  key="${line%%=*}"
  key="$(trim_spaces "$key")"
  default_value="${line#*=}"

  # Basic key validation
  if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
    continue
  fi

  if rg -n "^${key}=" "$ENV_FILE" >/dev/null 2>&1; then
    continue
  fi

  missing_count=$((missing_count + 1))
  echo "Variabile mancante: $key"

  prompt_default="$default_value"
  if [[ "$prompt_default" == "\"\"" ]]; then
    prompt_default=""
  fi

  if [[ -n "$prompt_default" ]]; then
    read -r -p "Inserisci valore per $key [$prompt_default]: " user_value
    if [[ -z "$user_value" ]]; then
      user_value="$prompt_default"
    fi
  else
    read -r -p "Inserisci valore per $key: " user_value
  fi

  {
    echo
    printf '%s=%s\n' "$key" "$user_value"
  } >> "$ENV_FILE"
done < "$ENV_EXAMPLE"

if [[ "$missing_count" -eq 0 ]]; then
  echo "Nessuna variabile mancante in .env"
else
  echo
  echo "Aggiunte $missing_count variabili mancanti in .env"
fi

echo
echo "Build immagini Docker aggiornate..."
(cd "$ROOT_DIR" && docker compose build backend frontend)

echo
echo "Backup database SQLite (se presente)..."
db_path="$(get_env_value "DATABASE_PATH" "$ENV_FILE")"
if [[ -z "$db_path" ]]; then
  db_path="./db/fotosicai.sqlite"
fi
if [[ "$db_path" != /* ]]; then
  db_path="$ROOT_DIR/${db_path#./}"
fi

if [[ -f "$db_path" ]]; then
  backup_dir="$ROOT_DIR/db/backups"
  mkdir -p "$backup_dir"
  backup_file="$backup_dir/fotosicai-$(date +%Y%m%d-%H%M%S).sqlite"
  cp "$db_path" "$backup_file"
  echo "Backup creato: $backup_file"
else
  echo "Nessun file database trovato in $db_path (skip backup)."
fi

echo
echo "Eseguo migration backend (ALTER TABLE idempotenti, dati preservati)..."
(
  cd "$ROOT_DIR" && docker compose run --rm backend \
    node -e "const { getDb } = require('./src/db'); getDb(); console.log('Migrations OK');"
)

echo
echo "Rilancio servizi Docker..."
(cd "$ROOT_DIR" && docker compose up -d)

echo
echo "Completato."
