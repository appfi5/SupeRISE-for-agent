# 05 MCP 与 Owner 接口设计

## 1. 文档目的

本文档定义 Agent MCP 工具、Owner HTTP API、输入输出模型、错误模型和权限边界。目标是统一系统的外部行为，而不是仅描述内部实现。

## 2. 接口总原则

- Agent 正式集成统一通过 `MCP`
- Owner 统一通过 `HTTP + Web UI`
- 两类入口共用同一应用层
- 两类入口共用同一错误模型
- 两类入口都不直接接触私钥

## 3. Agent MCP 设计

### 3.1 MCP 角色

MCP 是 Agent 的唯一正式入口。

MCP 的定位是：

- 钱包工具协议层
- 不是第二套业务实现
- 不是 HTTP API 的简单映射文档

### 3.2 本期工具集合

必须提供以下工具：

1. `wallet.current`
2. `wallet.operation_status`
3. `address_book.list`
4. `address_book.search`
5. `address_book.lookup_by_address`
6. `address_book.get`
7. `address_book.get_all`
8. `address_book.create`
9. `address_book.update`
10. `address_book.delete`
11. `nervos.address`
12. `nervos.balance.ckb`
13. `nervos.sign_message`
14. `nervos.transfer.ckb`
15. `nervos.tx_status`
16. `ethereum.address`
17. `ethereum.balance.eth`
18. `ethereum.balance.usdt`
19. `ethereum.balance.usdc`
20. `ethereum.sign_message`
21. `ethereum.transfer.eth`
22. `ethereum.transfer.usdt`
23. `ethereum.transfer.usdc`
24. `ethereum.tx_status`

### 3.2.1 Agent 可见元数据要求

对外暴露给 Agent 的 `tools/list` 必须足以让外部 Agent 在不阅读仓库文档的前提下理解工具。

因此每个工具至少必须在 MCP 元数据中暴露：

- `title`
- `description`
- `inputSchema`
- `outputSchema`
- `annotations`

其中：

- `description` 必须说明用途、关键单位语义和后续动作要求
- `outputSchema` 必须描述成功/失败时的结构化返回
- transfer 工具必须明确“返回的是提交结果，不代表最终确认”
- `annotations` 必须至少表达只读性、破坏性、幂等性和是否依赖外部世界

### 3.3 工具定义

#### `wallet.current`

用途：

- 返回当前唯一钱包的基础状态

输入：

- 无

输出：

- `walletFingerprint`
- `status`
- `source`

#### `address_book.list`

用途：

- 返回当前地址簿的联系人摘要列表

输入：

- 无

输出：

- `contacts[]`

`contacts[]` 中每项至少包括：

- `name`
- `note?`
- `chains`
- `updatedAt`

说明：

- 列表以 `name` 为主视角
- 列表默认按 `name` 升序返回
- 列表返回摘要，不返回完整多链地址映射
- `chains` 只允许返回 `NERVOS`、`ETHEREUM` 中的一个或两个值

#### `address_book.search`

用途：

- 按名称搜索联系人摘要

输入：

- `query`

输出：

- `contacts[]`

说明：

- 仅按 `name` 搜索
- `query` 去首尾空格后不能为空；空查询应改用 `address_book.list`
- 搜索按归一化名称执行大小写不敏感匹配
- 返回结构与 `address_book.list` 一致

#### `address_book.get`

用途：

- 返回单个联系人的完整信息

输入：

- `name`

输出：

- `contact`

`contact` 至少包括：

- `name`
- `note?`
- `addresses`
- `createdAt`
- `updatedAt`

`addresses` 中允许：

- `nervosAddress?`
- `ethereumAddress?`

#### `address_book.lookup_by_address`

用途：

- 按精确地址查询该地址在地址簿中匹配到哪些联系人名称

输入：

- `address`

输出：

- `address`
- `chain?`
- `matched`
- `contacts`

说明：

