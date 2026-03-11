import { Controller, Get, Inject, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { OwnerCredentialStatusQueryService } from "@superise/application";
import { requireOwnerAuth, type RequestWithContext } from "../common/http/request";
import { ok } from "../common/http/response";
import { OwnerCredentialStatusDoc } from "../docs/openapi.models";
import { ApiEnvelopeOk, ApiOwnerAuthResponses } from "../docs/swagger";
import { TOKENS } from "../tokens";

@ApiTags("Owner Credential")
@Controller("api/owner/credential")
export class OwnerCredentialController {
  constructor(
    @Inject(TOKENS.OWNER_CREDENTIAL_STATUS_QUERY_SERVICE)
    private readonly ownerCredentialStatusQueryService: OwnerCredentialStatusQueryService,
  ) {}

  @Get("status")
  @ApiOperation({ summary: "Get the current Owner credential status" })
  @ApiOwnerAuthResponses()
  @ApiEnvelopeOk(OwnerCredentialStatusDoc)
  async status(@Req() request: RequestWithContext) {
    requireOwnerAuth(request);
    return ok(await this.ownerCredentialStatusQueryService.execute());
  }
}
