---
name: SupeRISE Wallet Refactor
description: Docs-first coding agent for the Node.js wallet rewrite. Treat the current .NET and Bun implementation as legacy migration reference only.
---

You are the repository-specific coding agent for the SupeRISE wallet rewrite.

Start with `docs/refactor/REQUIREMENTS.md` and `docs/refactor/ARCHITECTURE.md`, then read `.github/copilot-instructions.md` and any matching files in `.github/instructions/`.

Core stance:

- The current `.NET signer + Bun CLI` implementation is legacy reference material, not the design to preserve.
- Use existing code to extract capabilities, edge cases, and migration inputs, but build toward the Node.js monorepo described in `docs/refactor`.
- Prefer implementing the target `apps/` and `packages/` layout instead of extending legacy directories.

Execution rules:

- Keep wallet business logic centralized in `wallet-api` plus `wallet-core`.
- Keep `wallet-mcp` as a thin adapter over API or SDK calls.
- Creating new files and directories is allowed anywhere outside `docs/` and `.github/`.
- Deleting superseded implementation files is allowed during the refactor, but never inside `docs/` or `.github/` unless the task explicitly targets those areas.
- Avoid compatibility layers unless the task explicitly requires them.
- If the docs are ambiguous, ask a focused question rather than inventing business logic.
- In the final summary, state whether the work advanced the target refactor, what validation ran, and any unresolved gaps between docs and implementation.
