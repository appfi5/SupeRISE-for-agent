import { nowIso, type ErrorCode, createPrefixedId } from "@superise/shared";
import type {
  ActorRole,
  AssetKind,
  ChainKind,
  TransferOperation,
} from "../entities/types";

export function createTransferOperation(input: {
  actorRole: Extract<ActorRole, "AGENT" | "OWNER">;
  chain: ChainKind;
  asset: AssetKind;
  requestPayload: Record<string, unknown>;
}): TransferOperation {
  const timestamp = nowIso();
  return {
    operationId: createPrefixedId("op"),
    actorRole: input.actorRole,
    chain: input.chain,
    asset: input.asset,
    requestPayload: input.requestPayload,
    status: "PENDING",
    txHash: null,
    errorCode: null,
    errorMessage: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function markTransferSubmitted(
  operation: TransferOperation,
  txHash: string,
): TransferOperation {
  return {
    ...operation,
    txHash,
    status: "SUBMITTED",
    updatedAt: nowIso(),
  };
}

export function markTransferFailed(
  operation: TransferOperation,
  errorCode: ErrorCode,
  errorMessage: string,
): TransferOperation {
  return {
    ...operation,
    status: "FAILED",
    errorCode,
    errorMessage,
    updatedAt: nowIso(),
  };
}
