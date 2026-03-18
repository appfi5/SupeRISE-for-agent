# 使用文档

本目录存放 SupeRISE Agent Wallet 的对外文档。该项目是一个面向 Agent 的本地钱包服务，并使用 `MCP` 进行接入。

English version: [README.md](./README.md).

## 按目标选择

- 我想通过 MCP 接入 Agent： [MCP 接入说明](./mcp.zh.md)
- 我想部署或运维服务： [部署说明](./deployment.zh.md)
- 我想发布镜像或执行 release： [发布说明](./release.zh.md)
- 我想做定制开发或二次开发： [开发说明](./development.zh.md)

服务还包含一个供真人操作的钱包本地操作面，可用于钱包操作、限额管理和凭证处理；需要这类流程时请查看部署文档。

## 对外运行时入口

- `POST /mcp`：Agent 接入面
- `GET /health`：运行时健康检查入口
- `/`：本地 Owner Web UI
- `/api/owner/*`：本地 Owner HTTP API
- `/docs` 与 `/docs-json`：仅在 `ENABLE_API_DOCS=true` 时启用的 Owner HTTP API Swagger
