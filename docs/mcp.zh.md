# MCP 接入说明

SupeRISE Agent Wallet 是一个面向 Agent 的本地钱包服务。Agent 通过 `POST /mcp` 这个 MCP 端点接入。

English version: [mcp.md](./mcp.md).

本文档用于解释工具面的语义与运维边界；实际契约仍应以 `tools/list` 为准。Swagger 只描述 Owner HTTP API，并不是 Agent 集成契约来源。

## 端点契约

- 端点：`POST /mcp`
- 支持的方法：仅 `POST`
- 必需 `Accept`：`application/json, text/event-stream`
- 必需 `Content-Type`：`application/json`
- `GET /mcp` 与 `DELETE /mcp` 会返回 `405`

`/mcp` 是协议端点，应通过 MCP 客户端或 MCP Inspector 使用，而不是当作 Swagger 风格的手工表单接口来调用。

## 推荐调用流程

1. 发送 `initialize`
2. 发送 `notifications/initialized`
3. 发送 `tools/list`
4. 发送 `tools/call`

本地调试建议优先使用 `@modelcontextprotocol/inspector`。

## `tools/list` 是权威契约源

当前实现会为每个工具公开：

- `title`
- `description`
- `inputSchema`
- `outputSchema`
- `annotations`

外部 Agent 应优先依赖这些元数据发现和校验工具行为，再结合本文档理解高层语义与运维背景。

## 当前工具分组

### Wallet

- `wallet.current`
- `wallet.operation_status`

### Address Book

- `address_book.list`
- `address_book.search`
- `address_book.lookup_by_address`
- `address_book.get`
- `address_book.get_all`
- `address_book.create`
- `address_book.update`
- `address_book.delete`

### Nervos

- `nervos.address`
- `nervos.balance.ckb`
- `nervos.sign_message`
- `nervos.transfer.ckb`
- `nervos.tx_status`

### Ethereum

- `ethereum.address`
- `ethereum.balance.eth`
- `ethereum.balance.usdt`
- `ethereum.balance.usdc`
- `ethereum.sign_message`
- `ethereum.transfer.eth`
- `ethereum.transfer.usdt`
- `ethereum.transfer.usdc`
- `ethereum.tx_status`

## 工具与状态语义

- 当前支持资产为 Nervos `CKB`，以及 Ethereum `ETH`、`USDT`、`USDC`
- `amount` 一律是资产最小单位的整数字符串
- `nervos.balance.ckb` 与 `nervos.transfer.ckb` 使用 `Shannon`
- `ethereum.balance.eth` 与 `ethereum.transfer.eth` 使用 `wei`
- `ethereum.balance.usdt` 与 `ethereum.transfer.usdt` 使用 USDT 最小单位
- `ethereum.balance.usdc` 与 `ethereum.transfer.usdc` 使用 USDC 最小单位
- 余额查询结果会返回 `amount`、`decimals` 与 `symbol`
- transfer 工具返回的是服务端已接受并开始处理该操作的结果，不表示链上最终确认
- `wallet.operation_status` 反映本地编排状态：`RESERVED`、`SUBMITTED`、`CONFIRMED`、`FAILED`
- `nervos.tx_status` 与 `ethereum.tx_status` 反映链上观察状态：`NOT_FOUND`、`PENDING`、`CONFIRMED`、`FAILED`
- 一次转账后，通常需要同时轮询 `wallet.operation_status` 与对应链的 `tx_status` 以跟踪内部进度和链上最终结果
- 当 Agent 转账命中按资产限额时，transfer 工具会返回 `ASSET_LIMIT_EXCEEDED`
- 限额按资产独立执行，并按日、周、月窗口统计
- 地址簿工具只管理本地共享联系人；`address_book.lookup_by_address` 只表示本地地址簿中的匹配结果，不表示链上真实归属
- 四个 transfer 工具都支持可选 `toType`
- `toType=address` 表示 `to` 是原始链地址；省略 `toType` 时默认按此模式处理
- `toType=contact_name` 表示 `to` 是联系人名称；服务端会在转账前解析成当前链的最终地址
- `toType=address` 不会自动反查地址簿，也不会回填联系人名称

## 安全与运行说明

- `/mcp` 默认无鉴权
- 服务应只运行在受信任的本地或私有网络中
- 不应将 `/mcp` 直接暴露到公网
- 如果需要对外发布 Docker 端口，优先绑定到 `127.0.0.1`
- 打开 `/docs` 不会改变 MCP 契约；它只会暴露 Owner HTTP API 的 Swagger
