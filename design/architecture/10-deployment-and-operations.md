# 10 部署、运维与环境配置

## 1. 文档目的

本文档定义部署模式、运行配置、链配置加载方式、健康检查、备份恢复与运维边界。它的职责是指导开发者和运维实现正确的部署方案，而不是记录当前实现结果。

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
- 某条链处于 `custom` 模式时必须提供对应的 `*_CHAIN_CONFIG_PATH`

## 3. 配置项分组

建议至少定义以下配置组：

### 3.1 服务配置

- `HOST`
- `PORT`
- `NODE_ENV`

### 3.2 数据配置

- `DATA_DIR`
- `SQLITE_PATH`

### 3.3 密钥配置

- `WALLET_KEK_PATH`
- `WALLET_KEK`
- `ALLOW_PLAINTEXT_KEK_ENV`

### 3.4 链配置

- `CKB_CHAIN_MODE`
- `CKB_CHAIN_PRESET`
- `CKB_CHAIN_CONFIG_PATH`
- `EVM_CHAIN_MODE`
- `EVM_CHAIN_PRESET`
- `EVM_CHAIN_CONFIG_PATH`

### 3.5 Owner 配置

- `OWNER_JWT_TTL`
- `OWNER_JWT_SECRET`
- `OWNER_NOTICE_PATH`

## 4. 链配置模式

链配置采用“按链独立的 env + JSON 文件”混合模式。

正式规则：

- `CKB_CHAIN_MODE=preset|custom`
- `EVM_CHAIN_MODE=preset|custom`
- `preset` 时使用系统内置 `testnet|mainnet`
- `custom` 时必须提供对应链的 `*_CHAIN_CONFIG_PATH`

### 4.1 preset 模式

适用于：

- `CKB_CHAIN_MODE=preset`
- `EVM_CHAIN_MODE=preset`

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

- 必须提供对应链的 `*_CHAIN_CONFIG_PATH`
- 配置文件必须是结构化 JSON
- JSON 缺项直接启动失败

`CKB custom` 建议结构：

```json
{
  "rpcUrl": "https://example-ckb-rpc.local",
  "indexerUrl": "https://example-ckb-indexer.local",
  "genesisHash": "0x...",
  "addressPrefix": "ckt",
  "scripts": {
    "Secp256k1Blake160": {
      "codeHash": "0x...",
      "hashType": "type",
      "cellDeps": [
        {
          "cellDep": {
            "outPoint": {
              "txHash": "0x...",
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

`EVM custom` 建议结构：

```json
{
  "rpcUrl": "https://example-evm-rpc.local",
  "chainId": 11155111,
  "networkName": "custom-sepolia",
  "tokens": {
    "erc20": {
      "usdt": {
        "standard": "erc20",
        "contractAddress": "0x..."
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
- `ckb.addressPrefix`
- `ckb.scripts.Secp256k1Blake160`
- `evm.rpcUrl`
- `evm.chainId`
- `evm.tokens.erc20.usdt.standard`
- `evm.tokens.erc20.usdt.contractAddress`

可选字段：

- `evm.networkName`

### 4.4 USDT 配置口径

本期 `USDT` 只支持 ERC-20 标准余额查询和转账。

因此用户配置层只需要提供：

- `tokens.erc20.usdt.contractAddress`

不要求用户提供：

- ABI
- symbol
- decimals

系统要求：

- 内部使用固定 ERC-20 ABI 片段
- 启动时校验目标地址存在合约字节码
- 启动时校验 `decimals()` 返回值为 `6`

### 4.5 模式冲突处理

必须遵守：

- `*_CHAIN_MODE=preset` 时不得要求对应的 `*_CHAIN_CONFIG_PATH`
- `*_CHAIN_MODE=custom` 时缺失对应 `*_CHAIN_CONFIG_PATH` 必须启动失败
- `preset` 模式下如果同时提供该链 custom 文件，应直接启动失败，避免歧义

## 5. 启动顺序

固定启动顺序：

1. 读取基础配置
2. 分别解析 `CKB` 与 `EVM` 的 `MODE/PRESET/CONFIG_PATH`
3. 对每条处于 `custom` 模式的链读取并校验链配置 JSON
4. 初始化日志
5. 读取 `KEK`
6. 初始化 SQLite 与 migration
7. 检查链 RPC 可用性
8. 检查或创建当前钱包
9. 检查或创建默认 Owner 凭证
10. 启动 MCP
11. 启动 Owner HTTP API
12. 提供静态 UI

## 6. 健康检查

### 6.1 启动阶段自检

必须检查：

- `KEK` 可读且格式正确
- SQLite 可初始化
- CKB RPC 可达
- ETH RPC 可达
- EVM 实际 `chainId` 与配置一致
- `USDT` 合约地址格式合法
- `USDT` 合约代码存在
- `USDT` 合约 `decimals()` 返回值为 `6`

当 `CKB_CHAIN_MODE=custom` 时还必须检查：

- CKB 实际 `genesisHash` 与配置一致

### 6.2 运行中检查

至少提供：

- 进程存活检查
- 数据库可用性检查

## 7. 备份与恢复

### 7.1 必须备份的内容

- SQLite 数据库
- `KEK` 来源文件或 docker secret 源

当 `CKB_CHAIN_MODE=custom` 时还必须备份：

- `CKB_CHAIN_CONFIG_PATH` 指向的 JSON 配置文件

当 `EVM_CHAIN_MODE=custom` 时还必须备份：

- `EVM_CHAIN_CONFIG_PATH` 指向的 JSON 配置文件

### 7.2 恢复要求

恢复时必须同时恢复：

- 数据库
- `KEK`

当 `CKB_CHAIN_MODE=custom` 时还必须恢复：

- `CKB` 链配置 JSON

当 `EVM_CHAIN_MODE=custom` 时还必须恢复：

- `EVM` 链配置 JSON

否则无法解密钱包私钥或恢复正确链环境。

## 8. 运维边界

运维文档应指导以下事项：

- 如何提供 `KEK`
- 如何选择每条链的 `MODE/PRESET`
- 如何在 `custom` 模式下挂载 `CKB/EVM` 两份链配置 JSON
- 如何启动服务
- 如何检查健康状态
- 如何备份与恢复
- 如何轮换部署配置

运维文档不应承担：

- 描述当前代码是否已经实现某项能力
- 记录临时开发差异

## 9. 部署结论

本期部署设计的目标是：

`让单机钱包服务在受控密钥和受控链配置前提下稳定启动、可诊断、可恢复。`
