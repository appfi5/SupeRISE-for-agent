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
- `pnpm version:check`：检查根包与所有 workspace 包的版本是否一致
- `pnpm version:sync`：把所有 workspace 包版本同步到根 `package.json`
- `pnpm version:set <version>`：把根包和所有 workspace 包一次性设置为指定版本
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
- release 自动化配置： [`.github/release-please-config.json`](../.github/release-please-config.json)
- release workflow： [`.github/workflows/release.yml`](../.github/workflows/release.yml)
- 直接发布 tag 镜像的 workflow： [`.github/workflows/tag-image.yml`](../.github/workflows/tag-image.yml)

## Release 自动化

仓库现在使用两段式 Docker 发版流程：

1. 每次 push 到 `main`，都会执行校验、构建多架构候选镜像，并以 `superise/agent-wallet:sha-<commit>` 推送
2. 同一次 `main` push 还会通过 `release-please` 创建或更新 Release PR
3. 当 Release PR 被合并后，下一次对应的 `main` workflow 会创建 GitHub release，并把已经构建好的候选 digest promote 成正式 Docker tag

非正式 tag 的镜像发布与这条正式流程分开。只要 push 的不是稳定版 semver tag，就会立即构建并推送镜像：

- `v1.2.3-rc.1` 会发布为 Docker tag `1.2.3-rc.1`
- `test-address-book-1` 会发布为 Docker tag `test-address-book-1`
- `v1.2.3` 这类稳定版 tag 会被该 workflow 忽略，因为它们由正式 release workflow 负责

正式 Docker tag 规则如下：

- 每次 release 都会生成 `superise/agent-wallet:<version>`
- 稳定版还会额外生成 `superise/agent-wallet:<major>.<minor>` 和 `superise/agent-wallet:latest`
- `1.2.3-rc.1` 这类预发布版本不会移动 `latest`

版本在整个仓库内保持锁步。根 [`package.json`](../package.json) 是唯一版本源，`release-please` 通过 `extra-files` 同步所有 workspace `package.json`，而 wallet server 在运行时直接读取 [`apps/wallet-server/package.json`](../apps/wallet-server/package.json) 中的版本，不再维护重复的硬编码字符串。

日常发版默认让 `release-please` 根据 Conventional Commits 自动判断 bump。若确实需要指定下一版号，可手动运行 `Release` workflow，并传入可选的 `release_as` 输入。

如果你希望 Release PR 创建后自动触发 CI，请在仓库 secrets 中配置 `RELEASE_PLEASE_TOKEN`，内容为具备创建 PR 权限的 PAT 或 GitHub App token。当前 workflow 会优先使用它；若不存在则回退到默认 `GITHUB_TOKEN`，而 GitHub 不会为该 token 创建的 PR 触发下游 workflow。

## Build 元数据

`/health` 现在会在健康检查结果之外返回一组 build 元数据，这些字段的语义是刻意拆开的：

- `appVersion`：代码版本，来源于 [`apps/wallet-server/package.json`](../apps/wallet-server/package.json)
- `buildRef`：镜像构建时对应的源码引用，例如 `refs/heads/main` 或 `refs/tags/test-address-book-1`
- `gitSha`：烘焙进镜像的准确 commit
- `builtAt`：UTC 时间的镜像构建时间
- `deployImageTag`：容器实际以哪个镜像别名部署
- `deployImageDigest`：运行时注入的镜像 digest

只有构建期字段会被烘焙进镜像。`deployImageTag` 与 `deployImageDigest` 属于部署期元数据，需要在确实关心时由运行环境显式注入，例如设置 `SUPERISE_DEPLOY_IMAGE_TAG` 和 `SUPERISE_DEPLOY_IMAGE_DIGEST`。这样同一个 digest 即使同时对应 `0.3.0`、`0.3`、`latest` 等多个 tag，也不会在镜像内部伪装成某一个固定别名。

## 验证建议

完成修改后，常见验证流程如下：

1. 运行 `pnpm typecheck`
2. 运行 `pnpm test`
3. 运行 `pnpm version:check`
4. 验证 `http://127.0.0.1:18799/health`
5. 验证 `http://127.0.0.1:18799/` 的 Owner UI 能正常加载
6. 如果改动影响 MCP 行为，再通过 MCP Inspector 重新验证接入
7. 如果改动影响 Owner 侧行为，再重新验证对应的 Owner UI 或 Owner API 流程

## 安全提示

- `/mcp` 默认无鉴权，因此开发和测试环境也应放在受信任的本地或私有网络中
- transfer 工具返回的是服务端已接受任务的结果，不表示链上最终确认
- 如果你需要 managed secret、主网 preset 或 custom chain deployment，请查看 [`deployment.zh.md`](./deployment.zh.md)
