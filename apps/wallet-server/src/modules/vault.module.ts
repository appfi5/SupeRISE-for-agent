import { Global, Module } from "@nestjs/common";
import {
  AesGcmVaultService,
  FileOwnerCredentialNoticeWriter,
  ScryptPasswordHasher,
  Secp256k1PrivateKeyFactory,
  type WalletServerConfig,
} from "@superise/infrastructure";
import { TOKENS } from "../tokens";

@Global()
@Module({
  providers: [
    {
      provide: TOKENS.VAULT,
      inject: [TOKENS.CONFIG],
      useFactory: (config: WalletServerConfig) => new AesGcmVaultService(config),
    },
    {
      provide: TOKENS.PASSWORD_HASHER,
      useFactory: () => new ScryptPasswordHasher(),
    },
    {
      provide: TOKENS.NOTICE_WRITER,
      inject: [TOKENS.CONFIG],
      useFactory: (config: WalletServerConfig) =>
        new FileOwnerCredentialNoticeWriter(config),
    },
    {
      provide: TOKENS.PRIVATE_KEY_FACTORY,
      useFactory: () => new Secp256k1PrivateKeyFactory(),
    },
  ],
  exports: [
    TOKENS.VAULT,
    TOKENS.PASSWORD_HASHER,
    TOKENS.NOTICE_WRITER,
    TOKENS.PRIVATE_KEY_FACTORY,
  ],
})
export class VaultModule {}
