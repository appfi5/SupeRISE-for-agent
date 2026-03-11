import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import { apiFailure } from "@superise/app-contracts";
import { WalletDomainError } from "@superise/domain";
import { toErrorMessage } from "@superise/shared";

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof WalletDomainError) {
      response
        .status(mapErrorStatus(exception.code))
        .json(apiFailure({ code: exception.code, message: exception.message }));
      return;
    }

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(
        apiFailure({
          code: "VALIDATION_ERROR",
          message: toErrorMessage(exception.getResponse()),
        }),
      );
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      apiFailure({
        code: "VALIDATION_ERROR",
        message: toErrorMessage(exception),
      }),
    );
  }
}

function mapErrorStatus(code: WalletDomainError["code"]): number {
  switch (code) {
    case "AUTH_ERROR":
      return HttpStatus.UNAUTHORIZED;
    case "WALLET_NOT_FOUND":
      return HttpStatus.NOT_FOUND;
    case "CHAIN_UNAVAILABLE":
      return HttpStatus.BAD_GATEWAY;
    case "DATABASE_UNAVAILABLE":
      return HttpStatus.SERVICE_UNAVAILABLE;
    case "VALIDATION_ERROR":
      return HttpStatus.BAD_REQUEST;
    default:
      return HttpStatus.BAD_REQUEST;
  }
}
