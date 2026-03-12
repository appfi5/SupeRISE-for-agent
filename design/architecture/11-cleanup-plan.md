# 11 重构清理实施方案

## 1. 文档目的

本文档把“彻底重构前必须先清理什么”落成开发执行方案。

它不是历史总结，也不是迁移手册，而是开发开始前的强制清场要求。

## 2. 清理目标

清理完成后，仓库必须满足以下目标：

- 仓库中只保留一套正式钱包架构。
- Agent 正式入口只保留 `MCP`。
- Owner 正式入口只保留 `HTTP API + Web UI`。
- `design/product/prd.md` 成为唯一产品基准。
- `design/architecture/` 与 `design/contracts/` 成为唯一设计真相来源。
- 新开发只围绕 `apps/`、`packages/`、`deploy/`、`scripts/` 组织。

## 3. 必须保留的内容

以下内容属于新架构基线，不允许在清理阶段误删：

- `design/product/prd.md`
- `design/architecture/`
- `design/contracts/`
- `apps/wallet-server`
- `apps/owner-ui`
- `packages/app-contracts`
- `packages/domain`
- `packages/application`
- `packages/infrastructure`
- `packages/adapters-ckb`
- `packages/adapters-evm`
- `packages/shared`
- `deploy/docker`
- `scripts/`
- 根目录工作区文件，例如 `package.json`、`pnpm-workspace.yaml`、`tsconfig.base.json`

## 4. 必须彻底移除的历史边界

以下内容不得再作为实现输入、兼容目标或参考实现保留：

- 旧 `.NET` server 目录与其任何构建、安装、运行脚本
- 旧 CLI 钱包入口与旧 CLI 文档
- 旧 Agent HTTP 接口说明、旧 swagger 文件、旧 endpoint 定义
- 围绕旧多配置、多白名单、多平台授权模型形成的历史抽象
- 指向旧系统结构的 README、设计稿、部署说明、脚本说明

开发要求：

- 任何 PR 都不得重新引入 `SupeRISELocalServer` 风格目录。
- 任何 PR 都不得重新引入旧 `SupeRISECli` 钱包入口。
- 任何新文档都不得要求开发者参考旧 `.NET` 或旧 CLI 代码决定设计。

## 5. 当前仓库的清理要求

结合当前仓库结构，开发者必须额外执行以下清理和收口：

- 不把 `apps/*/dist` 作为源码目录使用。
- 不把 `node_modules/`、SQLite 数据文件、`owner-credential.txt`、`wallet_kek` 文件提交到版本库。
- 不在仓库根目录或 `apps/wallet-server/data` 下沉淀真实运行数据作为实现依赖。
- 不把 `deploy/docker/runtime-data` 中的真实运行数据当作样例资产保留。
- 不把 `deploy/docker/secrets` 中的真实密钥文件作为默认配置分发。

强制规则：

- 构建产物只允许由构建流程生成，不允许手工编辑。
- 运行时数据只允许出现在被忽略的本地目录中。
- 设计文档只能描述目标结构，不描述某次本地运行产生的数据结果。

## 6. 运行时数据清理要求

钱包项目会自然产生运行时状态，但这些内容都不是设计资产。

必须明确区分：

- 设计资产：`design/` 下文档、`packages/app-contracts` 下 schema、`apps/*/src` 下源码
- 运行时资产：SQLite 文件、`KEK` 文件、默认 Owner 凭证通知文件、WAL 文件、临时日志

开发要求：

- 所有运行时资产都必须由配置项决定路径。
- 本地开发环境不得依赖仓库内预置的钱包数据库才能启动。
- 任何脚本都不得在版本库中生成默认可用的真实私钥或真实 `KEK`。
- Docker 示例只能提供 `.env.example` 和空目录占位文件，不能提供真实 secret。

## 7. 工程边界清理要求

清理不仅是删目录，也包括删错误的工程边界。

必须完成以下收口：

- 不再新增 Agent 专用 HTTP controller。
- 不再新增与 `MCP` 平行的第二套 Agent transport。
- 不再把链 SDK 调用写进 controller、UI 或文档示例。
- 不再把 Owner 看板需求误实现为后端聚合 API。
- 不再把多资产通用入口作为本期对外协议。

本期对外协议必须只保留这些明确工具：

- `wallet.current`
- `wallet.operation_status`
- `nervos.address`
- `nervos.balance.ckb`
- `nervos.sign_message`
- `nervos.transfer.ckb`
- `nervos.tx_status`
- `ethereum.address`
- `ethereum.balance.eth`
- `ethereum.balance.usdt`
- `ethereum.balance.usdc`
- `ethereum.sign_message`
- `ethereum.transfer.eth`
- `ethereum.transfer.usdt`
- `ethereum.transfer.usdc`
- `ethereum.tx_status`

## 8. 清理执行顺序

建议按以下顺序执行：

1. 冻结 `PRD` 和 `design/` 目录，明确它们是设计基线。
2. 删除历史 `.NET`、历史 CLI、历史 Agent HTTP 相关目录和脚本。
3. 清理根目录 README、脚本入口、命令说明中的历史引用。
4. 清理构建产物、运行时数据、示例密钥、示例凭证文件。
5. 确认工作区只剩一套 `pnpm workspace` 主结构。
6. 以 `design/contracts/` 为准，重新核对所有工具名和 Owner API 名称。
7. 在清理完成后，再进入实现阶段。

## 9. 清理完成判定

只有同时满足以下条件，才算清理阶段完成：

- 根目录不存在旧 `.NET` server 和旧 CLI 的正式入口说明。
- 仓库中不存在可被误解为正式 Agent 入口的 HTTP API 设计。
- 仓库中不存在真实 `KEK`、真实默认凭证、真实钱包数据库的版本化文件。
- `README`、`design/README.md`、`design/architecture/README.md` 的入口关系一致。
- 新开发者进入仓库后，不会对“该从哪一套实现开始”产生歧义。

## 10. 开发者提交要求

从清理阶段开始，后续所有开发提交都必须遵守：

- 不恢复任何历史目录。
- 不复制旧实现代码进入新目录后继续沿用旧模型。
- 不以“旧代码已经有类似逻辑”为理由绕过当前设计文档。
- 如需参考历史实现，只能用于了解业务背景，不能用于决定新架构边界。
