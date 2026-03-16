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

地址簿能力额外要求同步检查：

- `address_book.xxx` tools 契约
- `address_book.lookup_by_address` 的输入输出与匹配语义
- 转账 schema 中的 `toType`
- 地址簿仓储与名称唯一性规则
- 转账结果中的 `resolvedAddress` / `contactName`

## 3. 本期能力覆盖矩阵

开发者必须以此为最小实现集合：

| 链 | 地址 | 余额 | 签名 | 转账 | Tx 状态 |
| --- | --- | --- | --- | --- | --- |
| Nervos / CKB | `nervos.address` | `nervos.balance.ckb` | `nervos.sign_message` | `nervos.transfer.ckb` | `nervos.tx_status` |
| Ethereum / ETH | `ethereum.address` | `ethereum.balance.eth` | `ethereum.sign_message` | `ethereum.transfer.eth` | `ethereum.tx_status` |
| Ethereum / USDT | 复用 `ethereum.address` | `ethereum.balance.usdt` | 不单独提供第二个签名工具 | `ethereum.transfer.usdt` | 复用 `ethereum.tx_status` |
| Ethereum / USDC | 复用 `ethereum.address` | `ethereum.balance.usdc` | 不单独提供第二个签名工具 | `ethereum.transfer.usdc` | 复用 `ethereum.tx_status` |

实现要求：

- 不允许缺失 `ETH` 转账。
- 不允许只做 `USDT` 转账而缺失 `ETH` 转账。
- 不允许只做 `USDC` 转账而缺失 `USDC` 余额查询。
- 不允许把 `ETH`、`USDT`、`USDC` 合并成外部通用 transfer tool。
- 不允许缺失 `nervos.tx_status` 或 `ethereum.tx_status`。
- 必须提供按币种独立的日、周、月限额能力。

地址簿能力最小集合：

- `address_book.list`
- `address_book.search`
- `address_book.lookup_by_address`
- `address_book.get`
- `address_book.get_all`
- `address_book.create`
- `address_book.update`
- `address_book.delete`

## 4. 单工具单职责要求

对外接口必须遵守：

- 一个 tool 只做一件事。
- 一个 tool 只对应一个明确资产范围。
- 一个转账 tool 只服务一个链上资产。
- 不允许提供 `wallet.transfer`、`ethereum.transfer.asset`、`balance.asset` 这类外部万能入口。
- 不允许把两条链的 `tx status` 合并成 `wallet.tx_status` 这类外部万能入口。
- 不允许提供 `address_book.manage`、`address_book.resolve` 这类外部万能入口。
- 不允许把按名称搜索和按精确地址匹配混成同一个外部工具。

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
- 不直接依赖 `viem` 或 `@ckb-ccc/shell`。
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
- `managed` 模式下 `KEK` 由部署侧提供，应用只读取。
- `quickstart` 模式下允许应用首次启动时自动生成并持久化 `KEK` 与 Owner JWT secret。
- 导出私钥只能由 Owner 触发，且必须审计。
- 导入私钥必须明确提示“替换当前钱包”。
- 高风险操作必须带 actor 语义并写入审计。

开发者不得：

- 在日志中打印私钥、`DEK`、`KEK`、完整签名原文。
- 在示例配置中放入真实 `KEK`。
- 在版本库提交 SQLite 钱包数据库。
- 在镜像层内置真实钱包数据库、真实 `KEK`、真实 Owner 凭证或真实 JWT secret。

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

## 8.1 限额实现要求

限额能力必须遵守：

- 限额由 server 执行，不在 Agent 或 UI 侧自行判断
- 限额只对 `AGENT` 生效
- `OWNER` 不受限额约束
- 限额按币种独立配置
- 限额周期固定为 `DAILY`、`WEEKLY`、`MONTHLY`
- 限额按 server 本地时区计算
- Agent 只在触发时收到结构化 `limit` 信息

实现要求：

- 限额配置修改必须审计
- Agent 触发限额拦截必须审计
- 限额统计不得依赖解析 UI 状态
- 限额金额口径必须与转账金额口径一致
- Agent 转账必须先预占额度，再进入链适配器
- 限额判断必须基于 `ACTIVE + CONSUMED`
- 广播失败、链上失败、确认超时都必须释放额度预占
- 必须存在后台结算任务清理 `RESERVED` 与 `SUBMITTED` 操作

## 8.2 地址簿实现要求

地址簿能力必须遵守：

