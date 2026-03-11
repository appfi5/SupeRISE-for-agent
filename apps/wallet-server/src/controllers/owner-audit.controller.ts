import { Controller, Get, Inject, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { AuditLogQueryService } from "@superise/application";
import { requireOwnerAuth, type RequestWithContext } from "../common/http/request";
import { ok } from "../common/http/response";
import { AuditLogDoc } from "../docs/openapi.models";
import { ApiEnvelopeOk, ApiOwnerAuthResponses } from "../docs/swagger";
import { TOKENS } from "../tokens";

@ApiTags("Owner Audit")
@Controller("api/owner")
export class OwnerAuditController {
  constructor(
    @Inject(TOKENS.AUDIT_LOG_QUERY_SERVICE)
    private readonly auditLogQueryService: AuditLogQueryService,
  ) {}

  @Get("audit-logs")
  @ApiOperation({ summary: "List recent audit logs" })
  @ApiOwnerAuthResponses()
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Maximum number of audit logs to return.",
    schema: { type: "integer", minimum: 1, default: 50 },
  })
  @ApiEnvelopeOk(AuditLogDoc, { isArray: true })
  async auditLogs(@Req() request: RequestWithContext, @Query("limit") limit?: string) {
    requireOwnerAuth(request);
    const parsedLimit = limit ? Number(limit) : 50;
    return ok(await this.auditLogQueryService.execute(parsedLimit));
  }
}
