import type { OwnerCredentialStatusDto, OwnerLoginResponse } from "@superise/app-contracts";
import {
  createAuditLog,
  rotateOwnerCredential,
  WalletDomainError,
} from "@superise/domain";
import type {
  OwnerAccessTokenClaims,
  OwnerAccessTokenPort,
  PasswordHasher,
  RepositoryBundle,
} from "../ports";

export class OwnerAuthService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly passwordHasher: PasswordHasher,
    private readonly ownerAccessTokens: OwnerAccessTokenPort,
  ) {}

  async login(password: string): Promise<OwnerLoginResponse> {
    const credential = await this.repos.ownerCredentials.getCurrent();
    if (!credential) {
      throw new WalletDomainError("AUTH_ERROR", "Owner credential not initialized");
    }

    const matches = await this.passwordHasher.verifyPassword(
      password,
      credential.passwordHash,
    );

    if (!matches) {
      await this.repos.audits.save(
        createAuditLog({
          actorRole: "OWNER",
          action: "owner.login",
          result: "FAILED",
          metadata: { reason: "password_mismatch" },
        }),
      );
      throw new WalletDomainError("AUTH_ERROR", "Password is invalid");
    }

    await this.repos.audits.save(
      createAuditLog({
        actorRole: "OWNER",
        action: "owner.login",
        result: "SUCCESS",
      }),
    );

    const issuedToken = await this.ownerAccessTokens.issue({
      credentialId: credential.credentialId,
      credentialUpdatedAt: credential.updatedAt,
    });
    const credentialStatus: OwnerCredentialStatusDto["credentialStatus"] =
      credential.mustRotate ? "DEFAULT_PENDING_ROTATION" : "ACTIVE";

    return {
      credentialStatus,
      ...issuedToken,
    };
  }

  async authenticateAccessToken(token: string): Promise<OwnerAccessTokenClaims> {
    const claims = await this.ownerAccessTokens.verify(token);
    const credential = await this.repos.ownerCredentials.getCurrent();
    if (!credential) {
      throw new WalletDomainError("AUTH_ERROR", "Owner credential not initialized");
    }

    if (claims.credentialId !== credential.credentialId) {
      throw new WalletDomainError("AUTH_ERROR", "Owner bearer token is no longer valid");
    }

    if (claims.credentialUpdatedAt !== credential.updatedAt) {
      throw new WalletDomainError(
        "AUTH_ERROR",
        "Owner bearer token is no longer valid after credential rotation",
      );
    }

    return claims;
  }

  async rotateCredential(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ rotated: true }> {
    const credential = await this.repos.ownerCredentials.getCurrent();
    if (!credential) {
      throw new WalletDomainError("AUTH_ERROR", "Owner credential not initialized");
    }

    const matches = await this.passwordHasher.verifyPassword(
      currentPassword,
      credential.passwordHash,
    );
    if (!matches) {
      throw new WalletDomainError("AUTH_ERROR", "Current password is invalid");
    }

    const nextHash = await this.passwordHasher.hashPassword(newPassword);
    await this.repos.ownerCredentials.saveCurrent(
      rotateOwnerCredential(credential, nextHash),
    );
    await this.repos.audits.save(
      createAuditLog({
        actorRole: "OWNER",
        action: "owner.rotate_credential",
        result: "SUCCESS",
      }),
    );

    return { rotated: true };
  }
}
