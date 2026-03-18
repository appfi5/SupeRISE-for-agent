# Development

This guide is for people who want to customize SupeRISE Agent Wallet or use the repository as a starting point for secondary development. The project stays agent-first: `MCP` is the main contract, while the Owner UI and Owner API are secondary local operator surfaces.

中文版本见 [development.zh.md](./development.zh.md)。

## Local Setup

Requirements:

- `Node.js 24+`
- `pnpm`
- Docker, if you want to use the repository-managed deployment flow

Install dependencies and start local development:

```bash
pnpm install
cp apps/wallet-server/.env.example apps/wallet-server/.env
pnpm dev
```

For a production-style local start:

```bash
pnpm build
pnpm --filter @superise/wallet-server start
```

## Common Commands

- `pnpm dev`: start the Owner UI and wallet server in watch mode
- `pnpm build`: build workspace packages, the Owner UI, and the wallet server
- `pnpm test`: build everything and run all `*.test.cjs` files
- `pnpm typecheck`: run TypeScript type-checking across the workspace
- `pnpm docker:up`: start the repository-managed Docker deployment
- `pnpm docker:down`: stop the repository-managed Docker deployment

## Repository Map

- `apps/wallet-server`: the NestJS server that exposes `/mcp`, `/api/owner/*`, `/health`, and optional Swagger docs
- `apps/owner-ui`: the React/Vite Owner UI served by `wallet-server`
- `packages/app-contracts`: shared MCP and HTTP request/response schemas
- `packages/application`: application services and use-case orchestration
- `packages/domain`: domain entities, factories, and domain errors
- `packages/infrastructure`: SQLite, vault, configuration, and runtime integrations
- `packages/adapters-ckb` and `packages/adapters-evm`: chain-specific adapters

## Agent And Owner Boundaries

- keep `MCP` as the primary integration contract when extending the project
- treat the Owner UI and Owner API as local human-operator surfaces layered on top of the same wallet
- when behavior changes affect transfers, addresses, or status tracking, verify both the MCP path and any affected Owner flows

## Common Edit Points

- runtime and local env example: [`apps/wallet-server/.env.example`](../apps/wallet-server/.env.example)
- custom chain config examples: [`apps/wallet-server/config`](../apps/wallet-server/config)
- Docker deployment env example: [`deploy/docker/.env.example`](../deploy/docker/.env.example)
- shared MCP and Owner API schemas: [`packages/app-contracts`](../packages/app-contracts)
- Owner UI code: [`apps/owner-ui`](../apps/owner-ui)
- wallet server code: [`apps/wallet-server`](../apps/wallet-server)

## Verification Checklist

After changes, a typical validation flow is:

1. run `pnpm typecheck`
2. run `pnpm test`
3. verify `http://127.0.0.1:18799/health`
4. verify the Owner UI loads at `http://127.0.0.1:18799/`
5. if you changed MCP behavior, re-check the integration through MCP Inspector
6. if you changed Owner-facing behavior, re-check the relevant Owner UI or Owner API flow

## Safety Notes

- `/mcp` is unauthenticated by default, so keep development and test environments on trusted local or private networks
- transfer tools return accepted work, not final on-chain confirmation
- if you need managed secrets, mainnet presets, or custom chain deployment, use [`deployment.md`](./deployment.md)
