import type {
  AssetLimitPolicyRepository,
  AssetLimitReservationRepository,
  AuditLogRepository,
  OwnerCredentialRepository,
  RepositoryBundle,
  SignOperationRepository,
  SystemConfigRepository,
  TransferOperationRepository,
  UnitOfWork,
  WalletRepository,
} from "@superise/application";
import type {
  AuditLog,
  AssetLimitPolicy,
  AssetLimitReservation,
  OwnerCredential,
  SignOperation,
  SystemConfigSnapshot,
  TransferOperation,
  TransferStatus,
  WalletAggregate,
} from "@superise/domain";
import type { Kysely } from "kysely";
import type { DatabaseSchema, Executor } from "../database/schema";
import {
  auditLogFromRow,
  auditLogToRow,
  assetLimitPolicyFromRow,
  assetLimitPolicyToRow,
  assetLimitReservationFromRow,
  assetLimitReservationToRow,
  ownerCredentialFromRow,
  ownerCredentialToRow,
  signOperationToRow,
  systemConfigFromRow,
  systemConfigToRow,
  transferOperationFromRow,
  transferOperationToRow,
  walletFromRow,
  walletToRow,
} from "../database/mappers";

class SqliteWalletRepository implements WalletRepository {
  constructor(private readonly executor: Executor) {}

  async getCurrent(): Promise<WalletAggregate | null> {
    const row = await this.executor
      .selectFrom("wallet_state")
      .selectAll()
      .where("id", "=", "wallet_current")
      .executeTakeFirst();

    return row ? walletFromRow(row) : null;
  }

  async saveCurrent(wallet: WalletAggregate): Promise<void> {
    await this.executor
      .insertInto("wallet_state")
      .values(walletToRow(wallet))
      .onConflict((oc) => oc.column("id").doUpdateSet(walletToRow(wallet)))
      .execute();
  }
}

class SqliteOwnerCredentialRepository implements OwnerCredentialRepository {
  constructor(private readonly executor: Executor) {}

  async getCurrent(): Promise<OwnerCredential | null> {
    const row = await this.executor
      .selectFrom("owner_credentials")
      .selectAll()
      .where("id", "=", "owner_credential_current")
      .executeTakeFirst();

    return row ? ownerCredentialFromRow(row) : null;
  }

  async saveCurrent(credential: OwnerCredential): Promise<void> {
    await this.executor
      .insertInto("owner_credentials")
      .values(ownerCredentialToRow(credential))
      .onConflict((oc) =>
        oc.column("id").doUpdateSet(ownerCredentialToRow(credential)),
      )
      .execute();
  }
}

class SqliteTransferOperationRepository implements TransferOperationRepository {
  constructor(private readonly executor: Executor) {}

  async getById(operationId: string): Promise<TransferOperation | null> {
    const row = await this.executor
      .selectFrom("transfer_operations")
      .selectAll()
      .where("id", "=", operationId)
      .executeTakeFirst();

    return row ? transferOperationFromRow(row) : null;
  }

  async listByStatuses(
    statuses: TransferStatus[],
    limit: number,
  ): Promise<TransferOperation[]> {
    if (statuses.length === 0) {
      return [];
    }

    const rows = await this.executor
      .selectFrom("transfer_operations")
      .selectAll()
      .where("status", "in", statuses)
      .orderBy("updated_at", "asc")
      .limit(limit)
      .execute();

    return rows.map(transferOperationFromRow);
  }

  async save(operation: TransferOperation): Promise<void> {
    await this.executor
      .insertInto("transfer_operations")
      .values(transferOperationToRow(operation))
      .onConflict((oc) =>
        oc.column("id").doUpdateSet(transferOperationToRow(operation)),
      )
      .execute();
  }
}

class SqliteSignOperationRepository implements SignOperationRepository {
  constructor(private readonly executor: Executor) {}

  async save(operation: SignOperation): Promise<void> {
    await this.executor
      .insertInto("sign_operations")
      .values(signOperationToRow(operation))
      .execute();
  }
}

class SqliteAuditLogRepository implements AuditLogRepository {
  constructor(private readonly executor: Executor) {}

  async listRecent(limit: number): Promise<AuditLog[]> {
    const rows = await this.executor
      .selectFrom("audit_logs")
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(limit)
      .execute();

    return rows.map(auditLogFromRow);
  }

