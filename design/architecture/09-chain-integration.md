# 09 多链接入与链适配器设计

## 1. 文档目的

本文档定义 CKB 与 EVM 的集成方式、链环境模型、适配器边界和链差异处理策略。

## 2. 本期支持范围

本期只支持：

- `CKB` 链上的 `CKB`
- `ETH` 链上的 `ETH`
- `ETH` 链上的 `USDT`
- `ETH` 链上的 `USDC`

不支持：

- 其他 CKB 资产
- 其他 EVM 资产
- 多链资产自动发现

## 3. 链环境模型

本期链环境统一采用：

- `CHAIN_ENV=custom|testnet|mainnet`

三种模式的正式语义如下：

- `testnet`：使用系统内置测试网 preset，面向零 setup。
- `mainnet`：使用系统内置主网 preset，面向正式运行。
- `custom`：使用者显式提供完整链连接配置，面向开发、联调、自建节点和代理 RPC 场景。

约束：

- `testnet` 与 `mainnet` 只允许使用内置 preset。
- `custom` 允许自定义链连接参数，但不改变本期产品范围。
- 无论处于哪种模式，对外协议仍只支持 `CKB`、`ETH`、`USDT`、`USDC` 四类资产动作。

## 4. 链接入定案

### 4.1 CKB

- SDK：`@ckb-ccc/shell`

适配器职责：

- 私钥推导地址
- CKB 余额查询
- 消息签名
- CKB 转账

### 4.2 EVM

- SDK：`viem`

适配器职责：

- 私钥推导地址
- ETH 余额查询
- USDT 余额查询
- USDC 余额查询
- 消息签名
- ETH 转账
- USDT 转账
- USDC 转账

### 4.3 模式化装配要求

适配器装配必须同时支持两类来源：

1. preset profile
用于 `testnet` 与 `mainnet`

2. custom profile
用于 `custom`

开发要求：

- 不允许把 `@ckb-ccc/shell` 和 `viem` 适配器实现成只支持硬编码 preset。
- preset profile 负责零 setup 启动。
- custom profile 负责显式链参数接入。
- profile 选择必须由配置层完成，不允许由业务代码猜测。

### 4.4 custom 模式配置结构

`custom` 模式下，链配置必须通过独立 JSON 文件提供，而不是把全部链参数散落在环境变量里。

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

要求：

- `ckb.rpcUrl` 必填
- `ckb.indexerUrl` 必填
- `ckb.genesisHash` 必填
- `evm.rpcUrl` 必填
- `evm.chainId` 必填
- `evm.networkName` 可选，仅用于日志与展示
- `evm.tokens.erc20.usdt.contractAddress` 必填
- `evm.tokens.erc20.usdc.contractAddress` 必填

说明：

- `custom` 模式下外部 tool 名称仍保持 `ethereum.*`
- 这里的 `ethereum.*` 表示当前唯一 EVM 运行槽位
- 这不会把系统扩展成任意资产平台，只是允许在受控范围内自定义 EVM 连接参数

## 5. 适配器接口

建议统一抽象：

```ts
interface ChainIdentityProvider<TIdentity> {
  getIdentity(privateKey: string): Promise<TIdentity>;
}

interface MessageSigner {
  signMessage(privateKey: string, payload: string | Uint8Array): Promise<string>;
}

interface CkbBalanceReader {
  getCkbBalance(privateKey: string): Promise<BalanceResult>;
}

interface CkbTransferExecutor {
  transferCkb(privateKey: string, req: CkbTransferReq): Promise<TransferResult>;
}

interface EvmEthBalanceReader {
  getEthBalance(privateKey: string): Promise<BalanceResult>;
}

interface EvmEthTransferExecutor {
  transferEth(privateKey: string, req: EvmEthTransferReq): Promise<TransferResult>;
}

interface EvmUsdtBalanceReader {
  getUsdtBalance(privateKey: string): Promise<BalanceResult>;
}

interface EvmUsdtTransferExecutor {
  transferUsdt(privateKey: string, req: EvmUsdtTransferReq): Promise<TransferResult>;
}

interface EvmUsdcBalanceReader {
  getUsdcBalance(privateKey: string): Promise<BalanceResult>;
}

interface EvmUsdcTransferExecutor {
  transferUsdc(privateKey: string, req: EvmUsdcTransferReq): Promise<TransferResult>;
}
```

