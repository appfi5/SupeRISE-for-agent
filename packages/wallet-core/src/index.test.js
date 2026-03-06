import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { WalletCoreService } from "./index.js";

describe("WalletCoreService", () => {
  function createMockRepository() {
    return {
      createWallet: mock.fn(),
      listWallets: mock.fn(() => []),
      getWallet: mock.fn(),
      getDefaultWallet: mock.fn(),
      getKeyMaterial: mock.fn(),
      addSignRecord: mock.fn(),
    };
  }

  function createMockCkbAdapter() {
    return {
      deriveIdentity: mock.fn(async () => ({
        chain: "ckb",
        address: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
        publicKey: "0x02a1b8c0d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1",
      })),
      signMessage: mock.fn(async () => "0xabcd1234"),
      transfer: mock.fn(async () => ({
        txHash: "0x1234567890abcdef",
        toAddress: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
        amountShannon: "10000000000",
      })),
    };
  }

  describe("importWallet", () => {
    it("should import wallet and return identity", async () => {
      const repository = createMockRepository();
      const ckbAdapter = createMockCkbAdapter();
      const service = new WalletCoreService({
        repository,
        ckbAdapter,
        masterKey: "test-master-key-at-least-32-bytes-long",
      });

      const result = await service.importWallet({
        name: "Test Wallet",
        privateKey: "a".repeat(64),
      });

      assert.equal(typeof result.walletId, "string");
      assert.equal(result.name, "Test Wallet");
      assert.equal(result.chain, "ckb");
      assert.ok(result.address);
      assert.ok(result.publicKey);
      assert.equal(repository.createWallet.mock.calls.length, 1);
    });

    it("should throw if masterKey is too short", async () => {
      const repository = createMockRepository();
      const ckbAdapter = createMockCkbAdapter();

      await assert.rejects(
        async () => {
          const service = new WalletCoreService({
            repository,
            ckbAdapter,
            masterKey: "short",
          });
          await service.importWallet({ name: "Test", privateKey: "a".repeat(64) });
        },
        { message: /MASTER_KEY must be at least 32 bytes/ }
      );
    });

    it("should encrypt private key before storing", async () => {
      const repository = createMockRepository();
      const ckbAdapter = createMockCkbAdapter();
      const service = new WalletCoreService({
        repository,
        ckbAdapter,
        masterKey: "test-master-key-at-least-32-bytes-long",
      });

      await service.importWallet({
        name: "Test Wallet",
        privateKey: "a".repeat(64),
      });

      const createWalletCall = repository.createWallet.mock.calls[0];
      const keyMaterial = createWalletCall.arguments[1];

      assert.ok(keyMaterial.ciphertext);
      assert.ok(keyMaterial.iv);
      assert.ok(keyMaterial.authTag);
      assert.ok(keyMaterial.salt);
      assert.ok(keyMaterial.fingerprint);
      assert.notEqual(keyMaterial.ciphertext, "a".repeat(64));
    });
  });

  describe("listWallets", () => {
    it("should return list of wallets from repository", () => {
      const repository = createMockRepository();
      repository.listWallets.mock.mockImplementation(() => [
        { id: "1", name: "Wallet 1", chain: "ckb" },
        { id: "2", name: "Wallet 2", chain: "ckb" },
      ]);
      const ckbAdapter = createMockCkbAdapter();
      const service = new WalletCoreService({
        repository,
        ckbAdapter,
        masterKey: "test-master-key-at-least-32-bytes-long",
      });

      const result = service.listWallets();

      assert.equal(result.length, 2);
      assert.equal(result[0].name, "Wallet 1");
    });
  });

  describe("getWalletIdentity", () => {
    it("should return wallet by ID", () => {
      const repository = createMockRepository();
      repository.getWallet.mock.mockImplementation(() => ({
        id: "test-id",
        name: "Test Wallet",
        chain: "ckb",
      }));
      const ckbAdapter = createMockCkbAdapter();
      const service = new WalletCoreService({
        repository,
        ckbAdapter,
        masterKey: "test-master-key-at-least-32-bytes-long",
      });

      const result = service.getWalletIdentity("test-id");

      assert.equal(result.id, "test-id");
      assert.equal(repository.getWallet.mock.calls.length, 1);
    });

    it("should return default wallet when no ID provided", () => {
      const repository = createMockRepository();
      repository.getDefaultWallet.mock.mockImplementation(() => ({
        id: "default-id",
        name: "Default Wallet",
      }));
      const ckbAdapter = createMockCkbAdapter();
      const service = new WalletCoreService({
        repository,
        ckbAdapter,
        masterKey: "test-master-key-at-least-32-bytes-long",
      });

      const result = service.getWalletIdentity();

      assert.equal(result.id, "default-id");
      assert.equal(repository.getDefaultWallet.mock.calls.length, 1);
    });

    it("should throw when wallet not found", () => {
      const repository = createMockRepository();
      repository.getWallet.mock.mockImplementation(() => null);
      const ckbAdapter = createMockCkbAdapter();
      const service = new WalletCoreService({
        repository,
        ckbAdapter,
        masterKey: "test-master-key-at-least-32-bytes-long",
      });

      assert.throws(
        () => service.getWalletIdentity("nonexistent"),
        { message: "Wallet not found." }
      );
    });
  });

  describe("exportWalletSecret", () => {
    it("should export decrypted private key", async () => {
      const repository = createMockRepository();
      const ckbAdapter = createMockCkbAdapter();
      const masterKey = "test-master-key-at-least-32-bytes-long";
      const service = new WalletCoreService({
        repository,
        ckbAdapter,
        masterKey,
      });

      // Import a wallet first to get properly encrypted data
      const testPrivateKey = "a".repeat(64);
      await service.importWallet({
        name: "Test Wallet",
        privateKey: testPrivateKey,
      });

      // Get the encrypted data that was stored
      const createWalletCall = repository.createWallet.mock.calls[0];
      const encryptedData = createWalletCall.arguments[1];

      // Mock getKeyMaterial to return the properly encrypted data
      repository.getKeyMaterial.mock.mockImplementation(() => encryptedData);

      const result = service.exportWalletSecret("test-wallet-id");

      assert.ok(result.privateKey);
      assert.equal(typeof result.privateKey, "string");
      assert.equal(result.privateKey, testPrivateKey);
      assert.equal(repository.addSignRecord.mock.calls.length, 1);
      const signRecord = repository.addSignRecord.mock.calls[0].arguments[0];
      assert.equal(signRecord.operation, "export_wallet_secret");
      assert.equal(signRecord.actor, "admin");
    });

    it("should throw when key material not found", () => {
      const repository = createMockRepository();
      repository.getKeyMaterial.mock.mockImplementation(() => null);
      const ckbAdapter = createMockCkbAdapter();
      const service = new WalletCoreService({
        repository,
        ckbAdapter,
        masterKey: "test-master-key-at-least-32-bytes-long",
      });

      assert.throws(
        () => service.exportWalletSecret("nonexistent"),
        { message: "Wallet key material not found." }
      );
    });
  });

  describe("signMessage", () => {
    it("should sign message and record audit trail", async () => {
      const repository = createMockRepository();
      const ckbAdapter = createMockCkbAdapter();
      const masterKey = "test-master-key-at-least-32-bytes-long";
      const service = new WalletCoreService({
        repository,
        ckbAdapter,
        masterKey,
      });

      // Import a wallet first to get properly encrypted data
      const testPrivateKey = "a".repeat(64);
      await service.importWallet({
        name: "Test Wallet",
        privateKey: testPrivateKey,
      });

      // Get the encrypted data that was stored
      const createWalletCall = repository.createWallet.mock.calls[0];
      const encryptedData = createWalletCall.arguments[1];

      // Mock getKeyMaterial to return the properly encrypted data
      repository.getKeyMaterial.mock.mockImplementation(() => encryptedData);

      const result = await service.signMessage("test-wallet-id", "test message");

      assert.equal(result.signature, "0xabcd1234");
      assert.equal(repository.addSignRecord.mock.calls.length, 1);
      const signRecord = repository.addSignRecord.mock.calls[0].arguments[0];
      assert.equal(signRecord.operation, "sign_message");
      assert.equal(signRecord.actor, "runtime");
    });

    it("should throw when key material not found", async () => {
      const repository = createMockRepository();
      repository.getKeyMaterial.mock.mockImplementation(() => null);
      const ckbAdapter = createMockCkbAdapter();
      const service = new WalletCoreService({
        repository,
        ckbAdapter,
        masterKey: "test-master-key-at-least-32-bytes-long",
      });

      await assert.rejects(
        async () => service.signMessage("nonexistent", "message"),
        { message: "Wallet key material not found." }
      );
    });
  });

  describe("transferCkb", () => {
    it("should transfer CKB and record audit trail", async () => {
      const repository = createMockRepository();
      const ckbAdapter = createMockCkbAdapter();
      const masterKey = "test-master-key-at-least-32-bytes-long";
      const service = new WalletCoreService({
        repository,
        ckbAdapter,
        masterKey,
      });

      // Import a wallet first to get properly encrypted data
      const testPrivateKey = "a".repeat(64);
      await service.importWallet({
        name: "Test Wallet",
        privateKey: testPrivateKey,
      });

      // Get the encrypted data that was stored
      const createWalletCall = repository.createWallet.mock.calls[0];
      const encryptedData = createWalletCall.arguments[1];

      // Mock getKeyMaterial to return the properly encrypted data
      repository.getKeyMaterial.mock.mockImplementation(() => encryptedData);

      const result = await service.transferCkb(
        "test-wallet-id",
        "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
        "10000000000"
      );

      assert.equal(result.txHash, "0x1234567890abcdef");
      assert.equal(repository.addSignRecord.mock.calls.length, 1);
      const signRecord = repository.addSignRecord.mock.calls[0].arguments[0];
      assert.equal(signRecord.operation, "transfer_ckb");
      assert.equal(signRecord.actor, "runtime");
      assert.equal(signRecord.resultRef, "0x1234567890abcdef");
    });

    it("should throw when key material not found", async () => {
      const repository = createMockRepository();
      repository.getKeyMaterial.mock.mockImplementation(() => null);
      const ckbAdapter = createMockCkbAdapter();
      const service = new WalletCoreService({
        repository,
        ckbAdapter,
        masterKey: "test-master-key-at-least-32-bytes-long",
      });

      await assert.rejects(
        async () => service.transferCkb("nonexistent", "address", "1000"),
        { message: "Wallet key material not found." }
      );
    });
  });
});
