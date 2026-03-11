# 02 系统上下文与部署拓扑

## 1. 文档目的

本文档定义系统外部边界、进程边界、部署拓扑和运行上下文。目标是明确“系统由哪些部分组成、如何连接、哪些组件属于本期必须实现的正式形态”。

## 2. 系统上下文

本系统服务两个对象：

- `Agent`：通过 `MCP` 使用钱包能力
- `Owner`：通过本地 Web UI 接管钱包并执行高权限操作

本系统依赖三个外部环境：

- `CKB RPC / indexer`
- `ETH RPC`
- `宿主机文件系统 / docker secrets`

系统上下文图：

```text
┌────────────┐        MCP         ┌──────────────────────────┐
│   Agent    │──────────────────▶│  Wallet Server (NestJS)  │
└────────────┘                   │  - MCP tools             │
                                 │  - Owner HTTP API        │
┌────────────┐   HTTP localhost  │  - Wallet application    │
│   Owner    │──────────────────▶│  - Vault                 │
└────────────┘                   └───────────▲──────────────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                         ▼                   ▼                   ▼
                    SQLite DB           CKB RPC / SDK       ETH RPC / SDK
                         │
                         ▼
                 KEK file / docker secret
```

## 3. 正式部署形态

本期正式部署形态是本地单机服务。

必备组件：

- 一个 `NestJS` 服务进程
- 一个由该服务托管的 Owner Web UI 静态站点
- 一个本地 `SQLite` 数据库文件
- 一个外部提供的 `KEK`

本期不包含：

- 多实例部署
- 服务间 RPC
- 分布式锁
- 独立签名进程
- 远程托管 Vault

## 4. 进程边界

### 4.1 单进程原则

本期默认一个业务进程：

- `wallet-server`

在该进程内同时承载：

- MCP 服务
- Owner HTTP API
- 静态 UI 托管
- 业务用例编排
- 本地签名
- 审计记录

原因：

- 单钱包单用户场景不需要多进程分布
- 零 setup 和最少运维路径比水平扩展更重要

### 4.2 非进程边界

下面这些不是独立进程：

- `Vault`
- `MCP Module`
- `Ckb Adapter`
- `Evm Adapter`
- `Audit`

它们是进程内模块，不是单独服务。

## 5. 网络边界

### 5.1 内部监听

Owner HTTP API 默认只监听：

- `127.0.0.1`

MCP 默认为本地进程使用，不设计为公网接口。

### 5.2 外部依赖

系统主动访问：

- `CKB` 节点 RPC
- `ETH` 节点 RPC

系统不主动暴露：

- 公网钱包 API
- Agent HTTP API

## 6. docker 与非 docker 拓扑

### 6.1 docker-compose

```text
宿主机
  ├─ docker compose
  │   └─ wallet-server container
  │       ├─ NestJS
  │       ├─ UI static files
  │       ├─ sqlite volume
  │       └─ /run/secrets/wallet_kek
  └─ CKB / ETH RPC
```

### 6.2 非 docker

```text
宿主机
  ├─ systemd / pm2 / 手工运行
  │   └─ wallet-server process
  │       ├─ NestJS
  │       ├─ UI static files
  │       ├─ sqlite file
  │       └─ WALLET_KEK_PATH 指向的受控文件
  └─ CKB / ETH RPC
```

## 7. 运行时启动顺序

启动顺序固定如下：

1. 读取配置
2. 读取 `KEK`
3. 初始化数据库
4. 执行启动自检
5. 检查或生成当前钱包
6. 检查或生成默认 Owner 凭证
7. 启动 MCP 服务
8. 启动 Owner HTTP API
9. 提供静态 UI

## 8. 本期架构边界结论

本期系统边界可以概括为一句话：

`一个本地 NestJS 钱包服务，为 Agent 提供 MCP，为 Owner 提供本地 HTTP/UI，并通过本地 SQLite 与外部 KEK 管理单钱包生命周期。`
