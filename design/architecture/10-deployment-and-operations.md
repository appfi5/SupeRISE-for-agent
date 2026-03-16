# 10 部署、运维与环境配置

## 1. 文档目的

本文档定义部署模式、运行配置、链配置加载方式、限额时区口径、健康检查、备份恢复与运维边界。它的职责是指导开发者和运维实现正确的部署方案，而不是记录当前实现结果。

## 2. 支持的部署模式

正式要求：

- Docker Hub 只发布一个正式运行镜像
- `quickstart` 与 `managed` 是同一镜像的两种运行档位，不是两套镜像
- 档位必须通过 `DEPLOYMENT_PROFILE` 显式决定
- 不得根据是否提供 external secret、挂载文件或链配置自动推断档位

### 2.1 `docker run` quickstart

必须支持作为官方镜像默认体验模式。

要求：

- 用户可以直接执行 `docker run <image>` 完成首次启动
- 不要求用户预先提供 `.env`、`KEK`、链配置 JSON 或默认 Owner 凭证
- 镜像内默认使用 `quickstart` 部署档位
- 镜像必须声明运行时 volume，例如 `/app/runtime-data`
- 首次启动时自动生成运行时 secrets、当前钱包和默认 Owner 凭证

边界：

- 该模式解决的是“零配置启动”，不是“零参数即可从宿主机访问”
- 若用户不提供 `-p`，容器仍然可以启动，但宿主机无法直接访问 HTTP / MCP 端口

### 2.2 docker-compose

推荐作为标准受控部署模式。

要求：

- 服务以单容器形式运行
- `KEK` 通过 `docker secret` 或受控挂载文件提供
- SQLite 数据持久化到独立 volume
- `custom` 模式下的链配置 JSON 通过受控挂载文件提供

### 2.3 非 docker

支持：

- `systemd`
- `pm2`
- 手工进程运行

要求：

- 必须提供 `WALLET_KEK_PATH` 或显式允许的 `WALLET_KEK`
- 数据目录与日志目录必须可控
- `custom` 模式下必须提供 `CHAIN_CONFIG_PATH`

## 3. 配置项分组

建议至少定义以下配置组：

### 3.1 服务配置

- `DEPLOYMENT_PROFILE`
- `HOST`
- `PORT`
- `NODE_ENV`
- `TZ`

### 3.2 数据配置

- `DATA_DIR`
- `SQLITE_PATH`

### 3.3 密钥配置

- `WALLET_KEK_PATH`
- `WALLET_KEK`
- `ALLOW_PLAINTEXT_KEK_ENV`
- `RUNTIME_SECRET_DIR`

### 3.4 链配置

- `CHAIN_ENV`
- `CHAIN_CONFIG_PATH`

### 3.5 Owner 配置

- `OWNER_JWT_TTL`
- `OWNER_JWT_SECRET`
- `OWNER_NOTICE_PATH`

### 3.6 转账结算配置

- `TRANSFER_SETTLEMENT_INTERVAL_SECONDS`
- `TRANSFER_RESERVED_TIMEOUT_SECONDS`
- `TRANSFER_SUBMITTED_TIMEOUT_SECONDS`
- `EVM_MIN_CONFIRMATIONS`
- `CKB_MIN_CONFIRMATIONS`

## 4. 部署档位

### 4.1 `quickstart`

这是官方镜像必须支持的零配置启动档位。

正式要求：

- `DEPLOYMENT_PROFILE=quickstart`
- 未显式提供 `DEPLOYMENT_PROFILE` 时，官方镜像默认进入 `quickstart`
- 默认监听 `0.0.0.0:18799`
- 默认数据目录为 `/app/runtime-data`
- 默认链配置必须落在 `testnet` preset
- 未提供外部 `KEK` 时，自动生成并持久化 `wallet.kek`
- 未提供 Owner JWT secret 时，自动生成并持久化 `owner-jwt.secret`
- 未存在钱包时自动创建钱包
- 未存在 Owner 凭证时自动创建默认 Owner 凭证
- 首次启动时将 Owner 凭证文件路径写入日志
- 首次启动时允许把 Owner 初始凭证明文打印到日志一次

安全边界：

- 运行时 secrets 与数据库同处本地运行时 volume
- 这是一种本地便利模式，不是正式受控部署模式
- 默认不得连接主网
- 若同时提供 `managed` 必需的外部 secret 或配置，必须直接启动失败并提示切换到 `managed`

