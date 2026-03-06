---
applyTo: "docs/refactor/**,package.json,pnpm-workspace.yaml,pnpm-lock.yaml,apps/**,packages/**,Dockerfile*,docker-compose*.yml,docker-compose*.yaml,compose*.yml,compose*.yaml"
---

# Refactor target instructions

- `docs/refactor/REQUIREMENTS.md` and `docs/refactor/ARCHITECTURE.md` are the design baseline.
- Build toward a `Node.js LTS` + `pnpm workspaces` monorepo.
- `wallet-api` owns wallet business logic and HTTP entrypoints.
- `wallet-mcp` is a thin adapter over API or SDK calls and must not access persistence directly.
- `wallet-core` contains shared wallet use cases and domain logic.
- Chain-specific behavior belongs in adapters such as `chain-ckb` and `chain-eth`.
- `sustain` is migrated into its own package first; preserve current behavior during structural migration.
- New files and directories for the target architecture are expected; prefer creating clean target modules over forcing changes into legacy paths.
- When a target module fully replaces a legacy implementation, remove the old implementation outside `docs/` and `.github/` instead of leaving dead code behind.
- Do not introduce compatibility layers with the legacy `.NET` API or old CLI surface unless the task explicitly requires them.
- Validation when relevant: `pnpm install`, then targeted `pnpm test` and `pnpm build` commands for the packages or apps that already exist.
