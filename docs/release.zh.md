# 发布说明

本文档说明仓库如何发布 Docker 镜像、稳定版与非稳定 tag 的区别，以及版本号和 build 元数据的处理方式。

English version: [release.md](./release.md).

## 发布模型

仓库使用两条不同的发布路径：

- 稳定版走 `main` 上的正式 release workflow
- 预发布和自定义 tag 走 tag push 直发镜像 workflow

这样可以同时满足两件事：稳定版保持可审计、可控；RC 和临时镜像 tag 仍然能保持轻量发布。

## 稳定版发布

稳定版是形如 `vX.Y.Z` 的 tag。

正式流程如下：

1. 先把常规改动合入 `main`
2. 由 `release-please` 创建或更新 Release PR
3. 如需强制指定下一版稳定版本号，可手动运行 `Release` workflow，并传入 `release_as`
4. 合并 Release PR
5. `Release` workflow 会构建 `sha-<commit>` 候选镜像、创建 GitHub release，并把这份已验证的 digest promote 成稳定 Docker tag

稳定版会发布这些 Docker tag：

- `<version>`
- `<major>.<minor>`
- `latest`

相关文件：

- [`.github/workflows/release.yml`](../.github/workflows/release.yml)
- [`.github/release-please-config.json`](../.github/release-please-config.json)
- [`.github/.release-please-manifest.json`](../.github/.release-please-manifest.json)

## 预发布与自定义 Tag

凡是 push 的 tag 只要不是稳定版 `vX.Y.Z`，都会走 tag 直发镜像流程。

例子：

- `v1.2.3-rc.1` -> Docker tag `1.2.3-rc.1`
- `test-address-book-1` -> Docker tag `test-address-book-1`

像 `v1.2.3` 这样的稳定版 semver tag 会被 tag workflow 明确忽略，因为它们由正式 release workflow 接管。

相关文件：

- [`.github/workflows/tag-image.yml`](../.github/workflows/tag-image.yml)

## 锁步版本

仓库使用一套共享版本号，根包和所有 workspace 包保持一致。

- 根 [`package.json`](../package.json) 是唯一版本源
- `release-please` 通过 `extra-files` 更新各 workspace `package.json`
- wallet server 运行时从 [`apps/wallet-server/package.json`](../apps/wallet-server/package.json) 读取代码版本

常用命令：

- `pnpm version:check`
- `pnpm version:sync`
- `pnpm version:set <version>`

## Build 元数据

`/health` 会返回一组 build 元数据，方便运维判断当前运行的到底是哪份代码、哪种镜像别名。

字段包括：

- `appVersion`：来自 `apps/wallet-server/package.json` 的代码版本
- `buildRef`：镜像构建时使用的源码引用
- `gitSha`：烘焙进镜像的精确 commit
- `builtAt`：UTC 构建时间
- `deployImageTag`：运行时注入的部署镜像别名
- `deployImageDigest`：运行时注入的部署 digest

只有构建期字段会被烘焙进镜像。部署期字段是可选的运行时元数据，需要在你确实关心时由部署环境显式注入。

运行时环境变量：

- `SUPERISE_DEPLOY_IMAGE_TAG`
- `SUPERISE_DEPLOY_IMAGE_DIGEST`

## 运维注意事项

- 如果你希望自动创建的 Release PR 也自动触发 CI，请配置 `RELEASE_PLEASE_TOKEN`
- tag 直发镜像不会修改仓库版本号，只会增加一个 Docker 镜像别名
- 同一个 digest 可以同时挂多个 tag，因此不要把 `deployImageTag` 当成镜像内在身份
