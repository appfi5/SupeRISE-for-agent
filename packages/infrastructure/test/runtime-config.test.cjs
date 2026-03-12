const test = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const {
  WalletDatabase,
  loadWalletServerConfig,
} = require("../dist/index.cjs");

const CKB_CUSTOM_CONFIG = {
  rpcUrl: "https://testnet.ckb.dev",
  indexerUrl: "https://testnet.ckb.dev/indexer",
  genesisHash:
    "0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606",
  addressPrefix: "ckt",
  scripts: {
    Secp256k1Blake160: {
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
      cellDeps: [
        {
          cellDep: {
            outPoint: {
              txHash:
                "0x71a7ba8f0f0c92bfbf76d5e3ef0b75ab6b2df95d060c5bc3d2dfb3b9f4f7c452",
              index: 0,
            },
            depType: "depGroup",
          },
        },
      ],
    },
  },
};

const EVM_CUSTOM_CONFIG = {
  rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  chainId: 11155111,
  networkName: "custom-sepolia",
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
};

test("loadWalletServerConfig defaults both chains to the built-in testnet preset", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-default-"));
  const config = loadWalletServerConfig({}, cwd);

  assert.equal(config.chainConfig.ckb.mode, "preset");
  assert.equal(config.chainConfig.ckb.preset, "testnet");
  assert.equal(config.chainConfig.evm.mode, "preset");
  assert.equal(config.chainConfig.evm.chainId, 11155111);
  assert.equal(
    config.chainConfig.evm.tokens.erc20.usdc.contractAddress,
    "0xa704C2f31628ec73A12704fa726a1806613a30ae",
  );
});

test("loadWalletServerConfig loads mixed per-chain preset/custom configuration", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-custom-"));
  const evmConfigPath = join(cwd, "evm.custom.json");

  writeFileSync(
    evmConfigPath,
    JSON.stringify(EVM_CUSTOM_CONFIG),
  );

  const config = loadWalletServerConfig(
    {
      CKB_CHAIN_MODE: "preset",
      CKB_CHAIN_PRESET: "mainnet",
      EVM_CHAIN_MODE: "custom",
      EVM_CHAIN_CONFIG_PATH: "./evm.custom.json",
    },
    cwd,
  );

  assert.equal(config.chainConfig.ckb.mode, "preset");
  assert.equal(config.chainConfig.ckb.preset, "mainnet");
  assert.equal(config.evmChainConfigPath, evmConfigPath);
  assert.equal(config.chainConfig.evm.mode, "custom");
  assert.equal(config.chainConfig.evm.networkName, "custom-sepolia");
});

test("loadWalletServerConfig loads full custom configuration from two JSON files", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-dual-custom-"));
  const ckbConfigPath = join(cwd, "ckb.custom.json");
  const evmConfigPath = join(cwd, "evm.custom.json");

  writeFileSync(ckbConfigPath, JSON.stringify(CKB_CUSTOM_CONFIG));
  writeFileSync(evmConfigPath, JSON.stringify(EVM_CUSTOM_CONFIG));

  const config = loadWalletServerConfig(
    {
      CKB_CHAIN_MODE: "custom",
      CKB_CHAIN_CONFIG_PATH: "./ckb.custom.json",
      EVM_CHAIN_MODE: "custom",
      EVM_CHAIN_CONFIG_PATH: "./evm.custom.json",
    },
    cwd,
  );

  assert.equal(config.ckbChainConfigPath, ckbConfigPath);
  assert.equal(config.evmChainConfigPath, evmConfigPath);
  assert.equal(config.chainConfig.ckb.mode, "custom");
  assert.equal(config.chainConfig.ckb.addressPrefix, "ckt");
  assert.equal(
    config.chainConfig.ckb.scripts.Secp256k1Blake160.codeHash,
    CKB_CUSTOM_CONFIG.scripts.Secp256k1Blake160.codeHash,
  );
  assert.equal(
    config.chainConfig.evm.tokens.erc20.usdt.contractAddress,
    EVM_CUSTOM_CONFIG.tokens.erc20.usdt.contractAddress,
  );
  assert.equal(
    config.chainConfig.evm.tokens.erc20.usdc.contractAddress,
    EVM_CUSTOM_CONFIG.tokens.erc20.usdc.contractAddress,
  );
});

test("loadWalletServerConfig fails when CKB custom mode has no JSON path", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-error-"));

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          CKB_CHAIN_MODE: "custom",
        },
        cwd,
      ),
    /CKB_CHAIN_CONFIG_PATH is required/i,
  );
});

test("loadWalletServerConfig fails when preset mode also provides a custom EVM JSON path", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-preset-error-"));

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          EVM_CHAIN_MODE: "preset",
          EVM_CHAIN_CONFIG_PATH: "./evm.custom.json",
        },
        cwd,
      ),
    /EVM_CHAIN_CONFIG_PATH must not be set/i,
  );
});

test("loadWalletServerConfig auto-generates OWNER_JWT_SECRET outside production", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-dev-secret-"));
  const config = loadWalletServerConfig(
    {
      NODE_ENV: "development",
    },
    cwd,
  );

  assert.ok(typeof config.ownerJwtSecret === "string");
  assert.equal(config.ownerJwtSecret.length, 64);
});

test("loadWalletServerConfig requires explicit OWNER_JWT_SECRET in production", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-prod-secret-"));

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          NODE_ENV: "production",
        },
        cwd,
      ),
    /OWNER_JWT_SECRET is required in production/i,
  );
});

test("loadWalletServerConfig rejects weak OWNER_JWT_SECRET in production", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-prod-secret-weak-"));

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          NODE_ENV: "production",
          OWNER_JWT_SECRET: "too-short",
        },
        cwd,
      ),
    /OWNER_JWT_SECRET must be at least 32 bytes in production/i,
  );
});

test("WalletDatabase.checkHealth succeeds after migration", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-db-health-"));
  const config = loadWalletServerConfig({}, cwd);
  const database = new WalletDatabase(config);

  try {
    await database.migrate();
    await database.checkHealth();
    assert.ok(true);
  } finally {
    await database.close();
  }
});
