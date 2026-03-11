import type { ChainKind, TransferOperation } from "@superise/domain";
import { WalletDomainError } from "@superise/domain";
import {
  serializeJson,
  toErrorMessage,
  type ErrorCode,
} from "@superise/shared";

export function mapTransferErrorCode(
  error: unknown,
  chain: ChainKind,
): ErrorCode {
  if (error instanceof WalletDomainError) {
    return error.code;
  }

  const message = toErrorMessage(error).toLowerCase();
  if (message.includes("insufficientcellcapacity") || message.includes("occupied capacity")) {
    return "VALIDATION_ERROR";
  }
  if (message.includes("insufficient")) {
    return "INSUFFICIENT_BALANCE";
  }
  if (message.includes("rpc") || message.includes("network")) {
    return "CHAIN_UNAVAILABLE";
  }
  if (message.includes("broadcast") || message.includes("nonce")) {
    return "TRANSFER_BROADCAST_FAILED";
  }

  return chain === "evm"
    ? "TRANSFER_BROADCAST_FAILED"
    : "TRANSFER_BUILD_FAILED";
}

export function buildOperationPayload(operation: TransferOperation): string {
  return serializeJson(operation.requestPayload);
}
