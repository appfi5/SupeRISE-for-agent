# 使用文档

本目录用于存放面向使用者、接入者和部署者的文档，默认语言为中文。

英文版本见 [docs/en/README.md](./en/README.md)。

## 按主题阅读

- Agent 接入： [MCP 接入说明](./mcp.md)
- 部署与运行： [部署说明](./deployment.md)

## 当前覆盖范围

- `MCP` 工具清单，以及 `wallet.operation_status` 与链上 `tx_status` 的职责划分
- Owner 本地管理能力，包括钱包查看、转账和按资产日 / 周 / 月限额配置
- 部署与运行配置，包括 `USDT` / `USDC` 合约配置、后台结算轮询与健康检查

## 文档边界

`docs/` 只保留“如何使用、如何接入、如何部署、如何运维”这类外部可消费文档。

内部管理面、实现细节、PRD、架构设计和接口契约等材料统一放在 [`design/`](../design/README.md)。
