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
    addressBooks: {
      async getByName() {
        return null;
      },
      async getByNormalizedName() {
        return null;
      },
      async listAll() {
        return [];
      },
      async searchByNormalizedName() {
        return [];
      },
      async listByNormalizedAddress() {
        return [];
      },
      async save() {},
      async deleteById() {
        return false;
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
    assetLimitPolicies: {
      async getByChainAsset() {
        return null;
      },
      async listAll() {
        return [];
      },
      async save() {},
    },
    assetLimitReservations: {
      async getByOperationId() {
        return null;
      },
      async listByChainAsset() {
        return [];
      },
      async save() {},
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

const assetLimits = {
  async reserveForAgentTransfer() {},
  async consumeReservation() {},
  async releaseReservation() {},
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
    async normalizeAddress(address) {
      return address.toLowerCase();
    },
    async getEthBalance() {
      return "0";
    },
    async getUsdtBalance() {
      return "0";
    },
    async getUsdcBalance() {
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
    async transferUsdc() {
      return { txHash: "0xusdchash" };
    },
    async getTxStatus(txHash) {
      return { txHash, status: "PENDING" };
    },
    async checkHealth() {},
  };

  const service = new EthereumEthTransferService(
    repos,
    createUnitOfWork(repos),
    locker,
    assetLimits,
    createVault(VALID_PRIVATE_KEY),
    evm,
  );

  const result = await service.execute("OWNER", {
    to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    toType: "address",
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
    async normalizeAddress(address) {
      return address.toLowerCase();
    },
    async getEthBalance() {
      return "0";
    },
    async getUsdtBalance() {
      return "0";
    },
    async getUsdcBalance() {
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
    async transferUsdc() {
      return { txHash: "0xusdchash" };
    },
    async getTxStatus(txHash) {
      return { txHash, status: "PENDING" };
    },
    async checkHealth() {},
  };

  const service = new EthereumEthTransferService(
    repos,
    createUnitOfWork(repos),
    locker,
    assetLimits,
    createVault(VALID_PRIVATE_KEY),
    evm,
  );

  await assert.rejects(
    () =>
      service.execute("OWNER", {
        to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        toType: "address",
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

test("EthereumEthTransferService resolves contact_name targets before transfer", async () => {
  const { repos, transfers } = createRepos();
  repos.addressBooks.getByName = async (name) =>
    name === "Alice"
      ? {
          contactId: "contact_alice",
          name: "Alice",
          normalizedName: "alice",
          note: null,
          nervosAddress: null,
          normalizedNervosAddress: null,
          ethereumAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          normalizedEthereumAddress: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
          createdAt: "2026-03-13T00:00:00.000Z",
          updatedAt: "2026-03-13T00:00:00.000Z",
        }
      : null;

  let transferredTo = null;
  const evm = {
    async deriveAddress() {
      return "0x123";
    },
    async normalizeAddress(address) {
      return address.toLowerCase();
    },
    async getEthBalance() {
      return "0";
    },
    async getUsdtBalance() {
      return "0";
    },
    async getUsdcBalance() {
      return "0";
    },
    async signMessage() {
      return "0xsigned";
    },
    async transferEth(_privateKey, request) {
      transferredTo = request.to;
      return { txHash: "0xethhash" };
    },
    async transferUsdt() {
      return { txHash: "0xusdthash" };
    },
    async transferUsdc() {
      return { txHash: "0xusdchash" };
    },
    async getTxStatus(txHash) {
      return { txHash, status: "PENDING" };
    },
    async checkHealth() {},
  };

  const service = new EthereumEthTransferService(
    repos,
    createUnitOfWork(repos),
    locker,
    assetLimits,
    createVault(VALID_PRIVATE_KEY),
    evm,
  );

  const result = await service.execute("OWNER", {
    to: "Alice",
    toType: "contact_name",
    amount: "1000000000000000000",
  });

  assert.equal(transferredTo, "0x742d35cc6634c0532925a3b844bc454e4438f44e");
  assert.equal(result.toType, "contact_name");
  assert.equal(result.contactName, "Alice");
  assert.equal(
    result.resolvedAddress,
    "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  );
  assert.equal(transfers.at(-1)?.resolvedContactName, "Alice");
});
