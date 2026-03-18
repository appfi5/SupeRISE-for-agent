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

## Skills

这个仓库自带两个可安装的 skills：

- `superise-bootstrap`：从 Docker Hub 拉取官方镜像、检查 volume、启动并验证本地服务
- `superise-mcp-usage`：按标准 MCP 协议完成 `initialize`、`tools/list`、`tools/call` 等交互

可以直接使用 [`skills`](https://www.npmjs.com/package/skills) 从本仓库安装：

```bash
npx skills add https://github.com/appfi5/SupeRISE-for-agent --list
npx skills add https://github.com/appfi5/SupeRISE-for-agent \
  --skill superise-bootstrap \
  --skill superise-mcp-usage
```

如果需要安装到全局 skill 目录，可追加 `-g`。安装后重启你的客户端以加载新 skill。

## 当前能力

- `Agent` 通过 `MCP` 接入；`Owner` 通过本地管理面和本地 `HTTP API` 管理钱包与限额
- Owner 本地管理面支持 `en` / `zh` 双语；默认语言为 `en`，登录页和登录后顶部都可切换
- 当前支持资产为 Nervos `CKB`，以及 Ethereum `ETH`、`USDT`、`USDC`
- 提供共享地址簿，可维护联系人名称与 `Nervos` / `Ethereum` 地址映射，并支持按精确地址反查联系人
- 四个 transfer 工具都支持 `to + toType`：可直接转原始地址，也可按联系人名称解析为当前链地址
- Agent 转账按资产执行独立的日 / 周 / 月限额；Owner 转账不受该限额约束
- `wallet.operation_status` 表示 server 本地编排状态；链上状态需要分别使用 `nervos.tx_status` 与 `ethereum.tx_status`

## 使用方式

项目 README 只保留两种推荐启动方式，并优先推荐直接使用已发布 Docker 镜像。

### 1. 直接使用已发布 Docker 镜像

适合零应用配置快速启动。官方镜像名为 `superise/agent-wallet`。

镜像有两个运行档位：

- `quickstart`：默认档位；适合快速本地启动；自动生成 runtime secret；固定使用内置 `testnet` preset；必须显式挂载 `superise-agent-wallet-data:/app/runtime-data`
- `managed`：受控部署档位；必须显式设置 `DEPLOYMENT_PROFILE=managed`；必须提供外部 `KEK` 与 `OWNER_JWT_SECRET`；适合受控环境、主网或自定义链配置

#### `quickstart`

先检查并创建运行时 volume，再拉镜像并启动。默认使用 `superise/agent-wallet:latest`；如果 `latest` 尚未发布，则改用 Docker Hub 上最新上传的具体 tag，并在 `pull` 与 `run` 中保持同一个 tag：

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

说明：

- `superise-agent-wallet-data` 是 quickstart 必需的持久化卷
- 未显式挂载 `-v superise-agent-wallet-data:/app/runtime-data` 时，官方镜像会直接启动失败
- 如果 `docker pull superise/agent-wallet:latest` 返回 tag 不存在，就改用 Docker Hub 上最新上传的具体 tag，例如 `superise/agent-wallet:0.2.0-rc.1`
- 首次 quickstart 启动会在日志中打印一次初始 Owner 密码，首次登录后应立即修改

#### `managed`

如果你希望继续使用同一镜像，但以受控方式运行，则需要显式切换到 `managed` 并提供外部 secret。一个最小示例如下：

```bash
mkdir -p ./runtime-data ./secrets
openssl rand -hex 32 > ./secrets/wallet.kek

docker pull superise/agent-wallet:latest
docker run -d \
  --name superise-agent-wallet-managed \
  --restart unless-stopped \
  -p 127.0.0.1:18799:18799 \
  -e DEPLOYMENT_PROFILE=managed \
  -e OWNER_JWT_SECRET='replace-with-a-high-entropy-secret' \
  -e WALLET_KEK_PATH=/run/secrets/wallet_kek \
  -v "$PWD/runtime-data:/app/runtime-data" \
  -v "$PWD/secrets/wallet.kek:/run/secrets/wallet_kek:ro" \
  superise/agent-wallet:latest
```

说明：

- `managed` 不会自动回退到 `quickstart`
- 缺失 `OWNER_JWT_SECRET` 或 `WALLET_KEK_PATH` / `WALLET_KEK` 时会直接启动失败
- 建议继续把端口显式绑定在 `127.0.0.1`；只有在受控内网场景下才自行调整发布地址
- 如果需要主网或自定义链配置，再继续补充 `CKB_*` / `EVM_*` 环境变量和链配置挂载
- 对于源码仓库内的一键受控部署，仍推荐使用 `pnpm docker:up`

启动后可访问：

- 服务地址：`http://127.0.0.1:18799/`
- MCP 端点：`http://127.0.0.1:18799/mcp`
- 健康检查：`http://127.0.0.1:18799/health`

Owner 本地管理面说明：

- 默认语言是 `en`
- 用户切换到 `zh` 后会保存在浏览器本地；刷新、重新登录后继续沿用上次选择
- 登录页右上角和登录后顶部 Header 都提供语言切换入口

默认 Docker 配置只绑定到本机 `127.0.0.1`。`/mcp` 无鉴权，禁止直接暴露到公网或不受信任网络。

### 2. 自己拉代码运行

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
