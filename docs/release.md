# Release Guide

This guide explains how the repository publishes Docker images, how stable releases differ from non-stable tags, and how versioning and build metadata are handled.

中文版本见 [release.zh.md](./release.zh.md)。

## Release Model

The repository uses two different publishing paths:

- stable releases use the formal release workflow on `main`
- prerelease and custom tags publish images directly from the tag push workflow

This split keeps stable releases auditable while preserving a lightweight path for RC and ad hoc image tags.

## Stable Releases

Stable releases are the tags that match `vX.Y.Z`.

The formal flow is:

1. merge regular changes into `main`
2. let `release-please` create or update the Release PR
3. optionally run the `Release` workflow manually with `release_as` if you need to force the next stable version
4. merge the Release PR
5. the `Release` workflow builds the `sha-<commit>` candidate image, creates the GitHub release, and promotes that validated digest to the stable Docker tags

Stable releases publish these Docker tags:

- `<version>`
- `<major>.<minor>`
- `latest`

Files:

- [`.github/workflows/release.yml`](../.github/workflows/release.yml)
- [`.github/release-please-config.json`](../.github/release-please-config.json)
- [`.github/.release-please-manifest.json`](../.github/.release-please-manifest.json)

## Prerelease And Custom Tags

Any pushed tag that is not a stable `vX.Y.Z` tag goes through the direct tag publishing workflow.

Examples:

- `v1.2.3-rc.1` -> Docker tag `1.2.3-rc.1`
- `test-address-book-1` -> Docker tag `test-address-book-1`

Stable semver tags such as `v1.2.3` are intentionally ignored by the tag workflow because the formal release workflow owns them.

Files:

- [`.github/workflows/tag-image.yml`](../.github/workflows/tag-image.yml)

## Lockstep Versioning

The repository uses one shared version across the root package and every workspace package.

- the root [`package.json`](../package.json) is the source of truth
- `release-please` updates the workspace package versions through `extra-files`
- the wallet server reads its runtime code version from [`apps/wallet-server/package.json`](../apps/wallet-server/package.json)

Useful commands:

- `pnpm version:check`
- `pnpm version:sync`
- `pnpm version:set <version>`

## Build Metadata

`/health` exposes build metadata so operators can tell which code and image alias they are actually running.

Fields:

- `appVersion`: code version from `apps/wallet-server/package.json`
- `buildRef`: source ref used when the image was built
- `gitSha`: exact commit baked into the image
- `builtAt`: UTC build timestamp
- `deployImageTag`: deployment alias injected at runtime
- `deployImageDigest`: deployed digest injected at runtime

Only the build-time fields are baked into the image. The deployment fields are optional runtime metadata and should be injected by the deployment environment when you care about them.

Runtime environment variables:

- `SUPERISE_DEPLOY_IMAGE_TAG`
- `SUPERISE_DEPLOY_IMAGE_DIGEST`

## Operational Notes

- if you want CI workflows to run on Release PRs created by automation, configure `RELEASE_PLEASE_TOKEN`
- direct tag publishing does not change the repository version; it only publishes a Docker image alias
- because one digest can carry multiple tags, never treat `deployImageTag` as intrinsic image identity
