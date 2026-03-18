const test = require("node:test");
const assert = require("node:assert/strict");
const walletServerPackageJson = require("../package.json");
const {
  resolveBuildInfo,
} = require("../dist/build-info.js");

test("resolveBuildInfo separates code version from build and deploy metadata", () => {
  const info = resolveBuildInfo({
    SUPERISE_BUILD_REF: "refs/tags/test-address-book-1",
    SUPERISE_GIT_SHA: "abc123",
    SUPERISE_BUILT_AT: "2026-03-18T03:14:15Z",
    SUPERISE_DEPLOY_IMAGE_TAG: "test-address-book-1",
    SUPERISE_DEPLOY_IMAGE_DIGEST: "sha256:1234",
  });

  assert.equal(info.appVersion, walletServerPackageJson.version);
  assert.equal(info.buildRef, "refs/tags/test-address-book-1");
  assert.equal(info.gitSha, "abc123");
  assert.equal(info.builtAt, "2026-03-18T03:14:15Z");
  assert.equal(info.deployImageTag, "test-address-book-1");
  assert.equal(info.deployImageDigest, "sha256:1234");
});

test("resolveBuildInfo normalizes missing metadata to null", () => {
  const info = resolveBuildInfo({
    SUPERISE_BUILD_REF: "   ",
    SUPERISE_GIT_SHA: undefined,
    SUPERISE_BUILT_AT: "",
    SUPERISE_DEPLOY_IMAGE_TAG: undefined,
    SUPERISE_DEPLOY_IMAGE_DIGEST: "  ",
  });

  assert.equal(info.appVersion, walletServerPackageJson.version);
  assert.equal(info.buildRef, null);
  assert.equal(info.gitSha, null);
  assert.equal(info.builtAt, null);
  assert.equal(info.deployImageTag, null);
  assert.equal(info.deployImageDigest, null);
});
