import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createWalletApiApp } from "./app.js";

describe("Wallet API", () => {
  function createMockWalletService() {
    return {
      importWallet: async (payload) => ({
        walletId: "test-wallet-id",
        name: payload.name,
        chain: "ckb",
        address: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
        publicKey: "0xpubkey",
      }),
      exportWalletSecret: async (walletId) => ({
        privateKey: "0x" + "a".repeat(64),
      }),
      listWallets: () => [
        { id: "1", name: "Wallet 1", chain: "ckb" },
      ],
      getWalletIdentity: (walletId) => ({
        id: walletId || "default-id",
        name: "Test Wallet",
        chain: "ckb",
        address: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
        publicKey: "0xpubkey",
      }),
      signMessage: async (walletId, message) => ({
        signature: "0xsignature",
      }),
      transferCkb: async (walletId, toAddress, amountShannon) => ({
        txHash: "0xtxhash",
        toAddress,
        amountShannon: amountShannon.toString(),
      }),
    };
  }

  describe("GET /api/v1/healthz", () => {
    it("should return ok status without auth", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/healthz",
      });

      assert.equal(response.statusCode, 200);
      assert.deepEqual(response.json(), { status: "ok" });
    });
  });

  describe("POST /api/v1/admin/wallets/import", () => {
    it("should import wallet with valid admin token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/admin/wallets/import",
        headers: {
          "x-admin-token": "admin-token",
        },
        payload: {
          name: "New Wallet",
          privateKey: "a".repeat(64),
        },
      });

      assert.equal(response.statusCode, 200);
      const json = response.json();
      assert.equal(json.name, "New Wallet");
      assert.ok(json.walletId);
    });

    it("should reject without admin token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/admin/wallets/import",
        payload: {
          name: "New Wallet",
          privateKey: "a".repeat(64),
        },
      });

      assert.equal(response.statusCode, 401);
      assert.deepEqual(response.json(), { message: "Unauthorized" });
    });

    it("should reject with invalid payload", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/admin/wallets/import",
        headers: {
          "x-admin-token": "admin-token",
        },
        payload: {
          name: "",
          privateKey: "short",
        },
      });

      assert.equal(response.statusCode, 400);
      const json = response.json();
      // FastifyError wraps the ZodError and puts the message in the message field
      // We just verify we get validation error details back
      assert.ok(json.message);
      assert.ok(json.issues || json.message.includes("name") || json.message.includes("privateKey"));
    });
  });

  describe("POST /api/v1/admin/wallets/:walletId/export", () => {
    it("should export wallet with valid admin token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/admin/wallets/test-wallet-id/export",
        headers: {
          "x-admin-token": "admin-token",
        },
      });

      assert.equal(response.statusCode, 200);
      const json = response.json();
      assert.ok(json.privateKey);
    });

    it("should reject without admin token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/admin/wallets/test-wallet-id/export",
      });

      assert.equal(response.statusCode, 401);
    });
  });

  describe("GET /api/v1/admin/wallets", () => {
    it("should list wallets with valid admin token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/admin/wallets",
        headers: {
          "x-admin-token": "admin-token",
        },
      });

      assert.equal(response.statusCode, 200);
      const json = response.json();
      assert.ok(json.wallets);
      assert.equal(json.wallets.length, 1);
    });

    it("should reject without admin token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/admin/wallets",
      });

      assert.equal(response.statusCode, 401);
    });
  });

  describe("GET /api/v1/admin/wallets/:walletId", () => {
    it("should get wallet by ID with valid admin token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/admin/wallets/test-wallet-id",
        headers: {
          "x-admin-token": "admin-token",
        },
      });

      assert.equal(response.statusCode, 200);
      const json = response.json();
      assert.equal(json.id, "test-wallet-id");
    });
  });

  describe("GET /api/v1/wallets/current", () => {
    it("should get current wallet with valid runtime token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/wallets/current",
        headers: {
          "x-runtime-token": "runtime-token",
        },
      });

      assert.equal(response.statusCode, 200);
      const json = response.json();
      assert.equal(json.id, "default-id");
    });

    it("should reject without runtime token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/wallets/current",
      });

      assert.equal(response.statusCode, 401);
    });
  });

  describe("POST /api/v1/wallets/:walletId/sign-message", () => {
    it("should sign message with valid runtime token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/wallets/test-wallet-id/sign-message",
        headers: {
          "x-runtime-token": "runtime-token",
        },
        payload: {
          message: "test message",
        },
      });

      assert.equal(response.statusCode, 200);
      const json = response.json();
      assert.equal(json.signature, "0xsignature");
    });

    it("should reject without runtime token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/wallets/test-wallet-id/sign-message",
        payload: {
          message: "test message",
        },
      });

      assert.equal(response.statusCode, 401);
    });

    it("should reject with invalid payload", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/wallets/test-wallet-id/sign-message",
        headers: {
          "x-runtime-token": "runtime-token",
        },
        payload: {
          message: "",
        },
      });

      assert.equal(response.statusCode, 400);
    });
  });

  describe("POST /api/v1/wallets/:walletId/transfers/ckb", () => {
    it("should transfer CKB with valid runtime token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/wallets/test-wallet-id/transfers/ckb",
        headers: {
          "x-runtime-token": "runtime-token",
        },
        payload: {
          toAddress: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
          amountShannon: "10000000000",
        },
      });

      assert.equal(response.statusCode, 200);
      const json = response.json();
      assert.ok(json.txHash);
    });

    it("should reject without runtime token", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/wallets/test-wallet-id/transfers/ckb",
        payload: {
          toAddress: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
          amountShannon: "10000000000",
        },
      });

      assert.equal(response.statusCode, 401);
    });

    it("should reject with invalid payload", async () => {
      const app = createWalletApiApp({
        walletService: createMockWalletService(),
        adminToken: "admin-token",
        runtimeToken: "runtime-token",
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/wallets/test-wallet-id/transfers/ckb",
        headers: {
          "x-runtime-token": "runtime-token",
        },
        payload: {
          toAddress: "",
          amountShannon: "-100",
        },
      });

      assert.equal(response.statusCode, 400);
    });
  });
});
