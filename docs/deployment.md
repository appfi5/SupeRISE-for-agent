# 部署说明

英文版本见 [docs/en/deployment.md](./en/deployment.md)。

## 1. 文档目的

本文档定义部署方式、配置项、启动流程、健康检查、日志与恢复要求。

## 2. 支持的部署模式

### 2.1 `docker run` quickstart

官方镜像默认支持这一档位。

特点：

- 同一镜像直接 `docker run`
- 默认零配置启动
- 首次启动自动生成 runtime secret
- 默认链环境固定为内置 `testnet` preset

最简可访问示例：

```bash
docker run -p 18799:18799 <official-image>
```

首次启动后，运行时目录 `/app/runtime-data` 下会包含：

- SQLite 数据库
- `/app/runtime-data/secrets/wallet.kek`
- `/app/runtime-data/secrets/owner-jwt.secret`
- `/app/runtime-data/owner-credential.txt`

说明：

- Quickstart 只保证零配置启动，不保证零参数即可从宿主机访问
- 若不提供 `-p`，容器仍可完成初始化，但宿主机无法直接访问服务
- 初始 Owner 密码只会在首次启动日志中打印一次

### 2.2 `docker-compose` managed

这是仓库内推荐的标准受控部署模式。

特点：

- 单一镜像，但显式固定为 `DEPLOYMENT_PROFILE=managed`
- `KEK` 可通过 `docker secret` 注入
- Owner JWT secret 由部署环境显式提供

当前仓库内提供：

- root [Dockerfile](../Dockerfile)
- root [docker-compose.yml](../docker-compose.yml)
- 启动脚本 [docker-up.sh](../scripts/docker-up.sh)
- `KEK` 轮换脚本 [docker-rotate-kek.sh](../scripts/docker-rotate-kek.sh)
- 部署环境示例 [deploy/docker/.env.example](../deploy/docker/.env.example)
- Docker custom 链配置示例 [deploy/docker/chain-config](../deploy/docker/chain-config)

一键启动命令：

```bash
pnpm docker:up
```

启动后宿主机可直接查看：

- 服务地址：`http://127.0.0.1:${PORT:-18799}/`
- MCP 端点：`http://127.0.0.1:${PORT:-18799}/mcp`
- 健康检查：`http://127.0.0.1:${PORT:-18799}/health`
- SQLite 数据：`deploy/docker/runtime-data/wallet.sqlite`

说明：

- `docker-compose` 默认以 `NODE_ENV=production` 启动
- `docker-compose` 在 compose 文件中显式固定 `DEPLOYMENT_PROFILE=managed`
- `docker-compose` 默认通过 `PUBLISH_HOST=127.0.0.1` 只绑定本机回环地址
- `ENABLE_API_DOCS` 默认为 `false`
- 因此部署默认不暴露 `/docs` 和 `/docs-json`
- `deploy/docker/chain-config` 会只读挂载到容器内的 `/app/chain-config`
- `/mcp` 无鉴权，禁止把该端口直接暴露到公网或不受信任网络

### 2.3 非 docker

支持：

- `systemd`
- `pm2`
- 手工进程启动

要求：

- 建议显式设置 `DEPLOYMENT_PROFILE=managed`
- 必须提供 `WALLET_KEK_PATH` 或显式允许的 `WALLET_KEK`
- 必须显式提供 `OWNER_JWT_SECRET`

## 3. 核心配置项

建议配置项清单：

- `NODE_ENV`
- `DEPLOYMENT_PROFILE`
- `ENABLE_API_DOCS`
- `PUBLISH_HOST`
- `HOST`
- `PORT`
- `DATA_DIR`
- `RUNTIME_SECRET_DIR`
- `SQLITE_PATH`
- `WALLET_KEK_PATH`
- `WALLET_KEK`
- `ALLOW_PLAINTEXT_KEK_ENV`
- `TRANSFER_SETTLEMENT_INTERVAL_MS`
- `TRANSFER_RESERVED_TIMEOUT_MS`
- `TRANSFER_SUBMITTED_TIMEOUT_MS`
- `CKB_CHAIN_MODE`
- `CKB_CHAIN_PRESET`
- `CKB_CHAIN_CONFIG_PATH`
- `EVM_CHAIN_MODE`
- `EVM_CHAIN_PRESET`
- `EVM_CHAIN_CONFIG_PATH`

