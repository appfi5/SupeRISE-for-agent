const test = require("node:test");
const assert = require("node:assert/strict");
const {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} = require("node:fs");
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

function writeMountInfo(filePath, mountPoint) {
  writeFileSync(
    filePath,
    `27 20 0:22 / ${mountPoint} rw,relatime - tmpfs tmpfs rw\n`,
  );
}

test("loadWalletServerConfig defaults both chains to the built-in testnet preset", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-default-"));
  const config = loadWalletServerConfig({}, cwd);

  assert.equal(config.deploymentProfile, "quickstart");
  assert.equal(config.chainConfig.ckb.mode, "preset");
  assert.equal(config.chainConfig.ckb.preset, "testnet");
  assert.equal(config.chainConfig.evm.mode, "preset");
  assert.equal(config.chainConfig.evm.chainId, 11155111);
  assert.equal(config.runtimeSecretDir, join(cwd, "data/secrets"));
  assert.ok(existsSync(join(cwd, "data/secrets/owner-jwt.secret")));
  assert.equal(
    config.chainConfig.evm.tokens.erc20.usdc.contractAddress,
    "0xa704C2f31628ec73A12704fa726a1806613a30ae",
  );
});

test("loadWalletServerConfig loads mixed per-chain preset/custom configuration", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-custom-"));
  const evmConfigPath = join(cwd, "evm.custom.json");
  const kekPath = join(cwd, "wallet.kek");

  writeFileSync(
    evmConfigPath,
    JSON.stringify(EVM_CUSTOM_CONFIG),
  );
  writeFileSync(kekPath, "11".repeat(32));

  const config = loadWalletServerConfig(
    {
      DEPLOYMENT_PROFILE: "managed",
      OWNER_JWT_SECRET: "x".repeat(32),
      WALLET_KEK_PATH: "./wallet.kek",
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
  const kekPath = join(cwd, "wallet.kek");

  writeFileSync(ckbConfigPath, JSON.stringify(CKB_CUSTOM_CONFIG));
  writeFileSync(evmConfigPath, JSON.stringify(EVM_CUSTOM_CONFIG));
  writeFileSync(kekPath, "11".repeat(32));

  const config = loadWalletServerConfig(
    {
      DEPLOYMENT_PROFILE: "managed",
      OWNER_JWT_SECRET: "x".repeat(32),
      WALLET_KEK_PATH: "./wallet.kek",
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

test("loadWalletServerConfig quickstart persists OWNER_JWT_SECRET in runtime secret dir", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-quickstart-secret-"));
  const config = loadWalletServerConfig(
    {
      DEPLOYMENT_PROFILE: "quickstart",
    },
    cwd,
  );

  assert.ok(typeof config.ownerJwtSecret === "string");
  assert.equal(config.ownerJwtSecret.length, 64);
  assert.equal(
    readFileSync(join(cwd, "data/secrets/owner-jwt.secret"), "utf8").trim(),
    config.ownerJwtSecret,
  );
});

test("loadWalletServerConfig quickstart reuses the same persisted OWNER_JWT_SECRET", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-quickstart-reuse-"));
  const first = loadWalletServerConfig(
    {
      DEPLOYMENT_PROFILE: "quickstart",
    },
    cwd,
  );
  hydrateQuickstartRuntimeState(cwd);
  const second = loadWalletServerConfig(
    {
      DEPLOYMENT_PROFILE: "quickstart",
    },
    cwd,
  );

  assert.equal(first.ownerJwtSecret, second.ownerJwtSecret);
});

test("loadWalletServerConfig quickstart requires an explicit mounted runtime data directory when requested", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-quickstart-mounted-"));
  const mountInfoPath = join(cwd, "mountinfo");
  const dataDir = join(cwd, "runtime-data");
  writeMountInfo(mountInfoPath, dataDir);

  const config = loadWalletServerConfig(
    {
      DEPLOYMENT_PROFILE: "quickstart",
      DATA_DIR: "./runtime-data",
    },
    cwd,
    {
      quickstartMountInfoPath: mountInfoPath,
      requireQuickstartRuntimeMount: true,
    },
  );

  assert.equal(config.dataDir, dataDir);
  assert.ok(existsSync(join(dataDir, "secrets/owner-jwt.secret")));
});

test("loadWalletServerConfig quickstart rejects a missing explicit mounted runtime data directory", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-quickstart-unmounted-"));
  const mountInfoPath = join(cwd, "mountinfo");
  writeMountInfo(mountInfoPath, join(cwd, "some-other-data"));

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          DEPLOYMENT_PROFILE: "quickstart",
          DATA_DIR: "./runtime-data",
        },
        cwd,
        {
          quickstartMountInfoPath: mountInfoPath,
          requireQuickstartRuntimeMount: true,
        },
      ),
    /quickstart requires an explicit persistent volume mounted/i,
  );
});

