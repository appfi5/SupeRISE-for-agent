# ADR 0004 零配置容器启动与双部署档位

## 状态

Accepted

## 日期

2026-03-16

## 背景

产品需要支持一种“傻瓜式一键启动”场景：

- 由团队本地构建并分发官方镜像
- 使用者只需执行最少量参数命令即可完成首次启动
- 使用者不应被要求预先准备 `.env`
- 使用者不应被要求预先准备 `KEK`
- 使用者不应被要求预先准备链配置 JSON

但系统同时仍需要保留正式受控部署能力：

- 根密钥应尽量由部署侧掌握
- 链环境和运行时 secret 应具备明确控制边界
- 后续仍应支持 `docker-compose`、非 docker 和可恢复部署

如果不显式拆分部署档位，架构会落入二选一：

- 要么坚持“密钥必须外部提供”，导致零配置启动无法成立
- 要么默认允许应用自动生成所有 secret，导致正式部署边界被整体放松

## 决策

### 1. 官方只发布一个正式运行镜像

Docker Hub 分发层只发布一个正式运行镜像。

正式要求：

- `quickstart` 与 `managed` 是同一镜像的两种运行档位
- 运行档位通过 `DEPLOYMENT_PROFILE` 显式决定
- 不得根据挂载的 secret、文件路径或链配置自动推断档位

### 2. 正式拆分为两个部署档位

系统正式支持两种部署档位：

- `quickstart`
- `managed`

### 3. `quickstart` 是官方镜像默认档位

`quickstart` 的目标是支持官方镜像直接启动。

正式要求：

- 官方镜像默认使用 `quickstart`
- quickstart 官方最小命令为 `docker run -p 18799:18799 -v superise-agent-wallet-data:/app/runtime-data <image>`
- 默认链环境固定为 `testnet` preset
- 不要求用户提供外部 `KEK`
- 不要求用户提供外部 Owner JWT secret

### 4. `quickstart` 允许自动生成运行时 secret

在 `quickstart` 档位下，系统允许在首次启动时自动生成并持久化：

- `wallet.kek`
- `owner-jwt.secret`
- 当前钱包
- 默认 Owner 凭证

这些内容必须满足：

- 只允许写入运行时数据目录
- 不允许写入镜像层
- 不允许在版本库中提供默认值
- 必须写入显式外挂的持久化卷

### 5. `managed` 是正式受控部署档位

在 `managed` 档位下：

- `KEK` 必须由部署侧提供
- Owner JWT secret 必须由部署侧提供
- 应优先用于 `docker-compose` 与非 docker 正式部署
- 不依赖 quickstart 自动生成的 runtime secret

### 6. `managed` 必须显式启用且 fail-fast

正式要求：

- 必须显式设置 `DEPLOYMENT_PROFILE=managed`
- 缺失外部 `KEK`、Owner JWT secret 或必要链配置时必须直接启动失败
- 不得自动退回 `quickstart`

### 7. quickstart 必须使用显式外挂运行时数据卷

为保证 quickstart 数据不会随着容器意外删除而丢失，系统必须使用显式外挂的运行时数据卷，例如：

- `/app/runtime-data`

该目录用于承载：

- SQLite 数据库
- 自动生成的运行时 secret
- 默认 Owner 凭证文件

正式要求：

- quickstart 官方卷名统一为 `superise-agent-wallet-data`
- quickstart 启动前必须确认 `/app/runtime-data` 为外部挂载的持久化存储
- Dockerfile 不得依赖 `VOLUME /app/runtime-data` 作为正式持久化方案，避免匿名 volume 掩盖未挂载问题

### 8. 零配置启动与零参数可访问是两个不同目标

正式边界：

- quickstart 解决的是“零应用配置启动”，不是“零 Docker 参数启动”
- 若未提供 `-p`，宿主机默认无法访问容器端口
- 若未提供显式数据卷挂载，系统必须直接启动失败

因此：

- 系统必须支持“零应用配置启动”
- 但不把“零参数即可从宿主机访问”定义为应用架构目标

### 9. 首次启动允许输出一次性凭证提示

为避免零配置场景下用户拿不到 Owner 登录凭证，`quickstart` 首次启动时允许：

- 将 Owner 凭证文件路径写入日志
- 将初始 Owner 凭证明文打印到日志一次

同时必须满足：

- 只允许首次启动输出
- 后续重启不得重复打印同一凭证明文

### 10. 支持后续从 `quickstart` 接管到 `managed`

正式要求：

- 两种档位共用同一镜像、同一数据库格式与同一钱包密文格式
- 接管迁移必须由运维显式触发
- 迁移的核心动作是把现有 `KEK` 接管为外部受控 secret，或使用新的外部 `KEK` 重包装现有 `DEK`
- 切换完成后，系统必须以 `DEPLOYMENT_PROFILE=managed` 重新启动
- 删除 quickstart 容器后，只要重新挂回同一 `superise-agent-wallet-data`，系统就必须恢复原状态

### 11. quickstart 数据不得直接暴露给 Agent

正式要求：

- `superise-agent-wallet-data` 只允许挂载到钱包服务容器
- Agent 可见面只包括 MCP 工具返回值，不包括运行时文件、日志或挂载目录内容
- 挂载数据中的 `KEK`、JWT secret、SQLite 文件都不得通过 MCP 或 Owner API 直接暴露

## 结果

这项决策带来的结果是：

- 官方镜像可在显式挂卷前提下支持零应用配置首次启动
- Docker Hub 使用者只需要理解一个镜像，而不是两套镜像
- 正式部署仍保留受控密钥边界
- quickstart 与 managed 的安全假设不会相互污染
- 开发和评审可以明确知道哪些自动生成行为只属于 quickstart

## 后续影响

开发时必须同步更新：

- `design/architecture/07-security-and-key-management.md`
- `design/architecture/10-deployment-and-operations.md`
- `design/architecture/12-implementation-roadmap.md`
- `design/architecture/13-development-requirements-and-quality-gates.md`

实现上必须新增：

- 部署档位配置解析
- runtime secret 目录约定
- quickstart 首次启动 secret 自举逻辑
- quickstart 一次性凭证输出逻辑
- quickstart 接管到 managed 的迁移流程
- quickstart 外挂数据卷校验与恢复逻辑
