---
name: superise-bootstrap
description: Pull, start, verify, and minimally maintain a local Superise wallet deployment from the official Docker Hub image. Use this when an agent only has this skill manual and must bootstrap Superise on a machine from scratch.
---

# Superise Bootstrap

Use this skill when the task is to install and start Superise on a local machine from the official Docker Hub image.

Official image:

- `superise/agent-wallet:latest`

## Goal

Bring up a usable local Superise wallet service and verify that:

- the service is running
- `/health` responds successfully
- `/mcp` is reachable for later MCP use

## Preconditions

Check prerequisites before cloning or starting anything.

Required tools:

- `docker`

Preferred tools:

- `curl`
- `git`
- `node`
- `corepack` or `pnpm`

Useful checks:

```bash
docker --version
docker info
curl --version
git --version
node --version
corepack --version
pnpm --version
```

Rules:

- If `docker` is missing, stop and report the missing prerequisite unless the user explicitly wants source bootstrap.
- Prefer the official Docker Hub image over cloning the repository.
- Do not invent OS package installation steps unless the user explicitly asks.

## Default Path

Prefer the official Docker Hub quickstart unless Docker is unavailable or the user explicitly wants source-based development.

Preflight:

1. Confirm the Docker daemon is healthy.
2. Check whether the runtime volume already exists.
3. Create the volume if it does not exist.
4. Pull the latest official image.
5. Start the container with the official quickstart command.

Useful commands:

```bash
docker info
docker volume inspect superise-agent-wallet-data >/dev/null 2>&1 || docker volume create superise-agent-wallet-data
docker pull superise/agent-wallet:latest
docker run -d \
  --name superise-agent-wallet \
  --restart unless-stopped \
  -p 18799:18799 \
  -v superise-agent-wallet-data:/app/runtime-data \
  superise/agent-wallet:latest
```

Notes:

- The named volume `superise-agent-wallet-data` is required for official quickstart.
- Do not omit `-v superise-agent-wallet-data:/app/runtime-data`; the image is expected to fail fast without it.
- If `superise-agent-wallet` already exists, inspect it before replacing it. Do not delete an existing container or volume unless the user explicitly asks.

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
curl -I http://127.0.0.1:18799/mcp
docker ps --filter name=superise-agent-wallet
docker logs --tail=100 superise-agent-wallet
docker volume inspect superise-agent-wallet-data
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
- inspect runtime files and volume state
- rotate `KEK`

Useful commands:

```bash
docker start superise-agent-wallet
docker stop superise-agent-wallet
docker restart superise-agent-wallet
docker logs --tail=100 superise-agent-wallet
docker exec superise-agent-wallet ls -la /app/runtime-data
docker volume inspect superise-agent-wallet-data
```

If repository-based managed deployment is explicitly required, then and only then use:

```bash
git clone https://github.com/appfi5/SupeRISE-for-agent.git
cd SupeRISE-for-agent
pnpm docker:up
pnpm docker:rotate-kek
docker compose logs --tail=100 wallet-server
docker compose restart wallet-server
```

## Failure Handling

Check these first:

- Docker daemon is not running
- port `18799` is already in use
- the named volume `superise-agent-wallet-data` is missing or mounted to the wrong container
- the container is using an old image tag
- quickstart runtime files are incomplete because the volume was partially damaged
- configured RPC endpoints are unreachable after startup

Preferred recovery order:

1. inspect logs
2. inspect the container and volume state
3. confirm the image tag and runtime command
4. rerun the supported startup path without deleting the existing volume unless the user explicitly approves data loss

## Safety Rules

- `/mcp` is unauthenticated wallet access.
- Keep the service bound to localhost or a trusted private network only.
- Do not expose `/mcp` directly to the public Internet.
- Do not delete runtime data, SQLite files, secrets, containers, or the `superise-agent-wallet-data` volume unless the user explicitly asks.
- Do not rotate `KEK` unless the task requires it.
