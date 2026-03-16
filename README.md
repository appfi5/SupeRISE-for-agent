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

## 当前能力

- `Agent` 通过 `MCP` 接入；`Owner` 通过本地管理面和本地 `HTTP API` 管理钱包与限额
- 当前支持资产为 Nervos `CKB`，以及 Ethereum `ETH`、`USDT`、`USDC`
- 提供共享地址簿，可维护联系人名称与 `Nervos` / `Ethereum` 地址映射，并支持按精确地址反查联系人
- 四个 transfer 工具都支持 `to + toType`：可直接转原始地址，也可按联系人名称解析为当前链地址
- Agent 转账按资产执行独立的日 / 周 / 月限额；Owner 转账不受该限额约束
- `wallet.operation_status` 表示 server 本地编排状态；链上状态需要分别使用 `nervos.tx_status` 与 `ethereum.tx_status`

## 使用方式

项目 README 只保留两种推荐启动方式：

### 1. 自己拉代码运行

适合本地开发、调试和二次修改代码。

```bash
git clone https://github.com/appfi5/SupeRISE-for-agent.git
cd SupeRISE-for-agent
pnpm install
cp apps/wallet-server/.env.example apps/wallet-server/.env
pnpm dev
```

如果需要生产式本地启动：

```bash
pnpm build
pnpm --filter @superise/wallet-server start
```

### 2. 直接使用已发布 Docker 镜像

适合零应用配置快速启动。官方镜像名为 `superise/agent-wallet`。

先检查并创建运行时 volume，再拉最新镜像并启动：

```bash
docker volume inspect superise-agent-wallet-data >/dev/null 2>&1 || docker volume create superise-agent-wallet-data
docker pull superise/agent-wallet:latest
docker run -d \
  --name superise-agent-wallet \
  --restart unless-stopped \
  -p 18799:18799 \
  -v superise-agent-wallet-data:/app/runtime-data \
  superise/agent-wallet:latest
```

说明：

- `superise-agent-wallet-data` 是 quickstart 必需的持久化卷
- 未显式挂载 `-v superise-agent-wallet-data:/app/runtime-data` 时，官方镜像会直接启动失败
- 首次 quickstart 启动会在日志中打印一次初始 Owner 密码，首次登录后应立即修改

启动后可访问：

- 服务地址：`http://127.0.0.1:18799/`
- MCP 端点：`http://127.0.0.1:18799/mcp`
- 健康检查：`http://127.0.0.1:18799/health`

默认 Docker 配置只绑定到本机 `127.0.0.1`。`/mcp` 无鉴权，禁止直接暴露到公网或不受信任网络。

### 受控部署补充

如果你是从源码仓库做本地受控部署，仍然可以使用仓库内的 managed 脚本：

```bash
pnpm docker:up
pnpm docker:rotate-kek
```

## 镜像发布

GitHub tag 会自动触发 Docker Hub 镜像构建与推送，仓库当前镜像名为 `superise/agent-wallet`。

- Git tag `v0.2.0` -> Docker tag `0.2.0`
- Git tag `v0.2.0-rc.1` -> Docker tag `0.2.0-rc.1`
- Git tag `test-address-book-1` -> Docker tag `test-address-book-1`
- 发布镜像为多架构 manifest，当前覆盖 `linux/amd64` 与 `linux/arm64`

`latest` 只会在以下条件同时满足时更新：

- Git tag 形如稳定版 `vX.Y.Z`
- 该 tag 指向的提交来自 `main`

## 配置

链配置按 `CKB` 与 `EVM` 独立装配，可自由组合 preset 与 custom。

- `DEPLOYMENT_PROFILE=quickstart|managed`
- `RUNTIME_SECRET_DIR`
- `CKB_CHAIN_MODE=preset|custom`
- `CKB_CHAIN_PRESET=testnet|mainnet`
- `CKB_CHAIN_CONFIG_PATH`
- `EVM_CHAIN_MODE=preset|custom`
- `EVM_CHAIN_PRESET=testnet|mainnet`
- `EVM_CHAIN_CONFIG_PATH`

规则：

- `quickstart` 默认用于零应用配置启动，只允许两条链都落在内置 `testnet` preset
- `managed` 用于受控部署，要求外部提供 `KEK` 与 `OWNER_JWT_SECRET`
- `preset` 使用内置 `testnet/mainnet` 配置
- `custom` 通过各自的 JSON 文件加载完整链配置
- `CKB custom` 需要 `rpcUrl`、`indexerUrl`、`genesisHash`、`addressPrefix`、`scripts`
- `EVM custom` 需要 `rpcUrl`、`chainId`、`networkName?`、`tokens.erc20.usdt`、`tokens.erc20.usdc`
- `TRANSFER_SETTLEMENT_INTERVAL_MS` 控制后台转账结算轮询间隔
- `TRANSFER_RESERVED_TIMEOUT_MS` 控制 `RESERVED` 状态等待广播的最长时间
- `TRANSFER_SUBMITTED_TIMEOUT_MS` 控制 `SUBMITTED` 状态等待链上确认的最长时间

- 本地开发配置见 `apps/wallet-server/.env.example`
- 本地 custom 示例见 `apps/wallet-server/config/*.custom.example.json`
- Docker 部署配置见 `deploy/docker/.env.example`
- Docker custom 示例见 `deploy/docker/chain-config/*.custom.example.json`

只有当 `ENABLE_API_DOCS=true` 时，`/docs` 和 `/docs-json` 才会启用；默认部署配置会关闭它们。
`pnpm docker:up` 在首次生成 `deploy/docker/.env` 时会自动写入本地管理面所需的高熵 JWT 签名密钥。
