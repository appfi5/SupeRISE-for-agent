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

本系统持久化分六类：

1. 钱包核心状态
2. 鉴权状态
3. 操作流水
4. 审计记录
5. 限额配置
6. 限额预占与结算状态

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
- `submitted_at`
- `confirmed_at`
- `failed_at`
- `last_chain_status`
- `last_chain_checked_at`
- `limit_window`
- `limit_snapshot`
- `created_at`
- `updated_at`

说明：

- `requested_amount` 用于转账与限额结算对账，不依赖解析 `request_payload`
- `status` 正式取值至少包括 `RESERVED`、`SUBMITTED`、`CONFIRMED`、`FAILED`
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

### 4.8 `asset_limit_reservations`

用途：

- 保存 Agent 转账的额度预占、确认消耗与返还状态

字段建议：

- `id`
- `operation_id`
- `actor_role`
- `chain`
- `asset`
- `amount`
- `daily_window_start`
- `weekly_window_start`
- `monthly_window_start`
- `status`
- `release_reason`
- `created_at`
- `updated_at`
- `settled_at`

约束：

- `operation_id` 唯一
- `status` 仅允许 `ACTIVE`、`CONSUMED`、`RELEASED`
- 仅 `actor_role=AGENT` 的转账允许产生 reservation

### 4.9 限额统计口径

v1 不新增独立的限额计数器表，但必须新增额度预占流水表。

当前限额统计来源为：

- `asset_limit_reservations`

统计范围：

- `actor_role=AGENT`
- `status in (ACTIVE, CONSUMED)`
- 同一 `chain + asset`
- 落在当前日、周、月窗口内的 reservation bucket

统计语义：

- `ACTIVE` 表示已预占但尚未最终结算
- `CONSUMED` 表示链上确认成功后正式消耗
- `RELEASED` 不参与当前额度统计

为此必须补充索引：

- `transfer_operations(status, created_at)`
- `transfer_operations(tx_hash)`
- `asset_limit_reservations(operation_id)`
- `asset_limit_reservations(actor_role, chain, asset, status, daily_window_start)`
- `asset_limit_reservations(actor_role, chain, asset, status, weekly_window_start)`
- `asset_limit_reservations(actor_role, chain, asset, status, monthly_window_start)`

## 5. Repository 设计

建议仓储接口：

- `WalletRepository`
- `OwnerCredentialRepository`
- `TransferOperationRepository`
- `SignOperationRepository`
- `AuditLogRepository`
- `SystemConfigRepository`
- `AssetLimitPolicyRepository`
- `AssetLimitReservationRepository`

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

### 6.3 Agent 转账预占事务

至少保证：

- 在额度锁保护下完成当前窗口额度统计
- 创建 `transfer_operation(status=RESERVED)`
- 创建 `asset_limit_reservation(status=ACTIVE)`

### 6.4 转账广播结果事务

至少保证：

- 广播成功时更新 `transfer_operation -> SUBMITTED`
- 写入 `tx_hash` 与 `submitted_at`
- 广播失败时更新 `transfer_operation -> FAILED`
- 广播失败时释放关联 reservation

### 6.5 限额拦截事务

必须保证：

- 限额评估结果可记录
- 被拦截的失败操作可追踪
- 审计日志同步写入

### 6.6 转账异步结算事务

必须保证：

- `SUBMITTED` 操作查询链上状态
- 链上确认成功时更新 `transfer_operation -> CONFIRMED`
- 同一事务内把 reservation 更新为 `CONSUMED`
- 链上失败或超时时更新 `transfer_operation -> FAILED`
- 同一事务内把 reservation 更新为 `RELEASED`

### 6.7 限额配置事务

必须保证：

- 限额配置写入或更新
- 审计日志写入
- 同一 `chain + asset` 不产生重复配置记录

### 6.8 导出审计事务

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

### 7.4 限额预占记录

- reservation 默认保留
- `ACTIVE` 状态不得被静默删除
- `CONSUMED` 与 `RELEASED` 用于对账和审计

### 7.5 审计日志

- 不允许静默删除
- 后续如需归档，应单独设计

## 8. 数据一致性要求

必须保证：

- 钱包指纹与多链身份来源于同一私钥
- 操作记录与实际发起角色一致
- 审计记录不可缺失
- 限额统计与转账金额字段口径一致
- 限额配置与支持币种集合一致
- reservation 结算与 transfer status 必须一致
- 任一 `ACTIVE` reservation 都必须能追溯到未完成或待恢复的操作

## 9. 数据层结论

数据层不是简单保存配置，而是支撑以下三个核心目标：

- 单钱包一致性
- 闭环操作可追踪
- 高风险行为可审计
- Agent 风险限额可执行
