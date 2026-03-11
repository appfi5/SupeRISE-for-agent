#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
ENV_EXAMPLE="$ROOT_DIR/deploy/docker/.env.example"
ENV_FILE="$ROOT_DIR/deploy/docker/.env"
RUNTIME_DIR="$ROOT_DIR/deploy/docker/runtime-data"
SECRET_DIR="$ROOT_DIR/deploy/docker/secrets"
SECRET_FILE="$SECRET_DIR/wallet_kek.txt"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[docker-up] missing required command: $1" >&2
    exit 1
  fi
}

validate_env_file() {
  if grep -Eq '^(NETWORK|CHAIN_ENV|CHAIN_CONFIG_PATH)=' "$1"; then
    echo "[docker-up] legacy chain config keys detected in $1" >&2
    echo "[docker-up] replace them with CKB_CHAIN_* and EVM_CHAIN_* settings" >&2
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

read_env_value() {
  KEY="$1"
  FILE="$2"
  awk -F= -v key="$KEY" '$1 == key { value=$2 } END { print value }' "$FILE"
}

mkdir -p "$RUNTIME_DIR" "$SECRET_DIR"

require_command docker

if [ ! -f "$ENV_FILE" ]; then
  JWT_SECRET=$(generate_hex_32)
  while IFS= read -r line || [ -n "$line" ]; do
    if [ "$line" = "OWNER_JWT_SECRET=" ]; then
      printf 'OWNER_JWT_SECRET=%s\n' "$JWT_SECRET"
    else
      printf '%s\n' "$line"
    fi
  done < "$ENV_EXAMPLE" > "$ENV_FILE"
  echo "[docker-up] created $ENV_FILE"
fi

validate_env_file "$ENV_FILE"

if [ ! -f "$SECRET_FILE" ]; then
  generate_hex_32 > "$SECRET_FILE"
  chmod 600 "$SECRET_FILE" || true
  echo "[docker-up] generated $SECRET_FILE"
fi

cd "$ROOT_DIR"
docker compose up -d --build

PUBLISH_HOST=$(read_env_value "PUBLISH_HOST" "$ENV_FILE")
PORT_VALUE=$(read_env_value "PORT" "$ENV_FILE")

if [ -z "$PUBLISH_HOST" ]; then
  PUBLISH_HOST="127.0.0.1"
fi

if [ -z "$PORT_VALUE" ]; then
  PORT_VALUE="18799"
fi

DISPLAY_HOST="$PUBLISH_HOST"
if [ "$DISPLAY_HOST" = "0.0.0.0" ]; then
  DISPLAY_HOST="127.0.0.1"
fi

echo "[docker-up] wallet server is starting"
echo "[docker-up] service url: http://$DISPLAY_HOST:$PORT_VALUE/"
echo "[docker-up] mcp endpoint: http://$DISPLAY_HOST:$PORT_VALUE/mcp"
echo "[docker-up] warning: /mcp is unauthenticated and should only be exposed to trusted local or private networks"
echo "[docker-up] api docs: enable by setting ENABLE_API_DOCS=true in deploy/docker/.env"
