import { randomUUID } from "node:crypto";
import { WalletDomainError } from "@superise/domain";
import type {
  IssuedOwnerAccessToken,
  OwnerAccessTokenClaims,
  OwnerAccessTokenIssueInput,
  OwnerAccessTokenPort,
} from "@superise/application";
import {
  JsonWebTokenError,
  NotBeforeError,
  sign,
  TokenExpiredError,
  verify,
  type JwtPayload,
} from "jsonwebtoken";

const OWNER_ACCESS_TOKEN_SUBJECT = "owner";
const OWNER_ACCESS_TOKEN_ISSUER = "superise-wallet-server";
const OWNER_ACCESS_TOKEN_AUDIENCE = "superise-owner-api";

type OwnerJwtPayload = JwtPayload & {
  credentialId: string;
  credentialUpdatedAt: string;
  jti: string;
};

export class JwtOwnerAccessTokenService implements OwnerAccessTokenPort {
  constructor(
    private readonly options: {
      secret: string;
      ttlSeconds: number;
    },
  ) {}

  async issue(input: OwnerAccessTokenIssueInput): Promise<IssuedOwnerAccessToken> {
    const issuedAtSeconds = Math.floor(Date.now() / 1000);
    const expiresInSeconds = this.options.ttlSeconds;
    const expiresAtSeconds = issuedAtSeconds + expiresInSeconds;

    const accessToken = sign(
      {
        credentialId: input.credentialId,
        credentialUpdatedAt: input.credentialUpdatedAt,
      },
      this.options.secret,
      {
        algorithm: "HS256",
        audience: OWNER_ACCESS_TOKEN_AUDIENCE,
        expiresIn: expiresInSeconds,
        issuer: OWNER_ACCESS_TOKEN_ISSUER,
        jwtid: randomUUID(),
        subject: OWNER_ACCESS_TOKEN_SUBJECT,
      },
    );

    return {
      accessToken,
      tokenType: "Bearer",
      expiresInSeconds,
      expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
    };
  }

  async verify(token: string): Promise<OwnerAccessTokenClaims> {
    try {
      const payload = verify(token, this.options.secret, {
        algorithms: ["HS256"],
        audience: OWNER_ACCESS_TOKEN_AUDIENCE,
        issuer: OWNER_ACCESS_TOKEN_ISSUER,
        subject: OWNER_ACCESS_TOKEN_SUBJECT,
      }) as OwnerJwtPayload;

      if (
        typeof payload.credentialId !== "string" ||
        typeof payload.credentialUpdatedAt !== "string" ||
        typeof payload.iat !== "number" ||
        typeof payload.exp !== "number" ||
        typeof payload.jti !== "string"
      ) {
        throw new WalletDomainError("AUTH_ERROR", "Owner bearer token payload is invalid");
      }

      return {
        subject: OWNER_ACCESS_TOKEN_SUBJECT,
        credentialId: payload.credentialId,
        credentialUpdatedAt: payload.credentialUpdatedAt,
        issuedAt: new Date(payload.iat * 1000).toISOString(),
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        tokenId: payload.jti,
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new WalletDomainError("AUTH_ERROR", "Owner bearer token has expired");
      }

      if (error instanceof JsonWebTokenError || error instanceof NotBeforeError) {
        throw new WalletDomainError("AUTH_ERROR", "Owner bearer token is invalid");
      }

      throw error;
    }
  }
}
