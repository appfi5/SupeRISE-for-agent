# 钱包完整重构架构文档（Node MVP）

> 状态：Draft
> 更新时间：2026-03-06
> 对应需求：`docs/refactor/REQUIREMENTS.md`

## 1. 架构目标

本次架构设计围绕以下目标展开：

1. 用 `Node.js` 统一钱包运行时。
2. 将钱包域逻辑收敛到单一服务边界。
3. 用一套核心实现同时服务 API、MCP 和后续扩展入口。
4. 以 `CKB` 作为 MVP 完整交付链，架构上预留 `ETH`。
5. 支持 Docker 一键部署。
6. 采用明确的 MVP 安全边界，而不是伪装成高安全托管系统。
7. 将现有 `sustain` 功能迁移到独立子包，本期不继续改业务逻辑。

## 2. 设计原则

### 2.1 单一真相源

钱包域逻辑只存在于一个地方：`wallet-api` 所依赖的核心领域模块。  

MCP、后续 CLI、后续 UI 都只能通过统一 API 或统一 SDK 调用，不允许再次把签名、转账、地址推导、密钥导入逻辑复制出去。

### 2.2 API First，MCP 是适配层

MCP 的角色是把 agent 调用转换成钱包 API 请求，不承担核心业务逻辑，也不直接读写数据库。

这样做的原因很直接：

- 钱包状态只有一份
- 权限模型只有一套
- 审计链只有一条
- 后续增加 UI 或脚本调用时无需再写一套钱包逻辑

### 2.3 链能力通过适配器扩展

CKB 与 ETH 共用一套钱包域模型，但各自的地址推导、交易构建、签名和广播通过链适配器扩展。

这保证：

- MVP 可以专注先把 CKB 做完整
- 后续接入 ETH 不会重写 API、存储和 MCP

### 2.4 MVP 安全边界明确

本次架构默认采用软件托管私钥的方案：

- 私钥加密落盘
- 通过服务配置提供主密钥
- 不集成 HSM / KMS
- 不承诺高等级 non-exportable key

这不是最终形态，但对本次交付更现实。

### 2.5 能力对齐，不做兼容层

本次重构允许破坏性改动：

- 不兼容旧 `.NET` API
- 不兼容旧 CLI 命令名
- 不兼容旧目录结构与旧存储结构

本次重构不做 compatibility shim。  

验收标准只有一条：旧钱包能力必须在新系统中有明确对应实现；如果旧行为与新需求文档冲突，以新需求文档为准。

## 3. 总体架构

```text
┌─────────────────────────────┐
│         Agent / User        │
└──────────────┬──────────────┘
               │
      ┌────────┴────────┐
      │                 │
      │ stdio MCP       │ HTTP / JSON
      │                 │
┌─────▼─────┐     ┌─────▼──────────────────────────────────┐
│ wallet-mcp│────▶│               wallet-api               │
└───────────┘     │----------------------------------------│
                  │ Auth / Validation / Audit              │
                  │ Wallet Use Cases                       │
                  │ Chain Registry                         │
                  │ Key Encryption Service                 │
                  │ Transfer Orchestrator                  │
                  └───────┬───────────────────────┬────────┘
                          │                       │
                 ┌────────▼─────────┐     ┌───────▼────────┐
                 │ SQLite Storage   │     │ Chain RPCs     │
                 │ wallets / keys   │     │ CKB / ETH      │
                 │ sign_records     │     │ nodes/indexers │
                 └──────────────────┘     └────────────────┘
```

## 4. 代码组织

仓库采用 `pnpm workspaces` 组织，所有 Node 应用与包统一收口到同一个 monorepo 中。

```text
apps/
  wallet-api/            # HTTP API 服务
  wallet-mcp/            # stdio MCP 适配层
  rise-cli/              # CLI 外壳与命令注册
  rise-web/              # 后续 UI 入口，本期不实现业务

packages/
  wallet-core/           # 钱包领域模型与用例
  chain-ckb/             # CKB 链适配器
  chain-eth/             # ETH 链适配器（MVP 先留空骨架）
  storage-sqlite/        # SQLite 仓储实现
  sustain/               # 现有 sustain 功能迁移后的独立子包
  contracts/             # API DTO、错误码、共享类型
  sdk/                   # 给 MCP / 后续 CLI / UI 用的 API client
```

### 4.1 `apps/wallet-api`

职责：

- 提供 HTTP API
- 做鉴权、参数校验、错误映射
- 组合 `wallet-core` 与链适配器
- 统一记录审计日志

固定技术栈：

- HTTP 框架：`Fastify`
- 校验与 DTO：`zod`
- OpenAPI 生成：`@fastify/swagger`

### 4.2 `apps/wallet-mcp`

职责：

- 以 stdio MCP server 的形式暴露钱包工具
- 使用 `sdk` 调用 `wallet-api`
- 不直接连接数据库
- 不自己实现签名、转账、导入、导出规则

