import { Body, Controller, Get, HttpCode, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  walletToolCallRequestSchema,
  type WalletToolCallRequest,
} from "@superise/app-contracts";
import {
  parseWithSchema,
  requireOwnerAuth,
  type RequestWithContext,
} from "../common/http/request";
import { ok } from "../common/http/response";
import {
  WalletToolCallRequestDoc,
  WalletToolCallResponseDoc,
  WalletToolCatalogItemDoc,
} from "../docs/openapi.models";
import {
  ApiEnvelopeBody,
  ApiEnvelopeOk,
  ApiOwnerAuthResponses,
} from "../docs/swagger";
import { WalletToolRegistryService } from "../modules/wallet-tools/wallet-tool-registry.service";

@ApiTags("Wallet Tools")
@Controller("api/wallet-tools")
export class WalletToolsController {
  constructor(private readonly walletToolRegistry: WalletToolRegistryService) {}

  @Get("catalog")
  @ApiOperation({ summary: "List wallet tools available through the HTTP gateway" })
  @ApiOwnerAuthResponses()
  @ApiEnvelopeOk(WalletToolCatalogItemDoc, { isArray: true })
  catalog(@Req() request: RequestWithContext) {
    requireOwnerAuth(request);
    return ok(this.walletToolRegistry.listCatalog());
  }

  @Post("call")
  @HttpCode(200)
  @ApiOperation({ summary: "Call a wallet tool through the HTTP gateway" })
  @ApiOwnerAuthResponses()
  @ApiEnvelopeBody(WalletToolCallRequestDoc)
  @ApiEnvelopeOk(WalletToolCallResponseDoc)
  async call(@Req() request: RequestWithContext, @Body() body: unknown) {
    requireOwnerAuth(request);
    const payload = parseWithSchema<WalletToolCallRequest>(walletToolCallRequestSchema, body);
    const result = await this.walletToolRegistry.call(payload.name, payload.arguments, {
      actorRole: "OWNER",
    });

    return ok({
      name: payload.name,
      result,
    });
  }
}
