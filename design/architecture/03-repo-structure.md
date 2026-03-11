# 03 仓库与工程结构设计

## 1. 文档目的

本文档定义重构后仓库结构、包边界和依赖方向。目标是让开发者从一开始就在正确的目录层级里实现代码，而不是先写代码再倒推结构。

## 2. 工程组织定案

本期工程组织采用 `pnpm workspace`。

选择原因：

- 需要同时维护服务端、Owner UI、共享类型、领域层、链适配器和存储层
- 多包结构比单包目录堆叠更易保持依赖边界
- 比单纯 npm workspace 更适合长期模块化管理

## 3. 推荐目录结构

```text
apps/
  wallet-server/
  owner-ui/
packages/
  app-contracts/
  domain/
  application/
  infrastructure/
  adapters-ckb/
  adapters-evm/
  shared/
docs/
  README.md
  mcp.md
  owner-ui.md
  deployment.md
design/
  README.md
  product/
    prd.md
  architecture/
    overview.md
  contracts/
    mcp-and-owner-interfaces.md
```

## 4. 各目录职责

### 4.1 `apps/wallet-server`

职责：

- `NestJS` 启动入口
- HTTP 控制器
- MCP 服务装配
- 模块注册
- 配置装配
- 静态 UI 托管

禁止：

- 直接写链逻辑
- 直接写 SQL
- 直接实现加密细节

### 4.2 `apps/owner-ui`

职责：

- Owner 登录与看板页面
- Owner 转账、签名、导入、导出、凭证管理
- 风险提示与状态展示

禁止：

- 直接引入 Node 专属能力
- 直接实现钱包签名逻辑

### 4.3 `packages/app-contracts`

职责：

- Owner HTTP DTO
- MCP tool 输入输出 schema
- 错误码定义
- API/MCP 返回模型

原因：

- 协议定义必须独立，避免被某个入口实现绑死

### 4.4 `packages/domain`

职责：

- 领域对象
- 领域规则
- 值对象
- 领域错误

禁止：

- 依赖 `NestJS`
- 依赖数据库实现
- 依赖链 SDK

### 4.5 `packages/application`

职责：

- 用例编排
- 权限判断
- 工作流协调
- 审计触发

它依赖：

- `domain`
- repository interface
- adapter interface

### 4.6 `packages/infrastructure`

职责：

- `SQLite` 仓储实现
- `Vault` 实现
- 配置加载
- 日志实现
- 文件系统访问

### 4.7 `packages/adapters-ckb`

职责：

- `@ckb-ccc/core` 的二次封装
- CKB 地址推导、签名、转账、余额查询

### 4.8 `packages/adapters-evm`

职责：

- `viem` 的二次封装
- ETH 地址推导、ETH / USDT 余额查询、签名、转账

### 4.9 `packages/shared`

职责：

- 通用类型
- 常量
- 小型工具函数
- 不依赖业务语义的共享能力

## 5. 依赖方向

正式依赖方向：

```text
apps/* -> app-contracts
apps/* -> application
application -> domain
application -> app-contracts
application -> adapter interfaces
application -> repository interfaces
infrastructure -> domain/application interfaces
adapters-* -> domain/application interfaces
shared -> 被低层与高层共同依赖
```

禁止依赖：

- `domain -> infrastructure`
- `domain -> adapters-*`
- `application -> NestJS controller`
- `owner-ui -> infrastructure`

## 6. 文件命名约定

建议约定：

- `*.module.ts`：Nest 模块
- `*.controller.ts`：Owner HTTP 控制器
- `*.tool.ts`：MCP tool 适配层
- `*.service.ts`：应用服务或基础设施服务
- `*.repository.ts`：仓储接口与实现
- `*.schema.ts`：Zod schema
- `*.entity.ts` / `*.vo.ts`：领域对象与值对象

## 7. 工程结构目标

最终要达到的效果：

- 任何开发者都能从目录结构直接理解系统层次
- 任何业务功能都能定位到唯一的实现层
- 任何协议变更都先落在 contract 层
- 任何链能力都不会污染领域层
