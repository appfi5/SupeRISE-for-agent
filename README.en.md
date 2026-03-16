# SupeRISE Agent Wallet

SupeRISE Agent Wallet is a single-wallet credit wallet service built for Agents. The formal Agent integration surface is `MCP`.

The default Chinese version is [README.md](./README.md).

## Runtime

- `Node.js 24 LTS`
- `pnpm workspace`
- `NestJS 11` wallet server
- `SQLite + Kysely + better-sqlite3`
- `MCP` for Agent access

## Documentation

- Usage docs (Chinese, default): [`docs/README.md`](./docs/README.md)
- Usage docs (English): [`docs/en/README.md`](./docs/en/README.md)
- MCP integration (Chinese): [`docs/mcp.md`](./docs/mcp.md)
- Deployment guide (Chinese): [`docs/deployment.md`](./docs/deployment.md)

## Current Capabilities

- `Agents` integrate through `MCP`; `Owners` manage the wallet and limits through the local management surface and local `HTTP API`
- Supported assets are Nervos `CKB`, plus Ethereum `ETH`, `USDT`, and `USDC`
- A shared address book maps contact names to `Nervos` / `Ethereum` addresses and supports exact-address reverse lookup
- All four transfer tools support `to + toType`: they can send to a raw address directly or resolve a contact name on the current chain first
- Agent transfers are enforced with independent daily / weekly / monthly limits per asset; Owner transfers are exempt
- `wallet.operation_status` reports server-side orchestration status, while on-chain progress must be checked through `nervos.tx_status` and `ethereum.tx_status`

## Ways To Run

This README keeps only two recommended startup paths:

### 1. Clone The Code And Run It Yourself

Use this for local development, debugging, or code changes.

```bash
git clone https://github.com/appfi5/SupeRISE-for-agent.git
cd SupeRISE-for-agent
pnpm install
cp apps/wallet-server/.env.example apps/wallet-server/.env
pnpm dev
```

If you want a production-style local start:

```bash
pnpm build
pnpm --filter @superise/wallet-server start
```

### 2. Use The Published Docker Image Directly

Use this for zero-app-config quickstart. The official image name is `superise/agent-wallet`.

Check or create the runtime volume first, then pull the latest image and start it:

```bash
docker volume inspect superise-agent-wallet-data >/dev/null 2>&1 || docker volume create superise-agent-wallet-data
docker pull superise/agent-wallet:latest
docker run -d \
  --name superise-agent-wallet \
  --restart unless-stopped \
  -p 18799:18799 \
  -v superise-agent-wallet-data:/app/runtime-data \
  superise/agent-wallet:latest
```

Notes:

- `superise-agent-wallet-data` is the required persistent volume for quickstart
- without `-v superise-agent-wallet-data:/app/runtime-data`, the official image fails fast on purpose
- on the first quickstart boot, the logs print the initial Owner password once; rotate it immediately after the first login

After startup:

- Service URL: `http://127.0.0.1:18799/`
- MCP endpoint: `http://127.0.0.1:18799/mcp`
- Health check: `http://127.0.0.1:18799/health`

The default Docker configuration binds only to local `127.0.0.1`. `/mcp` is unauthenticated and must not be exposed to the public Internet or to untrusted networks.

### Controlled Deployment Note

If you are doing a controlled local deployment from the source repository, you can still use the repository-managed flow:

```bash
pnpm docker:up
pnpm docker:rotate-kek
```

## Image Publishing

GitHub tags automatically trigger Docker Hub image build and push. The repository image name is `superise/agent-wallet`.

- Git tag `v0.2.0` -> Docker tag `0.2.0`
- Git tag `v0.2.0-rc.1` -> Docker tag `0.2.0-rc.1`
- Git tag `test-address-book-1` -> Docker tag `test-address-book-1`
- Published images are multi-platform manifests that currently cover `linux/amd64` and `linux/arm64`

`latest` is updated only when both conditions are true:

- the Git tag matches a stable release `vX.Y.Z`
- the tagged commit comes from `main`

## Configuration

Chain configuration is resolved independently for `CKB` and `EVM`, so preset and custom modes can be mixed per chain.

- `DEPLOYMENT_PROFILE=quickstart|managed`
- `RUNTIME_SECRET_DIR`
- `CKB_CHAIN_MODE=preset|custom`
- `CKB_CHAIN_PRESET=testnet|mainnet`
- `CKB_CHAIN_CONFIG_PATH`
- `EVM_CHAIN_MODE=preset|custom`
- `EVM_CHAIN_PRESET=testnet|mainnet`
- `EVM_CHAIN_CONFIG_PATH`

Rules:

- `quickstart` is for zero-app-config startup and only allows the built-in `testnet` preset on both chains
- `managed` is for controlled deployment and requires an external `KEK` plus `OWNER_JWT_SECRET`
- `preset` uses the built-in `testnet/mainnet` profiles
- `custom` loads a dedicated JSON file per chain
- `CKB custom` requires `rpcUrl`, `indexerUrl`, `genesisHash`, `addressPrefix`, and `scripts`
- `EVM custom` requires `rpcUrl`, `chainId`, optional `networkName`, plus both `tokens.erc20.usdt` and `tokens.erc20.usdc`
- `TRANSFER_SETTLEMENT_INTERVAL_MS` controls the background transfer-settlement polling interval
- `TRANSFER_RESERVED_TIMEOUT_MS` controls how long a `RESERVED` operation may wait before broadcast
- `TRANSFER_SUBMITTED_TIMEOUT_MS` controls how long a `SUBMITTED` operation may wait for on-chain confirmation
- local development config: `apps/wallet-server/.env.example`
- local custom examples: `apps/wallet-server/config/*.custom.example.json`
- Docker deployment config: `deploy/docker/.env.example`
- Docker custom examples: `deploy/docker/chain-config/*.custom.example.json`

`/docs` and `/docs-json` are enabled only when `ENABLE_API_DOCS=true`; the default deployment configuration keeps them disabled.
`pnpm docker:up` auto-generates the high-entropy JWT signing secret required by the local management surface when it creates `deploy/docker/.env` for the first time.
