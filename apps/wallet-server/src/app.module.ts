import { MiddlewareConsumer, Module, type DynamicModule, type NestModule } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { resolve } from "node:path";
import type { WalletServerConfig } from "@superise/infrastructure";
import {
  RequestContextMiddleware,
  AppExceptionFilter,
  RequestLoggingInterceptor,
} from "./common/http";
import { McpController } from "./controllers/mcp.controller";
import { BootstrapService } from "./bootstrap.service";
import { ConfigModule } from "./modules/config.module";
import { LoggingModule } from "./modules/logging.module";
import { DatabaseModule } from "./modules/database.module";
import { VaultModule } from "./modules/vault.module";
import { CkbModule } from "./modules/ckb.module";
import { EvmModule } from "./modules/evm.module";
import { AuditModule } from "./modules/audit.module";
import { OwnerAuthModule } from "./modules/owner-auth.module";
import { WalletModule } from "./modules/wallet.module";
import { OwnerApiModule } from "./modules/owner-api.module";
import { McpModule } from "./modules/mcp.module";
import { HealthModule } from "./modules/health.module";
import { WalletToolsModule } from "./modules/wallet-tools.module";

@Module({})
export class AppModule implements NestModule {
  static register(config: WalletServerConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.register(config),
        LoggingModule,
        DatabaseModule,
        VaultModule,
        CkbModule,
        EvmModule,
        AuditModule,
        OwnerAuthModule,
        WalletModule,
        WalletToolsModule,
        OwnerApiModule,
        McpModule,
        HealthModule,
        ServeStaticModule.forRoot({
          rootPath: resolve(__dirname, "../../owner-ui/dist"),
          exclude: [
            "/api/(.*)",
            "/build",
            "/mcp",
            "/health",
            "/docs",
            "/docs/(.*)",
            "/docs-json",
          ],
        }),
      ],
      controllers: [McpController],
      providers: [BootstrapService, AppExceptionFilter, RequestLoggingInterceptor],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
