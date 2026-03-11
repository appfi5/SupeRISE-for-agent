const test = require("node:test");
const assert = require("node:assert/strict");
const {
  EthereumEthTransferService,
} = require("../dist/index.cjs");
const { WalletDomainError } = require("@superise/domain");

const VALID_PRIVATE_KEY =
  "0x4c0883a69102937d6231471b5dbb6204fe51296170827978d6ab2e5f3f6b6f8d";

const CURRENT_WALLET = {
  walletId: "wallet_current",
  fingerprint: "wlt_test",
  source: "IMPORTED",
  status: "ACTIVE",
  encryptedPrivateKey: "enc",
  encryptedDek: "enc",
  privateKeyIv: "iv",
  privateKeyTag: "tag",
  dekIv: "iv",
  dekTag: "tag",
  createdAt: "2026-03-10T00:00:00.000Z",
  updatedAt: "2026-03-10T00:00:00.000Z",
};

function createRepos() {
  const transfers = [];
  const audits = [];

  const repos = {
    wallets: {
      async getCurrent() {
        return CURRENT_WALLET;
      },
      async saveCurrent() {},
    },
    ownerCredentials: {
      async getCurrent() {
        return null;
      },
      async saveCurrent() {},
    },
    transfers: {
      async getById() {
        return null;
      },
      async save(operation) {
        transfers.push(operation);
      },
    },
    signs: {
      async save() {},
    },
    audits: {
      async listRecent() {
        return [];
      },
      async save(log) {
        audits.push(log);
      },
    },
    systemConfig: {
      async getCurrent() {
        return null;
      },
      async saveCurrent() {},
    },
  };

  return {
    repos,
    transfers,
    audits,
  };
}

function createVault(privateKey) {
  return {
    async validateKek() {},
    async encryptPrivateKey() {
      throw new Error("not implemented in test");
    },
    async decryptPrivateKey() {
      return privateKey;
    },
    async rewrapDek() {
      throw new Error("not implemented in test");
    },
    getMetadata() {
      return {
        provider: "env",
        reference: "test",
      };
    },
  };
}

const locker = {
  async execute(_chain, task) {
    return task();
  },
};

function createUnitOfWork(repos) {
  return {
    async run(work) {
      return work(repos);
    },
  };
}

test("EthereumEthTransferService records a submitted ETH transfer", async () => {
  const { repos, transfers, audits } = createRepos();
  const evm = {
    async deriveAddress() {
      return "0x123";
    },
    async getEthBalance() {
      return "0";
    },
    async getUsdtBalance() {
      return "0";
    },
    async signMessage() {
      return "0xsigned";
    },
    async transferEth() {
      return { txHash: "0xethhash" };
    },
    async transferUsdt() {
      return { txHash: "0xusdthash" };
    },
    async checkHealth() {},
  };

  const service = new EthereumEthTransferService(
    repos,
    createUnitOfWork(repos),
    locker,
    createVault(VALID_PRIVATE_KEY),
    evm,
  );

  const result = await service.execute("OWNER", {
    to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    amount: "1000000000000000000",
  });

  assert.equal(result.asset, "ETH");
  assert.equal(result.status, "SUBMITTED");
  assert.equal(result.txHash, "0xethhash");
  assert.equal(transfers.at(-1)?.asset, "ETH");
  assert.equal(audits.at(-1)?.action, "ethereum.transfer_eth");
  assert.equal(audits.at(-1)?.result, "SUCCESS");
});

test("EthereumEthTransferService maps failure paths to failed operations", async () => {
  const { repos, transfers, audits } = createRepos();
  const evm = {
    async deriveAddress() {
      return "0x123";
    },
    async getEthBalance() {
      return "0";
    },
    async getUsdtBalance() {
      return "0";
    },
    async signMessage() {
      return "0xsigned";
    },
    async transferEth() {
      throw new Error("insufficient funds for gas * price + value");
    },
    async transferUsdt() {
      return { txHash: "0xusdthash" };
    },
    async checkHealth() {},
  };

  const service = new EthereumEthTransferService(
    repos,
    createUnitOfWork(repos),
    locker,
    createVault(VALID_PRIVATE_KEY),
    evm,
  );

  await assert.rejects(
    () =>
      service.execute("OWNER", {
        to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        amount: "1",
      }),
    (error) =>
      error instanceof WalletDomainError &&
      error.code === "INSUFFICIENT_BALANCE",
  );

  assert.equal(transfers.at(-1)?.status, "FAILED");
  assert.equal(transfers.at(-1)?.asset, "ETH");
  assert.equal(audits.at(-1)?.action, "ethereum.transfer_eth");
  assert.equal(audits.at(-1)?.result, "FAILED");
});