  async save(log: AuditLog): Promise<void> {
    await this.executor
      .insertInto("audit_logs")
      .values(auditLogToRow(log))
      .execute();
  }
}

class SqliteAssetLimitPolicyRepository implements AssetLimitPolicyRepository {
  constructor(private readonly executor: Executor) {}

  async getByChainAsset(
    chain: AssetLimitPolicy["chain"],
    asset: AssetLimitPolicy["asset"],
  ): Promise<AssetLimitPolicy | null> {
    const row = await this.executor
      .selectFrom("asset_limit_policies")
      .selectAll()
      .where("chain", "=", chain)
      .where("asset", "=", asset)
      .executeTakeFirst();

    return row ? assetLimitPolicyFromRow(row) : null;
  }

  async listAll(): Promise<AssetLimitPolicy[]> {
    const rows = await this.executor
      .selectFrom("asset_limit_policies")
      .selectAll()
      .orderBy("chain", "asc")
      .orderBy("asset", "asc")
      .execute();

    return rows.map(assetLimitPolicyFromRow);
  }

  async save(policy: AssetLimitPolicy): Promise<void> {
    await this.executor
      .insertInto("asset_limit_policies")
      .values(assetLimitPolicyToRow(policy))
      .onConflict((oc) =>
        oc.columns(["chain", "asset"]).doUpdateSet(assetLimitPolicyToRow(policy)),
      )
      .execute();
  }
}

class SqliteAssetLimitReservationRepository
  implements AssetLimitReservationRepository
{
  constructor(private readonly executor: Executor) {}

  async getByOperationId(operationId: string): Promise<AssetLimitReservation | null> {
    const row = await this.executor
      .selectFrom("asset_limit_reservations")
      .selectAll()
      .where("operation_id", "=", operationId)
      .executeTakeFirst();

    return row ? assetLimitReservationFromRow(row) : null;
  }

  async listByChainAsset(
    chain: AssetLimitReservation["chain"],
    asset: AssetLimitReservation["asset"],
  ): Promise<AssetLimitReservation[]> {
    const rows = await this.executor
      .selectFrom("asset_limit_reservations")
      .selectAll()
      .where("chain", "=", chain)
      .where("asset", "=", asset)
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(assetLimitReservationFromRow);
  }

  async save(reservation: AssetLimitReservation): Promise<void> {
    await this.executor
      .insertInto("asset_limit_reservations")
      .values(assetLimitReservationToRow(reservation))
      .onConflict((oc) =>
        oc.column("operation_id").doUpdateSet(assetLimitReservationToRow(reservation)),
      )
      .execute();
  }
}

class SqliteSystemConfigRepository implements SystemConfigRepository {
  constructor(private readonly executor: Executor) {}

  async getCurrent(): Promise<SystemConfigSnapshot | null> {
    const row = await this.executor
      .selectFrom("system_config")
      .selectAll()
      .where("id", "=", "system_config_current")
      .executeTakeFirst();

    return row ? systemConfigFromRow(row) : null;
  }

  async saveCurrent(config: SystemConfigSnapshot): Promise<void> {
    await this.executor
      .insertInto("system_config")
      .values(systemConfigToRow(config))
      .onConflict((oc) =>
        oc.column("id").doUpdateSet(systemConfigToRow(config)),
      )
      .execute();
  }
}

export function createRepositoryBundle(executor: Executor): RepositoryBundle {
  return {
    wallets: new SqliteWalletRepository(executor),
    ownerCredentials: new SqliteOwnerCredentialRepository(executor),
    transfers: new SqliteTransferOperationRepository(executor),
    signs: new SqliteSignOperationRepository(executor),
    audits: new SqliteAuditLogRepository(executor),
    assetLimitPolicies: new SqliteAssetLimitPolicyRepository(executor),
    assetLimitReservations: new SqliteAssetLimitReservationRepository(executor),
    systemConfig: new SqliteSystemConfigRepository(executor),
  };
}

export class SqliteUnitOfWork implements UnitOfWork {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async run<T>(work: (repos: RepositoryBundle) => Promise<T>): Promise<T> {
    return this.db.transaction().execute(async (tx) => work(createRepositoryBundle(tx)));
  }
}
