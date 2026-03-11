# 13 开发约束与质量闸门

## 1. 文档目的

本文档把架构要求转成开发者必须遵守的实现约束和评审闸门。

目标不是增加流程，而是避免实现偏离 `PRD`、偏离单钱包模型、偏离单工具单职责原则。

## 2. 契约同步要求

任何新增或修改的钱包能力，都必须同时检查以下层次：

1. `design/product/prd.md`
2. `design/contracts/mcp-and-owner-interfaces.md`
3. `packages/app-contracts/src/schemas/`
4. `packages/application/src/ports/` 与 `packages/application/src/services/`
5. `packages/adapters-ckb` 或 `packages/adapters-evm`
6. `apps/wallet-server/src/modules/*` 装配与 `tokens.ts`
7. `apps/wallet-server/src/modules/wallet-tools/wallet-tool-registry.service.ts`
8. `apps/owner-ui/src/api/`、`apps/owner-ui/src/components/`、`apps/owner-ui/src/types/app-state.ts`

任何一层缺失，均视为功能未完成。

## 3. 本期能力覆盖矩阵

开发者必须以此为最小实现集合：

| 链 | 地址 | 余额 | 签名 | 转账 |
| --- | --- | --- | --- | --- |
| Nervos / CKB | `nervos.address` | `nervos.balance.ckb` | `nervos.sign_message` | `nervos.transfer.ckb` |
| Ethereum / ETH | `ethereum.address` | `ethereum.balance.eth` | `ethereum.sign_message` | `ethereum.transfer.eth` |
| Ethereum / USDT | 复用 `ethereum.address` | `ethereum.balance.usdt` | 不单独提供第二个签名工具 | `ethereum.transfer.usdt` |

实现要求：

- 不允许缺失 `ETH` 转账。
- 不允许只做 `USDT` 转账而缺失 `ETH` 转账。
- 不允许把 `ETH` 与 `USDT` 合并成一个外部通用 transfer tool。

## 4. 单工具单职责要求

对外接口必须遵守：

- 一个 tool 只做一件事。
- 一个 tool 只对应一个明确资产范围。
- 一个转账 tool 只服务一个链上资产。
- 不允许提供 `wallet.transfer`、`ethereum.transfer.asset`、`balance.asset` 这类外部万能入口。

内部可以复用共享实现，但外部契约不得变成抽象占位符。

## 5. Owner API 纯度要求

Owner API 必须保持纯粹。

允许：

- 认证
- 凭证管理
- 钱包导入与导出
- 审计日志查看
- wallet tool catalog
- wallet tool HTTP gateway

禁止：

- 聚合 dashboard API
- 后端跨链看板拼装接口
- 只给 UI 用、但不属于 Owner 管理语义的临时专用接口

UI 要求：

- UI 自行组合 `wallet.current`、地址、余额、审计等原子能力。
- UI 必须承担看板拼装职责。
- UI 不得绕过 API 直接读取数据库或本地文件。

## 6. 层级边界要求

### 6.1 `apps/wallet-server`

- 只做 Nest transport、模块装配、过滤器、中间件、静态托管。
- 不直接写链逻辑。
- 不直接写仓储 SQL。
- 不直接实现加密算法细节。

### 6.2 `packages/application`

- 只编排用例和端口。
- 不直接依赖 `NestJS`。
- 不直接依赖 `viem` 或 `@ckb-ccc/core`。
- 不直接感知 HTTP 请求对象。

### 6.3 `packages/domain`

- 只保存领域对象、规则、错误和值对象。
- 不依赖任何 SDK、数据库或框架。

### 6.4 `packages/adapters-*`

- 只负责链 SDK 二次封装。
- 不直接写审计。
- 不直接写数据库。

### 6.5 `packages/infrastructure`

- 只负责仓储、vault、配置、日志、文件访问等基础设施实现。
- 不新增业务场景判断。

### 6.6 `apps/owner-ui`

- 只负责 Owner 交互与展示。
- 不直接引入链 SDK。
- 不在前端实现钱包业务规则。

## 7. 安全与数据处理要求

必须遵守：

