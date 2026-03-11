import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppExceptionFilter, RequestLoggingInterceptor } from "./common/http";
import { createOwnerAuthContextMiddleware } from "./common/middleware/owner-auth-context.middleware";
import { registerSwagger } from "./docs/swagger";
import { loadWalletServerConfig } from "@superise/infrastructure";
import type { OwnerAuthService } from "@superise/application";
import { TOKENS } from "./tokens";

async function bootstrap() {
  const config = loadWalletServerConfig();
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

  await app.listen(config.port, config.host);
}

void bootstrap();
