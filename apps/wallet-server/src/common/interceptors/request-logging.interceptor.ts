import {
  Inject,
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import type { Response } from "express";
import { Observable, tap } from "rxjs";
import type pino from "pino";
import { TOKENS } from "../../tokens";
import type { RequestWithContext } from "../http/request";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(@Inject(TOKENS.LOGGER) private readonly logger: pino.Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const response = context.switchToHttp().getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.info({
            requestId: request.requestId,
            module: "http",
            action: `${request.method} ${request.originalUrl}`,
            statusCode: response.statusCode,
            actorRole: request.ownerAuth ? "OWNER" : "AGENT",
            durationMs: Date.now() - start,
          });
        },
      }),
    );
  }
}
