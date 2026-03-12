# MCP 接入说明

本项目首先面向 Agent 使用。正式的 Agent 接入面是 MCP。

英文版本见 [docs/en/mcp.md](./en/mcp.md)。

## MCP 入口

- 传输端点：`POST /mcp`
- 请求方法：仅支持 `POST`
- 必需 `Accept`：`application/json, text/event-stream`
- 必需 `Content-Type`：`application/json`

`/mcp` 是协议端点，应该通过 MCP 客户端或 MCP Inspector 使用，而不是当作 Swagger 风格的普通 HTTP 表单接口来调用。

## 推荐调用流程

1. 发送 `initialize`
2. 发送 `notifications/initialized`
3. 发送 `tools/list`
4. 发送 `tools/call`

本地调试建议优先使用 `@modelcontextprotocol/inspector`。

`tools/list` 是 Agent 的权威契约源。当前实现会在 `tools/list` 中直接暴露每个工具的：

- `title`
- `description`
- `inputSchema`
- `outputSchema`
- `annotations`

外部 Agent 应优先依赖这些元数据理解工具，而不是依赖其他本地管理入口或 Swagger。

安全边界说明：

- `/mcp` 默认无鉴权
- 该服务应只运行在受信任的本地或私有网络环境中
- 不应将 `/mcp` 直接暴露到公网

## 当前工具集合

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

## 工具语义

- 当前支持资产为 Nervos `CKB`，以及 Ethereum `ETH`、`USDT`、`USDC`
- `amount` 一律是资产最小单位的整数字符串
- `nervos.balance.ckb` 和 `nervos.transfer.ckb` 使用 `Shannon`
- `ethereum.balance.eth` 和 `ethereum.transfer.eth` 使用 `wei`
- `ethereum.balance.usdt` 和 `ethereum.transfer.usdt` 使用 USDT 最小单位
- `ethereum.balance.usdc` 和 `ethereum.transfer.usdc` 使用 USDC 最小单位
- 余额查询结果会返回 `amount`、`decimals`、`symbol`
- transfer 工具返回的是 server 已接受并开始处理的提交结果，不表示最终链上确认
- `wallet.operation_status` 返回本地操作状态：`RESERVED`、`SUBMITTED`、`CONFIRMED`、`FAILED`
- `nervos.tx_status` 与 `ethereum.tx_status` 返回链上观察状态：`NOT_FOUND`、`PENDING`、`CONFIRMED`、`FAILED`
- 一次转账后，通常需要同时使用 `wallet.operation_status` 与对应链的 `tx_status` 跟踪内部进度和链上最终结果
- 当 Agent 转账命中按资产限额时，transfer 工具会返回 `ASSET_LIMIT_EXCEEDED`；限额按资产独立执行，并按日 / 周 / 月窗口统计
