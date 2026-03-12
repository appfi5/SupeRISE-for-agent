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
3. `nervos.address`
4. `nervos.balance.ckb`
5. `nervos.sign_message`
6. `nervos.transfer.ckb`
7. `nervos.tx_status`
8. `ethereum.address`
9. `ethereum.balance.eth`
10. `ethereum.balance.usdt`
11. `ethereum.balance.usdc`
12. `ethereum.sign_message`
13. `ethereum.transfer.eth`
14. `ethereum.transfer.usdt`
15. `ethereum.transfer.usdc`
16. `ethereum.tx_status`

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
- `amount`，单位为 `Shannon` 的正整数字符串，`100000000` 表示 `1 CKB`

输出：

- `chain`
- `asset`，固定为 `CKB`
- `operationId`
- `txHash`
- `status`

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
- `amount`，单位为 `wei` 的正整数字符串，`1000000000000000000` 表示 `1 ETH`

输出：

- `chain`
- `asset`，固定为 `ETH`
- `operationId`
- `txHash`
- `status`

#### `ethereum.transfer.usdt`

输入：

- `to`
- `amount`，单位为 USDT 最小单位的正整数字符串，`1000000` 表示 `1 USDT`

输出：

- `chain`
- `asset`，固定为 `USDT`
- `operationId`
- `txHash`
- `status`

#### `ethereum.transfer.usdc`

输入：

- `to`
- `amount`，单位为 USDC 最小单位的正整数字符串，`1000000` 表示 `1 USDC`

输出：

- `chain`
- `asset`，固定为 `USDC`
- `operationId`
- `txHash`
- `status`

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
