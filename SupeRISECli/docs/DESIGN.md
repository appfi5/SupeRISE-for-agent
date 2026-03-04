# SupeRISE for Agent CLI - Design Document

## 1. Background and Target

This project provides a unified CLI tool (`rise`) for agent-facing local wallet interaction and keep-alive management.

Core capabilities:

- **Wallet operations**: CKB wallet interactions (`rise` core commands)
- **Keep-alive management**: Agent self-supervision (`rise sustain` commands) including balance monitoring, model switching, and top-up workflow

Confirmed context:

1. `superise-market` is an external LLM router/platform with pay-per-use billing.
2. OpenClaw model usage consumes superise-market account balance.
3. Payment (top-up) execution uses CKB transfers via existing CLI capabilities.
4. Core target is agent self-supervision + autonomous decision-making for keep-alive.

## 2. Requirement Summary

Primary requirements:

1. Provide keep-alive as integrated capability for existing agent workflows.
2. Keep state storage lightweight.
3. Enable self-learning feedback loop for better policy decisions.
4. Keep user-facing command complexity low.

Architecture constraints:

1. Do not add another router layer in front of superise-market.
2. Keep `rise` as main command surface.
3. `sustain` commands are integrated as `rise sustain ...`.
4. Use Bun + TypeScript uniformly.
5. Private project, synchronized evolution; no backward compatibility burden.

## 3. Single Project Architecture

```text
src/
  index.ts              # main entry point
  commands/             # all commands
    config/             # configuration commands
    transfer/           # transfer commands
    address-book/       # address book commands
    sustain/            # keep-alive commands
  mcp-server/           # MCP server implementation
  core/
    sustain/            # sustain core logic
  storage/              # persistence layer
  services/             # external service clients
  utils/                # shared utilities
  types/                # type definitions
```

### Command Structure

All command domains follow the same pattern:

```text
commands/<domain>/
  index.ts              # command registration
  helps.ts              # parsing/output helpers
  actions/              # command handlers
    *.ts
```

### Core Commands

- `config`: Configuration management
- `transfer`: CKB token transfers
- `address-book`: Address management
- `sustain`: Keep-alive management
  - `health-check`: Check balance and health status
  - `forecast`: Forecast balance consumption
  - `plan`: Generate action plan
  - `act`: Execute action
  - `tick`: Run supervision cycle
  - `score`: Show latest decision feedback score
  - `mcp-server`: Start MCP server
  - `list-models`: List available models with pricing
  - `top-up`: Top up account balance with CKB
  - `setup`: Setup sustain system
  - `config`: Manage sustain configuration

## 4. MCP Server

MCP server lifecycle management:

- MCP server is managed by OpenClaw (not by CLI)
- skill metadata (`SKILL.md`) declares MCP server requirement
- OpenClaw is responsible for starting/stopping MCP server before invoking skill tools
- `rise sustain mcp` command provides manual control for development/debugging

Process management:

1. `mcp` runs as foreground process by design.
2. daemonization/restart is externalized to PM2 (production) or OpenClaw (development).
3. recommended runtime pattern:
   - production: PM2 handles startup/restart/autostart
   - development: OpenClaw manages MCP server lifecycle based on skill metadata
   - skill metadata declares MCP server dependency in `SKILL.md`

## 5. Storage Strategy

Sustain data storage follows CLI configuration pattern:

- storage location: `~/.rise` (hardcoded, defined as `RISE_HOME` in `src/utils/constants.ts`)
- sustain-specific data: `~/.rise/sustain/`
  - `~/.rise/sustain/state.db` (SQLite for persistent state)
  - `~/.rise/sustain/logs/` (optional structured logs)
- configuration access: use `src/utils/config.ts` helpers
- directory creation: automatic on first write

Directory structure:

```text
~/.rise/
  config.json
  sustain/
    state.db
    logs/
```

Storage responsibilities:

- `src/storage/` implements data access layer
- schema migrations handled via simple version tracking in SQLite
- concurrent access: SQLite WAL mode for multi-process safety

## 6. Build and Development

Build commands:

```bash
bun run dev              # development mode (direct run)
bun run build            # build to bin/rise.js
bun run build:bin        # compile to standalone binary
bun run test-server      # start local test server for development
```

Project structure:

- Single `package.json` with all dependencies
- Single `tsconfig.json` for TypeScript configuration
- No monorepo complexity
- Direct imports using relative paths

## 7. Implementation Roadmap

1. Implement real sustain core (`forecast/plan/act/tick`) in `src/core/sustain`.
2. Implement lightweight persistence in `src/storage` (SQLite preferred).
3. Wire MCP tools to real adapters and persistence.
4. Add self-learning loop (contextual bandit style) for policy tuning.
5. Add PM2 runbook + skill operational instructions.