test("loadWalletServerConfig quickstart rejects incomplete runtime data", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-quickstart-partial-"));
  mkdirSync(join(cwd, "data/secrets"), { recursive: true });
  writeFileSync(join(cwd, "data/secrets/owner-jwt.secret"), "x".repeat(32));

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          DEPLOYMENT_PROFILE: "quickstart",
        },
        cwd,
      ),
    /quickstart runtime data is incomplete/i,
  );
});

test("loadWalletServerConfig quickstart rejects external OWNER_JWT_SECRET", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-quickstart-owner-secret-"));

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          DEPLOYMENT_PROFILE: "quickstart",
          OWNER_JWT_SECRET: "x".repeat(32),
        },
        cwd,
      ),
    (error) => {
      assert.equal(
        error.message,
        "quickstart does not accept OWNER_JWT_SECRET. Remove legacy OWNER_JWT_SECRET from your environment, or set DEPLOYMENT_PROFILE=managed.",
      );
      return true;
    },
  );
});

test("loadWalletServerConfig quickstart rejects external KEK configuration", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-quickstart-kek-"));

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          DEPLOYMENT_PROFILE: "quickstart",
          WALLET_KEK_PATH: "./wallet.kek",
        },
        cwd,
      ),
    (error) => {
      assert.equal(
        error.message,
        "quickstart does not accept external KEK configuration. Remove legacy WALLET_KEK_PATH / WALLET_KEK from your environment, or set DEPLOYMENT_PROFILE=managed.",
      );
      return true;
    },
  );
});

test("loadWalletServerConfig quickstart rejects mainnet presets", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-quickstart-mainnet-"));

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          DEPLOYMENT_PROFILE: "quickstart",
          CKB_CHAIN_PRESET: "mainnet",
        },
        cwd,
      ),
    (error) => {
      assert.equal(
        error.message,
        "quickstart only supports the built-in CKB testnet preset. Remove legacy CKB mainnet/custom chain config from your environment, or set DEPLOYMENT_PROFILE=managed.",
      );
      return true;
    },
  );

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          DEPLOYMENT_PROFILE: "quickstart",
          EVM_CHAIN_PRESET: "mainnet",
        },
        cwd,
      ),
    (error) => {
      assert.equal(
        error.message,
        "quickstart only supports the built-in EVM testnet preset. Remove legacy EVM mainnet/custom chain config from your environment, or set DEPLOYMENT_PROFILE=managed.",
      );
      return true;
    },
  );
});

test("loadWalletServerConfig managed requires explicit OWNER_JWT_SECRET", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-managed-secret-"));
  const kekPath = join(cwd, "wallet.kek");
  writeFileSync(kekPath, "11".repeat(32));

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          DEPLOYMENT_PROFILE: "managed",
          WALLET_KEK_PATH: "./wallet.kek",
        },
        cwd,
      ),
    /OWNER_JWT_SECRET is required when DEPLOYMENT_PROFILE=managed/i,
  );
});

test("loadWalletServerConfig managed requires explicit KEK configuration", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-managed-kek-"));

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          DEPLOYMENT_PROFILE: "managed",
          OWNER_JWT_SECRET: "x".repeat(32),
        },
        cwd,
      ),
    /WALLET_KEK_PATH or WALLET_KEK is required when DEPLOYMENT_PROFILE=managed/i,
  );
});

test("loadWalletServerConfig managed rejects weak OWNER_JWT_SECRET", () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-config-managed-weak-secret-"));
  const kekPath = join(cwd, "wallet.kek");
  writeFileSync(kekPath, "11".repeat(32));

  assert.throws(
    () =>
      loadWalletServerConfig(
        {
          DEPLOYMENT_PROFILE: "managed",
          WALLET_KEK_PATH: "./wallet.kek",
          OWNER_JWT_SECRET: "too-short",
        },
        cwd,
      ),
    /OWNER_JWT_SECRET must be at least 32 bytes/i,
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
