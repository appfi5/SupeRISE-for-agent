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

Check prerequisites before starting anything.

Required tools:

- `docker`

Useful checks:

```bash
docker --version
docker info
```

Rules:

- If `docker` is missing, stop and report the missing prerequisite.
- Do not invent OS package installation steps unless the user explicitly asks.

## Default Path

Always use the official Docker Hub quickstart path for this skill.

Preflight:

1. Confirm the Docker daemon is healthy.
2. Check whether the runtime volume already exists.
3. Create the volume if it does not exist.
4. Pull the latest official image.
5. Check whether `superise-agent-wallet` already exists.
6. Start the container with the official quickstart command.

Useful commands:

```bash
docker info
docker volume inspect superise-agent-wallet-data >/dev/null 2>&1 || docker volume create superise-agent-wallet-data
docker pull superise/agent-wallet:latest
docker container inspect superise-agent-wallet >/dev/null 2>&1
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
- On the first quickstart boot, inspect the container logs for the one-time initial Owner password prompt and tell the user to rotate that password immediately after the first login.
- Do not keep repeating or reprint the initial Owner password after the bootstrap handoff unless the user explicitly asks for it again.

## Success Checks

Treat bootstrap as successful only when all of these are true:

- the process or container is running
- `GET /health` succeeds
- the expected local endpoint is reachable

Useful checks:

```bash
docker ps --filter name=superise-agent-wallet
docker port superise-agent-wallet 18799
docker logs --tail=100 superise-agent-wallet
docker volume inspect superise-agent-wallet-data
docker exec superise-agent-wallet node -e "fetch('http://127.0.0.1:18799/health').then(async (res) => { process.stdout.write(await res.text()); process.exit(res.ok ? 0 : 1); }).catch((error) => { console.error(error); process.exit(1); })"
docker exec superise-agent-wallet node -e "fetch('http://127.0.0.1:18799/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }) }).then(async (res) => { console.log(res.status); process.exit(res.status < 500 ? 0 : 1); }).catch((error) => { console.error(error); process.exit(1); })"
```

Default local endpoints:

- `http://127.0.0.1:18799/health`
- `http://127.0.0.1:18799/mcp`

Post-bootstrap rule:

- If the logs show the one-time quickstart Owner password, remind the user to log in and change it immediately.
- If the container is reusing an existing volume and no initial-password log appears, treat that as a recovery boot and do not give the first-run password reminder again.

## Minimal Operations

Included local maintenance scope:

- start
- stop
- restart
- view logs
- inspect runtime files and volume state

Useful commands:

```bash
docker start superise-agent-wallet
docker stop superise-agent-wallet
docker restart superise-agent-wallet
docker logs --tail=100 superise-agent-wallet
docker exec superise-agent-wallet ls -la /app/runtime-data
docker volume inspect superise-agent-wallet-data
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
- Do not persist, echo repeatedly, or summarize the initial Owner password outside the minimum first-run handoff needed for the user to rotate it.
- `KEK` rotation is outside the scope of this Docker-only bootstrap skill.