补充说明：

- `DEPLOYMENT_PROFILE=quickstart` 时，不接受外部 `WALLET_KEK_PATH`、`WALLET_KEK` 或 `OWNER_JWT_SECRET`
- `DEPLOYMENT_PROFILE=quickstart` 只允许两条链都落在内置 `testnet` preset
- `DEPLOYMENT_PROFILE=managed` 时，缺失外部 `KEK` 或 `OWNER_JWT_SECRET` 会直接启动失败
- 当且仅当 `ENABLE_API_DOCS=true` 时启用 Swagger 文档
- 未设置该变量时按 `false` 处理
- `PUBLISH_HOST` 控制 Docker 将端口发布到哪个宿主机地址，默认值为 `127.0.0.1`
- `pnpm docker:up` 首次生成 `deploy/docker/.env` 时会自动写入本地管理面所需的高熵 JWT 签名密钥
- `TRANSFER_SETTLEMENT_INTERVAL_MS`、`TRANSFER_RESERVED_TIMEOUT_MS`、`TRANSFER_SUBMITTED_TIMEOUT_MS` 共同控制后台转账结算轮询与超时判定
- `CKB` 与 `EVM` 独立选择 `preset|custom`
- `preset` 模式使用内置 `testnet|mainnet`
- `custom` 模式分别通过各自 JSON 文件提供链配置
- `EVM custom` 必须同时提供 `tokens.erc20.usdt` 与 `tokens.erc20.usdc`

`CKB custom` 配置示例：

```json
{
  "rpcUrl": "https://testnet.ckb.dev",
  "indexerUrl": "https://testnet.ckb.dev/indexer",
  "genesisHash": "0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606",
  "addressPrefix": "ckt",
  "scripts": {
    "Secp256k1Blake160": {
      "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      "hashType": "type",
      "cellDeps": [
        {
          "cellDep": {
            "outPoint": {
              "txHash": "0x71a7ba8f0f0c92bfbf76d5e3ef0b75ab6b2df95d060c5bc3d2dfb3b9f4f7c452",
              "index": 0
            },
            "depType": "depGroup"
          }
        }
      ]
    }
  }
}
```

`EVM custom` 配置示例：

```json
{
  "rpcUrl": "https://ethereum-sepolia-rpc.publicnode.com",
  "chainId": 11155111,
  "networkName": "custom-sepolia",
  "tokens": {
    "erc20": {
      "usdt": {
        "standard": "erc20",
        "contractAddress": "0x0cF531D755F7324B910879b3Cf7beDFAb872513E"
      },
      "usdc": {
        "standard": "erc20",
        "contractAddress": "0xa704C2f31628ec73A12704fa726a1806613a30ae"
      }
    }
  }
}
```

## 4. 配置优先级

### 4.1 `KEK`

优先级：

1. `WALLET_KEK_PATH`
2. `WALLET_KEK`
3. quickstart 运行时自动生成文件
4. 开发模式自动生成

### 4.2 数据目录

优先级：

1. 显式配置路径
2. 默认应用数据目录

## 5. 启动流程

固定启动步骤：

1. 读取环境配置
2. 解析 `DEPLOYMENT_PROFILE`
3. 分别解析 `CKB` 与 `EVM` 的 `MODE/PRESET/CONFIG_PATH`
4. 如某条链为 `custom`，读取并校验对应 JSON 文件
5. 按部署档位读取或生成 runtime secret
6. 初始化数据库与数据目录
7. 执行 migration
8. 执行启动阶段自检（`KEK` / 数据库 / CKB / EVM / `USDT` 合约 / `USDC` 合约）
9. 检查 / 生成钱包
10. 检查 / 生成 Owner 本地管理凭证提示
11. 若为 quickstart 首次启动，打印一次性 Owner 凭证提示
12. 启动 MCP 与 HTTP 服务
13. 启动后台转账结算轮询

## 6. 健康检查

启动前自检至少包含：

