# Agent 信用钱包详细架构设计文档集

> 状态：Proposed
> 更新时间：2026-03-12
> 关联文档：`design/product/prd.md`

本目录是 Agent 信用钱包重构的正式架构文档集。该文档集用于指导开发团队完成一次彻底重构，不为历史代码提供兼容路径，也不以现有实现作为设计边界。

## 文档目标

- 将原先单一架构文档拆分为可独立评审的专题文档
- 为开发、测试、部署、运维提供统一且可执行的技术规范
- 把“产品边界”“技术边界”“安全边界”“实施边界”拆开，避免混写

## 阅读顺序

1. [01 重构原则与清理策略](./01-principles-and-rewrite-strategy.md)
2. [02 系统上下文与部署拓扑](./02-system-topology.md)
3. [03 仓库与工程结构设计](./03-repo-structure.md)
4. [04 运行时模块与 NestJS 分层设计](./04-modules-and-runtime.md)
5. [MCP 与 Owner 接口设计](../contracts/mcp-and-owner-interfaces.md)
6. [06 钱包领域模型与核心用例](./06-wallet-domain-and-use-cases.md)
7. [07 安全、加密与密钥管理](./07-security-and-key-management.md)
8. [08 数据模型与持久化设计](./08-data-and-persistence.md)
9. [09 多链接入与链适配器设计](./09-chain-integration.md)
10. [10 部署、运维与环境配置](./10-deployment-and-operations.md)
11. [11 重构清理实施方案](./11-cleanup-plan.md)
12. [12 开发实施路线图](./12-implementation-roadmap.md)
13. [13 开发约束与质量闸门](./13-development-requirements-and-quality-gates.md)
14. [ADR 0001 币种限额执行模型](./adr/0001-asset-limit-enforcement.md)
15. [ADR 0002 转账结算与链上状态跟踪](./adr/0002-transfer-settlement-and-tx-status.md)
16. [ADR 0003 地址簿与转账目标解析模型](./adr/0003-address-book-and-transfer-target-resolution.md)

## 本次重构的正式定案

- 运行时：`Node.js 24 LTS`
- 服务端：`NestJS 11`
- Agent 入口：`MCP`
- Owner 入口：`HTTP API + 本地 Web UI`
- Owner 不提供聚合接口，UI 自行组合原子能力
- UI：`React + Vite`
- 数据库：`SQLite`
- 数据访问：`Kysely + better-sqlite3`
- EVM：`viem`
- CKB：`@ckb-ccc/shell`
- 密钥管理：`DEK + KEK` 双层设计，`KEK` 由部署侧提供
- 当前支持资产：`CKB`、`ETH`、`USDT`、`USDC`
- 当前支持地址簿能力：按名称管理 `Nervos` / `Ethereum` 收款目标，并支持按精确地址反查已知联系人名称
- server 侧按币种执行 `daily/weekly/monthly` 三档限额
- Agent 转账采用“额度预占 + 异步结算”模型
- `CKB` 与 `Ethereum` 都提供链上 `tx status` 查询能力

## 文档边界

本文档集只定义本期正式架构，不承担以下职责：

- 解释历史代码如何迁移
- 保留旧 CLI、旧 .NET server、旧 Agent HTTP 入口
- 为历史目录结构生成兼容映射

## 实施原则

- 先清理，再开发
- 先定边界，再写代码
- 先收敛接口，再进入实现
- 先落实密钥管理，再落地钱包存储
