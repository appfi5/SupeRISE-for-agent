import { Body, Controller, Get, Inject, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  ownerWalletExportRequestSchema,
  ownerWalletImportRequestSchema,
} from "@superise/app-contracts";
import type {
  CurrentWalletQueryService,
  WalletExportService,
  WalletImportService,
} from "@superise/application";
import { parseWithSchema, requireOwnerAuth, type RequestWithContext } from "../common/http/request";
import { ok } from "../common/http/response";
import {
  OwnerWalletExportRequestDoc,
  OwnerWalletExportResponseDoc,
  OwnerWalletPrivateKeyRequestDoc,
  WalletCurrentDoc,
} from "../docs/openapi.models";
import {
  ApiEnvelopeBody,
  ApiEnvelopeOk,
  ApiOwnerAuthResponses,
} from "../docs/swagger";
import { TOKENS } from "../tokens";

@ApiTags("Owner Wallet")
@Controller("api/owner/wallet")
export class OwnerWalletController {
  constructor(
    @Inject(TOKENS.CURRENT_WALLET_QUERY_SERVICE)
    private readonly currentWalletQueryService: CurrentWalletQueryService,
    @Inject(TOKENS.WALLET_IMPORT_SERVICE)
    private readonly walletImportService: WalletImportService,
    @Inject(TOKENS.WALLET_EXPORT_SERVICE)
    private readonly walletExportService: WalletExportService,
  ) {}

  @Get("current")
  @ApiOperation({ summary: "Get the current wallet metadata" })
  @ApiOwnerAuthResponses()
  @ApiEnvelopeOk(WalletCurrentDoc)
  async current(@Req() request: RequestWithContext) {
    requireOwnerAuth(request);
    return ok(await this.currentWalletQueryService.execute());
  }

  @Post("import")
  @ApiOperation({ summary: "Import and replace the current wallet private key" })
  @ApiOwnerAuthResponses()
  @ApiEnvelopeBody(OwnerWalletPrivateKeyRequestDoc)
  @ApiEnvelopeOk(WalletCurrentDoc)
  async importWallet(@Req() request: RequestWithContext, @Body() body: unknown) {
    requireOwnerAuth(request);
    const payload = parseWithSchema(ownerWalletImportRequestSchema, body);
    return ok(
      await this.walletImportService.execute({
        privateKey: payload.privateKey,
        confirmed: payload.confirmed,
      }),
    );
  }

  @Post("export")
  @ApiOperation({ summary: "Export the current wallet private key" })
  @ApiOwnerAuthResponses()
  @ApiEnvelopeBody(OwnerWalletExportRequestDoc)
  @ApiEnvelopeOk(OwnerWalletExportResponseDoc)
  async exportWallet(@Req() request: RequestWithContext, @Body() body: unknown) {
    requireOwnerAuth(request);
    parseWithSchema(ownerWalletExportRequestSchema, body);
    return ok(await this.walletExportService.execute());
  }
}
