---
name: superise-bootstrap
description: Clone, install, start, verify, and minimally maintain a local Superise wallet deployment from the official GitHub repository. Use this when an agent only has this skill manual and must bootstrap Superise on a machine from scratch.
---

# Superise Bootstrap

Use this skill when the task is to install and start Superise on a local machine from the official repository.

Repository:

- `https://github.com/appfi5/SupeRISE-for-agent`

## Goal

Bring up a usable local Superise wallet service and verify that:

- the service is running
- `/health` responds successfully
- `/mcp` is reachable for later MCP use

## Preconditions

Check prerequisites before cloning or starting anything.

Required tools:

- `git`
- `node`
- `corepack` or `pnpm`

Preferred tools:

- `docker`
- `docker compose`

Useful checks:

```bash
git --version
node --version
corepack --version
pnpm --version
docker --version
docker compose version
```

Rules:

- If `git` or `node` is missing, stop and report the missing prerequisite.
- Prefer Docker when available.
- Do not invent OS package installation steps unless the user explicitly asks.

## Default Path

Prefer Docker unless Docker is unavailable or the user explicitly wants source-based development.

```bash
git clone https://github.com/appfi5/SupeRISE-for-agent.git
cd SupeRISE-for-agent
pnpm docker:up
```

## Source-Based Fallback

Use this only when Docker is unavailable or development mode is explicitly requested.

```bash
git clone https://github.com/appfi5/SupeRISE-for-agent.git
cd SupeRISE-for-agent
pnpm install
cp apps/wallet-server/.env.example apps/wallet-server/.env
pnpm dev
```

Production-style source start:

```bash
pnpm install
pnpm build
cp apps/wallet-server/.env.example apps/wallet-server/.env
pnpm --filter @superise/wallet-server start
```

## Success Checks

Treat bootstrap as successful only when all of these are true:

- the process or container is running
- `GET /health` succeeds
- the expected local endpoint is reachable

Useful checks:

```bash
curl http://127.0.0.1:18799/health
docker compose ps
docker compose logs --tail=100 wallet-server
```

Default local endpoints:

- `http://127.0.0.1:18799/health`
- `http://127.0.0.1:18799/mcp`

## Minimal Operations

Included local maintenance scope:

- start
- stop
- restart
- view logs
- inspect runtime files
- rotate `KEK`

Useful commands:

```bash
pnpm docker:up
pnpm docker:rotate-kek
docker compose logs --tail=100 wallet-server
docker compose restart wallet-server
```

## Failure Handling

Check these first:

- Docker daemon is not running
- port `18799` is already in use
- chain configuration paths are missing or invalid
- generated runtime files were not created
- configured RPC endpoints are unreachable

Preferred recovery order:

1. inspect logs
2. inspect generated env/config files
3. rerun the supported startup path

## Safety Rules

- `/mcp` is unauthenticated wallet access.
- Keep the service bound to localhost or a trusted private network only.
- Do not expose `/mcp` directly to the public Internet.
- Do not delete runtime data, SQLite files, secrets, or generated env files unless the user explicitly asks.
- Do not rotate `KEK` unless the task requires it.
