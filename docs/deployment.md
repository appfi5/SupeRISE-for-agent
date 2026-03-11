# 部署说明

英文版本见 [docs/en/deployment.md](./en/deployment.md)。

## 1. 文档目的

本文档定义部署方式、配置项、启动流程、健康检查、日志与恢复要求。

## 2. 支持的部署模式

### 2.1 docker-compose

这是推荐的标准部署模式。

特点：

- 一键启动
- 环境一致
- `KEK` 可通过 `docker secret` 注入

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
- `docker-compose` 默认通过 `PUBLISH_HOST=127.0.0.1` 只绑定本机回环地址
- `ENABLE_API_DOCS` 默认为 `false`
- 因此部署默认不暴露 `/docs` 和 `/docs-json`
- `deploy/docker/chain-config` 会只读挂载到容器内的 `/app/chain-config`
- `/mcp` 无鉴权，禁止把该端口直接暴露到公网或不受信任网络

### 2.2 非 docker

支持：

- `systemd`
- `pm2`
- 手工进程启动

要求：

- 必须提供 `WALLET_KEK_PATH` 或显式允许的 `WALLET_KEK`

## 3. 核心配置项

建议配置项清单：

- `NODE_ENV`
- `ENABLE_API_DOCS`
- `PUBLISH_HOST`
- `HOST`
- `PORT`
- `DATA_DIR`
- `SQLITE_PATH`
- `WALLET_KEK_PATH`
- `WALLET_KEK`
- `ALLOW_PLAINTEXT_KEK_ENV`
- `CKB_CHAIN_MODE`
- `CKB_CHAIN_PRESET`
- `CKB_CHAIN_CONFIG_PATH`
- `EVM_CHAIN_MODE`
- `EVM_CHAIN_PRESET`
- `EVM_CHAIN_CONFIG_PATH`

补充说明：

- 当且仅当 `ENABLE_API_DOCS=true` 时启用 Swagger 文档
- 未设置该变量时按 `false` 处理
- `PUBLISH_HOST` 控制 Docker 将端口发布到哪个宿主机地址，默认值为 `127.0.0.1`
- `pnpm docker:up` 首次生成 `deploy/docker/.env` 时会自动写入本地管理面所需的高熵 JWT 签名密钥
- `CKB` 与 `EVM` 独立选择 `preset|custom`
- `preset` 模式使用内置 `testnet|mainnet`
- `custom` 模式分别通过各自 JSON 文件提供链配置
- `EVM custom` 中的 `USDT` 配置路径固定为 `tokens.erc20.usdt`

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
3. 开发模式自动生成

### 4.2 数据目录

优先级：

1. 显式配置路径
2. 默认应用数据目录

## 5. 启动流程

固定启动步骤：

1. 读取环境配置
2. 分别解析 `CKB` 与 `EVM` 的 `MODE/PRESET/CONFIG_PATH`
3. 如某条链为 `custom`，读取并校验对应 JSON 文件
4. 初始化日志
5. 读取 `KEK`
6. 初始化数据库与数据目录
7. 执行 migration
8. 执行启动阶段自检（`KEK` / 数据库 / CKB / EVM / USDT 合约）
9. 检查 / 生成钱包
10. 启动 MCP 与 HTTP 服务

## 6. 健康检查

启动前自检至少包含：

- `KEK` 可用
- SQLite 可读写
- CKB RPC 可达
- ETH RPC 可达
- EVM `chainId` 与配置一致
- USDT 合约地址格式合法
- USDT 合约代码存在
- USDT `decimals()` 等于 `6`

当 `CKB_CHAIN_MODE=custom` 时还会额外校验：

- CKB 实际 `genesisHash` 与配置一致

运行中健康检查可提供：

- 进程存活
- 数据库可用性检查

当前实现说明：

- 启动阶段已执行 `KEK`、数据库、CKB、EVM 与 USDT 合约自检
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
- `KEK` 来源文件或 `docker secret` 源

当 `CKB_CHAIN_MODE=custom` 时还必须备份：

- `CKB_CHAIN_CONFIG_PATH` 指向的 JSON 配置文件

当 `EVM_CHAIN_MODE=custom` 时还必须备份：

- `EVM_CHAIN_CONFIG_PATH` 指向的 JSON 配置文件

只备份数据库不足以恢复钱包。

### 8.2 恢复原则

恢复系统时必须同时恢复：

- 数据库
- `KEK`

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

## 10. 运维结论

本期运维设计的目标不是复杂编排，而是：

`让单机钱包服务可启动、可诊断、可恢复。`
