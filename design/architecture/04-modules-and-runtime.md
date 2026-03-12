# 04 运行时模块与 NestJS 分层设计

## 1. 文档目的

本文档定义运行时模块划分、NestJS 模块边界、模块依赖关系和每个模块的职责。目标是让开发人员能直接据此拆分服务端代码。

## 2. 服务端总分层

服务端分为四层：

1. `Interface Layer`
2. `Application Layer`
3. `Domain Layer`
4. `Infrastructure Layer`

对应关系：

- `Interface Layer`：Nest controller、MCP tool adapters
- `Application Layer`：use cases、orchestrators、policies
- `Domain Layer`：aggregate、value objects、domain errors
- `Infrastructure Layer`：SQLite、Vault、配置、链 SDK 封装

## 3. NestJS 模块列表

本期建议建立以下主模块：

- `AppModule`
- `ConfigModule`
- `LoggingModule`
- `DatabaseModule`
- `VaultModule`
- `WalletModule`
- `AssetLimitModule`
- `OwnerAuthModule`
- `OwnerApiModule`
- `WalletToolsModule`
- `McpModule`
- `CkbModule`
- `EvmModule`
- `AuditModule`
- `HealthModule`

## 4. 模块职责定义

### 4.1 `AppModule`

职责：

- 组装全部运行时模块
- 注册全局异常过滤器
- 注册全局校验管道
- 注册全局日志拦截器

不负责：

- 业务逻辑
- 链接入逻辑

### 4.2 `ConfigModule`

职责：

- 加载环境配置
- 校验必填配置
- 输出配置对象
- 决定 `KEK provider`

必须提供的配置类别：

- 服务端口与主机
- 数据目录与 SQLite 路径
- `KEK` 读取方式
- 链网络 preset / custom 配置
- `TZ`
- Owner JWT 配置

### 4.3 `LoggingModule`

职责：

- 初始化 `Pino`
- 统一日志字段
- 为请求注入 `requestId`
- 记录关键业务日志

统一日志字段建议：

- `requestId`
- `module`
- `action`
- `actorRole`
- `walletFingerprint`
- `chain`
- `operationId`

### 4.4 `DatabaseModule`

职责：

- 初始化 `SQLite`
- 注入 `Kysely`
- 管理 schema migration
- 提供事务能力

要求：

- 启动时自动执行 schema version 检查
- WAL 模式默认开启

### 4.5 `VaultModule`

职责：

- 加载 `KEK`
- 生成 `DEK`
- 加密钱包私钥
- 解密钱包私钥
- 包装 / 解包 `DEK`

向上提供的能力：

- `encryptPrivateKey`
- `decryptPrivateKey`
- `rewrapDek`
- `validateKek`

### 4.6 `WalletModule`

职责：

- 当前钱包查询
- 多链身份查询
- CKB 余额查询
- ETH 余额查询
- USDT 余额查询
- USDC 余额查询
- 消息签名
- CKB 转账编排
- ETH 转账编排
- USDT 转账编排
- USDC 转账编排
- 导入恢复
- 导出私钥
- 启动时自动创建钱包

WalletModule 是本期核心业务模块。

额外要求：

- Agent 转账路径必须在进入链适配器前调用限额评估
- Owner 转账路径必须显式绕过限额评估
- 限额评估失败时必须返回结构化 `ASSET_LIMIT_EXCEEDED`

### 4.7 `OwnerAuthModule`

职责：

- 默认 Owner 凭证生成
- 登录验证
- JWT 签发与校验
- 凭证轮换

要求：

- 不与钱包私钥加密逻辑耦合
- 不承担 `KEK` 管理职责

### 4.8 `OwnerApiModule`

职责：

- 提供 Owner HTTP 接口
- 参数校验
- 鉴权拦截
- 调用应用用例

控制器按领域拆分：

- `OwnerAuthController`
- `OwnerCredentialController`
- `OwnerWalletController`
- `OwnerAssetLimitController`
- `OwnerAuditController`

### 4.9 `AssetLimitModule`

职责：

- 保存按币种的日、周、月限额配置
- 在 Agent 转账前执行限额评估
- 计算当前周期的已用额度
- 返回限额超出时的结构化信息

必须支持：

- `CKB`
- `ETH`
- `USDT`
- `USDC`

