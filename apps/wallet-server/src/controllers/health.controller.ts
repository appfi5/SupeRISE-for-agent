import { Controller, Get, Inject } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { RuntimeHealthCheckService } from "@superise/application";
import { ok } from "../common/http/response";
import { ApiEnvelopeOk } from "../docs/swagger";
import { HealthStatusDoc } from "../docs/openapi.models";
import { TOKENS } from "../tokens";

@ApiTags("Health")
@Controller()
export class HealthController {
  constructor(
    @Inject(TOKENS.RUNTIME_HEALTH_CHECK_SERVICE)
    private readonly runtimeHealthCheckService: RuntimeHealthCheckService,
  ) {}

  @Get("health")
  @ApiOperation({ summary: "Check runtime health" })
  @ApiEnvelopeOk(HealthStatusDoc)
  async health() {
    return ok(await this.runtimeHealthCheckService.execute());
  }
}
