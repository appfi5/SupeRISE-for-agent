# Docker 部署指南

本文档介绍如何使用 Docker / Docker Compose 构建和运行 **SupeRISELocalServer**（本地签名服务器）。

---

## 目录

1. [前置条件](#前置条件)
2. [快速开始（推荐）](#快速开始推荐)
3. [仅使用 Docker 命令](#仅使用-docker-命令)
4. [环境变量说明](#环境变量说明)
5. [数据持久化](#数据持久化)
6. [多环境支持](#多环境支持)
7. [开发环境热更新](#开发环境热更新)
8. [安全加固说明](#安全加固说明)
9. [常见问题](#常见问题)
10. [CI 流程](#ci-流程)

---

## 前置条件

| 工具 | 最低版本 | 安装参考 |
|------|----------|----------|
| Docker | 24.x | https://docs.docker.com/get-docker/ |
| Docker Compose | v2.x (已内置于 Docker Desktop) | https://docs.docker.com/compose/install/ |

> **注意**：本指南在 Linux、macOS 和 WSL2 上均已验证。Windows 原生 CMD/PowerShell 需将 `\` 换行符替换为 `` ` ``。

---

## 快速开始（推荐）

```bash
# 1. 进入项目根目录
cd SupeRISE-for-agent

# 2. 复制环境变量示例文件（按需修改）
cp .env.example .env

# 3. 启动生产模式
docker compose --profile production up -d

# 4. 验证服务健康状态
curl http://localhost:18799/healthz
# → Healthy

# 5. 访问 Swagger UI（API 文档）
open http://localhost:18799/superise-for-agent/swagger
```

---

## 仅使用 Docker 命令

### 构建镜像

```bash
docker build \
  -t superise-local-server:latest \
  SupeRISELocalServer
```

### 运行容器（生产）

```bash
docker run -d \
  --name superise-server \
  -p 18799:18799 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__AppDb="Data Source=/app/data/app.db" \
  -e Ckb__NetWork=0 \
  -e Ckb__NodeUrl=https://mainnet.ckb.dev \
  -e CurrentEnvironment__IsDebug=false \
  -v superise-data:/app/data \
  superise-local-server:latest
```

### 运行容器（开发/测试网）

```bash
docker run -d \
  --name superise-server-dev \
  -p 18799:18799 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -e ConnectionStrings__AppDb="Data Source=/app/data/app.db" \
  -e Ckb__NetWork=1 \
  -e Ckb__NodeUrl=https://testnet.ckb.dev \
  -e CurrentEnvironment__IsDebug=true \
  -v superise-dev-data:/app/data \
  superise-local-server:latest
```

---

## 环境变量说明

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `ASPNETCORE_ENVIRONMENT` | `Production` | ASP.NET 环境名，可为 `Development` 或 `Production` |
| `ASPNETCORE_URLS` | `http://+:18799` | 监听地址 |
| `ConnectionStrings__AppDb` | `Data Source=/app/data/app.db` | SQLite 数据库路径 |
| `Ckb__NetWork` | `0` | CKB 网络：`0` = 主网，`1` = 测试网 |
| `Ckb__NodeUrl` | `https://mainnet.ckb.dev` | CKB 节点 RPC 地址 |
| `CurrentEnvironment__IsDebug` | `false` | `true` 时首次启动自动生成密钥对（仅用于开发调试） |
| `HOST_PORT` | `18799` | 宿主机映射端口（仅 docker-compose） |

> **安全提示**：不要将私钥或敏感值写入镜像或代码仓库。  
> 生产环境中通过 `-e` 或 Docker Secrets / Kubernetes Secrets 等方式在运行时注入。

---

## 数据持久化

SQLite 数据库文件默认保存在容器内的 `/app/data/app.db`。  
务必通过 **具名卷** 或 **绑定挂载** 持久化该目录，否则容器删除后数据丢失。

### 方式一：具名卷（推荐）

```bash
docker run ... -v superise-data:/app/data ...
```

### 方式二：绑定挂载（方便调试）

```bash
mkdir -p $(pwd)/data
docker run ... -v $(pwd)/data:/app/data ...
```

查看数据卷：

```bash
docker volume ls | grep superise
docker volume inspect superise-data
```

---

## 多环境支持

`docker-compose.yml` 通过 [Compose Profiles](https://docs.docker.com/compose/profiles/) 区分环境：

```bash
# 开发环境（testnet, IsDebug=true）
docker compose --profile development up

# 生产环境（mainnet, IsDebug=false）
docker compose --profile production up -d
```

也可通过 `.env` 文件覆盖默认值，无需修改 `docker-compose.yml`：

```env
# .env
HOST_PORT=18799
CKB_NETWORK=1
CKB_NODE_URL=https://testnet.ckb.dev
IS_DEBUG=true
```

---

## 开发环境热更新

Docker 容器中默认不支持代码热更新。如需在开发过程中实时调试代码，推荐**不使用 Docker**，直接在宿主机运行：

```bash
cd SupeRISELocalServer/src
dotnet run --configuration Development
```

若坚持使用 Docker 进行开发，可将源码绑定挂载并使用 `dotnet watch`：

```bash
docker run -it --rm \
  -p 18799:18799 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -v $(pwd)/SupeRISELocalServer:/app/src \
  -w /app/src/src \
  mcr.microsoft.com/dotnet/sdk:10.0 \
  dotnet watch run
```

---

## 安全加固说明

本 Dockerfile 已包含以下安全措施：

1. **非 root 用户运行**：容器内以 `appuser`（UID 1001）身份运行，防止提权攻击。
2. **多阶段构建**：最终镜像仅包含 ASP.NET 运行时，不含 SDK、源码或中间构建产物，显著减小攻击面。
3. **最小基础镜像**：使用 `mcr.microsoft.com/dotnet/aspnet` 而非完整 SDK 镜像。
4. **健康检查**：内置 `HEALTHCHECK` 指令，便于容器编排平台（Docker Swarm / Kubernetes）监控。
5. **无敏感信息入镜**：私钥、密码等敏感信息通过运行时环境变量注入，不写入镜像层。

---

## 常见问题

### Q: 容器启动后访问 18799 端口无响应

1. 检查容器状态：`docker ps`
2. 查看日志：`docker logs superise-server`
3. 确认防火墙/端口映射：`docker inspect superise-server | grep -A 10 Ports`

### Q: 数据库迁移失败

容器启动时会自动执行 `MigrateAsync()`，如果失败，常见原因：

- `/app/data` 目录不可写（检查卷挂载权限）
- SQLite 文件被其他进程锁定

查看详细日志：

```bash
docker logs superise-server 2>&1 | grep -i "error\|exception"
```

### Q: `IsDebug=true` 但没有自动生成密钥

确保 `ASPNETCORE_ENVIRONMENT=Development` 与 `CurrentEnvironment__IsDebug=true` 同时设置，且数据库中尚无 `KeyConfig` 记录。

### Q: 如何备份数据库

```bash
# 备份
docker run --rm \
  -v superise-data:/data \
  -v $(pwd)/backup:/backup \
  busybox cp /data/app.db /backup/app-$(date +%Y%m%d).db

# 恢复
docker run --rm \
  -v superise-data:/data \
  -v $(pwd)/backup:/backup \
  busybox cp /backup/app-20240101.db /data/app.db
```

### Q: 如何升级镜像

```bash
# 重新构建镜像
docker compose --profile production build --no-cache

# 重启服务（数据卷保留）
docker compose --profile production up -d
```

---

## CI 流程

项目内置 GitHub Actions 工作流 `.github/workflows/docker-build-test.yaml`，在以下情况自动触发：

- 推送到 `main`/`master` 分支（涉及服务器或 Docker 文件变更）
- 对 `main`/`master` 的 Pull Request

工作流步骤：

1. **Build** – 使用 `docker/build-push-action` 构建镜像，启用 GitHub Actions 缓存加速。
2. **Start** – 以开发配置启动容器。
3. **Health check** – 轮询 `/healthz` 端点，最多等待 60 秒。
4. **Swagger check** – 验证 Swagger UI 可访问。
5. **Logs** – 无论成功失败，输出容器日志便于排查。
6. **Cleanup** – 清理临时容器。
