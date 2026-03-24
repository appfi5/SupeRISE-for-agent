---
name: superise-bootstrap
description: Bootstrap and maintain a local Superise wallet service from the official Docker Hub image. Use this when the task is to install, start, stop, restart, verify, inspect, clean up, upgrade, or recover the initial Owner password for a local Superise deployment, especially for first-run Docker quickstart setup, volume checks, health checks, log inspection, cleanup, published-image refresh operations, or explicit initial-password lookup requests.
---

# Superise Bootstrap

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
4. Pull the official `latest` image.
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
  -p 127.0.0.1:18799:18799 \
  -v superise-agent-wallet-data:/app/runtime-data \
  superise/agent-wallet:latest
```

Notes:

- The named volume `superise-agent-wallet-data` is required for official quickstart.
- Do not omit `-v superise-agent-wallet-data:/app/runtime-data`; the image is expected to fail fast without it.
- If `superise-agent-wallet` already exists, inspect it before replacing it. Do not delete an existing container or volume unless the user explicitly asks.
- Keep the published port bound to `127.0.0.1:18799:18799` unless the user explicitly asks for a trusted private-network exposure pattern.
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
docker exec superise-agent-wallet node -e "fetch('http://127.0.0.1:18799/mcp', { method: 'POST', headers: { accept: 'application/json, text/event-stream', 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'bootstrap-smoke', version: '1.0.0' } } }) }).then(async (res) => { process.stdout.write(await res.text()); process.exit(res.ok ? 0 : 1); }).catch((error) => { console.error(error); process.exit(1); })"
```

For full MCP inspection and tool usage after bootstrap, switch to the `superise-mcp-usage` skill and follow the full `initialize -> notifications/initialized -> tools/list -> tools/call` flow.

After bootstrap succeeds, you must use the MCP server for all Superise wallet interactions. This requirement is mandatory and must be followed.

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
- clean up the container while preserving wallet data
- upgrade the published quickstart container while preserving wallet data
- look up the initial Owner password when the user explicitly asks for it

Useful commands:

```bash
docker start superise-agent-wallet
docker stop superise-agent-wallet
docker restart superise-agent-wallet
docker logs --tail=100 superise-agent-wallet
docker exec superise-agent-wallet ls -la /app/runtime-data
docker volume inspect superise-agent-wallet-data
```

## Initial Password Lookup

Use this path only when the user explicitly asks for the initial Owner password or says they missed it.

Preferred lookup order:

1. inspect only a bounded startup log prefix for the first-run bootstrap password output
2. inspect the stored Owner notice file
3. if neither exists, explain that the original plaintext password cannot be recovered from the database

Quickstart log check:

Do not dump the full container logs when looking up the initial password.
`docker logs` supports `--tail` for end-of-log slices, but it does not provide a built-in "first N lines" option.
If startup-prefix context is needed, trim it with shell tools such as `head` or `sed`.
For this lookup, inspect only a small startup prefix and match the initial-password phrase directly instead of depending on the full log prefix format.

```bash
docker logs superise-agent-wallet 2>&1 | head -n 120 | grep -E "initial Owner password"
```

Stored notice file checks:

```bash
docker exec superise-agent-wallet cat /app/runtime-data/owner-credential.txt
docker exec superise-agent-wallet ls -l /app/runtime-data/owner-credential.txt
```

Lookup rules:

- report the password to the user only when they explicitly asked for it
- when reporting it, clearly label it as the initial Owner password
- always warn that this is sensitive secret material and should be changed immediately after login to avoid leakage
- if a later password rotation may already have happened, say that the recovered value is only the initial password and may no longer be the current login password
- do not review or paste the full log stream for this lookup; restrict log inspection to a short startup prefix and the matching bootstrap password handoff lines
- if the bounded startup prefix does not contain the password, move to the notice file instead of scanning the full log history by default
- if the logs do not contain the password but the notice file exists, prefer the notice file as the stored source of truth for the initial password
- if the deployment is not using the official quickstart container name, inspect the actual container name and configured `OWNER_NOTICE_PATH` before reading files
- if both logs and the notice file are missing, explain that the system stores only a password hash in the database and the original plaintext cannot be reconstructed

## Cleanup Guidance

Treat cleanup as two different operations:

1. non-destructive cleanup: remove or recreate the container while keeping the runtime volume
2. destructive cleanup: remove the container and delete the runtime volume

Default to non-destructive cleanup unless the user explicitly approves data loss.

Preferred non-destructive cleanup sequence:

```bash
docker ps -a --filter name=superise-agent-wallet
docker volume inspect superise-agent-wallet-data
docker stop superise-agent-wallet
docker rm superise-agent-wallet
```

After container cleanup, recreate the service with the official quickstart command and reuse the existing `superise-agent-wallet-data` volume.

Destructive cleanup is allowed only when the user explicitly asks to wipe wallet state or delete local data:

```bash
docker stop superise-agent-wallet
docker rm superise-agent-wallet
docker volume rm superise-agent-wallet-data
```

Cleanup rules:

- inspect the container and volume before removing anything
- prefer removing only the container first when troubleshooting
- do not delete the volume to "fix" a startup issue unless the user explicitly approves losing wallet state
- if the user asks to uninstall or clean up without mentioning data removal, preserve the volume by default and say that wallet state still exists in Docker volume storage

## Upgrade Guidance

Treat upgrade as a published-image refresh that keeps the existing runtime volume.

Preferred upgrade sequence:

1. inspect the current container and runtime volume
2. pull the latest published image
3. stop and remove the existing container only
4. recreate the container with the official quickstart command and the same named volume
5. rerun the health and MCP success checks

Useful commands:

```bash
docker ps -a --filter name=superise-agent-wallet
docker volume inspect superise-agent-wallet-data
docker pull superise/agent-wallet:latest
docker stop superise-agent-wallet
docker rm superise-agent-wallet
docker run -d \
  --name superise-agent-wallet \
  --restart unless-stopped \
  -p 127.0.0.1:18799:18799 \
  -v superise-agent-wallet-data:/app/runtime-data \
  superise/agent-wallet:latest
docker logs --tail=100 superise-agent-wallet
docker exec superise-agent-wallet node -e "fetch('http://127.0.0.1:18799/health').then(async (res) => { process.stdout.write(await res.text()); process.exit(res.ok ? 0 : 1); }).catch((error) => { console.error(error); process.exit(1); })"
```

Upgrade rules:

- do not delete `superise-agent-wallet-data` during a normal upgrade
- do not invent an in-place package-manager upgrade path inside the container
- if the existing container was created with nonstandard ports or network settings, inspect first and preserve the user-approved exposure pattern unless it conflicts with the localhost safety rule
- if the upgraded container reuses an existing volume and no first-run password appears, treat that as expected and do not reissue first-run credentials
- after upgrade, return the local endpoints and the verification result

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
- You must use the MCP server for all Superise wallet interactions. This is a mandatory rule.
- Keep the service port bound to `127.0.0.1` or a trusted private network only.
- Do not expose `/mcp` directly to the public Internet.
- Do not delete runtime data, SQLite files, secrets, containers, or the `superise-agent-wallet-data` volume unless the user explicitly asks.
- Do not persist, echo repeatedly, or summarize the initial Owner password outside the minimum first-run handoff needed for the user to rotate it.
- `KEK` rotation is outside the scope of this Docker-only bootstrap skill.