### 4.2 `managed`

这是正式受控部署档位。

正式要求：

- `DEPLOYMENT_PROFILE=managed`
- `KEK` 由外部提供
- Owner JWT secret 由外部提供
- 允许 `testnet`、`mainnet`、`custom` 三种链配置模式
- 不依赖自动生成的运行时 secrets
- 缺失外部 `KEK`、Owner JWT secret 或所选模式必需配置时必须 fail-fast
- 不得自动退回 `quickstart`

### 4.3 Docker 网络边界

必须在文档中明确：

- `docker run <image>` 可以实现零配置启动
- 但如果未提供 `-p`，宿主机无法直接访问服务
- 因此“零配置启动”与“零参数可访问”不是同一个目标

推荐命令口径：

- 最简可访问：`docker run -p 18799:18799 <image>`
- 纯零参数：仅保证容器内服务完成初始化

### 4.4 档位切换与接管迁移

正式要求：

- `quickstart` 与 `managed` 必须能够复用同一份数据库格式与钱包密文格式
- 后续从 `quickstart` 切换到 `managed` 时，必须复用同一正式运行镜像
- 接管迁移必须由运维显式执行，不允许应用自行根据环境变化切换档位

迁移边界：

- 需要把 `quickstart` 运行时目录中的 `KEK` 接管为外部 secret，或以新的外部 `KEK` 重包裹现有 `DEK`
- 切换完成后必须显式以 `DEPLOYMENT_PROFILE=managed` 重新启动
- 迁移失败时不得半切到 `managed` 后再回落到 `quickstart`

## 5. 链配置模式

链配置采用 `env + JSON 文件` 的混合模式。

正式规则：

- `CHAIN_ENV=custom|testnet|mainnet`
- `CHAIN_ENV=testnet|mainnet` 时使用系统内置 preset
- `CHAIN_ENV=custom` 时必须提供 `CHAIN_CONFIG_PATH`

### 5.1 preset 模式

适用于：

- `CHAIN_ENV=testnet`
- `CHAIN_ENV=mainnet`

要求：

- 不要求用户提供链级 JSON
- 不允许通过散落 env 修改链身份
- 配置目标是开箱可用，而不是可随意拼装

### 5.2 custom 模式

适用于：

- 开发联调
- 自建节点
- 代理 RPC
- 私有部署环境

要求：

- 必须提供 `CHAIN_CONFIG_PATH`
- 配置文件必须是结构化 JSON
- JSON 缺项直接启动失败

建议结构：

```json
{
  "ckb": {
    "rpcUrl": "https://example-ckb-rpc.local",
    "indexerUrl": "https://example-ckb-indexer.local",
    "genesisHash": "0x..."
  },
  "evm": {
    "rpcUrl": "https://example-evm-rpc.local",
    "chainId": 11155111,
    "networkName": "custom-sepolia",
    "tokens": {
      "erc20": {
        "usdt": {
          "contractAddress": "0x..."
        },
        "usdc": {
          "contractAddress": "0x..."
        }
      }
    }
  }
}
```

### 5.3 custom 模式字段要求

必须字段：

- `ckb.rpcUrl`
- `ckb.indexerUrl`
- `ckb.genesisHash`
- `evm.rpcUrl`
- `evm.chainId`
- `evm.tokens.erc20.usdt.contractAddress`
- `evm.tokens.erc20.usdc.contractAddress`

可选字段：

- `evm.networkName`

### 5.4 稳定币配置口径

本期 `USDT` 与 `USDC` 都只支持 ERC-20 标准余额查询和转账。

因此用户配置层只需要提供：

- `tokens.erc20.usdt.contractAddress`
- `tokens.erc20.usdc.contractAddress`

不要求用户提供：

- ABI
- symbol
- decimals

系统要求：

- 内部使用固定 ERC-20 ABI 片段
- 启动时校验目标地址存在合约字节码
- 启动时校验 `USDT.decimals()` 返回值为 `6`
- 启动时校验 `USDC.decimals()` 返回值为 `6`

### 5.5 模式冲突处理

必须遵守：

- `CHAIN_ENV=testnet|mainnet` 时不得要求 `CHAIN_CONFIG_PATH`
- `CHAIN_ENV=custom` 时缺失 `CHAIN_CONFIG_PATH` 必须启动失败
- `CHAIN_ENV=testnet|mainnet` 时如果同时提供 custom 文件，应直接启动失败，避免歧义

