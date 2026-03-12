# 10 部署、运维与环境配置

## 1. 文档目的

本文档定义部署模式、运行配置、链配置加载方式、限额时区口径、健康检查、备份恢复与运维边界。它的职责是指导开发者和运维实现正确的部署方案，而不是记录当前实现结果。

## 2. 支持的部署模式

### 2.1 docker-compose

推荐作为标准部署模式。

要求：

- 服务以单容器形式运行
- `KEK` 通过 `docker secret` 或受控挂载文件提供
- SQLite 数据持久化到独立 volume
- `custom` 模式下的链配置 JSON 通过受控挂载文件提供

### 2.2 非 docker

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

### 3.4 链配置

- `CHAIN_ENV`
- `CHAIN_CONFIG_PATH`

### 3.5 Owner 配置

- `OWNER_JWT_TTL`
- `OWNER_JWT_SECRET`
- `OWNER_NOTICE_PATH`

## 4. 链配置模式

链配置采用 `env + JSON 文件` 的混合模式。

正式规则：

- `CHAIN_ENV=custom|testnet|mainnet`
- `CHAIN_ENV=testnet|mainnet` 时使用系统内置 preset
- `CHAIN_ENV=custom` 时必须提供 `CHAIN_CONFIG_PATH`

### 4.1 preset 模式

适用于：

- `CHAIN_ENV=testnet`
- `CHAIN_ENV=mainnet`

要求：

- 不要求用户提供链级 JSON
- 不允许通过散落 env 修改链身份
- 配置目标是开箱可用，而不是可随意拼装

### 4.2 custom 模式

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

### 4.3 custom 模式字段要求

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

### 4.4 稳定币配置口径

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

### 4.5 模式冲突处理

必须遵守：

- `CHAIN_ENV=testnet|mainnet` 时不得要求 `CHAIN_CONFIG_PATH`
- `CHAIN_ENV=custom` 时缺失 `CHAIN_CONFIG_PATH` 必须启动失败
- `CHAIN_ENV=testnet|mainnet` 时如果同时提供 custom 文件，应直接启动失败，避免歧义

## 5. 限额时区口径

按产品要求，限额按 server 本地时区重置。

正式规则：

- 日限额：每天 `00:00`
- 周限额：每周一 `00:00`
- 月限额：每月 `1 日 00:00`

部署要求：

- 运维必须显式设置 `TZ`
- 应用启动日志必须打印解析后的本地时区
- 多环境之间不得默认依赖宿主机隐式时区

## 6. 启动顺序

固定启动顺序：

1. 读取基础配置
2. 解析 `CHAIN_ENV`
3. 如为 `custom`，读取并校验链配置 JSON
4. 解析本地时区
5. 初始化日志
6. 读取 `KEK`
7. 初始化 SQLite 与 migration
8. 检查链 RPC 可用性
9. 检查或创建当前钱包
10. 检查或创建默认 Owner 凭证
11. 启动 MCP
12. 启动 Owner HTTP API
13. 提供静态 UI

## 7. 健康检查

### 7.1 启动阶段自检

必须检查：

- `KEK` 可读且格式正确
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

### 7.2 运行中检查

至少提供：

- 进程存活检查
- 数据库可用性检查

## 8. 备份与恢复

### 8.1 必须备份的内容

- SQLite 数据库
- `KEK` 来源文件或 docker secret 源

当 `CHAIN_ENV=custom` 时还必须备份：

- `CHAIN_CONFIG_PATH` 指向的 JSON 配置文件

### 8.2 恢复要求

恢复时必须同时恢复：

- 数据库
- `KEK`

当 `CHAIN_ENV=custom` 时还必须恢复：

- 链配置 JSON

否则无法解密钱包私钥或恢复正确链环境。

## 9. 运维边界

运维文档应指导以下事项：

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

## 10. 部署结论

本期部署设计的目标是：

`让单机钱包服务在受控密钥、受控链配置和受控时区口径前提下稳定启动、可诊断、可恢复。`
