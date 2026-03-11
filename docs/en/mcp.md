# MCP Integration

This project is designed for Agent use first. The formal Agent integration surface is MCP.

The default Chinese version is available at [docs/mcp.md](../mcp.md).

## MCP Endpoint

- Transport endpoint: `POST /mcp`
- Method: `POST` only
- Required `Accept`: `application/json, text/event-stream`
- Required `Content-Type`: `application/json`

`/mcp` is a protocol endpoint. It should be used by an MCP client or by the MCP Inspector, not by Swagger-style manual HTTP forms.

## Recommended Client Workflow

1. Send `initialize`
2. Send `notifications/initialized`
3. Send `tools/list`
4. Send `tools/call`

For local inspection, prefer `@modelcontextprotocol/inspector`.

`tools/list` is the authoritative contract for agents. The current implementation exposes each tool's:

- `title`
- `description`
- `inputSchema`
- `outputSchema`
- `annotations`

External agents should rely on this metadata first instead of relying on other local management surfaces or Swagger.

## Current Tool Set

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

## Tool Semantics

- `amount` is always an integer string in the asset's smallest unit
- `nervos.balance.ckb` and `nervos.transfer.ckb` use `Shannon`
- `ethereum.balance.eth` uses `wei`
- `ethereum.transfer.eth` uses `wei`
- `ethereum.balance.usdt` and `ethereum.transfer.usdt` use the smallest USDT unit
- balance responses include `decimals`
- transfer tools return submission results, not final confirmation; continue polling with `wallet.operation_status`
