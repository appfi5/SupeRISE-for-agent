# SupeRISE refactor instructions

Source of truth, in order:

1. `docs/refactor/REQUIREMENTS.md`
2. `docs/refactor/ARCHITECTURE.md`
3. Explicit user instructions in the current task
4. Existing code and legacy docs as migration reference only

Repository state:

- The current `.NET signer + Bun CLI` implementation is legacy baseline material, not the target architecture.
- `SupeRISECli`, `SupeRISELocalServer`, the current root `README.md`, and `doc/` should be treated as capability inventory and migration input.
- If legacy code conflicts with `docs/refactor`, follow `docs/refactor`.

Target architecture:

- Runtime: `Node.js LTS`
- Workspace model: `pnpm workspaces`
- Primary apps: `apps/wallet-api`, `apps/wallet-mcp`, `apps/rise-cli`, `apps/rise-web`
- Primary packages: `packages/wallet-core`, `packages/chain-ckb`, `packages/chain-eth`, `packages/storage-sqlite`, `packages/sustain`, `packages/contracts`, `packages/sdk`

Architecture rules:

- `wallet-api` is the single owner of wallet business logic and HTTP entrypoints.
- `wallet-mcp` is a thin adapter layer and must not implement wallet rules or access the database directly.
- `wallet-core` contains the shared wallet use cases and domain logic.
- Chain-specific behavior belongs in adapters such as `chain-ckb` and `chain-eth`.
- `sustain` is being moved into its own package; during that migration, preserve behavior and avoid opportunistic business rewrites.

Implementation rules:

- Prefer creating or extending the target `apps/` and `packages/` structure over deepening the legacy layout.
- Creating new files and directories is allowed anywhere outside the protected `docs/` and `.github/` areas.
- Deleting or replacing obsolete implementation files is allowed during the refactor, as long as the deletions stay outside `docs/` and `.github/`.
- Treat `docs/` and `.github/` as protected areas: do not delete files there, and do not modify them unless the task explicitly targets documentation or agent configuration.
- Do not preserve the old `.NET` API, old CLI command names, old storage schema, or old deployment shape unless the task explicitly asks for compatibility.
- Do not duplicate wallet logic across API, MCP, CLI, or scripts.
- Keep behavior explicit. Avoid hidden side effects, silent failures, and speculative abstractions.
- If the refactor documents are ambiguous or incomplete, ask a focused question instead of inventing business logic.
- If a change intentionally diverges from `docs/refactor`, call it out explicitly in the pull request summary.

Validation guidance:

- Prefer workspace-level validation once the monorepo exists: `pnpm install`, `pnpm test`, and `pnpm build`.
- Run only the commands that are valid for the files and packages that already exist.
- If the workspace bootstrap has not landed yet, explain what could not be validated.
