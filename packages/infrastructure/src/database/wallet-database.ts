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
      .addColumn("target_type", "text", (column) => column.notNull().defaultTo("ADDRESS"))
      .addColumn("target_input", "text", (column) => column.notNull().defaultTo(""))
      .addColumn("resolved_to_address", "text")
      .addColumn("resolved_contact_name", "text")
      .addColumn("requested_amount", "text", (column) => column.notNull().defaultTo("0"))
      .addColumn("request_payload", "text", (column) => column.notNull())
      .addColumn("status", "text", (column) => column.notNull())
      .addColumn("tx_hash", "text")
      .addColumn("error_code", "text")
      .addColumn("error_message", "text")
      .addColumn("submitted_at", "text")
      .addColumn("confirmed_at", "text")
      .addColumn("failed_at", "text")
      .addColumn("last_chain_status", "text")
      .addColumn("last_chain_checked_at", "text")
      .addColumn("limit_window", "text")
      .addColumn("limit_snapshot", "text")
      .addColumn("created_at", "text", (column) => column.notNull())
      .addColumn("updated_at", "text", (column) => column.notNull())
      .execute();

    await this.db.schema
      .createTable("address_book_contacts")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("name", "text", (column) => column.notNull())
      .addColumn("normalized_name", "text", (column) => column.notNull())
      .addColumn("note", "text")
      .addColumn("nervos_address", "text")
      .addColumn("normalized_nervos_address", "text")
      .addColumn("ethereum_address", "text")
      .addColumn("normalized_ethereum_address", "text")
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
      .createTable("asset_limit_policies")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("chain", "text", (column) => column.notNull())
      .addColumn("asset", "text", (column) => column.notNull())
      .addColumn("daily_limit", "text")
      .addColumn("weekly_limit", "text")
      .addColumn("monthly_limit", "text")
      .addColumn("updated_by", "text", (column) => column.notNull())
      .addColumn("created_at", "text", (column) => column.notNull())
      .addColumn("updated_at", "text", (column) => column.notNull())
      .addUniqueConstraint("asset_limit_policies_chain_asset_unique", [
        "chain",
        "asset",
      ])
      .execute();

    await this.db.schema
      .createTable("asset_limit_reservations")
      .ifNotExists()
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("operation_id", "text", (column) => column.notNull())
      .addColumn("actor_role", "text", (column) => column.notNull())
      .addColumn("chain", "text", (column) => column.notNull())
      .addColumn("asset", "text", (column) => column.notNull())
      .addColumn("amount", "text", (column) => column.notNull())
      .addColumn("daily_window_start", "text", (column) => column.notNull())
      .addColumn("weekly_window_start", "text", (column) => column.notNull())
      .addColumn("monthly_window_start", "text", (column) => column.notNull())
      .addColumn("status", "text", (column) => column.notNull())
      .addColumn("release_reason", "text")
      .addColumn("created_at", "text", (column) => column.notNull())
      .addColumn("updated_at", "text", (column) => column.notNull())
      .addColumn("settled_at", "text")
      .addUniqueConstraint("asset_limit_reservations_operation_id_unique", [
        "operation_id",
      ])
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

    await this.ensureColumn(
      "transfer_operations",
      "target_type",
      "text not null default 'ADDRESS'",
    );
    await this.ensureColumn(
      "transfer_operations",
      "target_input",
      "text not null default ''",
    );
    await this.ensureColumn("transfer_operations", "resolved_to_address", "text");
    await this.ensureColumn("transfer_operations", "resolved_contact_name", "text");
    await this.ensureColumn(
      "transfer_operations",
      "requested_amount",
      "text not null default '0'",
    );
    await this.ensureColumn("transfer_operations", "submitted_at", "text");
    await this.ensureColumn("transfer_operations", "confirmed_at", "text");
    await this.ensureColumn("transfer_operations", "failed_at", "text");
    await this.ensureColumn("transfer_operations", "last_chain_status", "text");
    await this.ensureColumn("transfer_operations", "last_chain_checked_at", "text");
    await this.ensureColumn("transfer_operations", "limit_window", "text");
    await this.ensureColumn("transfer_operations", "limit_snapshot", "text");

    await this.db.schema
      .createIndex("idx_transfer_operations_status_created_at")
      .ifNotExists()
      .on("transfer_operations")
      .columns(["status", "created_at"])
      .execute();

    await this.db.schema
      .createIndex("idx_transfer_operations_tx_hash")
      .ifNotExists()
      .on("transfer_operations")
      .column("tx_hash")
      .execute();

    await this.db.schema
      .createIndex("idx_transfer_operations_target_type_target_input")
      .ifNotExists()
      .on("transfer_operations")
      .columns(["target_type", "target_input"])
      .execute();

    await this.db.schema
      .createIndex("idx_address_book_contacts_normalized_name")
      .ifNotExists()
      .unique()
      .on("address_book_contacts")
      .column("normalized_name")
      .execute();

    await this.db.schema
      .createIndex("idx_address_book_contacts_normalized_nervos_address")
      .ifNotExists()
      .on("address_book_contacts")
      .column("normalized_nervos_address")
      .execute();

    await this.db.schema
      .createIndex("idx_address_book_contacts_normalized_ethereum_address")
      .ifNotExists()
      .on("address_book_contacts")
      .column("normalized_ethereum_address")
      .execute();

    await this.db.schema
      .createIndex("idx_address_book_contacts_updated_at")
      .ifNotExists()
      .on("address_book_contacts")
      .column("updated_at")
      .execute();

    await this.db.schema
      .createIndex("idx_asset_limit_reservations_operation_id")
      .ifNotExists()
      .on("asset_limit_reservations")
      .column("operation_id")
      .execute();

    await this.db.schema
      .createIndex("idx_asset_limit_reservations_daily_usage")
      .ifNotExists()
      .on("asset_limit_reservations")
      .columns(["actor_role", "chain", "asset", "status", "daily_window_start"])
      .execute();

    await this.db.schema
      .createIndex("idx_asset_limit_reservations_weekly_usage")
      .ifNotExists()
      .on("asset_limit_reservations")
      .columns(["actor_role", "chain", "asset", "status", "weekly_window_start"])
      .execute();

    await this.db.schema
      .createIndex("idx_asset_limit_reservations_monthly_usage")
      .ifNotExists()
      .on("asset_limit_reservations")
      .columns(["actor_role", "chain", "asset", "status", "monthly_window_start"])
      .execute();

    await sql`PRAGMA user_version = 3`.execute(this.db);
  }

  async checkHealth(): Promise<void> {
    await sql`SELECT 1`.execute(this.db);
  }

  async close(): Promise<void> {
    await this.db.destroy();
    this.sqlite.close();
  }

  private async ensureColumn(
    tableName: string,
    columnName: string,
    definition: string,
  ): Promise<void> {
    const columns = this.sqlite
      .prepare(`PRAGMA table_info(${tableName})`)
      .all() as Array<{ name: string }>;

    if (columns.some((column) => column.name === columnName)) {
      return;
    }

    this.sqlite
      .prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`)
      .run();
  }
}
