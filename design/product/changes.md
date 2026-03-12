# Product Changes

本文件记录已经确认并合入正式 PRD 的产品变更。

维护原则：

- [`prd.md`](/Users/render/RivTower/projects/app5/SupeRISE-for-agent/design/product/prd.md) 是当前生效需求的唯一真相源
- 本文件记录“何时改了什么，以及为什么改”
- 新需求先在 `features/` 下整理，确认后再回写 `prd.md`，并在这里追加一条变更记录

## 2026-03-12

### 建立产品文档维护结构

状态：Accepted

目的：

- 保持 `prd.md` 只承载已确认需求
- 将需求讨论和正式需求解耦
- 降低后续持续迭代时的文档维护成本

变更：

- 将 [`prd.md`](/Users/render/RivTower/projects/app5/SupeRISE-for-agent/design/product/prd.md) 定义为正式需求源
- 新增 `features/` 目录用于承接 feature 级需求整理
- 新增本文件用于记录已确认变更

### 增加 USDC 与币种限额能力

状态：Accepted

目的：

- 扩展 Ethereum 侧可用资产范围
- 增加 server 侧风险控制能力，同时不增加 Agent 使用复杂度

变更：

- 新增 Ethereum 上的 USDC 支持
- 明确已支持币种都必须同时支持余额查询和转账
- 当前支持币种更新为 CKB、ETH、USDT、USDC
- 新增按币种独立配置的日、周、月限额
- 限额由 Owner 在 Owner Mode 中设置，由 server 执行
- Agent 平时不感知限额，仅在触发时收到 `limit` 信息
- Owner 操作不受该套限额约束
- 限额按 server 本地时区重置
