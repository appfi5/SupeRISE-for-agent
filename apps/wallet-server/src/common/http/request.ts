import type { Request } from "express";
import { WalletDomainError } from "@superise/domain";
import type { OwnerAccessTokenClaims } from "@superise/application";
import { toErrorMessage } from "@superise/shared";

export type RequestWithContext = Request & {
  requestId?: string;
  ownerAuth?: OwnerAccessTokenClaims;
  ownerAuthError?: string;
};

export function parseWithSchema<T>(
  schema: { parse: (value: unknown) => T },
  value: unknown,
): T {
  try {
    return schema.parse(value);
  } catch (error) {
    throw new WalletDomainError(
      "VALIDATION_ERROR",
      `Request validation failed: ${toErrorMessage(error)}`,
    );
  }
}

export function parseBearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token, ...rest] = authorizationHeader.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0) {
    throw new WalletDomainError("AUTH_ERROR", "Owner bearer token is malformed");
  }

  return token;
}

export function requireOwnerAuth(request: RequestWithContext): void {
  if (request.ownerAuth) {
    return;
  }

  if (request.ownerAuthError) {
    throw new WalletDomainError("AUTH_ERROR", request.ownerAuthError);
  }

  throw new WalletDomainError("AUTH_ERROR", "Owner bearer token is required");
}
