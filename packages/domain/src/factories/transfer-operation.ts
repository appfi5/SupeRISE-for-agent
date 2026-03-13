import {
  nowIso,
  type ErrorCode,
  createPrefixedId,
  type JsonValue,
} from "@superise/shared";
import type {
  ActorRole,
  AssetKind,
  AssetLimitWindow,
  ChainKind,
  ChainTransactionStatus,
  TransferOperation,
  TransferTargetType,
} from "../entities/types";

export function createTransferOperation(input: {
  actorRole: Extract<ActorRole, "AGENT" | "OWNER">;
  chain: ChainKind;
  asset: AssetKind;
  targetType: TransferTargetType;
  targetInput: string;
  resolvedToAddress: string | null;
  resolvedContactName: string | null;
  requestedAmount: string;
  requestPayload: Record<string, unknown>;
}): TransferOperation {
  const timestamp = nowIso();
  return {
    operationId: createPrefixedId("op"),
    actorRole: input.actorRole,
    chain: input.chain,
    asset: input.asset,
    targetType: input.targetType,
    targetInput: input.targetInput,
    resolvedToAddress: input.resolvedToAddress,
    resolvedContactName: input.resolvedContactName,
    requestedAmount: input.requestedAmount,
    requestPayload: input.requestPayload,
    status: "RESERVED",
    txHash: null,
    errorCode: null,
    errorMessage: null,
    submittedAt: null,
    confirmedAt: null,
    failedAt: null,
    lastChainStatus: null,
    lastChainCheckedAt: null,
    limitWindow: null,
    limitSnapshot: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function markTransferSubmitted(
  operation: TransferOperation,
  txHash: string,
  input?: {
    lastChainStatus?: ChainTransactionStatus | null;
    lastChainCheckedAt?: string | null;
  },
): TransferOperation {
  return {
    ...operation,
    txHash,
    status: "SUBMITTED",
    errorCode: null,
    errorMessage: null,
    submittedAt: operation.submittedAt ?? nowIso(),
    failedAt: null,
    lastChainStatus:
      input?.lastChainStatus !== undefined
        ? input.lastChainStatus
        : operation.lastChainStatus,
    lastChainCheckedAt:
      input?.lastChainCheckedAt !== undefined
        ? input.lastChainCheckedAt
        : operation.lastChainCheckedAt,
    updatedAt: nowIso(),
  };
}

export function markTransferConfirmed(
  operation: TransferOperation,
  input?: {
    lastChainStatus?: ChainTransactionStatus | null;
    lastChainCheckedAt?: string | null;
  },
): TransferOperation {
  const timestamp = nowIso();
  return {
    ...operation,
    status: "CONFIRMED",
    errorCode: null,
    errorMessage: null,
    confirmedAt: timestamp,
    failedAt: null,
    lastChainStatus: input?.lastChainStatus ?? operation.lastChainStatus,
    lastChainCheckedAt:
      input?.lastChainCheckedAt !== undefined
        ? input.lastChainCheckedAt
        : operation.lastChainCheckedAt,
    updatedAt: timestamp,
  };
}

export function markTransferFailed(
  operation: TransferOperation,
  errorCode: ErrorCode,
  errorMessage: string,
  input?: {
    lastChainStatus?: ChainTransactionStatus | null;
    lastChainCheckedAt?: string | null;
    limitWindow?: AssetLimitWindow | null;
    limitSnapshot?: JsonValue | null;
  },
): TransferOperation {
  const timestamp = nowIso();
  return {
    ...operation,
    status: "FAILED",
    errorCode,
    errorMessage,
    confirmedAt: null,
    failedAt: timestamp,
    lastChainStatus:
      input?.lastChainStatus !== undefined
        ? input.lastChainStatus
        : operation.lastChainStatus,
    lastChainCheckedAt:
      input?.lastChainCheckedAt !== undefined
        ? input.lastChainCheckedAt
        : operation.lastChainCheckedAt,
    limitWindow:
      input?.limitWindow !== undefined ? input.limitWindow : operation.limitWindow,
    limitSnapshot:
      input?.limitSnapshot !== undefined ? input.limitSnapshot : operation.limitSnapshot,
    updatedAt: timestamp,
  };
}
