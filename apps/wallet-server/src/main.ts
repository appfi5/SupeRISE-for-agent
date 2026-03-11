import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppExceptionFilter, RequestLoggingInterceptor } from "./common/http";
import { createOwnerAuthContextMiddleware } from "./common/middleware/owner-auth-context.middleware";
import { registerSwagger } from "./docs/swagger";
import { loadWalletServerConfig } from "@superise/infrastructure";
import type { OwnerAuthService } from "@superise/application";
import { TOKENS } from "./tokens";

function isLocalOnlyHost(host: string): boolean {
  return host === "127.0.0.1" || host === "::1" || host === "localhost";
}

async function bootstrap() {
  const config = loadWalletServerConfig();
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule.register(config), {
    cors: false,
  });
  const ownerAuthService = app.get<OwnerAuthService>(TOKENS.OWNER_AUTH_SERVICE);

  app.use(createOwnerAuthContextMiddleware(ownerAuthService));

  app.useGlobalFilters(app.get(AppExceptionFilter));
  app.useGlobalInterceptors(app.get(RequestLoggingInterceptor));
  app.enableShutdownHooks();
  if (config.enableApiDocs) {
    registerSwagger(app);
  }
  if (!isLocalOnlyHost(config.host)) {
    logger.warn(
      "wallet-server is listening on a non-local host. MCP at /mcp allows unauthenticated wallet operations, so only expose this service to trusted networks.",
    );
  }

  await app.listen(config.port, config.host);
}

void bootstrap();
