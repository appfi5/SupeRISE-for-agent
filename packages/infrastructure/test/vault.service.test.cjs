const test = require("node:test");
const assert = require("node:assert/strict");
const {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { mkdtempSync } = require("node:fs");
const {
  AesGcmVaultService,
  loadWalletServerConfig,
} = require("../dist/index.cjs");

function hydrateQuickstartRuntimeState(cwd) {
  const dataDir = join(cwd, "data");
  const secretDir = join(dataDir, "secrets");
  mkdirSync(secretDir, { recursive: true });

  if (!existsSync(join(secretDir, "wallet.kek"))) {
    writeFileSync(join(secretDir, "wallet.kek"), "11".repeat(32));
  }
  if (!existsSync(join(secretDir, "owner-jwt.secret"))) {
    writeFileSync(join(secretDir, "owner-jwt.secret"), "x".repeat(32));
  }
  if (!existsSync(join(dataDir, "wallet.sqlite"))) {
    writeFileSync(join(dataDir, "wallet.sqlite"), "");
  }
  if (!existsSync(join(dataDir, "owner-credential.txt"))) {
    writeFileSync(join(dataDir, "owner-credential.txt"), "owner notice");
  }
}

test("AesGcmVaultService quickstart generates and reuses runtime KEK file", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-vault-quickstart-"));
  const firstConfig = loadWalletServerConfig(
    {
      DEPLOYMENT_PROFILE: "quickstart",
    },
    cwd,
  );

  const firstVault = new AesGcmVaultService(firstConfig);
  await firstVault.validateKek();

  const runtimeKekPath = join(cwd, "data/secrets/wallet.kek");
  assert.equal(firstVault.getMetadata().provider, "runtime-auto-file");
  assert.equal(firstVault.getMetadata().reference, runtimeKekPath);
  assert.ok(existsSync(runtimeKekPath));

  const firstKek = readFileSync(runtimeKekPath, "utf8").trim();
  hydrateQuickstartRuntimeState(cwd);

  const secondConfig = loadWalletServerConfig(
    {
      DEPLOYMENT_PROFILE: "quickstart",
    },
    cwd,
  );
  const secondVault = new AesGcmVaultService(secondConfig);
  await secondVault.validateKek();

  assert.equal(secondVault.getMetadata().provider, "runtime-auto-file");
  assert.equal(readFileSync(runtimeKekPath, "utf8").trim(), firstKek);
});

test("AesGcmVaultService managed supports explicit env KEK when allowed", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-vault-managed-env-"));
  const config = loadWalletServerConfig(
    {
      DEPLOYMENT_PROFILE: "managed",
      OWNER_JWT_SECRET: "x".repeat(32),
      WALLET_KEK: "11".repeat(32),
      ALLOW_PLAINTEXT_KEK_ENV: "true",
    },
    cwd,
  );

  const vault = new AesGcmVaultService(config);
  await vault.validateKek();

  assert.equal(vault.getMetadata().provider, "env");
  assert.equal(vault.getMetadata().reference, "WALLET_KEK");
});
