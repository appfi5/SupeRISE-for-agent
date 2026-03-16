# 12 开发实施路线图

## 1. 文档目的

本文档把本期架构拆成可执行的开发阶段，明确每个阶段的目标、仓库落点、交付物和验收口径。

开发顺序必须服务于 `PRD` 的闭环交付，而不是服务于抽象完整性。

## 2. 总体实施原则

- 先冻结契约，再进入实现。
- 先完成单钱包主闭环，再补部署和增强能力。
- 每个阶段都必须有可验证输出，不能只留下半成品结构。
- 后续阶段不得绕过前序阶段的边界定义。

## 3. 阶段 0：契约冻结

### 3.1 目标

把本期支持的入口、动作、资产和错误模型一次性定死。

### 3.2 主要仓库落点

- `design/product/prd.md`
- `design/contracts/mcp-and-owner-interfaces.md`
- `packages/app-contracts/src/schemas/`
- `packages/app-contracts/src/errors.ts`
- `packages/app-contracts/src/responses.ts`

### 3.3 必须交付

- `MCP` 工具名集合与当前需求基线完全一致。
- Owner API 列表与当前需求基线完全一致。
- 地址簿 `list/search/lookup_by_address/get/get_all/create/update/delete` DTO 完整定义。
- `CKB`、`ETH`、`USDT`、`USDC` 的余额查询与转账 DTO 完整定义。
- `CKB` 与 `Ethereum` 的 `tx status` DTO 完整定义。
- 币种限额配置 DTO 与限额超限错误结构定义。
- 通用错误码集合稳定定义。
- API / MCP 返回 envelope 统一定义。

### 3.4 本期必须冻结的工具

- `wallet.current`
- `wallet.operation_status`
- `address_book.list`
- `address_book.search`
- `address_book.lookup_by_address`
- `address_book.get`
- `address_book.get_all`
- `address_book.create`
- `address_book.update`
- `address_book.delete`
- `nervos.address`
- `nervos.balance.ckb`
- `nervos.sign_message`
- `nervos.transfer.ckb`
- `nervos.tx_status`
- `ethereum.address`
- `ethereum.balance.eth`
- `ethereum.balance.usdt`
- `ethereum.balance.usdc`
- `ethereum.sign_message`
- `ethereum.transfer.eth`
- `ethereum.transfer.usdt`
- `ethereum.transfer.usdc`
- `ethereum.tx_status`

### 3.5 验收标准

- `packages/app-contracts/src/schemas/mcp.ts` 中的工具列表与设计文档完全一致。
- `packages/app-contracts/src/schemas/ethereum.ts` 必须同时包含 `ETH`、`USDT`、`USDC` 的余额与转账模型。
- contracts 必须定义 `ASSET_LIMIT_EXCEEDED` 的结构化返回。
- 任何开发者只看 contracts 包即可知道本期具体支持哪些动作。

## 4. 阶段 1：服务端骨架与模块装配

### 4.1 目标

建立唯一正式运行时骨架，确保 Nest 服务、MCP、Owner API、静态 UI 托管全部在新结构下装配。

### 4.2 主要仓库落点

- `apps/wallet-server/src/app.module.ts`
- `apps/wallet-server/src/main.ts`
- `apps/wallet-server/src/modules/`
- `apps/wallet-server/src/controllers/`
- `apps/wallet-server/src/common/`
- `apps/wallet-server/src/tokens.ts`

### 4.3 必须交付

- `ConfigModule`
- `DatabaseModule`
- `VaultModule`
- `CkbModule`
- `EvmModule`
- `WalletModule`
- `AddressBookModule`
- `TransferTrackingModule`
- `WalletToolsModule`
- `McpModule`
- `OwnerAuthModule`
- `OwnerApiModule`
- `AuditModule`
- `HealthModule`

### 4.4 开发要求

- `controller` 只处理 transport、校验、响应封装，不承载业务逻辑。
- `module` 只负责装配，不直接写业务分支。
- `wallet tool registry` 必须成为 Agent MCP 和 Owner HTTP gateway 的唯一工具注册入口。
- UI 静态产物只允许通过 Nest 托管，不引入第二个正式后端。

### 4.5 验收标准

