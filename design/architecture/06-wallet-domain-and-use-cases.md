# 06 钱包领域模型与核心用例

## 1. 文档目的

本文档定义钱包领域模型、状态规则和关键业务用例。目标是稳定业务语义，让开发不依赖 UI 或接口实现来理解钱包逻辑。

## 2. 领域核心

本期只有一个核心领域对象：`Current Wallet`。

这是一个单钱包系统，不存在：

- 多钱包列表
- 钱包切换
- 钱包分组
- 子账户

## 3. 核心领域对象

### 3.1 `WalletAggregate`

字段概念：

- `walletId`
- `fingerprint`
- `source`
- `status`
- `encryptedPrivateKeyRef`
- `createdAt`
- `updatedAt`

状态：

- `ACTIVE`
- `EMPTY`

### 3.2 `OwnerCredential`

字段概念：

- `credentialId`
- `passwordHash`
- `mustRotate`
- `createdAt`
- `updatedAt`

### 3.3 `TransferOperation`

字段概念：

- `operationId`
- `actorRole`
- `chain`
- `asset`
- `status`
- `txHash`
- `errorCode`
- `errorMessage`

状态机：

- `PENDING`
- `SUBMITTED`
- `CONFIRMED`
- `FAILED`

### 3.4 `AuditLog`

字段概念：

- `auditId`
- `actorRole`
- `action`
- `result`
- `metadata`
- `createdAt`

## 4. 核心业务规则

### 4.1 单钱包规则

- 系统中永远只有一个“当前钱包”
- 任何查询都面向当前钱包
- Owner 导入新私钥时直接替换当前钱包
- 不保留历史钱包切换能力

### 4.2 风险控制规则

- 风险控制依赖资金隔离
- 不依赖细粒度能力开关
- Agent 可自由使用已暴露能力
- Owner 拥有最终接管能力

### 4.3 私钥暴露规则

- Agent 永远不可获取私钥明文
- Owner 仅在明确导出流程中可获得私钥明文
- 系统不在普通查询或调试接口中返回私钥相关内容

## 5. 核心用例

### 5.1 启动自动建钱包

触发条件：

- 系统启动且无当前钱包

步骤：

1. 生成新私钥
2. 推导多链身份
3. 加密私钥
4. 持久化为当前钱包
5. 写审计或启动记录

结果：

- 系统启动后立即可用

### 5.2 查询当前钱包

输入：

- 无

输出：

- 当前钱包状态
- 钱包来源
- 钱包指纹

### 5.3 查询多链身份

输出：

- CKB 地址
- ETH 地址

### 5.4 查询 CKB 余额

输出：

- `chain`
- `asset`
- `amount`
- `decimals`

### 5.5 查询 ETH 余额

输出：

- `chain`
- `asset`
- `amount`
- `decimals`

### 5.6 查询 USDT 余额

输出：

- `chain`
- `asset`
- `amount`
- `decimals`

### 5.7 消息签名

输入：

- message

步骤：

1. 取当前钱包
2. 解密私钥
3. 调用对应链签名能力
4. 返回签名
5. 写审计

### 5.8 CKB 转账

步骤：

1. 校验参数
2. 加载当前钱包
3. 获取 `ckb` 写锁
4. 构建交易
5. 签名
6. 广播
7. 记录操作状态

### 5.9 Ethereum ETH 转账

步骤：

1. 校验参数
2. 加载当前钱包
3. 获取 `evm` 写锁
4. 构建 ETH 转账交易
5. 签名
6. 广播
7. 记录操作状态

### 5.10 Ethereum USDT 转账

步骤：

1. 校验参数
2. 加载当前钱包
3. 获取 `evm` 写锁
4. 构建 USDT 转账交易
5. 签名
6. 广播
7. 记录操作状态

### 5.11 Owner 导入恢复

步骤：

1. Owner 登录
2. 输入私钥
3. 校验格式
4. 推导身份
5. 加密私钥
6. 替换当前钱包
7. 写审计

### 5.12 Owner 导出私钥

步骤：

1. Owner 登录
2. 风险确认
3. 解密私钥
4. 返回明文
5. 写审计

## 6. 失败路径

必须显式处理：

- 钱包不存在
- 私钥导入格式错误
- `KEK` 不可用
- RPC 不可达
- 余额不足
- CKB 组交易失败
- ETH 转账广播失败
- EVM 资产余额查询失败
- USDT 转账广播失败
- 导出过程失败

## 7. 领域结论

本期钱包领域的本质不是“一个通用钱包”，而是：

`一个可被 Agent 自主使用、可被 Owner 后置接管、由单私钥承载多链身份和资产操作的单钱包信用账户。`
