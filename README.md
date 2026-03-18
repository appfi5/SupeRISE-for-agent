# SupeRISE Agent Wallet

SupeRISE Agent Wallet is a local wallet service for agents. Agents use `MCP` to connect to it. It is intended for trusted local or private-network deployment and currently supports Nervos `CKB` plus Ethereum `ETH`, `USDT`, and `USDC`.

中文版本见 [README.zh.md](./README.zh.md)。

## What It Provides

- A local wallet for agent-driven balance checks, signing, and transfers
- Balance visibility across the currently supported assets: `CKB`, `ETH`, `USDT`, and `USDC`
- Transfer progress tracking from submission through final chain outcome
- Spending limit management to keep agent-driven transfers within defined limits
- Shared contact management for recurring payment or payout targets
- Built-in multilingual interface support

## Quick Start

If your agent client supports skills, start there first. This lets the agent bootstrap the local service and connect through MCP by itself.

### 1. Install The Agent Skills

This repository provides two installable skills:

- `superise-bootstrap`: pull the official Docker image, prepare persistent storage, start the local service, and verify runtime status
- `superise-mcp-usage`: connect through MCP with the standard `initialize`, `tools/list`, and `tools/call` flow

Install them directly from this repository with [`skills`](https://www.npmjs.com/package/skills):

```bash
npx skills add https://github.com/appfi5/SupeRISE-for-agent --list
npx skills add https://github.com/appfi5/SupeRISE-for-agent \
  --skill superise-bootstrap \
  --skill superise-mcp-usage
```

If your client uses a global skill directory, add `-g`. Restart the client after installation so the new skills are loaded.

After the skills are installed, you can prompt your agent client with something lightweight like:

> Hi, help me install the local SupeRISE wallet.

### 2. Start The Local Service Directly

If you want to run the service yourself, the fastest way is the published Docker image:

```bash
docker volume inspect superise-agent-wallet-data >/dev/null 2>&1 || docker volume create superise-agent-wallet-data
docker pull superise/agent-wallet:latest
docker run -d \
  --name superise-agent-wallet \
  --restart unless-stopped \
  -p 127.0.0.1:18799:18799 \
  -v superise-agent-wallet-data:/app/runtime-data \
  superise/agent-wallet:latest
```

After startup:

- Agent endpoint: `http://127.0.0.1:18799/mcp`
- Health check: `http://127.0.0.1:18799/health`

## Run From Source

Use this when you want to evaluate the project locally or start customizing it:

```bash
git clone https://github.com/appfi5/SupeRISE-for-agent.git
cd SupeRISE-for-agent
pnpm install
cp apps/wallet-server/.env.example apps/wallet-server/.env
pnpm dev
```

For a production-style local start:

```bash
pnpm build
pnpm --filter @superise/wallet-server start
```

## Important Notes

- `/mcp` is unauthenticated by default, so keep the service on `127.0.0.1` or another trusted private network only
- If an agent installs or starts `quickstart` for you, change the local operator password immediately after the first login. The initial password is printed once during first boot and may appear in logs or agent-visible context
- `quickstart` is for the fastest local trial. It generates runtime secrets automatically and stays on the built-in `testnet` presets
- `managed` is for controlled deployments. Use it when you need explicit secrets, long-running operation, mainnet presets, or custom chain configuration
- Treat the runtime data volume as sensitive wallet state. Protect access to it and keep backups if the wallet matters to you
- A submitted transfer is accepted work, not final chain settlement. Check transfer progress before treating the result as complete

## Advanced Topics

- Overview and navigation: [`docs/README.md`](./docs/README.md)
- MCP integration: [`docs/mcp.md`](./docs/mcp.md)
- Deployment and operations, including the local operator surface: [`docs/deployment.md`](./docs/deployment.md)
- Release and image publishing workflow: [`docs/release.md`](./docs/release.md)
- Secondary development and customization: [`docs/development.md`](./docs/development.md)