- Agent 可通过 `MCP` 访问工具目录。
- Owner 可通过 `HTTP` 完成登录并调用 wallet tool gateway。
- 服务端模块边界与 [04-modules-and-runtime.md](./04-modules-and-runtime.md) 一致。

## 5. 阶段 2：钱包领域、应用服务与持久化

### 5.1 目标

建立单钱包主模型、导入导出闭环、审计闭环和操作状态闭环。

### 5.2 主要仓库落点

- `packages/domain/src/`
- `packages/application/src/ports/`
- `packages/application/src/services/`
- `packages/infrastructure/src/`
- `apps/wallet-server/src/modules/database.module.ts`
- `apps/wallet-server/src/modules/vault.module.ts`

### 5.3 必须交付

- 单钱包聚合模型与状态模型
- 地址簿联系人模型
- 地址簿按精确地址匹配模型
- 转账目标解析模型
- 币种限额策略模型
- 地址簿创建、列表、搜索、按精确地址查询、详情、全量详情、更新、删除应用服务
- 钱包创建、恢复、导出、查看应用服务
- 签名操作记录
- 转账操作记录
- 地址簿仓储实现
- 审计日志写入
- SQLite 仓储实现
- `KEK + DEK` vault 实现
- `operation_status` 查询能力
- Agent 转账前的限额评估能力
- Agent 转账额度预占能力
- 转账异步结算能力

### 5.4 开发要求

- 钱包模型必须坚持“全系统只有一个当前钱包”。
- 导入私钥的语义必须是“恢复并替换当前钱包”，不是“新增钱包”。
- 导出私钥必须走 Owner 权限与审计。
- 地址簿名称唯一性必须按归一化规则执行。
- 同一链下的同一个地址允许被多个联系人名称复用，不得加唯一限制。
- 地址簿是共享数据，不做 Agent / Owner 私有隔离。
- 地址簿按精确地址查询必须只返回匹配联系人名称，不返回链上真实归属判断。
- 地址簿创建与更新必须严格校验地址合法性，并持久化规范化地址。
- 转账状态必须可追踪，不能只返回成功或失败字符串。
- 转账中的 `contact_name` 必须在应用层解析为最终地址。
- 地址匹配查询只输入 `address`，由应用层完成链识别与规范化。
- 限额评估必须在应用层执行，不能下放到 UI 或 Agent。
- Agent 转账必须先预占额度，再进入链适配器。
- 广播失败、链上失败或超时都必须返还额度。
- `wallet.operation_status` 与链上 `tx status` 必须分开建模。
- Owner 的限额配置修改必须独立建模并审计。
- 仓储接口定义在应用层端口，具体 SQLite 实现在基础设施层。

### 5.5 验收标准

- 首次启动可自动创建钱包。
- 导入恢复后，地址、签名、转账都切换到新钱包。
- 导出私钥需要登录 Owner，并生成审计记录。
- 地址簿 CRUD、列表、搜索、按精确地址查询、详情、全量详情能力全部可用。
- 所有高风险操作都产生审计日志。
- Agent 命中限额时能返回结构化 `limit` 信息。
- `RESERVED` 操作在进程重启后仍能被恢复和结算。

## 6. 阶段 3：Nervos CKB 闭环

### 6.1 目标

完成 `CKB` 地址查询、余额查询、消息签名、转账与状态追踪。

### 6.2 主要仓库落点

- `packages/adapters-ckb/src/`
- `packages/application/src/services/nervos.service.ts`
- `packages/app-contracts/src/schemas/nervos.ts`
- `apps/wallet-server/src/modules/ckb.module.ts`

### 6.3 必须交付

- 基于 `@ckb-ccc/shell` 的地址推导
- `CKB` 最小单位余额查询
- Nervos 消息签名
- `CKB` 转账广播
- `CKB` `tx status` 查询
- 转账失败错误码映射
- `ckb` 链写操作串行化

### 6.4 开发要求

- 金额输入输出统一使用最小单位整数字符串。
- 适配器层负责链 SDK 细节，应用层不感知 `@ckb-ccc/shell` 原始对象。
- `nervos.transfer.ckb` 必须只处理 `CKB`，不能扩展成通用 Nervos 资产入口。
- `nervos.transfer.ckb` 必须支持 `toType=address|contact_name`。

### 6.5 验收标准

