# 08 数据模型与持久化设计

## 1. 文档目的

本文档定义数据库表、持久化职责、事务边界和数据生命周期。

## 2. 持久化技术定案

- 数据库：`SQLite`
- 数据访问：`Kysely`
- 驱动：`better-sqlite3`

原因：

- 本地单机部署最合适
- 事务能力足够
- 运维复杂度最低

## 3. 数据分类

本系统持久化分四类：

1. 钱包核心状态
2. 鉴权状态
3. 操作流水
4. 审计记录
5. 限额配置

## 4. 表设计

### 4.1 `wallet_state`

用途：

- 保存当前唯一钱包及其加密材料

字段建议：

- `id`
- `status`
- `encrypted_private_key`
- `encrypted_dek`
- `private_key_iv`
- `private_key_tag`
- `dek_iv`
- `dek_tag`
- `wallet_fingerprint`
- `source`
- `created_at`
- `updated_at`

约束：

- 表中只允许存在一条当前记录

### 4.2 `owner_credentials`

用途：

- 保存当前 Owner 凭证

字段建议：

- `id`
- `password_hash`
- `must_rotate`
- `created_at`
- `updated_at`

### 4.3 `transfer_operations`

用途：

- 记录转账闭环

字段建议：

- `id`
- `role`
- `chain`
- `asset`
- `requested_amount`
- `request_payload`
- `status`
- `tx_hash`
- `error_code`
- `error_message`
- `limit_window`
- `limit_snapshot`
- `created_at`
- `updated_at`

说明：

- `requested_amount` 用于限额统计，不依赖解析 `request_payload`
- 当转账被限额拦截时，应记录 `FAILED` 操作并保存 `limit_window` 与 `limit_snapshot`

### 4.4 `sign_operations`

用途：

- 记录消息签名行为

字段建议：

- `id`
- `role`
- `message_digest`
- `chain`
- `result`
- `error_code`
- `created_at`

### 4.5 `audit_logs`

用途：

- 记录高风险与关键行为

字段建议：

- `id`
- `actor_role`
- `action`
- `result`
- `metadata`
- `created_at`

### 4.6 `system_config`

用途：

- 保存系统级运行配置快照

字段建议：

- `id`
- `owner_credential_notice_path`
- `vault_mode`
- `kek_provider`
- `kek_reference`
- `chain_rpc_config`
- `created_at`
- `updated_at`

### 4.7 `asset_limit_policies`

用途：

- 保存按币种配置的日、周、月限额

字段建议：

- `id`
- `chain`
- `asset`
- `daily_limit`
- `weekly_limit`
- `monthly_limit`
- `updated_by`
- `created_at`
- `updated_at`

约束：

- `chain + asset` 唯一
- `null` 表示该周期不限额
- 仅允许当前支持币种：`CKB`、`ETH`、`USDT`、`USDC`

### 4.8 限额统计口径

v1 不新增独立的限额计数器表。

当前限额统计来源为：

- `transfer_operations`

统计范围：

- `role=AGENT`
- `status in (SUBMITTED, CONFIRMED)`
- 同一 `chain + asset`
- 落在当前日、周、月窗口内

为此必须补充索引：

- `(role, chain, asset, status, created_at)`
- `(chain, asset, created_at)`

## 5. Repository 设计

建议仓储接口：

- `WalletRepository`
- `OwnerCredentialRepository`
- `TransferOperationRepository`
- `SignOperationRepository`
- `AuditLogRepository`
- `SystemConfigRepository`
- `AssetLimitPolicyRepository`

每个仓储负责：

- 读写单一聚合或单一数据域
- 不负责编排跨域业务逻辑

## 6. 事务边界

### 6.1 钱包创建事务

必须原子完成：

- 钱包密文写入
- 钱包元数据写入
- 启动状态更新

### 6.2 钱包导入事务

必须原子完成：

- 新钱包材料写入
- 替换旧钱包
- 审计日志写入

### 6.3 转账状态更新事务

至少保证：

- 创建 `PENDING`
- 更新为 `SUBMITTED` 或 `FAILED`

### 6.4 限额拦截事务

必须保证：

- 限额评估结果可记录
- 被拦截的失败操作可追踪
- 审计日志同步写入

### 6.5 限额配置事务

必须保证：

- 限额配置写入或更新
- 审计日志写入
- 同一 `chain + asset` 不产生重复配置记录

### 6.6 导出审计事务

必须保证：

- 导出动作成功或失败都能留下审计记录

## 7. 数据生命周期

### 7.1 钱包数据

- 当前钱包永久保留
- 被新导入替换后，旧记录不作为可切换钱包保留入口

### 7.2 操作流水

- 转账与签名记录默认保留
- 不作为默认 UI 大量展示内容

### 7.3 限额配置

- 限额配置默认保留
- 配置变更通过更新时间覆盖，不保留历史版本表
- 变更历史通过审计日志追踪

### 7.4 审计日志

- 不允许静默删除
- 后续如需归档，应单独设计

## 8. 数据一致性要求

必须保证：

- 钱包指纹与多链身份来源于同一私钥
- 操作记录与实际发起角色一致
- 审计记录不可缺失
- 限额统计与转账金额字段口径一致
- 限额配置与支持币种集合一致

## 9. 数据层结论

数据层不是简单保存配置，而是支撑以下三个核心目标：

- 单钱包一致性
- 闭环操作可追踪
- 高风险行为可审计
- Agent 风险限额可执行
