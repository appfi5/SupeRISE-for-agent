# Deployment

This guide is for people who want to run SupeRISE Agent Wallet in a local or controlled environment. The primary integration surface remains `MCP`; the Owner UI and Owner API are local operator surfaces for human use.

中文版本见 [deployment.zh.md](./deployment.zh.md)。

## Deployment Profiles

| Profile | Use it when | Secret model | Chain config scope |
| --- | --- | --- | --- |
| `quickstart` | You want the fastest local trial with the published image | Runtime secrets are generated automatically | Fixed to built-in `testnet` presets for both chains |
| `managed` | You need explicit secrets, long-running deployment, mainnet presets, or custom chain config | `KEK` and `OWNER_JWT_SECRET` are provided explicitly | Supports built-in `testnet` or `mainnet` presets, plus custom chain JSON |

## Quickstart With The Published Image

```bash
docker volume inspect superise-agent-wallet-data >/dev/null 2>&1 || docker volume create superise-agent-wallet-data
docker pull superise/agent-wallet:latest
docker run -d \
  --name superise-agent-wallet \
  --restart unless-stopped \
  -p 127.0.0.1:18799:18799 \
  -v superise-agent-wallet-data:/app/runtime-data \
  superise/agent-wallet:latest
```

After startup:

- MCP endpoint: `http://127.0.0.1:18799/mcp`
- Owner UI: `http://127.0.0.1:18799/`
- Health check: `http://127.0.0.1:18799/health`

Notes:

- keep the published port on `127.0.0.1` unless you are deploying into a trusted private network
- `quickstart` requires the explicit `superise-agent-wallet-data:/app/runtime-data` mount
- `quickstart` uses the built-in `testnet` presets for both chains
- the initial Owner password is printed once in the container logs on the first boot
- `quickstart` does not accept external `WALLET_KEK*` or `OWNER_JWT_SECRET`

## Managed Deployment From This Repository

Use this when you want an explicit `KEK`, an explicit `OWNER_JWT_SECRET`, or more controlled runtime settings.

Key files:

- [`docker-compose.yml`](../docker-compose.yml)
- [`deploy/docker/.env.example`](../deploy/docker/.env.example)
- [`deploy/docker/chain-config`](../deploy/docker/chain-config)
- [`scripts/docker-up.sh`](../scripts/docker-up.sh)
- [`scripts/docker-rotate-kek.sh`](../scripts/docker-rotate-kek.sh)

Start it with:

```bash
pnpm install
pnpm docker:up
```

After startup:

- MCP endpoint: `http://127.0.0.1:${PORT:-18799}/mcp`
- Owner UI: `http://127.0.0.1:${PORT:-18799}/`
- Health check: `http://127.0.0.1:${PORT:-18799}/health`
- SQLite database: `deploy/docker/runtime-data/wallet.sqlite`

Notes:

- the repository flow uses `DEPLOYMENT_PROFILE=managed`
- `PUBLISH_HOST` defaults to `127.0.0.1`
- `ENABLE_API_DOCS` defaults to `false`
- `/mcp` remains unauthenticated and must not be exposed to the public Internet or to untrusted networks
- if you want `/health` to report the deployed image alias, inject `SUPERISE_DEPLOY_IMAGE_TAG` at runtime; if you also track digests in your deployment system, inject `SUPERISE_DEPLOY_IMAGE_DIGEST`

## Owner Access

- the Owner UI is served from `/`
- the Owner HTTP API lives under `/api/owner/*`
- in `quickstart`, the initial Owner password is printed once in the startup logs
- in `managed`, Owner authentication depends on the configured `OWNER_JWT_SECRET`
- treat the Owner UI and Owner API as local operator surfaces, just like the rest of the runtime

## Manual Managed Deployment

If you run the service outside Docker Compose, provide at least:

- `DEPLOYMENT_PROFILE=managed`
- `OWNER_JWT_SECRET`
- `WALLET_KEK_PATH`, or `WALLET_KEK` together with `ALLOW_PLAINTEXT_KEK_ENV=true`
- the required `CKB_CHAIN_*` and `EVM_CHAIN_*` settings for your target network

For local configuration examples, start from [`apps/wallet-server/.env.example`](../apps/wallet-server/.env.example).

## Key Configuration

### Runtime And Network

- `HOST`
- `PORT`
- `PUBLISH_HOST`
- `ENABLE_API_DOCS`
- `SUPERISE_DEPLOY_IMAGE_TAG`
- `SUPERISE_DEPLOY_IMAGE_DIGEST`

### Data And Secrets

- `DEPLOYMENT_PROFILE`
- `DATA_DIR`
- `RUNTIME_SECRET_DIR`
- `SQLITE_PATH`
- `OWNER_NOTICE_PATH`
- `OWNER_JWT_SECRET`
- `OWNER_JWT_TTL`
- `WALLET_KEK_PATH`
- `WALLET_KEK`
- `ALLOW_PLAINTEXT_KEK_ENV`

### Chain And Settlement

- `CKB_CHAIN_MODE`
- `CKB_CHAIN_PRESET`
- `CKB_CHAIN_CONFIG_PATH`
- `EVM_CHAIN_MODE`
- `EVM_CHAIN_PRESET`
- `EVM_CHAIN_CONFIG_PATH`
- `TRANSFER_SETTLEMENT_INTERVAL_MS`
- `TRANSFER_RESERVED_TIMEOUT_MS`
- `TRANSFER_SUBMITTED_TIMEOUT_MS`

Use `managed` when you need mainnet or custom chain config. `quickstart` is intentionally constrained to the built-in testnets.

## Health And Data

- `GET /health` reports runtime database availability
- the main runtime data is the SQLite database plus the active `KEK`
- if you use custom chain JSON files, back them up together with the database and `KEK`

For the repository-managed flow, the important local paths are:

- `deploy/docker/runtime-data`
- `deploy/docker/secrets/wallet_kek.txt`
- `deploy/docker/chain-config` when custom chain files are in use

## Advanced Operations

To rotate the Docker-managed `KEK`:

```bash
pnpm docker:rotate-kek
```

To stop the repository-managed deployment:

```bash
pnpm docker:down
```
