import { Global, Inject, Module } from "@nestjs/common";
import pino from "pino";
import { TOKENS } from "../tokens";

@Global()
@Module({
  providers: [
    {
      provide: TOKENS.LOGGER,
      useFactory: () =>
        pino({
          level: process.env.LOG_LEVEL ?? "info",
          base: undefined,
        }),
    },
  ],
  exports: [TOKENS.LOGGER],
})
export class LoggingModule {}
