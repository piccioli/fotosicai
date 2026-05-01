#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
ENV_EXAMPLE="$ROOT_DIR/.env.example"
RENDER_SCRIPT="$ROOT_DIR/scripts/render-apache-vhost.sh"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Comando richiesto non trovato: $1"
    exit 1
  fi
}

upsert_env() {
  local key="$1"
  local value="$2"
  local file="$3"
  local tmp
  tmp="$(mktemp)"

  if rg -n "^${key}=" "$file" >/dev/null 2>&1; then
    awk -v k="$key" -v v="$value" '
      BEGIN { done=0 }
      $0 ~ ("^" k "=") {
        print k "=" v
        done=1
        next
      }
      { print }
      END {
        if (done==0) {
          print k "=" v
        }
      }
    ' "$file" > "$tmp"
  else
    cat "$file" > "$tmp"
    printf '%s=%s\n' "$key" "$value" >> "$tmp"
  fi

  mv "$tmp" "$file"
}

prompt_default() {
  local label="$1"
  local def="$2"
  local answer
  read -r -p "$label [$def]: " answer
  if [[ -z "$answer" ]]; then
    echo "$def"
  else
    echo "$answer"
  fi
}

echo "== FotoSICAI first install =="
echo

require_cmd docker
require_cmd certbot
require_cmd sudo
require_cmd rg
require_cmd apache2ctl
require_cmd a2enmod
require_cmd a2ensite
require_cmd systemctl

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_EXAMPLE" ]]; then
    echo "File mancante: $ENV_EXAMPLE"
    exit 1
  fi
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "Creato $ENV_FILE da .env.example"
fi

DOMAIN="$(prompt_default "Dominio produzione (FQDN)" "fotosicai.montagnaservizi.it")"
PUBLIC_BASE_URL="$(prompt_default "PUBLIC_BASE_URL" "https://$DOMAIN")"
FRONTEND_HOST_PORT="$(prompt_default "Porta host frontend (evita porte occupate, es. 8081)" "8080")"
ACME_WEBROOT="$(prompt_default "Path ACME webroot" "/var/www/acme-fotosicai")"
UPSTREAM_URL="$(prompt_default "Upstream Apache -> frontend" "http://127.0.0.1:${FRONTEND_HOST_PORT}/")"
LETSENCRYPT_EMAIL="$(prompt_default "Email Let's Encrypt" "admin@$DOMAIN")"
NOMINATIM_USER_AGENT="$(prompt_default "NOMINATIM_USER_AGENT" "fotosicai/1.0 ($LETSENCRYPT_EMAIL)")"

read -r -p "ANTHROPIC_API_KEY (obbligatoria): " ANTHROPIC_API_KEY
read -r -p "ADMIN_TOKEN (obbligatorio): " ADMIN_TOKEN

if [[ -z "$ANTHROPIC_API_KEY" || -z "$ADMIN_TOKEN" ]]; then
  echo "ANTHROPIC_API_KEY e ADMIN_TOKEN sono obbligatorie."
  exit 1
fi

upsert_env "PUBLIC_BASE_URL" "$PUBLIC_BASE_URL" "$ENV_FILE"
upsert_env "FRONTEND_HOST_PORT" "$FRONTEND_HOST_PORT" "$ENV_FILE"
upsert_env "NOMINATIM_USER_AGENT" "$NOMINATIM_USER_AGENT" "$ENV_FILE"
upsert_env "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY" "$ENV_FILE"
upsert_env "ADMIN_TOKEN" "$ADMIN_TOKEN" "$ENV_FILE"

echo
echo "Genero i vhost Apache locali da template..."
"$RENDER_SCRIPT" "$DOMAIN" "$ACME_WEBROOT" "$UPSTREAM_URL"

HTTP_ONLY_LOCAL_CONF="$ROOT_DIR/apache/$DOMAIN-80-only.conf"
HTTPS_LOCAL_CONF="$ROOT_DIR/apache/$DOMAIN.conf"
APACHE_SITE_CONF="/etc/apache2/sites-available/$DOMAIN.conf"

echo
echo "Avvio/aggiorno stack Docker..."
(cd "$ROOT_DIR" && docker compose up -d --build)

echo
echo "Configuro Apache + HTTPS con Certbot..."
sudo mkdir -p "$ACME_WEBROOT"
sudo a2enmod ssl proxy proxy_http headers rewrite

sudo cp "$HTTP_ONLY_LOCAL_CONF" "$APACHE_SITE_CONF"
sudo a2ensite "$DOMAIN.conf"
sudo apache2ctl configtest
sudo systemctl reload apache2

sudo certbot certonly --webroot -w "$ACME_WEBROOT" -d "$DOMAIN" --email "$LETSENCRYPT_EMAIL" --agree-tos --non-interactive

sudo cp "$HTTPS_LOCAL_CONF" "$APACHE_SITE_CONF"
sudo apache2ctl configtest
sudo systemctl reload apache2

echo
echo "Installazione completata."
echo "Dominio: $DOMAIN"
echo "PUBLIC_BASE_URL: $PUBLIC_BASE_URL"
echo "FRONTEND_HOST_PORT: $FRONTEND_HOST_PORT"
echo "File env: $ENV_FILE"
