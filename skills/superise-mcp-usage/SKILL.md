---
name: superise-mcp-usage
description: Connect to and use Superise through the standard MCP protocol. Use this when the task is to validate MCP connectivity, inspect live tool metadata, list tools, call tools, or operate the wallet through a standard MCP client or manual Streamable HTTP requests.
---

# Superise MCP Usage

## Goal

Confirm that Superise MCP is reachable and interact with it using the standard MCP protocol.

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

## Source of Truth

Treat `tools/list` as the authority for:

- tool names
- descriptions
- input schemas
- output schemas
- annotations

Prefer live metadata over cached assumptions.

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
- Use it only on localhost or trusted private networks.
- Do not expose `/mcp` publicly.
- Do not use write tools as exploratory probes.
- Do not assume Swagger or any UI is required for MCP operation.