- `managed` 下 `KEK` 可用
- `quickstart` 下 runtime secret 目录可写，且所需 secret 可生成 / 读取
- SQLite 可读写
- CKB RPC 可达
- ETH RPC 可达
- EVM `chainId` 与配置一致
- USDT 合约地址格式合法
- USDT 合约代码存在
- USDT `decimals()` 等于 `6`
- USDC 合约地址格式合法
- USDC 合约代码存在
- USDC `decimals()` 等于 `6`

当 `CKB_CHAIN_MODE=custom` 时还会额外校验：

- CKB 实际 `genesisHash` 与配置一致

运行中健康检查可提供：

- 进程存活
- 数据库可用性检查

当前实现说明：

- 启动阶段已执行 `KEK`、数据库、CKB、EVM、USDT 合约与 USDC 合约自检
- 运行时会按 `TRANSFER_SETTLEMENT_INTERVAL_MS` 执行后台转账结算轮询
- `/health` 会执行数据库可用性检查，并返回 `checks.database`

## 7. 日志与审计

### 7.1 运行日志

必须记录：

- 启动成功 / 失败
- 配置校验失败
- RPC 异常
- 转账流程关键节点

### 7.2 审计日志

必须记录：

- 私钥导入
- 私钥导出
- 签名
- 转账

## 8. 备份与恢复

### 8.1 必须备份的内容

- SQLite 数据库
- `managed` 下的 `KEK` 来源文件或 `docker secret` 源
- `quickstart` 下的 runtime secret 目录

当 `CKB_CHAIN_MODE=custom` 时还必须备份：

- `CKB_CHAIN_CONFIG_PATH` 指向的 JSON 配置文件

当 `EVM_CHAIN_MODE=custom` 时还必须备份：

- `EVM_CHAIN_CONFIG_PATH` 指向的 JSON 配置文件

只备份数据库不足以恢复钱包。

### 8.2 恢复原则

恢复系统时必须同时恢复：

- 数据库
- `managed` 下的 `KEK`
- `quickstart` 下的 runtime secret 目录

当 `CKB_CHAIN_MODE=custom` 时还必须恢复：

- `CKB` 链配置 JSON

当 `EVM_CHAIN_MODE=custom` 时还必须恢复：

- `EVM` 链配置 JSON

否则无法解密当前钱包私钥。

## 9. 轮换策略

### 9.1 `KEK` 轮换

本期不作为常规 UI 能力，但架构上应支持：

- 解包旧 `DEK`
- 用新 `KEK` 重包 `DEK`

推荐运维方式：

- 使用独立 maintenance script 执行 `KEK` 轮换
- 执行轮换时，程序仍需使用旧 `KEK` 读取现有钱包
- 通过 `NEXT_WALLET_KEK_PATH` 或 `NEXT_WALLET_KEK` 提供目标 `KEK`
- 轮换成功后，再切换正式启动配置到新 `KEK`

当前 Docker 操作方式：

1. 执行 `pnpm docker:rotate-kek`
2. 脚本会先停止 `wallet-server`
3. 在 one-shot 容器中运行 [rewrap-kek.cjs](../apps/wallet-server/scripts/rewrap-kek.cjs)
4. 成功后备份旧 `KEK` 文件，并把新的 `KEK` 切换为当前 `docker secret` 源
5. 重新启动 `wallet-server`

如需自带目标 `KEK`，可直接传入目标文件路径：

```bash
sh scripts/docker-rotate-kek.sh /absolute/path/to/next-wallet-kek.txt
```

### 9.2 从 quickstart 接管到 managed

推荐步骤：

1. 停止当前 quickstart 容器，并保留同一份 runtime volume
2. 选择接管策略：复用原有 `/app/runtime-data/secrets/wallet.kek`，或准备新的外部 `KEK`
3. 如需切换到新的外部 `KEK`，先用 [rewrap-kek.cjs](../apps/wallet-server/scripts/rewrap-kek.cjs) 重包现有 `DEK`
4. 为 managed 部署准备外部 `KEK` 与 `OWNER_JWT_SECRET`
5. 使用同一镜像、同一数据目录，以 `DEPLOYMENT_PROFILE=managed` 重新启动

原则：

- 这是一条显式运维流程，不会由应用自动切换
- 切换失败时应保留原 quickstart 运行时数据，避免半切换状态

## 10. 运维结论

本期运维设计的目标不是复杂编排，而是：

`让单机钱包服务可启动、可诊断、可恢复。`
