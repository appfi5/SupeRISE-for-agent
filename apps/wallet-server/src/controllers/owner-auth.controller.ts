import { Body, Controller, HttpCode, Inject, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  ownerLoginRequestSchema,
  ownerRotateCredentialRequestSchema,
} from "@superise/app-contracts";
import type { OwnerAuthService } from "@superise/application";
import { parseWithSchema, requireOwnerAuth, type RequestWithContext } from "../common/http/request";
import { ok } from "../common/http/response";
import {
  OwnerLoginRequestDoc,
  OwnerLoginResponseDoc,
  OwnerLogoutResponseDoc,
  OwnerRotateCredentialRequestDoc,
  RotatedResponseDoc,
} from "../docs/openapi.models";
import {
  ApiEnvelopeBody,
  ApiEnvelopeOk,
  ApiOwnerAuthResponses,
  ApiValidationErrorResponse,
} from "../docs/swagger";
import { TOKENS } from "../tokens";

@ApiTags("Owner Auth")
@Controller("api/owner/auth")
export class OwnerAuthController {
  constructor(
    @Inject(TOKENS.OWNER_AUTH_SERVICE)
    private readonly ownerAuthService: OwnerAuthService,
  ) {}

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Log in to Owner mode" })
  @ApiEnvelopeBody(OwnerLoginRequestDoc)
  @ApiEnvelopeOk(OwnerLoginResponseDoc)
  @ApiValidationErrorResponse()
  async login(@Body() body: unknown) {
    const payload = parseWithSchema(ownerLoginRequestSchema, body);
    return ok(await this.ownerAuthService.login(payload.password));
  }

  @Post("logout")
  @HttpCode(200)
  @ApiOperation({ summary: "Log out from Owner mode" })
  @ApiEnvelopeOk(OwnerLogoutResponseDoc)
  async logout() {
    return ok({ loggedOut: true as const });
  }

  @Post("rotate-credential")
  @HttpCode(200)
  @ApiOperation({ summary: "Rotate the Owner credential" })
  @ApiOwnerAuthResponses()
  @ApiEnvelopeBody(OwnerRotateCredentialRequestDoc)
  @ApiEnvelopeOk(RotatedResponseDoc)
  async rotateCredential(@Req() request: RequestWithContext, @Body() body: unknown) {
    requireOwnerAuth(request);
    const payload = parseWithSchema(ownerRotateCredentialRequestSchema, body);
    const result = await this.ownerAuthService.rotateCredential(
      payload.currentPassword,
      payload.newPassword,
    );
    return ok(result);
  }
}
