import type {
  AuditLogDto,
  OperationStatusResponse,
  OwnerCredentialStatusDto,
  WalletCurrentDto,
} from "@superise/app-contracts";
import { WalletDomainError } from "@superise/domain";
import type {
  AuditLogRepository,
  CkbWalletAdapter,
  DatabaseHealthPort,
  EvmWalletAdapter,
  OwnerCredentialRepository,
  TransferOperationRepository,
  VaultPort,
  WalletRepository,
} from "../ports";

export class CurrentWalletQueryService {
  constructor(private readonly wallets: WalletRepository) {}

  async execute(): Promise<WalletCurrentDto> {
    const wallet = await this.wallets.getCurrent();
    if (!wallet) {
      return {
        walletFingerprint: "",
        status: "EMPTY",
        source: "UNKNOWN",
      };
    }

    return {
      walletFingerprint: wallet.fingerprint,
      status: wallet.status,
      source: wallet.source,
    };
  }
}

export class OwnerCredentialStatusQueryService {
  constructor(private readonly ownerCredentials: OwnerCredentialRepository) {}

  async execute(): Promise<OwnerCredentialStatusDto> {
    const credential = await this.ownerCredentials.getCurrent();
    if (!credential) {
      throw new WalletDomainError("AUTH_ERROR", "Owner credential not initialized");
    }

    return {
      credentialStatus: credential.mustRotate
        ? "DEFAULT_PENDING_ROTATION"
        : "ACTIVE",
    };
  }
}

export class OperationStatusQueryService {
  constructor(private readonly transfers: TransferOperationRepository) {}

  async execute(operationId: string): Promise<OperationStatusResponse> {
    const operation = await this.transfers.getById(operationId);
    if (!operation) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `Operation ${operationId} not found`,
      );
    }

    return {
      operationId: operation.operationId,
      chain: operation.chain === "ckb" ? "nervos" : "ethereum",
      asset: operation.asset,
      status: operation.status,
      txHash: operation.txHash,
      errorCode: operation.errorCode,
      errorMessage: operation.errorMessage,
    };
  }
}

export class AuditLogQueryService {
  constructor(private readonly audits: AuditLogRepository) {}

  async execute(limit = 50): Promise<AuditLogDto[]> {
    const logs = await this.audits.listRecent(limit);
    return logs.map((log) => ({
      auditId: log.auditId,
      actorRole: log.actorRole,
      action: log.action,
      result: log.result,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));
  }
}

export class HealthCheckService {
  constructor(
    private readonly database: DatabaseHealthPort,
    private readonly vault: VaultPort,
    private readonly ckb: CkbWalletAdapter,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(): Promise<void> {
    await this.database.checkHealth();
    await this.vault.validateKek();
    await this.ckb.checkHealth();
    await this.evm.checkHealth();
  }
}

export class RuntimeHealthCheckService {
  constructor(private readonly database: DatabaseHealthPort) {}

  async execute(): Promise<{ status: "ok"; checks: { database: "ok" } }> {
    await this.database.checkHealth();
    return {
      status: "ok",
      checks: {
        database: "ok",
      },
    };
  }
}
