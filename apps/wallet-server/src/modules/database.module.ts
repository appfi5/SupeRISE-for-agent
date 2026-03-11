import { Global, Inject, Module } from "@nestjs/common";
import {
  WalletDatabase,
  createRepositoryBundle,
  type WalletServerConfig,
  SqliteUnitOfWork,
} from "@superise/infrastructure";
import { TOKENS } from "../tokens";

@Global()
@Module({
  providers: [
    {
      provide: TOKENS.DATABASE,
      inject: [TOKENS.CONFIG],
      useFactory: (config: WalletServerConfig) => new WalletDatabase(config),
    },
    {
      provide: TOKENS.REPOSITORIES,
      inject: [TOKENS.DATABASE],
      useFactory: (database: WalletDatabase) => createRepositoryBundle(database.db),
    },
    {
      provide: TOKENS.UNIT_OF_WORK,
      inject: [TOKENS.DATABASE],
      useFactory: (database: WalletDatabase) => new SqliteUnitOfWork(database.db),
    },
  ],
  exports: [TOKENS.DATABASE, TOKENS.REPOSITORIES, TOKENS.UNIT_OF_WORK],
})
export class DatabaseModule {}
