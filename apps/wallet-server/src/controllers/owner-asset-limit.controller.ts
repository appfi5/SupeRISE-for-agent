import { Body, Controller, Get, Inject, Param, Put, Req } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import {
  ownerAssetLimitPathParamsSchema,
  ownerUpdateAssetLimitRequestSchema,
} from "@superise/app-contracts";
import {
  AssetLimitService,
  getSupportedAssetLimitTargetFromPublic,
} from "@superise/application";
import { WalletDomainError } from "@superise/domain";
import { parseWithSchema, requireOwnerAuth, type RequestWithContext } from "../common/http/request";
import { ok } from "../common/http/response";
import {
  OwnerAssetLimitEntryDoc,
  OwnerUpdateAssetLimitRequestDoc,
} from "../docs/openapi.models";
import {
  ApiEnvelopeBody,
  ApiEnvelopeOk,
  ApiOwnerAuthResponses,
} from "../docs/swagger";
import { TOKENS } from "../tokens";

@ApiTags("Owner Asset Limits")
@Controller("api/owner/asset-limits")
export class OwnerAssetLimitController {
  constructor(
    @Inject(TOKENS.ASSET_LIMIT_SERVICE)
    private readonly assetLimitService: AssetLimitService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the current per-asset limit configuration and usage" })
  @ApiOwnerAuthResponses()
  @ApiEnvelopeOk(OwnerAssetLimitEntryDoc, { isArray: true })
  async list(@Req() request: RequestWithContext) {
    requireOwnerAuth(request);
    return ok(await this.assetLimitService.listForOwner());
  }

  @Put(":chain/:asset")
  @ApiOperation({ summary: "Update the per-asset limit configuration for one asset" })
  @ApiOwnerAuthResponses()
  @ApiParam({ name: "chain", enum: ["nervos", "ethereum"] })
  @ApiParam({ name: "asset", enum: ["CKB", "ETH", "USDT", "USDC"] })
  @ApiEnvelopeBody(OwnerUpdateAssetLimitRequestDoc)
  @ApiEnvelopeOk(OwnerAssetLimitEntryDoc)
  async update(
    @Req() request: RequestWithContext,
    @Param() params: unknown,
    @Body() body: unknown,
  ) {
    requireOwnerAuth(request);

    const parsedParams = parseWithSchema(ownerAssetLimitPathParamsSchema, params);
    const payload = parseWithSchema(ownerUpdateAssetLimitRequestSchema, body);
    const target = getSupportedAssetLimitTargetFromPublic(
      parsedParams.chain,
      parsedParams.asset,
    );

    if (!target) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `Unsupported asset limit target: ${parsedParams.chain}/${parsedParams.asset}`,
      );
    }

    return ok(
      await this.assetLimitService.updatePolicy({
        chain: target.chain,
        asset: target.asset,
        dailyLimit: payload.dailyLimit,
        weeklyLimit: payload.weeklyLimit,
        monthlyLimit: payload.monthlyLimit,
        updatedBy: "OWNER",
      }),
    );
  }
}