### 5.6 转账结算配置规则

正式要求：

- 必须启用后台转账结算任务
- 定时任务负责扫描 `RESERVED` 与 `SUBMITTED` 操作
- `TRANSFER_SETTLEMENT_INTERVAL_SECONDS` 决定轮询频率
- `TRANSFER_RESERVED_TIMEOUT_SECONDS` 用于清理长时间未广播成功的 `RESERVED` 操作
- `TRANSFER_SUBMITTED_TIMEOUT_SECONDS` 用于识别长时间未完成结算的 `SUBMITTED` 操作
- `EVM_MIN_CONFIRMATIONS` 决定 EVM `CONFIRMED` 判定阈值
- `CKB_MIN_CONFIRMATIONS` 决定 CKB `CONFIRMED` 判定阈值

说明：

- `testnet`、`mainnet`、`custom` 三种模式都必须运行结算任务
- 结算任务是正式运行时职责，不是开发辅助工具

## 6. 限额时区口径

按产品要求，限额按 server 本地时区重置。

正式规则：

- 日限额：每天 `00:00`
- 周限额：每周一 `00:00`
- 月限额：每月 `1 日 00:00`

部署要求：

- 运维必须显式设置 `TZ`
- 应用启动日志必须打印解析后的本地时区
- 多环境之间不得默认依赖宿主机隐式时区

## 7. 启动顺序

固定启动顺序：

1. 读取基础配置
2. 解析 `DEPLOYMENT_PROFILE`
3. 解析 `CHAIN_ENV`
4. 如为 `custom`，读取并校验链配置 JSON
5. 解析本地时区
6. 初始化日志
7. 根据部署档位解析或生成 runtime secrets
8. 初始化 SQLite 与 migration
9. 检查链 RPC 可用性
10. 检查或创建当前钱包
11. 检查或创建默认 Owner 凭证
12. 若为首次 quickstart 启动，输出一次性 Owner 凭证提示
13. 启动转账结算调度器
14. 启动 MCP
15. 启动 Owner HTTP API
16. 提供静态 UI

## 8. 健康检查

### 8.1 启动阶段自检

必须检查：

- `managed` 模式下 `KEK` 可读且格式正确
- `quickstart` 模式下运行时 secret 目录可写且可生成所需 secret
- SQLite 可初始化
- CKB RPC 可达
- ETH RPC 可达
- server 本地时区可解析

当 `CHAIN_ENV=custom` 时还必须检查：

- CKB 实际 `genesisHash` 与配置一致
- EVM 实际 `chainId` 与配置一致
- `USDT` 合约地址格式合法
- `USDT` 合约代码存在
- `USDT` 合约 `decimals()` 返回值为 `6`
- `USDC` 合约地址格式合法
- `USDC` 合约代码存在
- `USDC` 合约 `decimals()` 返回值为 `6`

### 8.2 运行中检查

至少提供：

- 进程存活检查
- 数据库可用性检查
- 结算调度器存活检查
- 最近一次结算轮询时间检查
- 链上状态查询能力检查

## 9. 备份与恢复

### 9.1 必须备份的内容

- SQLite 数据库
- `managed` 模式下的 `KEK` 来源文件或 docker secret 源
- `quickstart` 模式下的运行时 secret 目录

当 `CHAIN_ENV=custom` 时还必须备份：

- `CHAIN_CONFIG_PATH` 指向的 JSON 配置文件

### 9.2 恢复要求

恢复时必须同时恢复：

- 数据库
- `managed` 模式下的 `KEK`
- `quickstart` 模式下的运行时 secret 目录

当 `CHAIN_ENV=custom` 时还必须恢复：

- 链配置 JSON

否则无法解密钱包私钥或恢复正确链环境。

## 10. 运维边界

运维文档应指导以下事项：

- 如何选择 `DEPLOYMENT_PROFILE`
- 如何提供 `KEK`
- 如何选择 `CHAIN_ENV`
- 如何在 `custom` 模式下挂载链配置 JSON
- 如何设置 `TZ`
- 如何启动服务
- 如何检查健康状态
- 如何备份与恢复
- 如何轮换部署配置

运维文档不应承担：

- 描述当前代码是否已经实现某项能力
- 记录临时开发差异

## 11. 部署结论

本期部署设计的目标是：

`让官方镜像既能以 quickstart 档位零配置启动，也能以 managed 档位进入受控部署。`