- `contacts` 只返回联系人名称数组，不返回完整联系人详情
- 该查询只表达“地址簿中有哪些匹配联系人”，不表达链上真实归属
- 服务端先尝试识别该地址属于当前支持的哪条链，再按链内规范化结果做精确匹配
- 当同一地址被多个联系人名称记录时，必须返回全部匹配名称
- 输入为空时返回 `VALIDATION_ERROR`
- 输入无法识别为当前支持链地址格式时，返回 `matched=false` 与空数组，不作为错误

#### `address_book.get_all`

用途：

- 一次性返回全部联系人的完整信息

输入：

- 无

输出：

- `contacts[]`

说明：

- 返回完整多链地址信息
- 不分页

#### `address_book.create`

用途：

- 创建新的联系人条目

输入：

- `contact`

`contact` 至少包括：

- `name`
- `note?`
- `addresses`

`addresses` 中允许：

- `nervosAddress?`
- `ethereumAddress?`

要求：

- `name` 必填
- 名称必须唯一
- 至少提供一个链地址
- 创建时必须校验地址格式合法性
- 不限制同一链下的同一个地址被多个联系人名称复用

输出：

- `contact`

说明：

- 返回结果至少包括 `name`、`note?`、`addresses`、`createdAt`、`updatedAt`

#### `address_book.update`

用途：

- 更新联系人条目

输入：

- `currentName`
- `contact`

`contact` 表示更新后的最终状态，至少包括：

- `name`
- `note?`
- `addresses`

`addresses` 中允许：

- `nervosAddress?`
- `ethereumAddress?`

规则：

- `update` 使用“最终状态替换”语义，不使用 patch 语义
- 若需要移除某条链地址，应显式传入 `null`
- 更新后的联系人必须仍然至少保留一个链地址
- 更新时必须校验保留地址的格式合法性
- 不限制同一链下的同一个地址被多个联系人名称复用

输出：

- `contact`

说明：

- 返回结果至少包括 `name`、`note?`、`addresses`、`createdAt`、`updatedAt`

#### `address_book.delete`

用途：

- 删除整个联系人条目

输入：

- `name`

输出：

- `deleted`
- `name`

说明：

- 删除成功时 `deleted` 固定为 `true`
- 联系人不存在时直接返回 `ADDRESS_BOOK_CONTACT_NOT_FOUND`

地址簿契约补充规则：

- 联系人名称按“去首尾空格 + 大小写不敏感”判断唯一性
- 对外仍返回原始展示名称，不返回归一化名称
- `get`、`update`、`delete` 对联系人名称使用精确匹配
- `lookup_by_address` 按地址精确匹配，不支持地址字符串模糊匹配
- 地址簿详情中不暴露内部数据库主键

#### `nervos.address`

用途：

- 返回当前钱包的 Nervos 地址

输出：

- `chain`
- `address`

#### `nervos.balance.ckb`

用途：

- 返回当前钱包的 Nervos CKB 余额

输出：

- `chain`
- `asset`
- `amount`，单位为 `Shannon` 的整数字符串，`100000000` 表示 `1 CKB`
- `decimals`，固定为 `8`
- `symbol`，固定为 `CKB`

#### `nervos.sign_message`

用途：

- 使用当前 Nervos 钱包对指定消息签名

输入：

- `message`
- `encoding`

输出：

- `chain`
- `signature`
- `signingAddress`

#### `nervos.transfer.ckb`

输入：

- `to`
- `toType?`，可选值为 `address` 或 `contact_name`；省略时按 `address` 处理
- `amount`，单位为 `Shannon` 的正整数字符串，`100000000` 表示 `1 CKB`

输出：

- `chain`
- `asset`，固定为 `CKB`
- `operationId`
- `txHash`
- `status`
- `toType`
- `contactName?`
- `resolvedAddress`

说明：

- `toType=contact_name` 时，系统会先解析该联系人在 `Nervos` 下的地址
- 返回结果必须同时给出联系人名称和最终解析地址
- `toType=address` 时不自动反查地址簿，也不回填 `contactName`

#### `nervos.tx_status`

用途：

- 按 `txHash` 查询指定 Nervos 交易当前链上状态
- 供 Agent 在提交转账后自行确认是否已成功上链

输入：

- `txHash`

输出：

- `chain`
- `txHash`
- `status`
- `blockNumber?`
- `blockHash?`
- `confirmations?`
- `reason?`

