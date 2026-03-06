# SupeRISE for agent

Node.js LTS + pnpm workspace wallet stack for CKB-first agent workflows.

## Refactor baseline

This repository is migrating to the architecture defined in:

- `docs/refactor/REQUIREMENTS.md`
- `docs/refactor/ARCHITECTURE.md`

Primary apps:

- `apps/wallet-api` (wallet business logic + HTTP entrypoints)
- `apps/wallet-mcp` (thin MCP adapter via SDK/API calls)
- `apps/rise-cli` / `apps/rise-web` (entry shells)

Primary packages:

- `packages/wallet-core`, `packages/chain-ckb`, `packages/chain-eth`
- `packages/storage-sqlite`, `packages/contracts`, `packages/sdk`, `packages/sustain`

## Wallet API docs

- Runtime OpenAPI endpoint: `GET /api/v1/openapi.json`
- Generated spec file: `apps/wallet-api/openapi.json`
- Regenerate command:

```bash
corepack pnpm -C apps/wallet-api openapi:generate
```

## Validation highlights

- CKB transfer target addresses are validated using a strict CKB/testnet prefix + bech32 charset check in `packages/contracts`.
- Invalid address payloads are rejected with HTTP `400` before wallet-core execution.

## Workspace commands

```bash
corepack pnpm install
corepack pnpm test
corepack pnpm build
```
