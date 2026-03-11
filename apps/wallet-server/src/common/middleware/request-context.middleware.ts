import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Response } from "express";
import { randomUUID } from "node:crypto";
import type { RequestWithContext } from "../http/request";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: RequestWithContext, response: Response, next: NextFunction): void {
    request.requestId = request.header("x-request-id") ?? randomUUID();
    response.setHeader("x-request-id", request.requestId);
    next();
  }
}