这样可以保证 agent 调用路径与普通 API 调用路径一致。

固定技术栈：

- MCP SDK：`@modelcontextprotocol/sdk`
- 与钱包服务通信方式：HTTP + `sdk`

### 4.3 `apps/rise-cli`

职责：

- 保留现有 CLI 命令入口
- 负责命令注册、参数解析和输出格式
- 不再承载钱包核心逻辑
- `sustain` 命令通过 `packages/sustain` 提供实现

### 4.4 `packages/wallet-core`

职责：

- 定义钱包域对象和用例
- 管理密钥生命周期
- 编排链适配调用
- 统一转账与签名流程

核心用例包括：

- `importWallet`
- `exportWalletSecret`
- `listWallets`
- `getWalletIdentity`
- `signMessage`
- `transferCkb`

### 4.5 `packages/chain-ckb`

职责：

- 由私钥推导 CKB 地址与公钥
- CKB 消息签名
- 构建 CKB 转账交易
- 签名并广播

这里承接当前仓库中分散在 CLI 与 signer 的 CKB 逻辑，重构后统一收口。

固定技术栈：

- 链 SDK：`@ckb-ccc/core` 与 `@ckb-ccc/shell`

### 4.6 `packages/chain-eth`

MVP 先提供接口与目录骨架，不交付业务能力。  

预留职责：

- 由私钥推导 ETH 地址
- `signMessage`
- `signTransaction`
- 后续扩展 `signTypedData`

固定技术栈：

- 链 SDK：`ethers`

### 4.7 `packages/storage-sqlite`

职责：

- 管理 SQLite schema
- 提供钱包、账户、签名记录等仓储实现
- 保证本地 Docker 部署足够轻量

固定技术栈：

- ORM / schema：`drizzle-orm`
- SQLite 驱动：`better-sqlite3`

### 4.8 `packages/sustain`

职责：

- 承接当前 `rise sustain` 的现有实现
- 将现有 sustain 命令、服务、存储与 MCP 相关代码迁移出 CLI 应用层
- 本期不改动 sustain 业务规则

本期规则：

- 只做结构迁移
- 不做策略重写
- 不做钱包集成重构
- 后续再单独处理 sustain 与新钱包服务的整合

## 5. 数据模型

MVP 不需要复杂表结构，但必须为多链和审计留出空间。

### 5.1 `wallets`

```text
wallets
- id TEXT PRIMARY KEY
- name TEXT NOT NULL
- source_type TEXT NOT NULL           -- imported_private_key
- status TEXT NOT NULL                -- active / disabled
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL
```

### 5.2 `key_materials`

```text
key_materials
- wallet_id TEXT PRIMARY KEY
- encrypted_private_key TEXT NOT NULL
- iv TEXT NOT NULL
- auth_tag TEXT NOT NULL
- public_key TEXT NOT NULL
- fingerprint TEXT NOT NULL
- encryption_version INTEGER NOT NULL
- created_at TEXT NOT NULL
```

规则：

- MVP 只存加密后的私钥
- 主密钥不进数据库

### 5.3 `chain_accounts`

```text
chain_accounts
- id TEXT PRIMARY KEY
- wallet_id TEXT NOT NULL
- chain TEXT NOT NULL                 -- ckb / eth
- address TEXT NOT NULL
- public_key TEXT NOT NULL
- is_default INTEGER NOT NULL
- metadata_json TEXT NOT NULL
- created_at TEXT NOT NULL
```

### 5.4 `sign_records`

```text
sign_records
- id TEXT PRIMARY KEY
- wallet_id TEXT NOT NULL
- chain TEXT NOT NULL
- operation TEXT NOT NULL
- request_hash TEXT NOT NULL
- result_ref TEXT
- actor TEXT NOT NULL
- created_at TEXT NOT NULL
```

## 6. API 设计

MVP API 不追求一次性覆盖所有未来能力，但要把边界画对。

### 6.1 管理类接口

- `POST /api/v1/admin/wallets/import`
- `POST /api/v1/admin/wallets/:walletId/export`
- `GET /api/v1/admin/wallets`
- `GET /api/v1/admin/wallets/:walletId`

### 6.2 运行类接口

- `GET /api/v1/wallets/current`
- `POST /api/v1/wallets/:walletId/sign-message`
- `POST /api/v1/wallets/:walletId/transfers/ckb`
- `GET /api/v1/healthz`

### 6.3 API 鉴权

MVP 使用两级鉴权：

- `admin token`：用于导入、导出、配置类操作
- `runtime token`：用于 agent 查询、签名、转账等运行期调用

这不是高安全模型，但足以把匿名调用风险降下来。

## 7. MCP 设计

MCP 的角色是给 agent 一个自然语言可调用的钱包入口，而不是替代钱包服务。

### 7.1 MCP 工具分类

MCP 工具固定包含以下能力：