- 地址簿以联系人名称为主视角
- 同一个联系人名称可同时记录 `Nervos` 地址和 `Ethereum` 地址
- 同一链下只允许一个地址
- 同一链下的同一个地址允许被多个联系人名称复用
- 名称唯一性必须按归一化规则判断
- 地址簿是共享数据，不是权限边界
- Agent 与 Owner 共享同一地址簿数据

实现要求：

- 地址簿当前只按两条链固定字段建模，不抽象成任意链映射表
- 同一链地址不得加唯一约束
- `create` 和 `update` 时必须校验至少保留一个链地址
- `create` 和 `update` 时必须严格校验地址合法性
- `update` 使用最终状态替换语义，不使用 patch 语义
- 地址簿必须持久化用于精确匹配的规范化地址
- `lookup_by_address` 只输入 `address`，不要求调用方提供 `chain`
- `lookup_by_address` 只返回匹配联系人名称，不返回完整联系人详情
- `lookup_by_address` 对空字符串返回校验错误；地址无法识别时返回未匹配结果
- 转账中的 `contact_name` 必须在应用层解析
- 链适配器只允许接收最终链地址
- `toType` 省略时按 `address` 处理，不允许自动猜测联系人名称
- 名称不存在或当前链下无地址时必须明确失败
- 解析失败时不允许降级到其他链地址
- `toType=address` 的转账不自动执行地址簿反查，也不回填联系人名称

## 8.3 转账状态追踪要求

必须遵守：

- `wallet.operation_status` 表示本地操作状态
- `nervos.tx_status` 与 `ethereum.tx_status` 表示链上观察状态
- 后台结算任务必须复用与 MCP 相同的 `tx status` 查询服务
- 不允许在调度器中直接拼装链 SDK 原始查询逻辑
- `RESERVED`、`SUBMITTED`、`CONFIRMED`、`FAILED` 的流转必须可审计、可恢复

## 9. 链配置实现要求

链配置必须遵守：

- 正式模式为 `CHAIN_ENV=custom|testnet|mainnet`
- `testnet` 与 `mainnet` 必须使用内置 preset
- `custom` 必须通过 `CHAIN_CONFIG_PATH` 加载 JSON 配置
- 不允许把完整链配置全部塞进环境变量
- 不允许通过配置动态生成新的外部 wallet tool

`custom` 模式必须支持：

- `ckb.rpcUrl`
- `ckb.indexerUrl`
- `ckb.genesisHash`
- `evm.rpcUrl`
- `evm.chainId`
- `evm.tokens.erc20.usdt.contractAddress`
- `evm.tokens.erc20.usdc.contractAddress`

`custom` 模式必须校验：

- CKB 实际 `genesisHash`
- EVM 实际 `chainId`
- USDT 合约地址格式
- USDT 合约代码存在
- USDT `decimals()` 返回值为 `6`
- USDC 合约地址格式
- USDC 合约代码存在
- USDC `decimals()` 返回值为 `6`

## 10. 零配置启动实现要求

零配置启动能力必须遵守：

- 官方镜像必须支持 `DEPLOYMENT_PROFILE=quickstart|managed`
- 官方镜像默认部署档位必须是 `quickstart`
- `quickstart` 默认链环境必须是 `testnet` preset
- `quickstart` 必须支持用户直接执行 `docker run <image>` 完成首次启动
- quickstart 自动生成的 runtime secrets 必须写入运行时 volume，不得写入镜像层
- Dockerfile 必须声明运行时 volume
- 首次 quickstart 启动必须把 Owner 凭证文件路径写入日志
- 首次 quickstart 启动允许把初始 Owner 凭证明文打印到日志一次
- 后续启动不得重复打印同一凭证明文
- `managed` 模式不得依赖 quickstart 自动生成的 runtime secrets

## 11. 代码评审闸门

以下任一项不满足，评审不得通过：

