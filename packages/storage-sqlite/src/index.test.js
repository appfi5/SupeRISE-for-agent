import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { unlinkSync, existsSync } from "node:fs";
import { SqliteWalletRepository } from "./index.js";

describe("SqliteWalletRepository", () => {
  const testDbPath = "/tmp/test-wallet.sqlite";

  function cleanupDb() {
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  }

  before(() => {
    cleanupDb();
  });

  after(() => {
    cleanupDb();
  });

  describe("constructor and migration", () => {
    it("should create database and tables", () => {
      const repo = new SqliteWalletRepository(testDbPath);
      const tables = repo.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      ).all();

      const tableNames = tables.map((t) => t.name);
      assert.ok(tableNames.includes("wallets"));
      assert.ok(tableNames.includes("key_materials"));
      assert.ok(tableNames.includes("chain_accounts"));
      assert.ok(tableNames.includes("sign_records"));
    });

    it("should add salt column if missing", () => {
      const repo = new SqliteWalletRepository(testDbPath);
      const columns = repo.db.prepare("PRAGMA table_info(key_materials)").all();
      const hasSalt = columns.some((col) => col.name === "salt");

      assert.ok(hasSalt);
    });
  });

  describe("createWallet", () => {
    it("should create wallet with key material and chain account", () => {
      cleanupDb();
      const repo = new SqliteWalletRepository(testDbPath);

      const wallet = {
        id: "test-wallet-1",
        name: "Test Wallet",
        sourceType: "imported_private_key",
      };
      const keyMaterial = {
        ciphertext: "encrypted-data",
        iv: "initialization-vector",
        authTag: "auth-tag",
        salt: "salt-value",
        fingerprint: "fingerprint123",
      };
      const account = {
        publicKey: "0x1234567890abcdef",
        address: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
      };

      repo.createWallet(wallet, keyMaterial, account);

      const savedWallet = repo.db.prepare("SELECT * FROM wallets WHERE id = ?").get(wallet.id);
      assert.equal(savedWallet.name, "Test Wallet");
      assert.equal(savedWallet.status, "active");

      const savedKey = repo.db.prepare("SELECT * FROM key_materials WHERE wallet_id = ?").get(wallet.id);
      assert.equal(savedKey.encrypted_private_key, "encrypted-data");
      assert.equal(savedKey.salt, "salt-value");

      const savedAccount = repo.db.prepare("SELECT * FROM chain_accounts WHERE wallet_id = ?").get(wallet.id);
      assert.equal(savedAccount.address, account.address);
    });

    it("should rollback on error", () => {
      cleanupDb();
      const repo = new SqliteWalletRepository(testDbPath);

      const wallet = {
        id: "test-wallet-2",
        name: "Test Wallet",
        sourceType: "imported_private_key",
      };
      const keyMaterial = {
        ciphertext: "encrypted-data",
        iv: "initialization-vector",
        authTag: "auth-tag",
        salt: "salt-value",
        fingerprint: "fingerprint123",
      };
      const account = {
        publicKey: "0x1234567890abcdef",
        address: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
      };

      repo.createWallet(wallet, keyMaterial, account);

      assert.throws(() => {
        repo.createWallet(wallet, keyMaterial, account);
      }, /UNIQUE constraint failed/);

      const count = repo.db.prepare("SELECT COUNT(*) as count FROM wallets WHERE id = ?").get(wallet.id);
      assert.equal(count.count, 1);
    });
  });

  describe("listWallets", () => {
    it("should return all wallets with chain account info", () => {
      cleanupDb();
      const repo = new SqliteWalletRepository(testDbPath);

      const wallet1 = {
        id: "wallet-1",
        name: "Wallet 1",
        sourceType: "imported_private_key",
      };
      const wallet2 = {
        id: "wallet-2",
        name: "Wallet 2",
        sourceType: "imported_private_key",
      };

      const keyMaterial = {
        ciphertext: "encrypted",
        iv: "iv",
        authTag: "tag",
        salt: "salt",
        fingerprint: "print",
      };

      const account = {
        publicKey: "0xpubkey",
        address: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
      };

      repo.createWallet(wallet1, keyMaterial, account);
      repo.createWallet(wallet2, keyMaterial, account);

      const wallets = repo.listWallets();

      assert.equal(wallets.length, 2);
      assert.equal(wallets[0].name, "Wallet 1");
      assert.equal(wallets[1].name, "Wallet 2");
      assert.ok(wallets[0].address);
      assert.ok(wallets[0].publicKey);
    });

    it("should return empty array when no wallets exist", () => {
      cleanupDb();
      const repo = new SqliteWalletRepository(testDbPath);

      const wallets = repo.listWallets();

      assert.equal(wallets.length, 0);
    });
  });

  describe("getWallet", () => {
    it("should return wallet by ID", () => {
      cleanupDb();
      const repo = new SqliteWalletRepository(testDbPath);

      const wallet = {
        id: "specific-wallet",
        name: "Specific Wallet",
        sourceType: "imported_private_key",
      };
      const keyMaterial = {
        ciphertext: "encrypted",
        iv: "iv",
        authTag: "tag",
        salt: "salt",
        fingerprint: "print",
      };
      const account = {
        publicKey: "0xpubkey",
        address: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
      };

      repo.createWallet(wallet, keyMaterial, account);

      const found = repo.getWallet("specific-wallet");

      assert.equal(found.id, "specific-wallet");
      assert.equal(found.name, "Specific Wallet");
    });

    it("should return undefined when wallet not found", () => {
      cleanupDb();
      const repo = new SqliteWalletRepository(testDbPath);

      const found = repo.getWallet("nonexistent");

      assert.equal(found, undefined);
    });
  });

  describe("getDefaultWallet", () => {
    it("should return first wallet as default", () => {
      cleanupDb();
      const repo = new SqliteWalletRepository(testDbPath);

      const wallet1 = {
        id: "first-wallet",
        name: "First Wallet",
        sourceType: "imported_private_key",
      };
      const wallet2 = {
        id: "second-wallet",
        name: "Second Wallet",
        sourceType: "imported_private_key",
      };
      const keyMaterial = {
        ciphertext: "encrypted",
        iv: "iv",
        authTag: "tag",
        salt: "salt",
        fingerprint: "print",
      };
      const account = {
        publicKey: "0xpubkey",
        address: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
      };

      repo.createWallet(wallet1, keyMaterial, account);
      repo.createWallet(wallet2, keyMaterial, account);

      const defaultWallet = repo.getDefaultWallet();

      assert.equal(defaultWallet.id, "first-wallet");
    });

    it("should return undefined when no wallets exist", () => {
      cleanupDb();
      const repo = new SqliteWalletRepository(testDbPath);

      const defaultWallet = repo.getDefaultWallet();

      assert.equal(defaultWallet, undefined);
    });
  });

  describe("getKeyMaterial", () => {
    it("should return encrypted key material", () => {
      cleanupDb();
      const repo = new SqliteWalletRepository(testDbPath);

      const wallet = {
        id: "wallet-with-key",
        name: "Wallet",
        sourceType: "imported_private_key",
      };
      const keyMaterial = {
        ciphertext: "encrypted-data",
        iv: "iv-value",
        authTag: "tag-value",
        salt: "salt-value",
        fingerprint: "print",
      };
      const account = {
        publicKey: "0xpubkey",
        address: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
      };

      repo.createWallet(wallet, keyMaterial, account);

      const retrieved = repo.getKeyMaterial("wallet-with-key");

      assert.equal(retrieved.ciphertext, "encrypted-data");
      assert.equal(retrieved.iv, "iv-value");
      assert.equal(retrieved.authTag, "tag-value");
      assert.equal(retrieved.salt, "salt-value");
    });

    it("should return undefined when key material not found", () => {
      cleanupDb();
      const repo = new SqliteWalletRepository(testDbPath);

      const retrieved = repo.getKeyMaterial("nonexistent");

      assert.equal(retrieved, undefined);
    });
  });

  describe("addSignRecord", () => {
    it("should add sign record with all fields", () => {
      cleanupDb();
      const repo = new SqliteWalletRepository(testDbPath);

      const record = {
        id: "record-1",
        walletId: "wallet-1",
        chain: "ckb",
        operation: "sign_message",
        requestHash: "hash123",
        resultRef: "signature123",
        actor: "runtime",
      };

      repo.addSignRecord(record);

      const saved = repo.db.prepare("SELECT * FROM sign_records WHERE id = ?").get(record.id);
      assert.equal(saved.wallet_id, "wallet-1");
      assert.equal(saved.operation, "sign_message");
      assert.equal(saved.result_ref, "signature123");
      assert.equal(saved.actor, "runtime");
    });

    it("should handle null resultRef", () => {
      cleanupDb();
      const repo = new SqliteWalletRepository(testDbPath);

      const record = {
        id: "record-2",
        walletId: "wallet-1",
        chain: "ckb",
        operation: "export_wallet_secret",
        requestHash: "hash456",
        resultRef: null,
        actor: "admin",
      };

      repo.addSignRecord(record);

      const saved = repo.db.prepare("SELECT * FROM sign_records WHERE id = ?").get(record.id);
      assert.equal(saved.result_ref, null);
    });
  });
});
