# Documentation

This directory contains user-facing documentation in English.

Chinese remains the default language. The default entry is [docs/README.md](../README.md).

## Read By Topic

- Agent integration: [MCP](./mcp.md)
- Deployment and runtime operations: [Deployment](./deployment.md)

## Current Coverage

- the MCP tool surface, including the boundary between `wallet.operation_status` and chain-specific `tx_status`
- Owner local-management capabilities, including wallet views, transfers, and per-asset daily / weekly / monthly limits
- deployment and runtime configuration for `USDT` / `USDC`, background settlement polling, and health checks

## Scope

`docs/` is reserved for materials that explain how to use, integrate, deploy, and operate the project.

Internal management surfaces, implementation details, product requirements, architecture, and internal contracts live separately under [`design/`](../../design/README.md).
