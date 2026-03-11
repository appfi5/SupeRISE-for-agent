import BetterSqlite3 from "better-sqlite3";
import {
  Kysely,
  SqliteDialect,
  sql,
} from "kysely";
import type { WalletServerConfig } from "../config/wallet-server-config";
import type { DatabaseSchema } from "./schema";

export class WalletDatabase {
  readonly sqlite: BetterSqlite3.Database;
  readonly db: Kysely<DatabaseSchema>;

  constructor(readonly config: WalletServerConfig) {
    this.sqlite = new BetterSqlite3(config.sqlitePath);
    this.sqlite.pragma("journal_mode = WAL");
    this.sqlite.pragma("foreign_keys = ON");
    this.db = new Kysely<DatabaseSchema>({
      dialect: new SqliteDialect({ database: this.sqlite }),
    });
  }

  async migrate(): Promise<void> {
    await this.db.schema
      .createTable("wallet_state")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("status", "text", (column) => column.notNull())
      .addColumn("encrypted_private_key", "text", (column) => column.notNull())
      .addColumn("encrypted_dek", "text", (column) => column.notNull())
      .addColumn("private_key_iv", "text", (column) => column.notNull())
      .addColumn("private_key_tag", "text", (column) => column.notNull())
      .addColumn("dek_iv", "text", (column) => column.notNull())
      .addColumn("dek_tag", "text", (column) => column.notNull())
      .addColumn("wallet_fingerprint", "text", (column) => column.notNull())
      .addColumn("source", "text", (column) => column.notNull())
      .addColumn("created_at", "text", (column) => column.notNull())
      .addColumn("updated_at", "text", (column) => column.notNull())
      .execute();

    await this.db.schema
      .createTable("owner_credentials")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("password_hash", "text", (column) => column.notNull())
      .addColumn("must_rotate", "integer", (column) => column.notNull())
      .addColumn("created_at", "text", (column) => column.notNull())
      .addColumn("updated_at", "text", (column) => column.notNull())
      .execute();

    await this.db.schema
      .createTable("transfer_operations")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("role", "text", (column) => column.notNull())
      .addColumn("chain", "text", (column) => column.notNull())
      .addColumn("asset", "text", (column) => column.notNull())
      .addColumn("request_payload", "text", (column) => column.notNull())
      .addColumn("status", "text", (column) => column.notNull())
      .addColumn("tx_hash", "text")
      .addColumn("error_code", "text")
      .addColumn("error_message", "text")
      .addColumn("created_at", "text", (column) => column.notNull())
      .addColumn("updated_at", "text", (column) => column.notNull())
      .execute();

    await this.db.schema
      .createTable("sign_operations")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("role", "text", (column) => column.notNull())
      .addColumn("message_digest", "text", (column) => column.notNull())
      .addColumn("chain", "text", (column) => column.notNull())
      .addColumn("result", "text", (column) => column.notNull())
      .addColumn("error_code", "text")
      .addColumn("created_at", "text", (column) => column.notNull())
      .execute();

    await this.db.schema
      .createTable("audit_logs")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("actor_role", "text", (column) => column.notNull())
      .addColumn("action", "text", (column) => column.notNull())
      .addColumn("result", "text", (column) => column.notNull())
      .addColumn("metadata", "text", (column) => column.notNull())
      .addColumn("created_at", "text", (column) => column.notNull())
      .execute();

    await this.db.schema
      .createTable("system_config")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("owner_credential_notice_path", "text", (column) => column.notNull())
      .addColumn("vault_mode", "text", (column) => column.notNull())
      .addColumn("kek_provider", "text", (column) => column.notNull())
      .addColumn("kek_reference", "text", (column) => column.notNull())
      .addColumn("chain_rpc_config", "text", (column) => column.notNull())
      .addColumn("created_at", "text", (column) => column.notNull())
      .addColumn("updated_at", "text", (column) => column.notNull())
      .execute();

    await sql`PRAGMA user_version = 1`.execute(this.db);
  }

  async checkHealth(): Promise<void> {
    await sql`SELECT 1`.execute(this.db);
  }

  async close(): Promise<void> {
    await this.db.destroy();
    this.sqlite.close();
  }
}
