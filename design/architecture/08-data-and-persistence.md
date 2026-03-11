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
- `request_payload`
- `status`
- `tx_hash`
- `error_code`
- `error_message`
- `created_at`
- `updated_at`

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

## 5. Repository 设计

建议仓储接口：

- `WalletRepository`
- `OwnerCredentialRepository`
- `TransferOperationRepository`
- `SignOperationRepository`
- `AuditLogRepository`
- `SystemConfigRepository`

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

### 6.4 导出审计事务

必须保证：

- 导出动作成功或失败都能留下审计记录

## 7. 数据生命周期

### 7.1 钱包数据

- 当前钱包永久保留
- 被新导入替换后，旧记录不作为可切换钱包保留入口

### 7.2 操作流水

- 转账与签名记录默认保留
- 不作为默认 UI 大量展示内容

### 7.3 审计日志

- 不允许静默删除
- 后续如需归档，应单独设计

## 8. 数据一致性要求

必须保证：

- 钱包指纹与多链身份来源于同一私钥
- 操作记录与实际发起角色一致
- 审计记录不可缺失

## 9. 数据层结论

数据层不是简单保存配置，而是支撑以下三个核心目标：

- 单钱包一致性
- 闭环操作可追踪
- 高风险行为可审计
