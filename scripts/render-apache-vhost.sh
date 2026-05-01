#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APACHE_DIR="$ROOT_DIR/apache"

usage() {
  cat <<'EOF'
Usage:
  scripts/render-apache-vhost.sh <domain> <acme_webroot> [upstream_url]

Example:
  scripts/render-apache-vhost.sh fotosicai.montagnaservizi.it /var/www/acme-fotosicai http://127.0.0.1:8080/

Output files:
  apache/<domain>.conf
  apache/<domain>-80-only.conf
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 2 ]]; then
  usage
  exit 1
fi

DOMAIN="$1"
ACME_WEBROOT="$2"
UPSTREAM_URL="${3:-http://127.0.0.1:8080/}"

HTTPS_TEMPLATE="$APACHE_DIR/vhost-https.example.conf"
HTTP_ONLY_TEMPLATE="$APACHE_DIR/vhost-80-only.example.conf"
HTTPS_OUT="$APACHE_DIR/$DOMAIN.conf"
HTTP_ONLY_OUT="$APACHE_DIR/$DOMAIN-80-only.conf"

if [[ ! -f "$HTTPS_TEMPLATE" || ! -f "$HTTP_ONLY_TEMPLATE" ]]; then
  echo "Template Apache non trovati in $APACHE_DIR"
  exit 1
fi

render_template() {
  local template="$1"
  local output="$2"

  sed \
    -e "s|__PROD_DOMAIN__|$DOMAIN|g" \
    -e "s|__ACME_WEBROOT__|$ACME_WEBROOT|g" \
    -e "s|__UPSTREAM_URL__|$UPSTREAM_URL|g" \
    "$template" > "$output"
}

render_template "$HTTPS_TEMPLATE" "$HTTPS_OUT"
render_template "$HTTP_ONLY_TEMPLATE" "$HTTP_ONLY_OUT"

echo "Generati:"
echo "  - $HTTPS_OUT"
echo "  - $HTTP_ONLY_OUT"
