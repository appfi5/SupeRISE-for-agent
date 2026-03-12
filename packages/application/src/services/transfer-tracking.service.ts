import {
  createAuditLog,
  markTransferConfirmed,
  markTransferFailed,
  WalletDomainError,
  type TransferOperation,
} from "@superise/domain";
import type {
  RepositoryBundle,
  UnitOfWork,
} from "../ports";
import { NervosTxStatusQueryService } from "./nervos.service";
import { EthereumTxStatusQueryService } from "./ethereum.service";
import { AssetLimitService } from "./asset-limit.service";

export class TransferSettlementService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly unitOfWork: UnitOfWork,
    private readonly assetLimits: AssetLimitService,
    private readonly nervosTxStatus: NervosTxStatusQueryService,
    private readonly ethereumTxStatus: EthereumTxStatusQueryService,
    private readonly reservedTimeoutMs: number,
    private readonly submittedTimeoutMs: number,
  ) {}

  async execute(limit = 100): Promise<{
    processed: number;
    confirmed: number;
    failed: number;
  }> {
    const operations = await this.repos.transfers.listByStatuses(
      ["RESERVED", "SUBMITTED"],
      limit,
    );
    let confirmed = 0;
    let failed = 0;

    for (const operation of operations) {
      const outcome = await this.settleOperation(operation);
      if (outcome === "CONFIRMED") {
        confirmed += 1;
      } else if (outcome === "FAILED") {
        failed += 1;
      }
    }

    return {
      processed: operations.length,
      confirmed,
      failed,
    };
  }

  private async settleOperation(
    operation: TransferOperation,
  ): Promise<"NOOP" | "CONFIRMED" | "FAILED"> {
    const ageMs = Date.now() - new Date(operation.updatedAt).getTime();

    if (operation.status === "RESERVED") {
      if (ageMs <= this.reservedTimeoutMs) {
        return "NOOP";
      }

      await this.failOperation(
        operation,
        "TRANSFER_BROADCAST_FAILED",
        "Transfer reservation expired before broadcast completed",
        "reservation_timeout",
      );
      return "FAILED";
    }

    if (!operation.txHash) {
      await this.failOperation(
        operation,
        "TRANSFER_BROADCAST_FAILED",
        "Submitted transfer is missing txHash",
        "missing_tx_hash",
      );
      return "FAILED";
    }

    const chainStatus =
      operation.chain === "ckb"
        ? await this.nervosTxStatus.execute(operation.txHash)
        : await this.ethereumTxStatus.execute(operation.txHash);

    if (chainStatus.status === "CONFIRMED") {
      await this.confirmOperation(operation);
      return "CONFIRMED";
    }

    if (chainStatus.status === "FAILED") {
      await this.failOperation(
        operation,
        "TRANSFER_BROADCAST_FAILED",
        chainStatus.reason ?? "Transaction failed on chain",
        "chain_failed",
      );
      return "FAILED";
    }

    if (ageMs <= this.submittedTimeoutMs) {
      return "NOOP";
    }

    await this.failOperation(
      operation,
      "TRANSFER_BROADCAST_FAILED",
      chainStatus.status === "NOT_FOUND"
        ? "Transaction was not found before settlement timeout"
        : "Transaction confirmation timed out",
      chainStatus.status === "NOT_FOUND" ? "not_found_timeout" : "confirmation_timeout",
    );
    return "FAILED";
  }

  private async confirmOperation(operation: TransferOperation): Promise<void> {
    const confirmed = markTransferConfirmed(operation);

    await this.unitOfWork.run(async (repos) => {
      await repos.transfers.save(confirmed);
      await repos.audits.save(
        createAuditLog({
          actorRole: "SYSTEM",
          action: "transfer.settlement_confirmed",
          result: "SUCCESS",
          metadata: {
            operationId: confirmed.operationId,
            chain: confirmed.chain,
            asset: confirmed.asset,
            txHash: confirmed.txHash,
          },
        }),
      );
    });

    await this.assetLimits.consumeReservation(operation.operationId);
  }

  private async failOperation(
    operation: TransferOperation,
    errorCode: "TRANSFER_BROADCAST_FAILED",
    errorMessage: string,
    releaseReason: string,
  ): Promise<void> {
    const failed = markTransferFailed(operation, errorCode, errorMessage);

    await this.unitOfWork.run(async (repos) => {
      await repos.transfers.save(failed);
      await repos.audits.save(
        createAuditLog({
          actorRole: "SYSTEM",
          action: "transfer.settlement_failed",
          result: "FAILED",
          metadata: {
            operationId: failed.operationId,
            chain: failed.chain,
            asset: failed.asset,
            txHash: failed.txHash,
            errorCode: failed.errorCode,
            errorMessage: failed.errorMessage,
          },
        }),
      );
    });

    await this.assetLimits.releaseReservation(operation.operationId, releaseReason);
  }
}

export function ensureSupportedSettlementConfig(input: {
  reservedTimeoutMs: number;
  submittedTimeoutMs: number;
  intervalMs: number;
}): void {
  if (input.reservedTimeoutMs <= 0 || input.submittedTimeoutMs <= 0 || input.intervalMs <= 0) {
    throw new WalletDomainError(
      "VALIDATION_ERROR",
      "Transfer settlement timing config must be positive integers",
    );
  }
}
