import type { NextFunction, Response } from "express";
import { WalletDomainError } from "@superise/domain";
import type { OwnerAuthService } from "@superise/application";
import { parseBearerToken, type RequestWithContext } from "../http/request";

export function createOwnerAuthContextMiddleware(ownerAuthService: OwnerAuthService) {
  return async (
    request: RequestWithContext,
    _response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = parseBearerToken(request.header("authorization"));
      if (!token) {
        next();
        return;
      }

      request.ownerAuth = await ownerAuthService.authenticateAccessToken(token);
      next();
    } catch (error) {
      if (error instanceof WalletDomainError && error.code === "AUTH_ERROR") {
        request.ownerAuthError = error.message;
        next();
        return;
      }

      next(error);
    }
  };
}
