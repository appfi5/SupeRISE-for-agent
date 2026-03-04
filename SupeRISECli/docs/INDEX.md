# Documentation Index

> All requirements, design, and API documentation for the SupeRISE CLI project is located under the `docs/` directory.

## Project-Level

| Document | Description |
|----------|-------------|
| [DESIGN.md](./DESIGN.md) | Overall project design: architecture, command structure, MCP Server, storage strategy |
| [BUILD.md](./BUILD.md) | Build guide: binary compilation, local test server |

## Sustain (Keep-Alive System)

| Document | Description |
|----------|-------------|
| [sustain/REQUIREMENTS.md](./sustain/REQUIREMENTS.md) | Sustain requirements v4 — core design principles, balance billing model, functional requirements |
| [sustain/DESIGN.md](./sustain/DESIGN.md) | Sustain design document — layered architecture, MCP design principles, CLI business logic layer |
| [sustain/AUTH_FLOW.md](./sustain/AUTH_FLOW.md) | Market auth flow — gen-sign-message → signMessage → login-for-agent |
| [sustain/API.md](./sustain/API.md) | Market platform API — user management, model catalog, quotation queries, top-up orders |
| [sustain/swagger.json](./sustain/swagger.json) | Market platform API specification (OpenAPI) |

## Sign Server (Local Signing Service)

| Document | Description |
|----------|-------------|
| [Swagger API](http://localhost:18799/superise-for-agent/swagger/v1/swagger.json) | Sign Server API specification (requires local service running) |

Sign Server default address: `http://127.0.0.1:18799`

APIs used:
- `GET /api/v1/agent/key-config/list` — Account info (use `data[0]`, contains addressType, address, publicKey)
- `POST /api/v1/agent/sign/sign-message` — Message signing (request: `{address, message}`, response: `{address, signature}`)
- `POST /api/v1/agent/sign/sign-ckb-transaction` — CKB transaction signing (request: `{address, content}`, response: `{address, content, txHash}`)

The `address` used for signing is `data[0].address` from `key-config/list` (equivalent to `rise whoami`).

## Other Documents (Outside docs/)

| Document | Location | Description |
|----------|----------|-------------|
| [README.md](../README.md) | Project root | Project README, quick start, command reference |
| [skills/superise-cli/SKILL.md](../skills/superise-cli/SKILL.md) | skills/ | Agent skill definition |
