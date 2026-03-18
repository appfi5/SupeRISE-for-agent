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
- release automation config: [`.github/release-please-config.json`](../.github/release-please-config.json)
- release workflow: [`.github/workflows/release.yml`](../.github/workflows/release.yml)
- direct tag image workflow: [`.github/workflows/tag-image.yml`](../.github/workflows/tag-image.yml)

## Release Automation

The repository now uses a two-stage Docker release flow:

1. every push to `main` runs validation, builds a multi-arch candidate image, and pushes it as `superise/agent-wallet:sha-<commit>`
2. the same `main` push updates or creates the Release PR through `release-please`
3. when that Release PR is merged, the next `main` run creates the GitHub release and promotes the already-built candidate digest to the semver Docker tags

Non-formal tag publishing is separate from that flow. Pushing a non-stable Git tag builds and pushes an image immediately:

- `v1.2.3-rc.1` becomes Docker tag `1.2.3-rc.1`
- `test-address-book-1` becomes Docker tag `test-address-book-1`
- stable tags like `v1.2.3` are ignored by the tag workflow because they are owned by the formal release workflow

The formal Docker tags follow these rules:

- every release gets `superise/agent-wallet:<version>`
- stable releases also get `superise/agent-wallet:<major>.<minor>` and `superise/agent-wallet:latest`
- prereleases such as `1.2.3-rc.1` do not move `latest`

Versioning is lockstep across the whole repository. The root [`package.json`](../package.json) stays the source of truth, `release-please` updates every workspace `package.json` through `extra-files`, and the wallet server reads its version from [`apps/wallet-server/package.json`](../apps/wallet-server/package.json) at runtime instead of duplicating hard-coded strings.

For normal releases, let `release-please` infer the bump from Conventional Commits. If you need an explicit next version, manually run the `Release` workflow and provide the optional `release_as` input.

If you want CI workflows to run automatically on the Release PR itself, add a repository secret named `RELEASE_PLEASE_TOKEN` that contains a PAT or GitHub App token with permission to open pull requests. The workflow falls back to the default `GITHUB_TOKEN`, but GitHub does not trigger downstream workflows from PRs created by that token.

## Build Metadata

`/health` now exposes build metadata alongside the health checks. The fields have intentionally separate meanings:

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
5. verify the Owner UI loads at `http://127.0.0.1:18799/`
6. if you changed MCP behavior, re-check the integration through MCP Inspector
7. if you changed Owner-facing behavior, re-check the relevant Owner UI or Owner API flow

## Safety Notes

- `/mcp` is unauthenticated by default, so keep development and test environments on trusted local or private networks
- transfer tools return accepted work, not final on-chain confirmation
- if you need managed secrets, mainnet presets, or custom chain deployment, use [`deployment.md`](./deployment.md)
