const test = require("node:test");
const assert = require("node:assert/strict");
const { Logger } = require("@nestjs/common");
const { BootstrapService } = require("../dist/bootstrap.service.js");

function createConfig(overrides = {}) {
  return {
    deploymentProfile: "quickstart",
    ownerNoticePath: "/tmp/owner-credential.txt",
    transferSettlementIntervalMs: 60_000,
    chainConfig: {
      ckb: {
        mode: "preset",
        preset: "testnet",
        rpcUrl: "https://testnet.ckb.dev",
        indexerUrl: "https://testnet.ckb.dev/indexer",
        genesisHash: "0x1",
        addressPrefix: "ckt",
      },
      evm: {
        mode: "preset",
        preset: "testnet",
        rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
        chainId: 11155111,
        networkName: "sepolia",
        tokens: {
          erc20: {
            usdt: {
              standard: "erc20",
              contractAddress: "0x0cF531D755F7324B910879b3Cf7beDFAb872513E",
            },
            usdc: {
              standard: "erc20",
              contractAddress: "0xa704C2f31628ec73A12704fa726a1806613a30ae",
            },
          },
        },
      },
    },
    ...overrides,
  };
}

test("BootstrapService logs the initial Owner credential only on quickstart first boot", async () => {
  const warnings = [];
  const originalWarn = Logger.prototype.warn;
  Logger.prototype.warn = function warn(message) {
    warnings.push(String(message));
  };

  try {
    const service = new BootstrapService(
      createConfig(),
      {
        async migrate() {},
        async close() {},
      },
      {
        async execute() {},
      },
      {
        async ensureWallet() {},
      },
      {
        async ensureCredential() {
          return {
            created: true,
            noticePath: "/tmp/owner-credential.txt",
            initialPassword: "owner-pass-1",
          };
        },
      },
      {
        async execute() {},
      },
    );

    await service.onApplicationBootstrap();
    await service.onApplicationShutdown();
  } finally {
    Logger.prototype.warn = originalWarn;
  }

  assert.equal(warnings.length, 3);
  assert.match(warnings[0], /notice written to \/tmp\/owner-credential\.txt/i);
  assert.match(warnings[1], /owner-pass-1/);
  assert.match(warnings[2], /rotate the initial owner password/i);
});

test("BootstrapService does not log plaintext Owner credentials outside quickstart first boot", async () => {
  const warnings = [];
  const originalWarn = Logger.prototype.warn;
  Logger.prototype.warn = function warn(message) {
    warnings.push(String(message));
  };

  try {
    const service = new BootstrapService(
      createConfig({ deploymentProfile: "managed" }),
      {
        async migrate() {},
        async close() {},
      },
      {
        async execute() {},
      },
      {
        async ensureWallet() {},
      },
      {
        async ensureCredential() {
          return {
            created: true,
            noticePath: "/tmp/owner-credential.txt",
            initialPassword: "owner-pass-1",
          };
        },
      },
      {
        async execute() {},
      },
    );

    await service.onApplicationBootstrap();
    await service.onApplicationShutdown();
  } finally {
    Logger.prototype.warn = originalWarn;
  }

  assert.deepEqual(warnings, []);
});
