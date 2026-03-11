import { Module } from "@nestjs/common";
import {
  BootstrapOwnerCredentialService,
  OwnerAuthService,
  type OwnerAccessTokenPort,
  type RepositoryBundle,
  type UnitOfWork,
  type OwnerCredentialNoticeWriter,
  type PasswordHasher,
  type VaultPort,
} from "@superise/application";
import {
  JwtOwnerAccessTokenService,
  type WalletServerConfig,
} from "@superise/infrastructure";
import { TOKENS } from "../tokens";

@Module({
  providers: [
    {
      provide: TOKENS.OWNER_ACCESS_TOKEN,
      inject: [TOKENS.CONFIG],
      useFactory: (config: WalletServerConfig) =>
        new JwtOwnerAccessTokenService({
          secret: config.ownerJwtSecret,
          ttlSeconds: config.ownerJwtTtlSeconds,
        }),
    },
    {
      provide: TOKENS.OWNER_AUTH_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.PASSWORD_HASHER, TOKENS.OWNER_ACCESS_TOKEN],
      useFactory: (
        repos: RepositoryBundle,
        passwordHasher: PasswordHasher,
        ownerAccessToken: OwnerAccessTokenPort,
      ) => new OwnerAuthService(repos, passwordHasher, ownerAccessToken),
    },
    {
      provide: TOKENS.BOOTSTRAP_OWNER_CREDENTIAL_SERVICE,
      inject: [
        TOKENS.REPOSITORIES,
        TOKENS.UNIT_OF_WORK,
        TOKENS.PASSWORD_HASHER,
        TOKENS.NOTICE_WRITER,
        TOKENS.VAULT,
      ],
      useFactory: (
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        passwordHasher: PasswordHasher,
        noticeWriter: OwnerCredentialNoticeWriter,
        vault: VaultPort,
      ) =>
        new BootstrapOwnerCredentialService(
          repos,
          unitOfWork,
          passwordHasher,
          noticeWriter,
          vault,
      ),
    },
  ],
  exports: [
    TOKENS.OWNER_ACCESS_TOKEN,
    TOKENS.OWNER_AUTH_SERVICE,
    TOKENS.BOOTSTRAP_OWNER_CREDENTIAL_SERVICE,
  ],
})
export class OwnerAuthModule {}
