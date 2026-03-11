# SupeRISE Agent Wallet

SupeRISE Agent Wallet 是一个面向 Agent 的单钱包信用钱包服务。正式的 Agent 接入面是 `MCP`。

英文版见 [README.en.md](./README.en.md)。

## 运行时

- `Node.js 24 LTS`
- `pnpm workspace`
- `NestJS 11` wallet server
- `SQLite + Kysely + better-sqlite3`
- `MCP` for Agent access

## 文档入口

- 使用文档（中文默认）：[`docs/README.md`](./docs/README.md)
- 使用文档（English）：[`docs/en/README.md`](./docs/en/README.md)
- MCP 接入说明（中文）：[`docs/mcp.md`](./docs/mcp.md)
- 部署说明（中文）：[`docs/deployment.md`](./docs/deployment.md)

## 常用命令

```bash
pnpm install
pnpm build
cp apps/wallet-server/.env.example apps/wallet-server/.env
pnpm dev
pnpm --filter @superise/wallet-server start
```

## Docker

支持一键本地部署：

```bash
pnpm docker:up
```

启动脚本会在首次运行时：

- 从 `deploy/docker/.env.example` 生成 `deploy/docker/.env`
- 生成 `deploy/docker/secrets/wallet_kek.txt`
- 将运行时数据持久化到 `deploy/docker/runtime-data`
- 构建并启动 `wallet-server` 容器

启动后可访问：

- 服务地址：`http://127.0.0.1:18799/`
- MCP 端点：`http://127.0.0.1:18799/mcp`
- 健康检查：`http://127.0.0.1:18799/health`

默认 Docker 配置只绑定到本机 `127.0.0.1`。`/mcp` 无鉴权，禁止直接暴露到公网或不受信任网络。

Docker 部署下也提供一键 `KEK` 轮换：

```bash
pnpm docker:rotate-kek
```

该命令会停止服务、用新的 `KEK` 重包当前 `DEK`、备份旧密钥来源，然后重新启动服务。

## 配置

链配置按 `CKB` 与 `EVM` 独立装配，可自由组合 preset 与 custom。

- `CKB_CHAIN_MODE=preset|custom`
- `CKB_CHAIN_PRESET=testnet|mainnet`
- `CKB_CHAIN_CONFIG_PATH`
- `EVM_CHAIN_MODE=preset|custom`
- `EVM_CHAIN_PRESET=testnet|mainnet`
- `EVM_CHAIN_CONFIG_PATH`

规则：

- `preset` 使用内置 `testnet/mainnet` 配置
- `custom` 通过各自的 JSON 文件加载完整链配置
- `CKB custom` 需要 `rpcUrl`、`indexerUrl`、`genesisHash`、`addressPrefix`、`scripts`
- `EVM custom` 需要 `rpcUrl`、`chainId`、`networkName?`、`tokens.erc20.usdt`

- 本地开发配置见 `apps/wallet-server/.env.example`
- 本地 custom 示例见 `apps/wallet-server/config/*.custom.example.json`
- Docker 部署配置见 `deploy/docker/.env.example`
- Docker custom 示例见 `deploy/docker/chain-config/*.custom.example.json`

只有当 `ENABLE_API_DOCS=true` 时，`/docs` 和 `/docs-json` 才会启用；默认部署配置会关闭它们。
`pnpm docker:up` 在首次生成 `deploy/docker/.env` 时会自动写入本地管理面所需的高熵 JWT 签名密钥。
