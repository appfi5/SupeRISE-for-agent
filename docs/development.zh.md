# 开发说明

本文档面向希望定制 SupeRISE Agent Wallet，或把该仓库作为二次开发起点的开发者。项目整体仍然是 Agent 优先：`MCP` 是主要契约，Owner UI 与 Owner API 是次级的本地真人操作入口。

English version: [development.md](./development.md).

## 本地开发环境

要求：

- `Node.js 24+`
- `pnpm`
- 如果你要使用仓库内置部署流程，还需要 Docker

安装依赖并启动本地开发环境：

```bash
pnpm install
cp apps/wallet-server/.env.example apps/wallet-server/.env
pnpm dev
```

如需生产式本地启动：

```bash
pnpm build
pnpm --filter @superise/wallet-server start
```

## 常用命令

- `pnpm dev`：以 watch 模式启动 Owner UI 与 wallet server
- `pnpm build`：构建 workspace 包、Owner UI 与 wallet server
- `pnpm test`：先构建，再运行全部 `*.test.cjs`
- `pnpm typecheck`：对整个 workspace 进行 TypeScript 类型检查
- `pnpm docker:up`：启动仓库内置 Docker 部署
- `pnpm docker:down`：停止仓库内置 Docker 部署

## 仓库结构

- `apps/wallet-server`：暴露 `/mcp`、`/api/owner/*`、`/health` 以及可选 Swagger 的 NestJS 服务
- `apps/owner-ui`：由 `wallet-server` 提供静态服务的 React/Vite Owner UI
- `packages/app-contracts`：共享 MCP 与 HTTP 请求/响应 schema
- `packages/application`：应用层服务与用例编排
- `packages/domain`：领域实体、工厂与领域错误
- `packages/infrastructure`：SQLite、vault、配置与运行时集成
- `packages/adapters-ckb` 与 `packages/adapters-evm`：链级适配器

## Agent 与 Owner 的边界

- 扩展项目时，应继续把 `MCP` 视为主要集成契约
- Owner UI 与 Owner API 应被视为建立在同一钱包之上的本地真人操作入口
- 如果改动影响了转账、地址解析或状态跟踪，应同时验证 MCP 路径以及受影响的 Owner 流程

## 常见修改入口

- 运行时与本地 env 示例：[`apps/wallet-server/.env.example`](../apps/wallet-server/.env.example)
- 自定义链配置示例：[`apps/wallet-server/config`](../apps/wallet-server/config)
- Docker 部署 env 示例：[`deploy/docker/.env.example`](../deploy/docker/.env.example)
- 共享 MCP 与 Owner API schema：[`packages/app-contracts`](../packages/app-contracts)
- Owner UI 代码：[`apps/owner-ui`](../apps/owner-ui)
- wallet server 代码：[`apps/wallet-server`](../apps/wallet-server)

## 验证建议

完成修改后，常见验证流程如下：

1. 运行 `pnpm typecheck`
2. 运行 `pnpm test`
3. 验证 `http://127.0.0.1:18799/health`
4. 验证 `http://127.0.0.1:18799/` 的 Owner UI 能正常加载
5. 如果改动影响 MCP 行为，再通过 MCP Inspector 重新验证接入
6. 如果改动影响 Owner 侧行为，再重新验证对应的 Owner UI 或 Owner API 流程

## 安全提示

- `/mcp` 默认无鉴权，因此开发和测试环境也应放在受信任的本地或私有网络中
- transfer 工具返回的是服务端已接受任务的结果，不表示链上最终确认
- 如果你需要 managed secret、主网 preset 或 custom chain deployment，请查看 [`deployment.zh.md`](./deployment.zh.md)
