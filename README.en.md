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

## Common Commands

```bash
pnpm install
pnpm build
cp apps/wallet-server/.env.example apps/wallet-server/.env
pnpm dev
pnpm --filter @superise/wallet-server start
```

## Docker

One-command local deployment is available:

```bash
pnpm docker:up
```

On the first run, the helper script will:

- create `deploy/docker/.env` from `deploy/docker/.env.example`
- generate `deploy/docker/secrets/wallet_kek.txt`
- persist runtime data under `deploy/docker/runtime-data`
- build and start the `wallet-server` container

After startup:

- Service URL: `http://127.0.0.1:18799/`
- MCP endpoint: `http://127.0.0.1:18799/mcp`
- Health check: `http://127.0.0.1:18799/health`

The default Docker configuration binds only to local `127.0.0.1`. `/mcp` is unauthenticated and must not be exposed to the public Internet or to untrusted networks.

Docker deployment also provides one-command `KEK` rotation:

```bash
pnpm docker:rotate-kek
```

This command stops the service, re-wraps the current `DEK` with a new `KEK`, backs up the previous key source, and starts the service again.

## Configuration

Chain configuration is resolved independently for `CKB` and `EVM`, so preset and custom modes can be mixed per chain.

- `CKB_CHAIN_MODE=preset|custom`
- `CKB_CHAIN_PRESET=testnet|mainnet`
- `CKB_CHAIN_CONFIG_PATH`
- `EVM_CHAIN_MODE=preset|custom`
- `EVM_CHAIN_PRESET=testnet|mainnet`
- `EVM_CHAIN_CONFIG_PATH`

Rules:

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
