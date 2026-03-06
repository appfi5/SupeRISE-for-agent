# SupeRISE for agent

Node.js LTS + pnpm workspace wallet stack for CKB-first agent workflows.

## Architecture

This repository follows the architecture defined in:

- `docs/refactor/REQUIREMENTS.md`
- `docs/refactor/ARCHITECTURE.md`

### Apps

| Path | Description |
|------|-------------|
| `apps/wallet-api` | Wallet business logic + HTTP API (Fastify) |
| `apps/wallet-mcp` | Thin MCP adapter — calls wallet-api via SDK |
| `apps/rise-cli` | CLI entry shell |
| `apps/rise-web` | Web UI entry (placeholder) |

### Packages

| Path | Description |
|------|-------------|
| `packages/wallet-core` | Wallet domain model & use cases |
| `packages/chain-ckb` | CKB chain adapter |
| `packages/chain-eth` | ETH chain adapter (skeleton) |
| `packages/storage-sqlite` | SQLite persistence |
| `packages/contracts` | Shared schemas, DTOs, validation |
| `packages/sdk` | API client for MCP / CLI / UI |
| `packages/sustain` | Sustain keep-alive engine (migrated from legacy CLI) |

## Wallet API

### Swagger UI

Start the API and open **`/docs`** in a browser for interactive API docs.

### OpenAPI spec

- Machine-readable endpoint: `GET /docs/json`
- Generated spec file: `apps/wallet-api/openapi.json`

Regenerate:

```bash
corepack pnpm -C apps/wallet-api openapi:generate
```

### CKB address validation

Transfer target addresses are validated against CKB/testnet bech32 format at the request layer.
Invalid addresses are rejected with HTTP `400` before reaching wallet-core.

## Getting started

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm test
```

### Running the API

```bash
MASTER_KEY=<your-secret> corepack pnpm -C apps/wallet-api start
```
