const test = require("node:test");
const assert = require("node:assert/strict");
const { BootstrapOwnerCredentialService } = require("../dist/index.cjs");

function createBootstrapContext() {
  let credential = null;
  let snapshot = null;
  const audits = [];
  const writtenPasswords = [];

  const repos = {
    ownerCredentials: {
      async getCurrent() {
        return credential;
      },
      async saveCurrent(next) {
        credential = next;
      },
    },
    systemConfig: {
      async getCurrent() {
        return snapshot;
      },
      async saveCurrent(next) {
        snapshot = next;
      },
    },
    audits: {
      async save(log) {
        audits.push(log);
      },
    },
  };

  return {
    audits,
    writtenPasswords,
    repos,
    getSnapshot() {
      return snapshot;
    },
    setCredential(value) {
      credential = value;
    },
  };
}

function createUnitOfWork(repos) {
  return {
    async run(work) {
      return work(repos);
    },
  };
}

test("BootstrapOwnerCredentialService returns first-run quickstart notice details", async () => {
  const context = createBootstrapContext();
  const service = new BootstrapOwnerCredentialService(
    context.repos,
    createUnitOfWork(context.repos),
    {
      async hashPassword(password) {
        return `hashed:${password}`;
      },
      async verifyPassword() {
        return true;
      },
      generateOwnerPassword() {
        return "owner-pass-1";
      },
    },
    {
      async write(password) {
        context.writtenPasswords.push(password);
        return "/tmp/owner-credential.txt";
      },
    },
    {
      getMetadata() {
        return {
          provider: "runtime-auto-file",
          reference: "/app/runtime-data/secrets/wallet.kek",
        };
      },
    },
  );

  const result = await service.ensureCredential({
    ownerCredentialNoticePath: "/tmp/owner-credential.txt",
    chainRpcConfig: {
      ckb: { mode: "preset", preset: "testnet" },
      evm: { mode: "preset", preset: "testnet" },
    },
  });

  assert.equal(result.created, true);
  assert.equal(result.noticePath, "/tmp/owner-credential.txt");
  assert.equal(result.initialPassword, "owner-pass-1");
  assert.deepEqual(context.writtenPasswords, ["owner-pass-1"]);
  assert.equal(context.getSnapshot().kekProvider, "runtime-auto-file");
  assert.equal(context.audits.length, 1);
});

test("BootstrapOwnerCredentialService does not reissue a password after the first bootstrap", async () => {
  const context = createBootstrapContext();
  context.setCredential({
    credentialId: "owner_credential_current",
    passwordHash: "hashed:old",
    mustRotate: true,
    createdAt: "2026-03-16T00:00:00.000Z",
    updatedAt: "2026-03-16T00:00:00.000Z",
  });
  const existingSnapshot = {
    id: "system_config_current",
    ownerCredentialNoticePath: "/tmp/existing-owner-credential.txt",
    vaultMode: "LOCAL_DEK_KEK",
    kekProvider: "runtime-auto-file",
    kekReference: "/app/runtime-data/secrets/wallet.kek",
    chainRpcConfig: {},
    createdAt: "2026-03-16T00:00:00.000Z",
    updatedAt: "2026-03-16T00:00:00.000Z",
  };
  context.repos.systemConfig.getCurrent = async () => existingSnapshot;
  const service = new BootstrapOwnerCredentialService(
    context.repos,
    createUnitOfWork(context.repos),
    {
      async hashPassword(password) {
        return `hashed:${password}`;
      },
      async verifyPassword() {
        return true;
      },
      generateOwnerPassword() {
        throw new Error("password generation should not run");
      },
    },
    {
      async write() {
        throw new Error("notice writer should not run");
      },
    },
    {
      getMetadata() {
        return {
          provider: "runtime-auto-file",
          reference: "/app/runtime-data/secrets/wallet.kek",
        };
      },
    },
  );

  const result = await service.ensureCredential({
    ownerCredentialNoticePath: "/tmp/new-owner-credential.txt",
    chainRpcConfig: {},
  });

  assert.equal(result.created, false);
  assert.equal(result.noticePath, "/tmp/existing-owner-credential.txt");
  assert.equal(result.initialPassword, undefined);
});
