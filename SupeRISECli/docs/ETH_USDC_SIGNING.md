# ETH / USDC 签名支持

本文档介绍如何在 SupeRISE 系统中使用 ETH 与 USDC 的签名功能。

---

## 概述

SupeRISELocalServer（本地签名服务器）已增加对以太坊（ETH）及 USDC（ERC-20）的签名支持，包括：

| 功能 | 接口 |
|------|------|
| ETH 消息签名（EIP-191 personal_sign） | `POST /api/v1/agent/sign/sign-message` |
| ETH / USDC 交易签名（Legacy Type-0） | `POST /api/v1/agent/sign/sign-eth-transaction` |

---

## 前置条件

在调用签名接口之前，需要在本地服务器中注册一个 ETH 类型的密钥配置（KeyConfig）。

**注册 ETH 密钥：**

```
POST /api/v1/ui/key-config/create
{
  "addressType": 1,          // 1 = ETH
  "address": "0xYourEthAddress",
  "publicKey": "0x04...",
  "privateKey": "0xYourPrivateKey"
}
```

---

## 接口说明

### 1. 消息签名（EIP-191 personal_sign）

签名任意消息，采用 EIP-191 `personal_sign` 规范（自动添加 `\x19Ethereum Signed Message:\n` 前缀并对消息进行 Keccak256 哈希）。

**请求：**

```
POST /api/v1/agent/sign/sign-message
Content-Type: application/json

{
  "address": "0xYourEthAddress",
  "message": "Hello ETH"
}
```

**响应：**

```json
{
  "success": true,
  "code": 200,
  "message": "",
  "data": {
    "address": "0xYourEthAddress",
    "signature": "0x..."
  },
  "errorData": null
}
```

**验证签名（链上/离线）：**

使用 `eth_sign` 或 `personal_ecRecover` 恢复签名者地址，对比期望地址即可验证签名合法性。

---

### 2. ETH / USDC 交易签名

签名一笔未广播的以太坊 Legacy（Type-0）交易，支持：

- **ETH 转账**：`data` 字段填 `"0x"`
- **USDC（ERC-20）转账**：将 `transfer(address,uint256)` ABI 编码后填入 `data` 字段

**请求：**

```
POST /api/v1/agent/sign/sign-eth-transaction
Content-Type: application/json

{
  "address": "0xYourEthAddress",
  "content": "{\"to\":\"0x...\",\"value\":\"0xde0b6b3a7640000\",\"data\":\"0x\",\"nonce\":\"0x0\",\"gasPrice\":\"0x4a817c800\",\"gasLimit\":\"0x5208\",\"chainId\":1}"
}
```

`content` 是一个 JSON 序列化的 `EthUnsignedTransaction` 对象：

| 字段 | 类型 | 说明 |
|------|------|------|
| `to` | `string` | 目标以太坊地址 |
| `value` | `string` | 转账金额（wei，十六进制，如 `"0xde0b6b3a7640000"` = 1 ETH） |
| `data` | `string` | 调用数据（ETH 转账填 `"0x"`；ERC-20 transfer 填 ABI 编码数据） |
| `nonce` | `string` | 发送方交易序号，十六进制 |
| `gasPrice` | `string` | Gas 单价（wei，十六进制） |
| `gasLimit` | `string` | Gas 上限，十六进制 |
| `chainId` | `number` | 链 ID（以太坊主网 `1`，Sepolia `11155111`） |

**响应：**

```json
{
  "success": true,
  "code": 200,
  "message": "",
  "data": {
    "address": "0xYourEthAddress",
    "signedTransaction": "0xf86c...",
    "txHash": "0x..."
  },
  "errorData": null
}
```

将 `signedTransaction` 通过 `eth_sendRawTransaction` 广播到网络即可。

---

### USDC ERC-20 transfer 数据编码示例

```
函数选择器: keccak256("transfer(address,uint256)")[0:4] = 0xa9059cbb
参数 1（接收地址，左填充至 32 字节）
参数 2（金额，左填充至 32 字节）

以转账 100 USDC（6 位小数 = 100_000_000）到 0x1234...5678 为例：
data = 0xa9059cbb
       0000000000000000000000001234...5678
       0000000000000000000000000000000000000000000000000000000005f5e100
```

---

## TypeScript 客户端用法（SupeRISECli）

```typescript
import { signEthTransaction, signMessage } from "@/services/sign-server";
import type { SignService } from "@/types";

// 签名消息
const { signature } = await signMessage("Hello ETH");

// 签名 ETH 转账
const result = await signEthTransaction(ethAddress, {
  to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  value: "0xde0b6b3a7640000",   // 1 ETH
  data: "0x",
  nonce: "0x0",
  gasPrice: "0x4a817c800",      // 20 Gwei
  gasLimit: "0x5208",           // 21000
  chainId: 1,
});

console.log("Signed tx:", result.signedTransaction);
console.log("TX hash:  ", result.txHash);

// 签名 USDC 转账（构造 ERC-20 transfer 调用数据）
const selector = "a9059cbb";
const recipient = "70997970C51812dc3A010C7d01b50e0d17dc79C8".padStart(64, "0");
const amount = (100_000_000).toString(16).padStart(64, "0"); // 100 USDC
const data = "0x" + selector + recipient + amount;

const usdcResult = await signEthTransaction(ethAddress, {
  to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC mainnet
  value: "0x0",
  data,
  nonce: "0x1",
  gasPrice: "0x4a817c800",
  gasLimit: "0xea60",
  chainId: 1,
});
```

---

## C# 工具类

| 工具类 | 位置 | 功能 |
|--------|------|------|
| `EthSignMessageUtils` | `Utils/EthSignMessageUtils.cs` | EIP-191 消息签名与地址恢复 |
| `GenEthAddressUtils` | `Utils/GenEthAddressUtils.cs` | 生成以太坊密钥对与地址 |

```csharp
// 签名消息
var signature = EthSignMessageUtils.SignMessage(privateKey, "Hello");

// 验证（恢复签名者地址）
var address = EthSignMessageUtils.RecoverSignerAddress("Hello", signature);

// 生成新地址
var info = GenEthAddressUtils.GenerateAddress();
Console.WriteLine(info.Address);   // 0x…
Console.WriteLine(info.PrivateKey);
```
