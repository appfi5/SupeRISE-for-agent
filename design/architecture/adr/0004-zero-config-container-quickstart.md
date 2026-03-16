# ADR 0004 零配置容器启动与双部署档位

## 状态

Accepted

## 日期

2026-03-16

## 背景

产品需要支持一种“傻瓜式一键启动”场景：

- 由团队本地构建并分发官方镜像
- 使用者只需执行 `docker run <image>` 或最少量参数命令即可完成首次启动
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

### 1. 正式拆分为两个部署档位

系统正式支持两种部署档位：

- `quickstart`
- `managed`

### 2. `quickstart` 是官方镜像默认档位

`quickstart` 的目标是支持官方镜像直接启动。

正式要求：

- 官方镜像默认使用 `quickstart`
- 用户可直接执行 `docker run <image>` 完成首次启动
- 默认链环境固定为 `testnet` preset
- 不要求用户提供外部 `KEK`
- 不要求用户提供外部 Owner JWT secret

### 3. `quickstart` 允许自动生成运行时 secret

在 `quickstart` 档位下，系统允许在首次启动时自动生成并持久化：

- `wallet.kek`
- `owner-jwt.secret`
- 当前钱包
- 默认 Owner 凭证

这些内容必须满足：

- 只允许写入运行时数据目录
- 不允许写入镜像层
- 不允许在版本库中提供默认值

### 4. `managed` 是正式受控部署档位

在 `managed` 档位下：

- `KEK` 必须由部署侧提供
- Owner JWT secret 必须由部署侧提供
- 应优先用于 `docker-compose` 与非 docker 正式部署
- 不依赖 quickstart 自动生成的 runtime secret

### 5. 官方镜像必须声明运行时 volume

为保证用户在不挂载额外 volume 时也能完成启动，官方镜像必须声明运行时 volume，例如：

- `/app/runtime-data`

该目录用于承载：

- SQLite 数据库
- 自动生成的运行时 secret
- 默认 Owner 凭证文件

### 6. 零配置启动与零参数可访问是两个不同目标

正式边界：

- `docker run <image>` 只保证容器完成初始化与服务启动
- 若未提供 `-p`，宿主机默认无法访问容器端口

因此：

- 系统必须支持“零配置启动”
- 但不把“零参数即可从宿主机访问”定义为应用架构目标

### 7. 首次启动允许输出一次性凭证提示

为避免零配置场景下用户拿不到 Owner 登录凭证，`quickstart` 首次启动时允许：

- 将 Owner 凭证文件路径写入日志
- 将初始 Owner 凭证明文打印到日志一次

同时必须满足：

- 只允许首次启动输出
- 后续重启不得重复打印同一凭证明文

## 结果

这项决策带来的结果是：

- 官方镜像可真正支持零配置首次启动
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
