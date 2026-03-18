import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BUILD_INFO } from "../build-info";
import { ok } from "../common/http/response";
import { BuildInfoDoc } from "../docs/openapi.models";
import { ApiEnvelopeOk } from "../docs/swagger";

@ApiTags("Build")
@Controller()
export class BuildController {
  @Get("build")
  @ApiOperation({ summary: "Get build metadata" })
  @ApiEnvelopeOk(BuildInfoDoc)
  build() {
    return ok(BUILD_INFO);
  }
}
