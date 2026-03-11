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

## 当前工具集合

- `wallet.current`
- `wallet.operation_status`
- `nervos.address`
- `nervos.balance.ckb`
- `nervos.sign_message`
- `nervos.transfer.ckb`
- `ethereum.address`
- `ethereum.balance.eth`
- `ethereum.balance.usdt`
- `ethereum.sign_message`
- `ethereum.transfer.eth`
- `ethereum.transfer.usdt`

## 工具语义

- `amount` 一律是资产最小单位的整数字符串
- `nervos.balance.ckb` 和 `nervos.transfer.ckb` 使用 `Shannon`
- `ethereum.balance.eth` 使用 `wei`
- `ethereum.transfer.eth` 使用 `wei`
- `ethereum.balance.usdt` 和 `ethereum.transfer.usdt` 使用 USDT 最小单位
- 余额查询结果会返回 `decimals`
- transfer 工具返回的是提交结果，不表示最终确认；应继续调用 `wallet.operation_status`
