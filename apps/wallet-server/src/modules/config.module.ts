import { Global, Module, type DynamicModule } from "@nestjs/common";
import type { WalletServerConfig } from "@superise/infrastructure";
import { TOKENS } from "../tokens";

@Global()
@Module({})
export class ConfigModule {
  static register(config: WalletServerConfig): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: TOKENS.CONFIG, useValue: config }],
      exports: [TOKENS.CONFIG],
    };
  }
}