#### `ethereum.address`

用途：

- 返回当前钱包的 Ethereum 地址

输出：

- `chain`
- `address`

#### `ethereum.balance.eth`

用途：

- 返回当前钱包的 Ethereum 原生 `ETH` 余额

输出：

- `chain`
- `asset`，固定为 `ETH`
- `amount`，单位为 `wei` 的整数字符串，`1000000000000000000` 表示 `1 ETH`
- `decimals`，固定为 `18`
- `symbol`，固定为 `ETH`

#### `ethereum.balance.usdt`

用途：

- 返回当前钱包的 Ethereum `USDT` 余额

输出：

- `chain`
- `asset`，固定为 `USDT`
- `amount`，单位为 USDT 最小单位的整数字符串，`1000000` 表示 `1 USDT`
- `decimals`，固定为 `6`
- `symbol`，固定为 `USDT`

#### `ethereum.balance.usdc`

用途：

- 返回当前钱包的 Ethereum `USDC` 余额

输出：

- `chain`
- `asset`，固定为 `USDC`
- `amount`，单位为 USDC 最小单位的整数字符串，`1000000` 表示 `1 USDC`
- `decimals`，固定为 `6`
- `symbol`，固定为 `USDC`

#### `ethereum.sign_message`

用途：

- 使用当前 Ethereum 钱包对指定消息签名

输入：

- `message`
- `encoding`

输出：

- `chain`
- `signature`
- `signingAddress`

#### `ethereum.transfer.eth`

输入：

- `to`
- `toType?`，可选值为 `address` 或 `contact_name`；省略时按 `address` 处理
- `amount`，单位为 `wei` 的正整数字符串，`1000000000000000000` 表示 `1 ETH`

输出：

- `chain`
- `asset`，固定为 `ETH`
- `operationId`
- `txHash`
- `status`
- `toType`
- `contactName?`
- `resolvedAddress`

说明：

- `toType=contact_name` 时，系统会先解析该联系人在 `Ethereum` 下的地址
- 返回结果必须同时给出联系人名称和最终解析地址
- `toType=address` 时不自动反查地址簿，也不回填 `contactName`

#### `ethereum.transfer.usdt`

输入：

- `to`
- `toType?`，可选值为 `address` 或 `contact_name`；省略时按 `address` 处理
- `amount`，单位为 USDT 最小单位的正整数字符串，`1000000` 表示 `1 USDT`

输出：

- `chain`
- `asset`，固定为 `USDT`
- `operationId`
- `txHash`
- `status`
- `toType`
- `contactName?`
- `resolvedAddress`

说明：

- `toType=contact_name` 时，系统会先解析该联系人在 `Ethereum` 下的地址
- `USDT` 与 `ETH` 共用同一个联系人 `Ethereum` 地址映射
- `toType=address` 时不自动反查地址簿，也不回填 `contactName`

#### `ethereum.transfer.usdc`

输入：

- `to`
- `toType?`，可选值为 `address` 或 `contact_name`；省略时按 `address` 处理
- `amount`，单位为 USDC 最小单位的正整数字符串，`1000000` 表示 `1 USDC`

输出：

- `chain`
- `asset`，固定为 `USDC`
- `operationId`
- `txHash`
- `status`
- `toType`
- `contactName?`
- `resolvedAddress`

说明：

- `toType=contact_name` 时，系统会先解析该联系人在 `Ethereum` 下的地址
- `USDC` 与 `ETH` 共用同一个联系人 `Ethereum` 地址映射
- `toType=address` 时不自动反查地址簿，也不回填 `contactName`

#### `ethereum.tx_status`

用途：

- 按 `txHash` 查询指定 Ethereum 交易当前链上状态
- 供 Agent 在提交转账后自行确认是否已成功上链

输入：

- `txHash`

输出：

- `chain`
- `txHash`
- `status`
- `blockNumber?`
- `blockHash?`
- `confirmations?`
- `reason?`

#### `wallet.operation_status`

用途：

- 返回本地操作编排状态
- 用于查询转账请求在 server 内部的处理进度
- 如果需要按 `txHash` 查询链上状态，应使用 `nervos.tx_status` 或 `ethereum.tx_status`