- `nervos.address`、`nervos.balance.ckb`、`nervos.sign_message`、`nervos.transfer.ckb` 全部可用。
- `nervos.tx_status` 可按 `txHash` 返回链上状态。
- `nervos.transfer.ckb` 使用 `contact_name` 时可解析到 `Nervos` 地址。
- `wallet.operation_status` 能返回 CKB 转账状态。
- 构造失败、广播失败、余额不足都能返回可诊断错误。

## 7. 阶段 4：Ethereum ETH、USDT 与 USDC 闭环

### 7.1 目标

完成 Ethereum 地址、`ETH` 余额、`USDT` 余额、`USDC` 余额、Ethereum 签名、`ETH` 转账、`USDT` 转账、`USDC` 转账。

### 7.2 主要仓库落点

- `packages/adapters-evm/src/`
- `packages/application/src/services/ethereum.service.ts`
- `packages/app-contracts/src/schemas/ethereum.ts`
- `packages/app-contracts/src/schemas/mcp.ts`
- `apps/wallet-server/src/modules/evm.module.ts`
- `apps/wallet-server/src/modules/wallet-tools/wallet-tool-registry.service.ts`

### 7.3 必须交付

- 基于 `viem` 的地址推导
- `ETH` 最小单位余额查询
- `USDT` 最小单位余额查询
- `USDC` 最小单位余额查询
- Ethereum 消息签名
- `ETH` 原生转账
- `USDT` ERC-20 转账
- `USDC` ERC-20 转账
- `ethereum.tx_status`
- `evm` 链写操作串行化
- `ETH`、`USDT`、`USDC` 的错误码映射

### 7.4 开发要求

- `ETH`、`USDT`、`USDC` 必须是三个明确动作，不允许用一个外部通用 transfer tool 合并。
- `packages/app-contracts/src/schemas/mcp.ts`、`wallet-tool-registry.service.ts`、应用服务层、Owner UI 必须同时覆盖 `ethereum.transfer.eth`。
- `USDT` 与 `USDC` 合约地址必须通过配置提供，不允许写死在 UI 层。
- `ETH`、`USDT`、`USDC` 都必须有余额查询和转账闭环，不能只实现其中一半。
- `ethereum.tx_status` 必须能被 Agent 和后台结算任务共同复用。
- `ethereum.transfer.eth`、`ethereum.transfer.usdt`、`ethereum.transfer.usdc` 都必须支持 `toType=address|contact_name`。

### 7.5 验收标准

- `ethereum.balance.eth`
- `ethereum.balance.usdt`
- `ethereum.balance.usdc`
- `ethereum.sign_message`
- `ethereum.transfer.eth`
- `ethereum.transfer.usdt`
- `ethereum.transfer.usdc`
- `ethereum.tx_status`

以上能力都能独立调用、独立报错、独立追踪状态。

## 8. 阶段 5：MCP 与 Owner HTTP Gateway

### 8.1 目标

把应用能力稳定暴露给 Agent 和 Owner，而不派生第二套业务实现。

### 8.2 主要仓库落点

- `apps/wallet-server/src/controllers/mcp.controller.ts`
- `apps/wallet-server/src/controllers/wallet-tools.controller.ts`
- `apps/wallet-server/src/modules/mcp/`
- `apps/wallet-server/src/modules/wallet-tools/`
- `design/contracts/mcp-and-owner-interfaces.md`

### 8.3 必须交付

- MCP transport
- wallet tool catalog
- wallet tool HTTP gateway
- address book tools transport exposure
- Owner auth / logout / credential rotation
- current wallet / import / export / audit owner APIs
- asset limit owner APIs

### 8.4 开发要求

- Agent 只通过 `MCP` 使用钱包能力。
- Owner UI 只通过 Owner API 与 wallet tool gateway 访问后端。
- gateway 必须复用同一套 tool registry。
- 不允许为 UI 新增聚合看板接口。
- 不允许把某个链能力只暴露给 Owner 而不暴露给 Agent，除非 `PRD` 明确区分。
- 限额配置必须走独立 Owner API，不复用 wallet tools gateway 伪装成钱包工具。
- `nervos.tx_status` 与 `ethereum.tx_status` 必须经由同一 registry 暴露。
- 地址簿能力必须通过 `address_book.xxx` tools 暴露，不新增第二组 Owner 专用地址簿后端接口。
- `address_book.lookup_by_address` 必须与其他地址簿 tools 一起经由同一 registry 暴露。

