# 部署说明

本文档面向希望在本地或受控环境中运行 SupeRISE Agent Wallet 的使用者。项目的主要集成面仍然是 `MCP`；Owner UI 与 Owner API 则是供真人操作员使用的本地操作入口。

English version: [deployment.md](./deployment.md).

## 部署档位

| 档位 | 适用场景 | Secret 模型 | 链配置范围 |
| --- | --- | --- | --- |
| `quickstart` | 你想用已发布镜像最快完成本地体验 | 运行时自动生成 secret | 两条链都固定为内置 `testnet` preset |
| `managed` | 你需要显式 secret、长期运行部署、主网 preset 或自定义链配置 | 显式提供 `KEK` 与 `OWNER_JWT_SECRET` | 支持内置 `testnet`、`mainnet` preset，也支持自定义链 JSON |

## 使用已发布镜像运行 Quickstart

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

启动后可访问：

- MCP 端点：`http://127.0.0.1:18799/mcp`
- Owner UI：`http://127.0.0.1:18799/`
- 健康检查：`http://127.0.0.1:18799/health`

说明：

- 除非你明确部署在受信任的私有网络，否则发布端口应保持绑定到 `127.0.0.1`
- `quickstart` 必须显式挂载 `superise-agent-wallet-data:/app/runtime-data`
- `quickstart` 固定使用两条链的内置 `testnet` preset
- 初始 Owner 密码只会在首次启动时输出到容器日志
- `quickstart` 不接受外部 `WALLET_KEK*` 或 `OWNER_JWT_SECRET`

## 使用仓库内置流程运行 Managed

如果你需要显式 `KEK`、显式 `OWNER_JWT_SECRET`，或更受控的运行配置，可以使用仓库内置流程。

关键文件：

- [`docker-compose.yml`](../docker-compose.yml)
- [`deploy/docker/.env.example`](../deploy/docker/.env.example)
- [`deploy/docker/chain-config`](../deploy/docker/chain-config)
- [`scripts/docker-up.sh`](../scripts/docker-up.sh)
- [`scripts/docker-rotate-kek.sh`](../scripts/docker-rotate-kek.sh)

启动命令：

```bash
pnpm install
pnpm docker:up
```

启动后可访问：

- MCP 端点：`http://127.0.0.1:${PORT:-18799}/mcp`
- Owner UI：`http://127.0.0.1:${PORT:-18799}/`
- 健康检查：`http://127.0.0.1:${PORT:-18799}/health`
- SQLite 数据库：`deploy/docker/runtime-data/wallet.sqlite`

说明：

- 仓库内置流程会使用 `DEPLOYMENT_PROFILE=managed`
- `PUBLISH_HOST` 默认值为 `127.0.0.1`
- `ENABLE_API_DOCS` 默认值为 `false`
- `/mcp` 仍然是无鉴权入口，不能直接暴露到公网或不受信任网络

## Owner 访问入口

- Owner UI 由 `/` 提供
- Owner HTTP API 位于 `/api/owner/*`
- 在 `quickstart` 下，初始 Owner 密码只会在启动日志中输出一次
- 在 `managed` 下，Owner 鉴权依赖配置好的 `OWNER_JWT_SECRET`
- Owner UI 与 Owner API 也应被视为本地操作入口，和其他运行时入口一样只暴露在受信任环境中

## 手工运行 Managed

如果你不使用 Docker Compose，至少需要提供：

- `DEPLOYMENT_PROFILE=managed`
- `OWNER_JWT_SECRET`
- `WALLET_KEK_PATH`，或者 `WALLET_KEK` 配合 `ALLOW_PLAINTEXT_KEK_ENV=true`
- 与目标网络对应的 `CKB_CHAIN_*` 和 `EVM_CHAIN_*` 配置

本地配置示例可从 [`apps/wallet-server/.env.example`](../apps/wallet-server/.env.example) 开始。

## 关键配置项

### 运行时与网络

- `HOST`
- `PORT`
- `PUBLISH_HOST`
- `ENABLE_API_DOCS`

### 数据与 Secret

- `DEPLOYMENT_PROFILE`
- `DATA_DIR`
- `RUNTIME_SECRET_DIR`
- `SQLITE_PATH`
- `OWNER_NOTICE_PATH`
- `OWNER_JWT_SECRET`
- `OWNER_JWT_TTL`
- `WALLET_KEK_PATH`
- `WALLET_KEK`
- `ALLOW_PLAINTEXT_KEK_ENV`

### 链配置与结算

- `CKB_CHAIN_MODE`
- `CKB_CHAIN_PRESET`
- `CKB_CHAIN_CONFIG_PATH`
- `EVM_CHAIN_MODE`
- `EVM_CHAIN_PRESET`
- `EVM_CHAIN_CONFIG_PATH`
- `TRANSFER_SETTLEMENT_INTERVAL_MS`
- `TRANSFER_RESERVED_TIMEOUT_MS`
- `TRANSFER_SUBMITTED_TIMEOUT_MS`

如果你需要主网或自定义链配置，应使用 `managed`。`quickstart` 只面向内置测试网体验。

## 健康检查与数据

- `GET /health` 用于查看运行时数据库可用性
- 最核心的运行时数据是 SQLite 数据库与当前激活的 `KEK`
- 如果使用了自定义链配置 JSON，应与数据库和 `KEK` 一起备份

对于仓库内置部署，重要本地路径包括：

- `deploy/docker/runtime-data`
- `deploy/docker/secrets/wallet_kek.txt`
- 使用自定义链配置时的 `deploy/docker/chain-config`

## 高级运维

轮换 Docker 管理下的 `KEK`：

```bash
pnpm docker:rotate-kek
```

停止仓库内置部署：

```bash
pnpm docker:down
```