输入：

- `operationId`

输出：

- `operationId`
- `status`
- `txHash?`
- `errorCode?`
- `errorMessage?`

`wallet.operation_status.status` 的正式取值：

- `RESERVED`
- `SUBMITTED`
- `CONFIRMED`
- `FAILED`

`nervos.tx_status.status` 与 `ethereum.tx_status.status` 的正式取值：

- `NOT_FOUND`
- `PENDING`
- `CONFIRMED`
- `FAILED`

## 4. MCP 返回规范

MCP 返回应满足：

- 成功与失败语义明确
- 错误码稳定
- 不暴露数据库结构
- 不暴露链 SDK 原始对象

建议统一结构：

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

失败时：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "TRANSFER_BUILD_FAILED",
    "message": "..."
  }
}
```

## 5. Owner HTTP API 设计

### 5.1 API 列表

```text
GET    /api/wallet-tools/catalog
POST   /api/wallet-tools/call
POST   /api/owner/auth/login
POST   /api/owner/auth/logout
POST   /api/owner/auth/rotate-credential
GET    /api/owner/credential/status
GET    /api/owner/wallet/current
POST   /api/owner/wallet/import
POST   /api/owner/wallet/export
GET    /api/owner/asset-limits
PUT    /api/owner/asset-limits/{chain}/{asset}
GET    /api/owner/audit-logs
```

### 5.2 Wallet Tools HTTP Gateway

为方便浏览器与 Owner UI 使用，系统额外提供一个面向 `wallet tools` 的简化 HTTP gateway：

- `GET /api/wallet-tools/catalog`
- `POST /api/wallet-tools/call`

其定位是：

- 复用与 MCP 完全相同的钱包工具能力
- 不要求 UI 直接讲 MCP transport 协议
- 是本地 UI / 本地人工操作的 transport adapter，不是第二套业务能力面
- 仅供已登录 Owner UI 使用，要求 `Owner JWT`

该 gateway 不承担 Owner 管理能力，`auth / credential / import / export / audit` 仍走 `owner` API。

### 5.3 Owner Authentication

Owner 登录成功后：

- 返回 `Bearer JWT`
- `Authorization: Bearer <token>`
- 默认有效期 `1 小时`
- 过期后必须重新登录，不提供 refresh token

高风险接口要求：

- 已登录
- 二次确认语义
- 审计记录

### 5.4 Owner Asset Limits

Owner HTTP API 需要提供独立的限额配置能力。

接口：

- `GET /api/owner/asset-limits`
- `PUT /api/owner/asset-limits/{chain}/{asset}`

`GET /api/owner/asset-limits` 返回：

- 当前支持币种的限额配置
- 每个币种当前周期的 `consumedAmount`
- 每个币种当前周期的 `reservedAmount`
- 每个币种当前周期的 `effectiveUsedAmount`
- 当前周期剩余额度
- 当前周期重置时间

说明：

- `effectiveUsedAmount = consumedAmount + reservedAmount`
- `reservedAmount` 表示已预占但尚未最终结算的 Agent 转账额度

`PUT /api/owner/asset-limits/{chain}/{asset}` 输入：

- `dailyLimit?`
- `weeklyLimit?`
- `monthlyLimit?`

要求：

- 金额单位使用该币种最小单位整数字符串
- `null` 表示该周期不限额
- 只允许配置当前支持币种：`CKB`、`ETH`、`USDT`、`USDC`
- 修改限额必须写审计日志
- Owner 自身转账不受这套限额约束

### 5.5 Owner 聚合策略

Owner HTTP API 不提供跨链聚合 `dashboard`。

UI 应在已登录状态下自行组合以下原子能力：

- `wallet-tools/call(name=wallet.current)`
- `wallet-tools/call(name=address_book.list)`
- `wallet-tools/call(name=address_book.search)`
- `wallet-tools/call(name=address_book.lookup_by_address)`
- `wallet-tools/call(name=address_book.get)`
- `wallet-tools/call(name=address_book.get_all)`
- `wallet-tools/call(name=address_book.create)`
- `wallet-tools/call(name=address_book.update)`
- `wallet-tools/call(name=address_book.delete)`
- `credential/status`
- `wallet-tools/call(name=nervos.address)`
- `wallet-tools/call(name=nervos.balance.ckb)`
- `wallet-tools/call(name=ethereum.address)`
- `wallet-tools/call(name=ethereum.balance.eth)`
- `wallet-tools/call(name=ethereum.balance.usdt)`
- `wallet-tools/call(name=ethereum.balance.usdc)`
- `asset-limits`
- `audit-logs`

架构原则：

- 不提供聚合接口
- 不把看板拼装职责下沉为新的后端领域能力
- UI 负责组合展示口径，但必须复用统一能力契约

## 6. 错误模型

统一错误码：

- `VALIDATION_ERROR`
- `AUTH_ERROR`
- `WALLET_NOT_FOUND`
- `WALLET_IMPORT_FAILED`
- `WALLET_EXPORT_FAILED`
- `VAULT_ERROR`
- `CHAIN_UNAVAILABLE`
- `INSUFFICIENT_BALANCE`
- `TRANSFER_BUILD_FAILED`
- `TRANSFER_BROADCAST_FAILED`
- `SIGN_MESSAGE_FAILED`
- `ASSET_LIMIT_EXCEEDED`
- `ADDRESS_BOOK_CONTACT_NOT_FOUND`
- `ADDRESS_BOOK_CONTACT_ALREADY_EXISTS`
- `ADDRESS_BOOK_CONTACT_EMPTY`
- `ADDRESS_BOOK_INVALID_NERVOS_ADDRESS`
- `ADDRESS_BOOK_INVALID_ETHEREUM_ADDRESS`
- `ADDRESS_BOOK_ADDRESS_NOT_FOUND_FOR_CHAIN`

要求：

- MCP 与 Owner HTTP 共用同一错误码集合
- 错误信息对用户可读，对开发者可诊断

当 Agent 转账命中限额时，错误结构中必须包含 `limit` 信息：

- `chain`
- `asset`
- `window`
- `limitAmount`
- `usedAmount`
- `requestedAmount`
- `remainingAmount`
- `resetsAt`

## 7. 权限边界

### 7.1 Agent

允许：

- 查询当前钱包
- 查询地址簿列表
- 搜索地址簿
- 按精确地址查询匹配联系人
- 查看单个联系人
- 查看全部联系人
- 创建联系人
- 更新联系人
- 删除联系人
- 查询 Nervos 地址
- 查询 Nervos CKB 余额
- Nervos 消息签名
- Nervos CKB 转账
- 查询 Ethereum 地址
- 查询 Ethereum ETH 余额
- 查询 Ethereum USDT 余额
- 查询 Ethereum USDC 余额
- Ethereum 消息签名
- Ethereum ETH 转账
- Ethereum USDT 转账
- Ethereum USDC 转账
- 查询操作状态
- 查询 Nervos 交易状态
- 查询 Ethereum 交易状态

禁止：

- 修改凭证
- 导入恢复
- 导出私钥
- 查看审计日志

### 7.2 Owner

允许：

- 包含全部 Agent 能力
- 凭证管理
- 钱包导入恢复
- 私钥导出
- 币种限额配置
- 审计日志查看

## 8. 接口设计约束

开发时必须遵守：

- 不新增独立语义的 Agent HTTP API
- 如需提供本地 HTTP gateway，必须只复用 wallet tool registry，不允许扩展出第二套业务能力面
- 不把 UI 页面直接绕过应用层访问数据库
- 不让接口返回链 SDK 的原始响应
- 不让私钥或 `DEK`/`KEK` 信息出现在任何接口输出中

## 9. Tool 粒度原则

钱包操作不做对外通用能力抽象。

要求：

- 一个 tool 只专注一件事
- 一个 tool 只对应一个明确动作和一个明确资产范围
- 当前需求基线支持什么，就定义什么 tool
- 后续新增币种或动作时，新增新的明确 tool，而不是把已有 tool 扩成万能入口
- 地址簿的列表、搜索、按地址查询、详情、创建、更新、删除必须保持独立 tool，不合并成万能 `address_book.manage`
