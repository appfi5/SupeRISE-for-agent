import type { ErrorPayload } from "@superise/app-contracts";
import { WalletDomainError } from "@superise/domain";
import { toErrorMessage } from "@superise/shared";

export function toContractError(error: unknown): ErrorPayload {
  if (error instanceof WalletDomainError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  return {
    code: "VALIDATION_ERROR",
    message: toErrorMessage(error),
  };
}