业务规则：

- 限额只对 `AGENT` 生效
- `OWNER` 不受限额约束
- 限额按 server 本地时区重置
- 限额口径使用币种最小单位整数字符串

### 4.10 `WalletToolsModule`

职责：

- 暴露 `wallet tools` 的本地 HTTP gateway
- 复用与 MCP 完全一致的 wallet tool registry
- 为 Owner UI 提供简化 transport adapter

要求：

- 不复制业务逻辑
- 不新增独立业务语义
- 不绕过应用层直接访问数据库

### 4.11 `McpModule`

职责：

- 注册 MCP tools
- 将 MCP 请求映射到应用用例
- 做参数校验与结果转换
- 输出统一错误

要求：

- 不直接访问数据库
- 不直接依赖链 SDK
- 不复制业务逻辑

### 4.12 `CkbModule`

职责：

- 注册 `CkbWalletAdapter`
- 封装 `@ckb-ccc/shell`
- 提供地址推导、CKB 余额查询、签名、CKB 转账

### 4.13 `EvmModule`

职责：

- 注册 `EvmWalletAdapter`
- 封装 `viem`
- 提供地址推导、ETH 余额查询、USDT 余额查询、USDC 余额查询、签名、ETH 转账、USDT 转账、USDC 转账

### 4.14 `AuditModule`

职责：

- 记录高风险行为
- 记录关键业务操作
- 提供审计查询接口给 Owner

必须记录：

- 登录
- 凭证修改
- 钱包导入
- 私钥导出
- 限额配置修改
- Agent 触发限额拦截
- 签名
- 转账

### 4.15 `HealthModule`

职责：

- 启动阶段自检
- 暴露运行中的存活检查接口

启动阶段至少检查：

- `KEK` 读取检查
- SQLite 初始化 / migration
- 链 RPC 可达性检查
- custom 链配置一致性检查
- ERC-20 合约校验
- server 本地时区可解析

运行中接口建议至少提供：

- 进程存活检查

## 5. 模块依赖关系

建议依赖关系：

```text
AppModule
  -> ConfigModule
  -> LoggingModule
  -> DatabaseModule
  -> VaultModule
  -> CkbModule
  -> EvmModule
  -> AuditModule
  -> OwnerAuthModule
  -> WalletModule
  -> WalletToolsModule
  -> OwnerApiModule
  -> McpModule
  -> HealthModule
```

关键约束：

- `OwnerApiModule` 只依赖 `WalletModule` / `OwnerAuthModule`
- `WalletToolsModule` 只依赖 `WalletModule`
- `McpModule` 只依赖 `WalletToolsModule`
- `WalletModule` 依赖 `VaultModule`、`AuditModule`、`CkbModule`、`EvmModule`
- `Domain` 不依赖任何 Nest 模块

## 6. 应用层服务拆分

WalletModule 内建议至少拆分这些应用服务：

- `BootstrapWalletService`
- `CurrentWalletQueryService`
- `OwnerCredentialStatusQueryService`
- `NervosAddressQueryService`
- `NervosCkbBalanceQueryService`
- `NervosMessageSigningService`
- `NervosCkbTransferService`
- `EthereumAddressQueryService`
- `EthereumUsdtBalanceQueryService`
- `EthereumMessageSigningService`
- `EthereumUsdtTransferService`
- `OperationStatusQueryService`
- `AuditLogQueryService`
- `HealthCheckService`
- `WalletImportService`
- `WalletExportService`

## 7. 并发与事务

### 7.1 链级写锁

必须按链进行写操作串行化：

- `ckb` 一把锁
- `evm` 一把锁

目的：

- 避免 CKB cell 冲突
- 避免 EVM nonce 冲突

### 7.2 事务边界

以下操作必须处于事务边界：

- 钱包创建 + 元数据写入
- 钱包导入替换 + 审计记录
- 导出记录 + 审计记录
- 转账操作记录状态切换

## 8. 全局基础设施

建议全局启用：

- 全局 validation pipe
- 全局 exception filter
- 全局 requestId interceptor
- 全局审计辅助中间件

## 9. 运行时设计结论

本期运行时的核心要求只有一句话：

`所有入口只做协议适配，所有业务规则集中在应用层，所有链差异封装在适配器层。`
