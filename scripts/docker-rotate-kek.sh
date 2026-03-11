#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
ENV_FILE="$ROOT_DIR/deploy/docker/.env"
SECRET_DIR="$ROOT_DIR/deploy/docker/secrets"
CURRENT_SECRET="$SECRET_DIR/wallet_kek.txt"
NEXT_SECRET="${1:-$SECRET_DIR/wallet_kek.next.txt}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[docker-rotate-kek] missing required command: $1" >&2
    exit 1
  fi
}

generate_hex_32() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
    return
  fi

  if command -v node >/dev/null 2>&1; then
    node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
    return
  fi

  docker run --rm node:24-bookworm-slim node -e \
    "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
}

require_command docker

if [ ! -f "$ENV_FILE" ]; then
  echo "[docker-rotate-kek] missing $ENV_FILE, run scripts/docker-up.sh first" >&2
  exit 1
fi

if [ ! -f "$CURRENT_SECRET" ]; then
  echo "[docker-rotate-kek] missing current KEK file: $CURRENT_SECRET" >&2
  exit 1
fi

if [ "$NEXT_SECRET" = "$CURRENT_SECRET" ]; then
  echo "[docker-rotate-kek] next KEK path must differ from current KEK path" >&2
  exit 1
fi

if [ ! -f "$NEXT_SECRET" ]; then
  mkdir -p "$(dirname "$NEXT_SECRET")"
  generate_hex_32 > "$NEXT_SECRET"
  chmod 600 "$NEXT_SECRET" || true
  echo "[docker-rotate-kek] generated next KEK file: $NEXT_SECRET"
fi

cd "$ROOT_DIR"

SERVICE_WAS_RUNNING=0
if docker compose ps --status running --services wallet-server 2>/dev/null | grep -q '^wallet-server$'; then
  SERVICE_WAS_RUNNING=1
fi

restore_service() {
  if [ "$SERVICE_WAS_RUNNING" -eq 1 ]; then
    docker compose up -d wallet-server >/dev/null 2>&1 || true
  fi
}

trap restore_service EXIT INT TERM

docker compose stop wallet-server >/dev/null 2>&1 || true
docker compose run --rm \
  -e NEXT_WALLET_KEK_PATH=/run/next-secrets/wallet_kek_next \
  -e NEXT_WALLET_KEK_PROVIDER=docker-secret \
  -e NEXT_WALLET_KEK_REFERENCE=/run/secrets/wallet_kek \
  -v "$NEXT_SECRET:/run/next-secrets/wallet_kek_next:ro" \
  wallet-server \
  node apps/wallet-server/scripts/rewrap-kek.cjs

BACKUP_SECRET="$SECRET_DIR/wallet_kek.$(date +%Y%m%d%H%M%S).bak"
cp "$CURRENT_SECRET" "$BACKUP_SECRET"
mv "$NEXT_SECRET" "$CURRENT_SECRET"
chmod 600 "$CURRENT_SECRET" || true

docker compose up -d wallet-server
trap - EXIT INT TERM

echo "[docker-rotate-kek] rotation complete"
echo "[docker-rotate-kek] backup of previous KEK: $BACKUP_SECRET"