## 6. CKB 适配器设计

### 6.1 查询能力

- `getCkbAddress`
- `getCkbBalance`

### 6.2 写能力

- `signCkbMessage`
- `transferCkb`

### 6.3 custom 模式要求

在 `custom` 模式下，CKB 适配器必须：

- 使用 `rpcUrl` 与 `indexerUrl` 建立连接
- 在启动阶段校验链实际 `genesisHash`
- 当 `genesisHash` 与配置不一致时直接失败

### 6.4 关键风险

- cell 竞争
- 组交易失败
- RPC / indexer 不一致

### 6.5 防护要求

- CKB 写操作串行化
- 失败原因明确映射

## 7. EVM 适配器设计

### 7.1 查询能力

- `getEthAddress`
- `getEthBalance`
- `getUsdtBalance`
- `getUsdcBalance`

### 7.2 写能力

- `signEvmMessage`
- `transferEth`
- `transferUsdt`
- `transferUsdc`

### 7.3 custom 模式要求

在 `custom` 模式下，EVM 适配器必须：

- 使用 `rpcUrl` 建立连接
- 在启动阶段校验实际 `chainId`
- 使用配置中的 `tokens.erc20.usdt.contractAddress`
- 使用配置中的 `tokens.erc20.usdc.contractAddress`
- 对目标稳定币合约执行基础校验

稳定币配置规则：

- 用户配置层只需要提供 `contractAddress`
- 不要求用户提供 ABI、symbol、decimals
- 系统内部使用固定 ERC-20 ABI 片段完成余额查询与转账

稳定币启动校验要求：

- 合约地址格式合法
- 目标地址存在合约字节码
- `USDT` 的 `decimals()` 返回值必须为 `6`
- `USDC` 的 `decimals()` 返回值必须为 `6`
- `symbol()` 可读取时可写入日志，但不作为启动强校验前置

### 7.4 关键风险

- nonce 冲突
- gas 估算失败
- ERC20 调用失败

### 7.5 防护要求

- EVM 写操作串行化
- 广播错误明确映射

## 8. 多链统一策略

统一策略：

- 上层只暴露当前需求明确需要的动作
- 下层处理链级差异
- 对外不提供万能余额查询或万能转账入口

即：

- 上层调用 `getCkbBalance`
- 上层调用 `getEthBalance`
- 上层调用 `getUsdtBalance`
- 上层调用 `getUsdcBalance`
- 上层调用 `transferCkb`
- 上层调用 `transferEth`
- 上层调用 `transferUsdt`
- 上层调用 `transferUsdc`
- 上层不处理 UTXO 与 nonce 差异

补充约束：

- 不把 `custom` 模式理解为任意资产平台
- 不因为 `custom` 模式引入新的外部 tool 命名
- 不允许通过配置动态生成新的对外 wallet tool

## 9. 错误映射

链 SDK 错误必须映射为系统错误码：

- `CHAIN_UNAVAILABLE`
- `INSUFFICIENT_BALANCE`
- `TRANSFER_BUILD_FAILED`
- `TRANSFER_BROADCAST_FAILED`
- `SIGN_MESSAGE_FAILED`

禁止把底层异常原样暴露给上层接口。

## 10. 后续扩展方式

未来新增链或资产时，规则如下：

- 新增明确的新 tool 和新用例
- 不修改现有单钱包模型
- 不把已有入口膨胀成万能接口
- 产品允许范围仍由 `PRD` 定义

## 11. 链集成结论

本期链集成的核心不是建立通用区块链框架，而是：

`为单钱包信用账户提供两个稳定可用、支持 preset 与 custom 双装配模式的链适配器。`
