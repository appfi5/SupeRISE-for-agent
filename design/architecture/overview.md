# Agent 信用钱包架构设计总览

> 状态：Proposed
> 更新时间：2026-03-16
> 关联文档：`design/product/prd.md`
> 实现约束：Node.js + TypeScript

本文档是 Agent 信用钱包的总览入口。详细架构设计已拆分到当前 `architecture/` 目录，按专题分别维护。

## 1. 核心定案

- 本次工作是彻底重构，不保留旧实现兼容义务
- 运行时采用 `Node.js 24 LTS`
- 服务端采用 `NestJS 11`
- Agent 正式入口采用 `MCP`
- Owner 不提供聚合接口，UI 在已登录前提下自行组合原子能力
- Owner 统一入口采用 `HTTP API + 本地 Web UI`
- UI 采用 `React + Vite`
- 数据库采用 `SQLite`
- 数据访问采用 `Kysely + better-sqlite3`
- ETH 集成采用 `viem`
- CKB 集成采用 `@ckb-ccc/shell`
- 密钥管理采用 `DEK + KEK` 双层设计；`managed` 由部署侧提供 `KEK`，`quickstart` 允许首次启动自举并写入运行时目录
- 当前支持资产为 `CKB`、`ETH`、`USDT`、`USDC`
- 当前支持地址簿能力：按名称管理 `Nervos` / `Ethereum` 收款目标，并支持按精确地址反查已知联系人名称
- 官方只发布一个运行镜像，`quickstart` / `managed` 是运行档位，不是不同镜像
- 官方镜像必须支持 `quickstart` 零应用配置启动档位，但必须显式挂载 `superise-agent-wallet-data:/app/runtime-data`
- server 侧提供按币种独立的日、周、月限额能力，仅对 Agent 生效
- Agent 转账采用“额度预占 + 异步结算”模型
- `CKB` 与 `Ethereum` 都提供链上 `tx status` 查询能力

## 2. 文档导航

- [设计文档入口](../README.md)
- [架构文档集总览](./README.md)
- [01 重构原则与清理策略](./01-principles-and-rewrite-strategy.md)
- [02 系统上下文与部署拓扑](./02-system-topology.md)
- [03 仓库与工程结构设计](./03-repo-structure.md)
- [04 运行时模块与 NestJS 分层设计](./04-modules-and-runtime.md)
- [MCP 与 Owner 接口设计](../contracts/mcp-and-owner-interfaces.md)
- [06 钱包领域模型与核心用例](./06-wallet-domain-and-use-cases.md)
- [07 安全、加密与密钥管理](./07-security-and-key-management.md)
- [08 数据模型与持久化设计](./08-data-and-persistence.md)
- [09 多链接入与链适配器设计](./09-chain-integration.md)
- [10 部署、运维与环境配置](./10-deployment-and-operations.md)
- [11 重构清理实施方案](./11-cleanup-plan.md)
- [12 开发实施路线图](./12-implementation-roadmap.md)
- [13 开发约束与质量闸门](./13-development-requirements-and-quality-gates.md)
- [ADR 0001 币种限额执行模型](./adr/0001-asset-limit-enforcement.md)
- [ADR 0002 转账结算与链上状态跟踪](./adr/0002-transfer-settlement-and-tx-status.md)
- [ADR 0003 地址簿与转账目标解析模型](./adr/0003-address-book-and-transfer-target-resolution.md)
- [ADR 0004 零配置容器启动与双部署档位](./adr/0004-zero-config-container-quickstart.md)

## 3. 使用方式

- 评审总体方向时先看本文件和 [README.md](./README.md)
- 做实现拆分时按专题文档逐项落地
- 发生冲突时，以 `PRD` 和专题文档为准，不以历史代码为准