- 当前需求基线内的工具没有在 contracts、registry、application、UI 中同步。
- `ETH`、`USDT`、`USDC` 支持不完整。
- 新增了后端聚合接口。
- 仍然把链环境写死为旧 `NETWORK=testnet|mainnet` 双态模型。
- `custom` 模式没有通过 JSON 文件提供完整链配置。
- 官方镜像不能在零配置前提下完成启动。
- 官方镜像默认部署档位不是 `quickstart`。
- quickstart 默认链环境落在主网。
- quickstart 的 `KEK`、Owner JWT secret 或初始凭证被写入镜像层。
- Dockerfile 未声明运行时 volume。
- 首次启动不输出 Owner 凭证文件路径，导致用户无法完成接管。
- 同一初始凭证明文在每次重启都重复打印。
- `USDT` 依赖用户手工提供 ABI 或 decimals 才能工作。
- `USDC` 依赖用户手工提供 ABI 或 decimals 才能工作。
- 限额判断被放到了 UI、Agent 或 controller 层。
- 没有额度锁保护，导致并发转账可穿透限额。
- 没有额度预占，直到链上确认才记额度。
- 没有后台结算任务，导致失败交易无法返还额度。
- `wallet.operation_status` 与链上 `tx status` 混成同一个外部接口。
- 地址簿名称唯一性规则不稳定，导致 `Bob` / `bob` 可重复。
- 给地址字段错误加了唯一约束，导致同一地址不能挂到多个联系人。
- 新增了 `address_book.manage` 之类的外部万能接口。
- 把名称搜索与按精确地址匹配合并成同一个外部接口。
- 转账时自动猜测 `to` 是地址还是联系人名称。
- `lookup_by_address` 返回了联系人详情甚至链上归属结论，而不是名称匹配结果。
- 在链适配器或 UI 层解析联系人名称。
- Owner 也被错误纳入 Agent 限额约束。
- controller 中出现链 SDK 直接调用。
- UI 中出现绕过 Owner API 的后门逻辑。
- 高风险操作没有审计记录。
- 测试只覆盖 happy path，没有失败路径。
- 文档与实际工具名不一致。

## 12. 测试闸门

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
- 额度预占与返还测试
- 后台结算恢复测试
- 地址簿名称唯一性测试
- 同地址多联系人测试
- 地址簿按链解析测试
- 按精确地址查询匹配联系人测试
- quickstart 首次启动测试
- quickstart 重启保持同一 runtime secrets 测试

最少失败路径：

- 钱包不存在
- `KEK` 缺失
- 余额不足
- 额度预占成功后广播失败
- 已提交交易链上失败后额度返还
- 已提交交易长时间未确认后的超时处理
- `nervos.tx_status` 查不到交易
- `ethereum.tx_status` receipt 失败
- 联系人名称不存在
- 联系人存在但当前链下无地址
- 按精确地址查询无匹配联系人
- 按精确地址查询无法识别链格式
- 按精确地址查询输入为空
- 地址簿重名创建
- 同一地址被多个联系人记录
- 更新联系人后地址全被清空
- quickstart 运行时目录不可写
- quickstart 首次启动未能生成运行时 secret
- 链节点不可用
- `custom` 链配置 JSON 缺项
- CKB `genesisHash` 不匹配
- EVM `chainId` 不匹配
- USDT `decimals()` 不是 `6`
- USDC `decimals()` 不是 `6`
- Agent 触发日限额
- Agent 触发周限额
- Agent 触发月限额
- 签名失败
- 转账广播失败
- 导入私钥格式错误
- 导出权限不足

## 13. 开发者自检清单

提交前必须逐项自检：

- 我新增或修改的能力是否在当前需求基线范围内。
- 我是否把外部接口做成了单工具单职责。
- 我是否错误地为 UI 新增了聚合接口。
- 我是否让 contracts、application、registry、UI 同步更新。
- 我是否补齐了 `ETH`、`CKB`、`USDT`、`USDC` 的需求闭环。
- 我是否让地址簿保持独立 tools，而不是做成万能入口。
- 我是否把按精确地址查询单独做成了地址簿工具，而不是塞进名称搜索。
- 我是否把联系人名称解析放在了应用层，而不是 UI 或链适配层。
- 我是否把地址簿反查结果收敛为“匹配联系人名称”，而不是扩展成归属判断。
- 我是否让官方镜像在不提供额外配置时也能完成 quickstart 启动。
- 我是否避免把 runtime secret、数据库或默认凭证烘焙进镜像。
- 我是否按 `CHAIN_ENV=custom|testnet|mainnet` 实现了链配置，而不是继续沿用旧 `NETWORK` 或按链拆开的旧口径。
- 我是否把 `custom` 配置放进了独立 JSON，而不是把整套链参数塞进 env。
- 我是否把限额判断留在 server 应用层，而不是散落到 UI 或 Agent。
- 我是否避免提交运行时数据和密钥文件。
- 我是否给高风险动作补了审计和测试。
