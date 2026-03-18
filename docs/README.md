# Documentation

This directory contains the external documentation for SupeRISE Agent Wallet, a local wallet service for agents that uses `MCP` for integration.

中文版本见 [README.zh.md](./README.zh.md)。

## Choose By Goal

- I want to integrate an agent through MCP: [MCP Integration](./mcp.md)
- I want to deploy or operate the service: [Deployment](./deployment.md)
- I want to publish images or cut a release: [Release Guide](./release.md)
- I want to customize or extend the project: [Development](./development.md)

The service also includes a local operator surface for human-managed wallet actions, limits, and credential handling. See the deployment guide when you need that workflow.

## Public Runtime Surfaces

- `POST /mcp`: Agent integration surface
- `GET /health`: runtime health probe
- `/`: local Owner web UI
- `/api/owner/*`: local Owner HTTP API
- `/docs` and `/docs-json`: optional Swagger for the Owner HTTP API when `ENABLE_API_DOCS=true`
