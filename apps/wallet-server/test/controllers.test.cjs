const test = require("node:test");
const assert = require("node:assert/strict");
const {
  OwnerWalletController,
} = require("../dist/controllers/owner-wallet.controller.js");
const {
  WalletToolsController,
} = require("../dist/controllers/wallet-tools.controller.js");
const {
  OwnerAssetLimitController: OwnerAssetLimitControllerDirect,
} = require("../dist/controllers/owner-asset-limit.controller.js");
const { WalletDomainError } = require("@superise/domain");

const OWNER_REQUEST = {
  ownerAuth: {
    subject: "owner",
    credentialId: "owner_credential_current",
    credentialUpdatedAt: "2026-03-10T00:00:00.000Z",
    issuedAt: "2026-03-10T00:00:00.000Z",
    expiresAt: "2026-03-10T01:00:00.000Z",
    tokenId: "tok_1",
  },
};

const VALID_PRIVATE_KEY =
  "0x4c0883a69102937d6231471b5dbb6204fe51296170827978d6ab2e5f3f6b6f8d";

test("OwnerWalletController.importWallet requires confirmed=true", async () => {
  const controller = new OwnerWalletController(
    {
      execute: async () => ({
        walletFingerprint: "wlt",
        status: "ACTIVE",
        source: "IMPORTED",
      }),
    },
    {
      execute: async () => ({
        walletFingerprint: "wlt",
        status: "ACTIVE",
        source: "IMPORTED",
      }),
    },
    { execute: async () => ({ privateKey: VALID_PRIVATE_KEY }) },
  );

  await assert.rejects(
    () =>
      controller.importWallet(OWNER_REQUEST, {
        privateKey: VALID_PRIVATE_KEY,
      }),
    (error) =>
      error instanceof WalletDomainError &&
      error.code === "VALIDATION_ERROR",
  );

  const response = await controller.importWallet(OWNER_REQUEST, {
    privateKey: VALID_PRIVATE_KEY,
    confirmed: true,
  });

  assert.equal(response.success, true);
  assert.equal(response.data?.source, "IMPORTED");
});

test("WalletToolsController.call forwards ethereum.transfer.eth through the HTTP gateway", async () => {
  const calls = [];
  const controller = new WalletToolsController({
    listCatalog: () => [],
    async call(name, argumentsValue, context) {
      calls.push({ name, argumentsValue, context });
      return {
        operationId: "op_test",
        asset: "ETH",
      };
    },
  });

  const response = await controller.call(OWNER_REQUEST, {
    name: "ethereum.transfer.eth",
    arguments: {
      to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      amount: "1000000000000000000",
    },
  });

  assert.equal(response.success, true);
  assert.equal(response.data?.name, "ethereum.transfer.eth");
  assert.deepEqual(calls[0], {
    name: "ethereum.transfer.eth",
    argumentsValue: {
      to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      amount: "1000000000000000000",
    },
    context: {
      actorRole: "OWNER",
    },
  });
});

test("OwnerAssetLimitController.update maps public chain params to the asset-limit service", async () => {
  const calls = [];
  const controller = new OwnerAssetLimitControllerDirect({
    async listForOwner() {
      return [];
    },
    async updatePolicy(input) {
      calls.push(input);
      return {
        chain: "ethereum",
        asset: "USDC",
        decimals: 6,
        dailyLimit: "100",
        weeklyLimit: null,
        monthlyLimit: null,
        usage: {
          daily: {
            window: "DAILY",
            limitAmount: "100",
            consumedAmount: "0",
            reservedAmount: "0",
            effectiveUsedAmount: "0",
            remainingAmount: "100",
            resetsAt: "2026-03-13T00:00:00.000Z",
          },
          weekly: {
            window: "WEEKLY",
            limitAmount: null,
            consumedAmount: "0",
            reservedAmount: "0",
            effectiveUsedAmount: "0",
            remainingAmount: null,
            resetsAt: "2026-03-16T00:00:00.000Z",
          },
          monthly: {
            window: "MONTHLY",
            limitAmount: null,
            consumedAmount: "0",
            reservedAmount: "0",
            effectiveUsedAmount: "0",
            remainingAmount: null,
            resetsAt: "2026-04-01T00:00:00.000Z",
          },
        },
        updatedAt: "2026-03-12T09:00:00.000Z",
        updatedBy: "OWNER",
      };
    },
  });

  const response = await controller.update(
    OWNER_REQUEST,
    { chain: "ethereum", asset: "USDC" },
    { dailyLimit: "100" },
  );

  assert.equal(response.success, true);
  assert.deepEqual(calls[0], {
    chain: "evm",
    asset: "USDC",
    dailyLimit: "100",
    weeklyLimit: undefined,
    monthlyLimit: undefined,
    updatedBy: "OWNER",
  });
});