### 8.5 验收标准

- Agent 与 Owner 调用同一工具时，返回模型一致。
- wallet tool catalog 中的工具集合与契约文档一致。
- `wallet.current`、`wallet.operation_status`、`nervos.tx_status`、`ethereum.tx_status` 在 `MCP` 与 HTTP gateway 中都可用。
- `address_book.list/search/lookup_by_address/get/get_all/create/update/delete` 在 `MCP` 与 HTTP gateway 中都可用。
- Owner 可通过独立接口读取和修改币种限额配置。

## 9. 阶段 6：Owner UI 闭环

### 9.1 目标

交付一个可直接接管 Agent 操作的钱包 Owner UI。

### 9.2 主要仓库落点

- `apps/owner-ui/src/App.tsx`
- `apps/owner-ui/src/api/`
- `apps/owner-ui/src/components/`
- `apps/owner-ui/src/types/app-state.ts`
- `apps/owner-ui/src/styles.css`

### 9.3 必须交付

- 登录页
- 当前钱包状态
- 地址簿联系人列表
- 地址簿名称搜索
- 按精确地址查询匹配联系人
- 联系人详情查看
- 联系人新增/编辑表单
- CKB 地址与余额展示
- ETH 地址与余额展示
- USDT 余额展示
- USDC 余额展示
- Nervos 消息签名面板
- Ethereum 消息签名面板
- `CKB` 转账面板
- `ETH` 转账面板
- `USDT` 转账面板
- `USDC` 转账面板
- 币种限额配置面板
- 钱包恢复导入
- 私钥导出
- 凭证轮换
- 审计日志查看
- 风险说明展示

### 9.4 开发要求

- UI 看板必须完全由原子能力组合而成，不新增后端聚合接口。
- UI 必须按链分组展示资产，但组合逻辑留在前端。
- 地址簿 UI 必须以联系人名称为主视角展示，不按链拆成多行列表。
- 精确地址查询结果只展示匹配联系人名称列表，不把它误写成链上归属说明。
- 每个转账面板只服务一个明确资产。
- 转账表单必须支持输入原始地址或联系人名称。
- 限额配置 UI 必须按币种展示日、周、月三档设置。
- UI 中的风险说明必须覆盖默认 Owner 凭证、私钥导出、恢复替换钱包、信用钱包资金隔离四类风险。
- `TransferPanels.tsx` 和 `types/app-state.ts` 必须同时反映 `CKB`、`ETH`、`USDT`、`USDC` 四类资产。

### 9.5 验收标准

- Owner 登录后能完整看到 CKB、ETH、USDT、USDC 状态。
- Owner 可完成地址簿的新增、查看、修改、删除、搜索、按精确地址查询和详情查看。
- Owner 不需要切换工具协议，即可一键完成签名与四类转账。
- Owner 可直接查看并修改四类资产的限额配置。
- UI 不依赖任何后端聚合 dashboard API。

## 10. 阶段 7：部署、安全与运维闭环

### 10.1 目标

把服务从“能运行”推进到“可部署、可恢复、可运维”。

### 10.2 主要仓库落点

- `deploy/docker/`
- `docker-compose.yml`
- `scripts/docker-up.sh`
- `scripts/docker-rotate-kek.sh`
- `apps/wallet-server/.env.example`
- `deploy/docker/.env.example`
- `design/architecture/07-security-and-key-management.md`
- `design/architecture/10-deployment-and-operations.md`

### 10.3 必须交付

- 单一官方运行镜像 + `quickstart|managed` 双档位模型
- `DEPLOYMENT_PROFILE=quickstart|managed` 部署档位
- `CHAIN_ENV=custom|testnet|mainnet` 模式化配置
- `CHAIN_CONFIG_PATH` 驱动的 custom 链配置加载
- `TZ` 驱动的 server 本地时区口径
- 转账结算轮询与确认阈值配置
- 官方镜像默认 `quickstart` 档位
- `managed` 显式启用与 fail-fast 规范
- `/app/runtime-data` 运行时 volume 约定
- quickstart 运行时 secret 自动生成与持久化规范
- quickstart 首次启动 Owner 凭证输出规范
- quickstart 到 managed 的接管迁移规范
- 非 Docker 路径下的 `WALLET_KEK_PATH` 启动规范
- Docker secret 路径下的 `KEK` 读取规范
- 默认 Owner 凭证通知规范
- Docker 一键启动说明
- `KEK` 轮换流程
- SQLite 备份恢复流程
- 健康检查与日志规范

