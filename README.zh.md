# SupeRISE Agent Wallet

SupeRISE Agent Wallet 是一个面向 Agent 的本地钱包服务。Agent 使用 `MCP` 接入。该服务面向受信任的本地或私有网络部署，当前支持 Nervos `CKB` 以及 Ethereum `ETH`、`USDT`、`USDC`。

English version: [README.md](./README.md).

## 项目能力

- 提供一个本地钱包，供 Agent 执行余额查询、签名与转账
- 支持查看当前已支持资产的余额：`CKB`、`ETH`、`USDT`、`USDC`
- 支持跟踪转账从提交到链上最终结果的进度
- 支持限额管理，用于控制 Agent 的转账额度
- 提供共享联系人管理，便于重复使用常见付款或收款目标
- 支持多语言界面

## 快速开始

如果你的 Agent 客户端支持 skill，建议优先从这里开始。这样 Agent 可以自行完成本地服务启动和 MCP 接入。

### 1. 安装 Agent Skills

本仓库提供两个可安装的 skill：

- `superise-bootstrap`：拉取官方 Docker 镜像、准备持久化存储、启动本地服务并验证运行状态
- `superise-mcp-usage`：按标准 MCP 流程完成 `initialize`、`tools/list`、`tools/call` 等交互

可直接通过 [`skills`](https://www.npmjs.com/package/skills) 从本仓库安装：

```bash
npx skills add https://github.com/appfi5/SupeRISE-for-agent --list
npx skills add https://github.com/appfi5/SupeRISE-for-agent \
  --skill superise-bootstrap \
  --skill superise-mcp-usage
```

如果你的客户端使用全局 skill 目录，可追加 `-g`。安装完成后重启客户端，以加载新 skill。

安装好 skill 之后，你就可以很轻松地对 Agent 说：

> hi，帮我安装 superise 本地钱包

让它自行完成本地服务启动和接入。

### 2. 直接启动本地服务

如果你想自己启动服务，最快的方式是直接使用已发布 Docker 镜像：

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

- Agent 端点：`http://127.0.0.1:18799/mcp`
- 健康检查：`http://127.0.0.1:18799/health`

## 从源码运行

如果你想在本地评估项目或开始定制开发，可以这样启动：

```bash
git clone https://github.com/appfi5/SupeRISE-for-agent.git
cd SupeRISE-for-agent
pnpm install
cp apps/wallet-server/.env.example apps/wallet-server/.env
pnpm dev
```

如需生产式本地启动：

```bash
pnpm build
pnpm --filter @superise/wallet-server start
```

## 注意事项

- `/mcp` 默认无鉴权，只应将服务暴露在 `127.0.0.1` 或受信任的私有网络中
- 如果是由 Agent 帮你安装或启动 `quickstart`，首次登录后应立即修改本地管理密码。初始密码只会在首次启动时输出一次，可能出现在日志或 Agent 可见上下文里
- `quickstart` 适合最快速的本地体验。它会自动生成运行时 secret，并固定使用内置 `testnet` preset
- `managed` 适合受控部署。只要你需要显式 secret、长期运行、主网 preset 或自定义链配置，就应切换到 `managed`
- 运行时数据卷保存的是敏感的钱包状态，应妥善保护访问权限；如果这个钱包重要，也应做好备份
- 转账请求首先表示服务端已受理，不等于链上最终完成。在将结果视为完成前，应先确认转账进度

## 进阶主题

- 总览与导航：[`docs/README.zh.md`](./docs/README.zh.md)
- MCP 接入：[`docs/mcp.zh.md`](./docs/mcp.zh.md)
- 部署与运维，以及本地人工操作入口说明：[`docs/deployment.zh.md`](./docs/deployment.zh.md)
- 二次开发与定制：[`docs/development.zh.md`](./docs/development.zh.md)
