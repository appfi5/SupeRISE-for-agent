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
- `AddressBookModule`
- `TransferTrackingModule`
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

- 多链公开身份查询必须按链返回 `address + publicKey`
- 公开身份信息由当前私钥即时推导，不单独持久化
- 转账路径必须先解析 `to + toType`，得到最终链地址后再进入限额与链适配流程
- `toType=address` 的转账不自动触发地址簿反查
- Agent 转账路径必须在进入链适配器前完成限额评估与额度预占
- Owner 转账路径必须显式绕过限额评估
- 限额评估失败时必须返回结构化 `ASSET_LIMIT_EXCEEDED`
- 广播失败时必须显式释放已预占额度

### 4.7 `AddressBookModule`

职责：

- 提供地址簿的新增、查看、修改和删除能力
- 提供联系人列表、名称搜索、单个详情、全量详情能力
- 提供按精确地址查询匹配联系人名称的能力
- 提供转账前的联系人名称解析能力
- 对名称唯一性和地址格式进行校验

要求：

- 地址簿是共享数据，不区分 Agent 与 Owner 私有条目
- 地址簿不承担权限隔离和白名单语义
- 同一链下的同一个地址允许被多个联系人名称复用
- `create` 与 `update` 必须严格校验地址合法性
- `lookup_by_address` 只做轻量地址识别与精确匹配，不承担链上真实归属判断
- `lookup_by_address` 输入为空时返回校验错误；地址无法识别时返回未匹配结果
- 名称解析必须按当前转账链执行，不允许跨链降级
- `AddressBookModule` 返回联系人数据，不直接执行转账逻辑

### 4.8 `TransferTrackingModule`

职责：

- 提供 `wallet.operation_status`
- 提供 `nervos.tx_status`
- 提供 `ethereum.tx_status`
- 运行 `TransferSettlementScheduler`
- 扫描并结算 `RESERVED` 与 `SUBMITTED` 操作
- 驱动额度预占的确认与返还

要求：

- `wallet.operation_status` 只返回本地操作状态
- 链上 `tx_status` 查询必须按链分开提供，不做通用外部入口
- 定时结算必须复用链适配器提供的 `tx status` 查询能力
- 调度器不得直接调用链 SDK 原始对象
- 调度器必须能处理进程重启后的未结算操作恢复

### 4.9 `OwnerAuthModule`

职责：

- 默认 Owner 凭证生成
- 登录验证
- JWT 签发与校验
- 凭证轮换

要求：

- 不与钱包私钥加密逻辑耦合
- 不承担 `KEK` 管理职责

### 4.10 `OwnerApiModule`

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

### 4.11 `AssetLimitModule`

职责：

- 保存按币种的日、周、月限额配置
- 在 Agent 转账前执行限额评估
- 为 Agent 转账创建额度预占
- 在链上确认后确认额度消耗
- 在广播失败、链上失败或超时后返还额度
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
- 已用额度口径为 `ACTIVE reservation + CONSUMED reservation`

### 4.12 `WalletToolsModule`

职责：

- 暴露 `wallet tools` 的本地 HTTP gateway
- 复用与 MCP 完全一致的 wallet tool registry
- 为 Owner UI 提供简化 transport adapter

要求：

- 不复制业务逻辑
- 不新增独立业务语义
- 不绕过应用层直接访问数据库

### 4.13 `McpModule`

职责：

- 注册 MCP tools
- 将 MCP 请求映射到应用用例
- 做参数校验与结果转换
- 输出统一错误

要求：

- 不直接访问数据库
- 不直接依赖链 SDK
- 不复制业务逻辑

### 4.14 `CkbModule`

职责：

- 注册 `CkbWalletAdapter`
- 封装 `@ckb-ccc/shell`
- 提供 Nervos 公开身份推导、CKB 余额查询、签名、CKB 转账、CKB `tx status` 查询

### 4.15 `EvmModule`

职责：

- 注册 `EvmWalletAdapter`
- 封装 `viem`
- 提供 Ethereum 公开身份推导、ETH 余额查询、USDT 余额查询、USDC 余额查询、签名、ETH 转账、USDT 转账、USDC 转账、EVM `tx status` 查询

### 4.16 `AuditModule`

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

### 4.17 `HealthModule`

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

### 4.18 Owner UI 多语言边界

多语言支持在当前架构中属于 `apps/owner-ui` 的展示层职责，不新增独立的 server 业务模块。

正式要求：

- 当前支持语言固定为 `en` 与 `zh`
- 默认显示语言固定为 `en`
- 语言切换状态由 Owner UI 本地管理
- 当前语言偏好只在本地浏览器侧持久化，不要求 server 持久化
- 登录前后界面必须共享同一语言状态
- 当本地语言偏好缺失或非法时，必须回退到默认英文
- 当前不要求根据浏览器语言自动推断显示语言
- MCP、Owner HTTP API 与 wallet tools gateway 不新增 `locale` 业务参数
- 后端返回稳定的错误码、状态值和原始数据，Owner UI 负责把固定界面文案和产品提示文案映射为当前语言
- 日期、时间、数字展示与所使用 UI 框架的内置固定文案必须跟随当前语言
- 固定枚举展示值必须由 Owner UI 本地化，不直接把原始枚举值作为最终产品文案
- 用户自行输入的内容、地址、交易哈希、资产符号等原始数据不进入翻译流程

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