### 10.4 开发要求

- 官方镜像必须支持 `docker run <image>` 零配置启动。
- 官方只发布一个正式运行镜像，`quickstart` 与 `managed` 通过 `DEPLOYMENT_PROFILE` 区分。
- 官方镜像默认落在 `quickstart` 档位，而不是 `managed`。
- `quickstart` 默认只能落在 `testnet` preset，不允许默认主网。
- `quickstart` 下自动生成的 `KEK` 和 Owner JWT secret 必须写入运行时 volume，不得写入镜像层。
- 不得依据 external secret 或挂载文件自动推断进入 `managed`。
- `managed` 缺失外部 `KEK`、Owner JWT secret 或必要链配置时必须 fail-fast。
- Dockerfile 必须声明运行时 volume，保证无挂载参数时仍有可写运行时目录。
- 首次 quickstart 启动必须把 Owner 凭证文件路径写入日志，并允许把初始凭证明文打印到日志一次。
- 后续重启不得重复打印同一凭证明文。
- `testnet` 与 `mainnet` 必须使用内置 preset。
- `custom` 必须通过 JSON 文件提供完整链配置，不允许把整套链配置散落在 env。
- `custom` 模式必须校验 CKB `genesisHash`、EVM `chainId`、USDT 合约 `decimals()` 和 USDC 合约 `decimals()`。
- 部署文档必须明确 `TZ` 对限额重置的影响。
- 转账结算任务必须默认启用，不能要求人工触发。
- 生产默认不允许依赖明文 `WALLET_KEK` 环境变量。
- Docker 示例不得提交真实 secret。
- 部署说明必须覆盖 Docker 与非 Docker 两条路径。
- 任何部署脚本都不得绕开审计、认证和 vault 初始化步骤。

### 10.5 验收标准

- `docker run <image>` 在不提供额外 env 和 secret 的情况下能够完成首次启动。
- `docker run -p 18799:18799 <image>` 能让用户完成首次登录和后续操作。
- quickstart 首次启动后，运行时目录中可见数据库、`wallet.kek`、Owner JWT secret 和 Owner 凭证文件。
- 重启同一容器后，钱包、Owner 凭证和 JWT secret 保持不变。
- 同一镜像能够分别以 `quickstart` 与 `managed` 两种档位启动。
- 开发者可按设计文档在 Docker 和非 Docker 两种模式下完成部署。
- 丢失数据库或迁移设备时，恢复流程有明确步骤。
- 从 `quickstart` 接管到 `managed` 的迁移边界有明确步骤。
- `managed` 模式下 `KEK` 控制权归属在部署侧而不在应用自身。

## 11. 阶段 8：测试与交付验收

### 11.1 目标

确保本期能力不是“接口存在”，而是真正闭环。

### 11.2 主要仓库落点

- `apps/wallet-server` 测试目录
- `packages/*` 测试目录
- `apps/owner-ui` 端到端测试目录

### 11.3 必须交付

- contract schema 测试
- application service 单元测试
- SQLite / vault 集成测试
- CKB 适配器集成测试
- EVM 适配器集成测试
- Owner API 集成测试
- Owner UI 关键流程端到端测试

### 11.4 最低验收场景

- 首次启动自动生成钱包
- 查看当前钱包
- 查看 CKB、ETH、USDT、USDC 余额
- Nervos 签名
- Ethereum 签名
- CKB 转账
- ETH 转账
- USDT 转账
- USDC 转账
- Owner 配置币种限额
- Agent 触发限额并收到结构化 `limit` 信息
- Owner 登录、改密、导入、导出
- 操作审计查询

### 11.5 发布前检查

- 所有 PRD 范围内工具均有测试覆盖
- 所有高风险动作均写入审计
- 仓库中不存在真实数据库、真实密钥、真实默认凭证文件
- 文档、contracts、运行时工具注册三者一致
