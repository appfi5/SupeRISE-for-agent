# MCP Integration

SupeRISE Agent Wallet is a local wallet service for agents. Agents connect through `MCP` at `POST /mcp`.

中文版本见 [mcp.zh.md](./mcp.zh.md)。

Use this document as a semantic guide, but treat `tools/list` as the live contract. Swagger documents only the Owner HTTP API and is not the source of truth for Agent integrations.

## Endpoint Contract

- Endpoint: `POST /mcp`
- Supported method: `POST` only
- Required `Accept`: `application/json, text/event-stream`
- Required `Content-Type`: `application/json`
- `GET /mcp` and `DELETE /mcp` return `405`

`/mcp` is a protocol endpoint. Use an MCP client or MCP Inspector instead of Swagger-style manual form calls.

## Recommended Client Workflow

1. Send `initialize`
2. Send `notifications/initialized`
3. Send `tools/list`
4. Send `tools/call`

For local inspection, prefer `@modelcontextprotocol/inspector`.

## `tools/list` Is The Source Of Truth

The current implementation exposes each tool's:

- `title`
- `description`
- `inputSchema`
- `outputSchema`
- `annotations`

External Agents should discover and validate tool behavior from this metadata first, then use this document for high-level semantics and operational context.

## Current Tool Groups

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

- `nervos.identity`
- `nervos.balance.ckb`
- `nervos.sign_message`
- `nervos.transfer.ckb`
- `nervos.tx_status`

### Ethereum

- `ethereum.identity`
- `ethereum.balance.eth`
- `ethereum.balance.usdt`
- `ethereum.balance.usdc`
- `ethereum.sign_message`
- `ethereum.transfer.eth`
- `ethereum.transfer.usdt`
- `ethereum.transfer.usdc`
- `ethereum.tx_status`

## Tool And State Semantics

- Supported assets are Nervos `CKB`, plus Ethereum `ETH`, `USDT`, and `USDC`
- `amount` is always an integer string in the asset's smallest unit
- `nervos.balance.ckb` and `nervos.transfer.ckb` use `Shannon`
- `ethereum.balance.eth` and `ethereum.transfer.eth` use `wei`
- `ethereum.balance.usdt` and `ethereum.transfer.usdt` use the smallest USDT unit
- `ethereum.balance.usdc` and `ethereum.transfer.usdc` use the smallest USDC unit
- `nervos.identity` and `ethereum.identity` return the chain address plus the same-chain `publicKey`
- Balance responses include `amount`, `decimals`, and `symbol`
- `nervos.sign_message` and `ethereum.sign_message` return `signature`, `signingAddress`, and `publicKey`
- Transfer tools return the server-side acceptance result for a submitted operation, not final chain confirmation
- `wallet.operation_status` reports local orchestration states: `RESERVED`, `SUBMITTED`, `CONFIRMED`, `FAILED`
- `nervos.tx_status` and `ethereum.tx_status` report observed chain states: `NOT_FOUND`, `PENDING`, `CONFIRMED`, `FAILED`
- After a transfer, poll both `wallet.operation_status` and the chain-specific `tx_status` tool to follow internal progress and final on-chain outcome
- If an Agent transfer exceeds a configured per-asset limit, the transfer tool returns `ASSET_LIMIT_EXCEEDED`
- Limits are enforced independently per asset across daily, weekly, and monthly windows
- Address-book tools manage local shared contacts; `address_book.lookup_by_address` reports only local matches and does not claim real on-chain ownership
- All four transfer tools accept optional `toType`
- `toType=address` means `to` is a raw chain address; omitting `toType` defaults to this mode
- `toType=contact_name` means `to` is a contact name; the server resolves the final chain address before transfer
- `toType=address` does not perform reverse address-book lookup and does not backfill a contact name

## Security And Operating Notes

- `/mcp` is unauthenticated by default
- Run the service only on trusted local or private networks
- Do not expose `/mcp` directly to the public Internet
- If you publish the Docker port at all, prefer binding to `127.0.0.1`
- Enabling `/docs` does not change the MCP contract; it only exposes Swagger for the Owner HTTP API
