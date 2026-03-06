import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

function now() {
  return new Date().toISOString();
}

export class SqliteWalletRepository {
  constructor(dbPath) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.#migrate();
  }

  #migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        source_type TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS key_materials (
        wallet_id TEXT PRIMARY KEY,
        encrypted_private_key TEXT NOT NULL,
        iv TEXT NOT NULL,
        auth_tag TEXT NOT NULL,
        public_key TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        encryption_version INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chain_accounts (
        id TEXT PRIMARY KEY,
        wallet_id TEXT NOT NULL,
        chain TEXT NOT NULL,
        address TEXT NOT NULL,
        public_key TEXT NOT NULL,
        is_default INTEGER NOT NULL,
        metadata_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sign_records (
        id TEXT PRIMARY KEY,
        wallet_id TEXT NOT NULL,
        chain TEXT NOT NULL,
        operation TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        result_ref TEXT,
        actor TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  createWallet(wallet, keyMaterial, account) {
    const timestamp = now();

    this.db.exec("BEGIN");
    try {
      this.db.prepare(`
        INSERT INTO wallets (id, name, source_type, status, created_at, updated_at)
        VALUES (?, ?, ?, 'active', ?, ?)
      `).run(wallet.id, wallet.name, wallet.sourceType, timestamp, timestamp);

      this.db.prepare(`
        INSERT INTO key_materials (wallet_id, encrypted_private_key, iv, auth_tag, public_key, fingerprint, encryption_version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `).run(
        wallet.id,
        keyMaterial.ciphertext,
        keyMaterial.iv,
        keyMaterial.authTag,
        account.publicKey,
        keyMaterial.fingerprint,
        timestamp,
      );

      this.db.prepare(`
        INSERT INTO chain_accounts (id, wallet_id, chain, address, public_key, is_default, metadata_json, created_at)
        VALUES (?, ?, 'ckb', ?, ?, 1, '{}', ?)
      `).run(`${wallet.id}:ckb`, wallet.id, account.address, account.publicKey, timestamp);

      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  listWallets() {
    return this.db.prepare(`
      SELECT w.id, w.name, w.status, a.chain, a.address, a.public_key AS publicKey
      FROM wallets w
      LEFT JOIN chain_accounts a ON a.wallet_id = w.id AND a.is_default = 1
      ORDER BY w.created_at ASC
    `).all();
  }

  getWallet(walletId) {
    return this.db.prepare(`
      SELECT w.id, w.name, w.status, a.chain, a.address, a.public_key AS publicKey
      FROM wallets w
      LEFT JOIN chain_accounts a ON a.wallet_id = w.id AND a.is_default = 1
      WHERE w.id = ?
    `).get(walletId);
  }

  getDefaultWallet() {
    return this.db.prepare(`
      SELECT w.id, w.name, w.status, a.chain, a.address, a.public_key AS publicKey
      FROM wallets w
      LEFT JOIN chain_accounts a ON a.wallet_id = w.id AND a.is_default = 1
      ORDER BY w.created_at ASC
      LIMIT 1
    `).get();
  }

  getKeyMaterial(walletId) {
    return this.db.prepare(`
      SELECT encrypted_private_key AS encryptedPrivateKey, iv, auth_tag AS authTag
      FROM key_materials
      WHERE wallet_id = ?
    `).get(walletId);
  }

  addSignRecord(record) {
    this.db.prepare(`
      INSERT INTO sign_records (id, wallet_id, chain, operation, request_hash, result_ref, actor, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.walletId,
      record.chain,
      record.operation,
      record.requestHash,
      record.resultRef ?? null,
      record.actor,
      now(),
    );
  }
}