- `wallet.current.get`
- `wallet.list`
- `wallet.ckb.sign_message`
- `wallet.ckb.transfer`
- `wallet.import_private_key`
- `wallet.export_private_key`

### 7.2 MCP 调用链

```text
Agent
  -> MCP tool
  -> SDK
  -> wallet-api
  -> wallet-core
  -> storage / chain adapters
```

这个链路的关键点是：  
MCP 没有自己的钱包业务逻辑，所有状态与规则都来自 `wallet-api`。

## 8. 核心流程

### 8.1 导入私钥

```text
admin request
  -> wallet-api validate
  -> wallet-core importWallet
  -> encrypt private key
  -> derive CKB account
  -> save wallet + key_material + chain_account
  -> return wallet identity
```

### 8.2 CKB 消息签名

```text
client / MCP request
  -> wallet-api auth
  -> wallet-core signMessage
  -> load encrypted key
  -> decrypt in process
  -> chain-ckb sign
  -> write sign_record
  -> return signature
```

### 8.3 CKB 转账

```text
client / MCP request
  -> wallet-api auth
  -> wallet-core transferCkb
  -> chain-ckb build tx
  -> decrypt private key
  -> sign tx
  -> broadcast tx
  -> write sign_record
  -> return tx hash
```

### 8.4 导出私钥

```text
admin request
  -> wallet-api auth
  -> wallet-core exportWalletSecret
  -> load encrypted key
  -> decrypt
  -> format export payload
  -> write audit record
  -> return secret / encrypted export package
```

MVP 可以先支持简化导出，但必须明确为高危操作。

## 9. 私钥加密方案（MVP）

### 9.1 方案选择

MVP 采用：

- `Node.js crypto`
- 对单条私钥使用对称加密落盘
- 主密钥从环境变量或挂载文件读取

具体形态：

- 算法：`AES-256-GCM`
- 数据库存：`ciphertext + iv + auth_tag`
- 服务启动时加载主密钥

### 9.2 明确的取舍

这个方案的优点：

- 实现简单
- 便于 Docker 部署
- 足以覆盖 MVP 本地持久化保护

这个方案的限制：

- 主密钥仍在应用进程内
- 容器或主机被控后，软件层无法提供高等级私钥隔离
- 不适合高价值资产托管

这部分必须写入项目文档，避免产生错误安全预期。

## 10. Docker 部署架构

### 10.1 部署形态

默认部署形态：

```text
docker compose
  └─ wallet-api
       ├─ mounted sqlite volume
       ├─ env / secret file
       └─ exposed http port
```

`wallet-mcp` 不作为常驻容器运行。  

原因：

- MCP 是 stdio 协议，更适合由 agent 宿主按需拉起
- 钱包 API 服务才是需要长驻的状态服务

### 10.2 配置项

- `PORT`
- `HOST`
- `DB_PATH`
- `MASTER_KEY`
- `CKB_RPC_URL`
- `CKB_INDEXER_URL`
- `ADMIN_TOKEN`
- `RUNTIME_TOKEN`

## 11. 与现有项目能力的映射

### 11.1 保留并收口的能力

- 现有 CKB 身份查询能力 -> 收口为钱包 API
- 现有 CKB 消息签名 -> 收口为钱包 API
- 现有 CKB 转账闭环 -> 从 CLI 收口到钱包 API
- 现有 market auth 对钱包的依赖 -> 未来改为调用钱包 API
- 现有钱包相关 MCP 需求 -> 由 `wallet-mcp` 承接
- 现有 sustain 功能 -> 先迁移到 `packages/sustain`

### 11.2 不继续沿用的结构

- `.NET signer + Bun CLI` 双运行时
- signer 与 CLI 分别维护钱包逻辑
- 继续把 MCP 做成独立业务实现
- 继续把 sustain 与 CLI 主体目录强耦合

## 12. 后续扩展路径

### 12.1 ETH 接入

后续增加 `ETH` 时，仅需补齐：

- `chain-eth` 适配器
- ETH 相关 API
- ETH 相关 MCP tool 映射

不需要重写：

- 钱包主表
- API 鉴权
- Docker 部署
- 审计体系
- MCP 基础框架

### 12.2 安全增强

MVP 之后的安全增强路径可以是：

1. 主密钥从 env 迁移到 secret file / secret manager
2. 导出私钥改为 break-glass 模式
3. 接入 HSM / KMS
4. 支持 non-exportable wallet 类型

## 13. 架构结论

本次重构最重要的不是“把 .NET 改成 Node”，而是把钱包域收敛成：

- 一个长驻的 `wallet-api`
- 一个薄适配层 `wallet-mcp`
- 一套唯一的钱包核心逻辑 `wallet-core`
- 一组可扩展的链适配器 `chain-ckb / chain-eth`

只要这个边界成立，后续再加 ETH、再加 Web UI、再接 sustain，复杂度都不会像现在这样继续外溢。
