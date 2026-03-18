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
- `pnpm version:check`: verify that the root and all workspace packages use the same version
- `pnpm version:sync`: sync every workspace package version to the root `package.json`
- `pnpm version:set <version>`: set the root and every workspace package to an explicit version
- `pnpm docker:up`: start the repository-managed Docker deployment
- `pnpm docker:down`: stop the repository-managed Docker deployment

## Repository Map

- `apps/wallet-server`: the NestJS server that exposes `/mcp`, `/api/owner/*`, `/health`, `/build`, and optional Swagger docs
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
- release automation config: [`.github/release-please-config.json`](../.github/release-please-config.json)
- release workflow: [`.github/workflows/release.yml`](../.github/workflows/release.yml)
- direct tag image workflow: [`.github/workflows/tag-image.yml`](../.github/workflows/tag-image.yml)

## Release Automation

For the full stable release, prerelease tag, and direct image publishing model, see [Release Guide](./release.md).

## Build Metadata

`/build` now exposes build metadata separately from `/health`. The fields have intentionally separate meanings:

- `appVersion`: the code version from [`apps/wallet-server/package.json`](../apps/wallet-server/package.json)
- `buildRef`: the source ref used when the image was built, such as `refs/heads/main` or `refs/tags/test-address-book-1`
- `gitSha`: the exact commit baked into the image
- `builtAt`: the image build timestamp in UTC
- `deployImageTag`: the deployment alias used when the container was started
- `deployImageDigest`: the deployed digest, when the runtime injects it

Only the build-time fields are baked into the image. `deployImageTag` and `deployImageDigest` are deployment metadata and should be injected by the runtime environment when you care about them, for example through `SUPERISE_DEPLOY_IMAGE_TAG` and `SUPERISE_DEPLOY_IMAGE_DIGEST`. This keeps a single digest free to carry multiple tags such as `0.3.0`, `0.3`, and `latest` without lying about which alias is "inside" the image.

## Verification Checklist

After changes, a typical validation flow is:

1. run `pnpm typecheck`
2. run `pnpm test`
3. run `pnpm version:check`
4. verify `http://127.0.0.1:18799/health`
5. verify `http://127.0.0.1:18799/build`
6. verify the Owner UI loads at `http://127.0.0.1:18799/`
7. if you changed MCP behavior, re-check the integration through MCP Inspector
8. if you changed Owner-facing behavior, re-check the relevant Owner UI or Owner API flow

## Safety Notes

- `/mcp` is unauthenticated by default, so keep development and test environments on trusted local or private networks
- transfer tools return accepted work, not final on-chain confirmation
- if you need managed secrets, mainnet presets, or custom chain deployment, use [`deployment.md`](./deployment.md)
