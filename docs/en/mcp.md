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

Security boundary:

- `/mcp` is unauthenticated by default
- the service should run only on trusted local or private networks
- `/mcp` must not be exposed directly to the public Internet

## Current Tool Set

- `wallet.current`
- `wallet.operation_status`
- `address_book.list`
- `address_book.search`
- `address_book.lookup_by_address`
- `address_book.get`
- `address_book.get_all`
- `address_book.create`
- `address_book.update`
- `address_book.delete`
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

## Tool Semantics

- Supported assets are Nervos `CKB`, plus Ethereum `ETH`, `USDT`, and `USDC`
- `amount` is always an integer string in the asset's smallest unit
- `nervos.balance.ckb` and `nervos.transfer.ckb` use `Shannon`
- `ethereum.balance.eth` and `ethereum.transfer.eth` use `wei`
- `ethereum.balance.usdt` and `ethereum.transfer.usdt` use the smallest USDT unit
- `ethereum.balance.usdc` and `ethereum.transfer.usdc` use the smallest USDC unit
- balance responses include `amount`, `decimals`, and `symbol`
- transfer tools return results that mean the server accepted and started processing the transfer, not final on-chain confirmation
- `wallet.operation_status` returns local orchestration states: `RESERVED`, `SUBMITTED`, `CONFIRMED`, `FAILED`
- `nervos.tx_status` and `ethereum.tx_status` return observed chain states: `NOT_FOUND`, `PENDING`, `CONFIRMED`, `FAILED`
- after a transfer, you will typically poll both `wallet.operation_status` and the chain-specific `tx_status` to follow internal progress and final on-chain outcome
- when an Agent transfer hits a per-asset limit, the transfer tool returns `ASSET_LIMIT_EXCEEDED`; limits are enforced independently per asset across daily / weekly / monthly windows
- address-book tools manage shared contacts; `address_book.lookup_by_address` only answers which contact names match in the local address book and does not claim real on-chain ownership
- all four transfer tools accept optional `toType`
  - `toType=address` means `to` is a raw chain address; omitted defaults to this mode
  - `toType=contact_name` means `to` is a contact name; the server resolves it on the current chain before transfer
  - `toType=address` does not auto-lookup the address book and does not backfill a contact name
