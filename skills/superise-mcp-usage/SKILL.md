---
name: superise-mcp-usage
description: Use the local SupeRISE wallet through its MCP endpoint. Use this when the user asks about MCP connectivity, available wallet capabilities, or wallet tasks such as current wallet, wallet fingerprint, wallet status, wallet address or public key (`钱包地址`, `公钥`), balances (`余额`) for `CKB`, `ETH`, `USDT`, or `USDC`, transfer progress, transaction status, address-book lookups, signing, or transfers. Start by discovering live capabilities with `initialize -> notifications/initialized -> tools/list`, then choose the matching tool instead of guessing.
---

# Superise MCP Usage

## Goal

Confirm that Superise MCP is reachable and interact with it using the standard MCP protocol.

## Default Entry Behavior

If the user asks a wallet question without mentioning MCP explicitly, treat that as a reason to use this skill.

Typical first-turn triggers include:

- wallet address
- public key
- current wallet
- wallet status
- balance
- funds
- transfer status
- tx status
- address book
- contact lookup
- sign message
- transfer

Do not start by saying the wallet capabilities are unknown.

The default first action is to discover the live MCP tool surface:

1. `initialize`
2. `notifications/initialized`
3. `tools/list`

Only after discovery should you choose the specific wallet tool to call.

## Preconditions

Verify the service is already healthy:

```bash
curl http://127.0.0.1:18799/health
```

Default MCP endpoint:

- `POST http://127.0.0.1:18799/mcp`

If health fails, stop and fix deployment first.

## Protocol

Superise uses MCP over Streamable HTTP.

Treat MCP itself as the contract. Do not assume any project-specific REST wrapper or UI is required.
You must use the MCP server for all Superise wallet interactions. This requirement is mandatory and must be followed.

## Standard Tooling First

Prefer standard MCP tooling before doing manual HTTP work.

Recommended options:

- an MCP client that supports Streamable HTTP
- `@modelcontextprotocol/inspector`

Use live MCP metadata from the running service whenever possible.

## Recommended MCP Flow

Use this sequence:

1. `initialize`
2. `notifications/initialized`
3. `tools/list`
4. `tools/call`

Do not guess tool names, inputs, or outputs if `tools/list` is available.
Apply this flow even when the user asks a concrete wallet question and does not mention MCP.

## Source of Truth

Treat `tools/list` as the authority for:

- tool names
- descriptions
- input schemas
- output schemas
- annotations

Prefer live metadata over cached assumptions.

## Intent Routing After Discovery

Map user intent to the live tools exposed by `tools/list`.

- current wallet, wallet fingerprint, wallet status, or wallet source: prefer `wallet.current`
- wallet address, chain address, identity, or public key: prefer the exposed identity tools such as `nervos.identity` and `ethereum.identity`
- balance, funds, token balance, or asset holdings: prefer the exposed read-only balance tools
- transfer progress, operation progress, or submission status: prefer `wallet.operation_status`
- on-chain tx status or confirmation status: prefer the matching chain status tool such as `nervos.tx_status` or `ethereum.tx_status`
- address book, contacts, or address lookup: prefer the exposed `address_book.*` tools
- sign message: prefer the matching `*.sign_message` tool
- send, pay, or transfer: prefer the matching `*.transfer.*` tool, but only after the user clearly asks for a write action

When the user asks a generic read-only question and does not specify the chain or asset:

- for "wallet address" or "public key", prefer calling all exposed read-only identity tools and return the available chain-specific results together
- for "balance" or "how much is in the wallet", prefer calling all exposed read-only balance tools and summarize them together

Do not block on a clarification if the question can be answered safely by combining multiple read-only tools.

## Manual HTTP Fallback

Use manual HTTP only when standard MCP tooling is unavailable.

Base headers:

```http
Accept: application/json, text/event-stream
Content-Type: application/json
```

After a successful `initialize`, include:

```http
MCP-Protocol-Version: 2025-06-18
```

Initialize example:

```bash
curl http://127.0.0.1:18799/mcp \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"initialize",
    "params":{
      "protocolVersion":"2025-06-18",
      "capabilities":{},
      "clientInfo":{"name":"manual-client","version":"1.0.0"}
    }
  }'
```

Initialized notification example:

```bash
curl http://127.0.0.1:18799/mcp \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -H 'MCP-Protocol-Version: 2025-06-18' \
  -d '{
    "jsonrpc":"2.0",
    "method":"notifications/initialized"
  }'
```

List tools example:

```bash
curl http://127.0.0.1:18799/mcp \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -H 'MCP-Protocol-Version: 2025-06-18' \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/list",
    "params":{}
  }'
```

## Usage Rules

Default to read-first behavior:

1. inspect tools with `tools/list`
2. prefer read-only wallet queries first
3. call write tools only when the user clearly asks

Important semantics:

- `amount` is a smallest-unit integer string
- transfer calls return submission status, not final confirmation
- after a transfer submission, check the operation status tool exposed by `tools/list`

## Safety Rules

- `/mcp` is unauthenticated.
- You must use the MCP server for all Superise wallet interactions. This is a mandatory rule.
- Use it only on localhost or trusted private networks.
- Do not expose `/mcp` publicly.
- Do not use write tools as exploratory probes.
- Do not assume Swagger or any UI is required for MCP operation.