- 私钥不明文落盘。
- 数据库不保存 `KEK`。
- `KEK` 由部署侧提供，应用只读取。
- 导出私钥只能由 Owner 触发，且必须审计。
- 导入私钥必须明确提示“替换当前钱包”。
- 高风险操作必须带 actor 语义并写入审计。

开发者不得：

- 在日志中打印私钥、`DEK`、`KEK`、完整签名原文。
- 在示例配置中放入真实 `KEK`。
- 在版本库提交 SQLite 钱包数据库。

## 8. 仓库卫生要求

任何提交都必须满足：

- 不提交 `node_modules/`
- 不提交 `dist/`
- 不提交 `coverage/`
- 不提交 SQLite 数据文件
- 不提交 `owner-credential.txt`
- 不提交 `wallet_kek.txt`
- 不提交 `wallet_kek.next.txt`

开发要求：

- 运行时目录必须由 `.gitignore` 覆盖。
- 文档示例只能引用 `.env.example` 或空目录占位文件。
- 不允许让自动生成的钱包数据成为仓库默认输入。

## 9. 链配置实现要求

链配置必须遵守：

- 正式模式为按链独立的 `*_CHAIN_MODE=preset|custom`
- `preset` 必须使用内置 `testnet|mainnet`
- `custom` 必须通过各自 `*_CHAIN_CONFIG_PATH` 加载 JSON 配置
- 不允许把完整链配置全部塞进环境变量
- 不允许通过配置动态生成新的外部 wallet tool

`custom` 模式必须支持：

- `ckb.rpcUrl`
- `ckb.indexerUrl`
- `ckb.genesisHash`
- `ckb.addressPrefix`
- `ckb.scripts.Secp256k1Blake160`
- `evm.rpcUrl`
- `evm.chainId`
- `evm.tokens.erc20.usdt.standard`
- `evm.tokens.erc20.usdt.contractAddress`

`custom` 模式必须校验：

- CKB 实际 `genesisHash`
- EVM 实际 `chainId`
- USDT 合约地址格式
- USDT 合约代码存在
- USDT `decimals()` 返回值为 `6`

## 10. 代码评审闸门

以下任一项不满足，评审不得通过：

- `PRD` 范围内的工具没有在 contracts、registry、application、UI 中同步。
- `ETH` 与 `USDT` 支持不完整。
- 新增了后端聚合接口。
- 仍然把链环境写死为旧 `NETWORK=testnet|mainnet` 双态模型。
- `custom` 模式没有通过 JSON 文件提供完整链配置。
- `USDT` 依赖用户手工提供 ABI 或 decimals 才能工作。
- controller 中出现链 SDK 直接调用。
- UI 中出现绕过 Owner API 的后门逻辑。
- 高风险操作没有审计记录。
- 测试只覆盖 happy path，没有失败路径。
- 文档与实际工具名不一致。

## 11. 测试闸门

每项能力至少应覆盖以下测试层次：

- schema 校验测试
- 应用服务测试
- 基础设施集成测试
- transport 集成测试

高风险动作额外要求：

- 审计写入测试
- 权限限制测试
- 错误码稳定性测试
- 操作状态追踪测试

最少失败路径：

- 钱包不存在
- `KEK` 缺失
- 余额不足
- 链节点不可用
- `custom` 链配置 JSON 缺项
- CKB `genesisHash` 不匹配
- EVM `chainId` 不匹配
- USDT `decimals()` 不是 `6`
- 签名失败
- 转账广播失败
- 导入私钥格式错误
- 导出权限不足

## 12. 开发者自检清单

提交前必须逐项自检：

- 我新增或修改的能力是否在 `PRD` 范围内。
- 我是否把外部接口做成了单工具单职责。
- 我是否错误地为 UI 新增了聚合接口。
- 我是否让 contracts、application、registry、UI 同步更新。
- 我是否补齐了 `ETH`、`CKB`、`USDT` 的需求闭环。
- 我是否按链独立的 `MODE/PRESET/CONFIG_PATH` 实现了链配置，而不是继续沿用旧 `NETWORK` 或单个 `CHAIN_ENV` 口径。
- 我是否把 `custom` 配置放进了独立 JSON，而不是把整套链参数塞进 env。
- 我是否避免提交运行时数据和密钥文件。
- 我是否给高风险动作补了审计和测试。
