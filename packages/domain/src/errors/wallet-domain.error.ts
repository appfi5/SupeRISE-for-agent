import type { ErrorCode, JsonValue } from "@superise/shared";

export class WalletDomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: JsonValue,
  ) {
    super(message);
    this.name = "WalletDomainError";
  }
}
