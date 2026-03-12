import { applyDecorators, type INestApplication, type Type } from "@nestjs/common";
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  DocumentBuilder,
  SwaggerModule,
  getSchemaPath,
} from "@nestjs/swagger";
import type { ReferenceObject, SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import {
  AuditLogDoc,
  ErrorPayloadDoc,
  HealthStatusDoc,
  OwnerCredentialStatusDoc,
  OwnerAssetLimitEntryDoc,
  OwnerAssetLimitUsageDoc,
  OwnerAssetLimitWindowUsageDoc,
  OwnerLoginRequestDoc,
  OwnerLoginResponseDoc,
  OwnerLogoutResponseDoc,
  OwnerRotateCredentialRequestDoc,
  OwnerUpdateAssetLimitRequestDoc,
  OwnerWalletExportRequestDoc,
  OwnerWalletExportResponseDoc,
  OwnerWalletPrivateKeyRequestDoc,
  RotatedResponseDoc,
  WalletCurrentDoc,
  WalletToolArgumentDoc,
  WalletToolCallRequestDoc,
  WalletToolCallResponseDoc,
  WalletToolCatalogItemDoc,
} from "./openapi.models";

type ModelClass = Type<unknown>;

const swaggerModels = [
  ErrorPayloadDoc,
  HealthStatusDoc,
  OwnerLoginRequestDoc,
  OwnerLoginResponseDoc,
  OwnerCredentialStatusDoc,
  OwnerAssetLimitWindowUsageDoc,
  OwnerAssetLimitUsageDoc,
  OwnerAssetLimitEntryDoc,
  OwnerRotateCredentialRequestDoc,
  OwnerUpdateAssetLimitRequestDoc,
  OwnerLogoutResponseDoc,
  OwnerWalletExportRequestDoc,
  OwnerWalletExportResponseDoc,
  OwnerWalletPrivateKeyRequestDoc,
  RotatedResponseDoc,
  WalletToolArgumentDoc,
  WalletToolCatalogItemDoc,
  WalletToolCallRequestDoc,
  WalletToolCallResponseDoc,
  WalletCurrentDoc,
  AuditLogDoc,
];

export function registerSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("SupeRISE Wallet Server")
    .setDescription(
      [
        "Owner mode and operational HTTP API for the single-wallet server.",
        "",
        "Agent integration uses MCP at `/mcp`.",
        "MCP is documented in the repository at `docs/mcp.md` and is not exposed as an interactive Swagger endpoint.",
      ].join("\n"),
    )
    .setVersion("0.2.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste the JWT access token returned by POST /api/owner/auth/login.",
      },
      "owner-jwt",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: swaggerModels,
  });

  SwaggerModule.setup("docs", app, document, {
    customSiteTitle: "SupeRISE Wallet Server Docs",
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

export function ApiEnvelopeBody(model: ModelClass) {
  return applyDecorators(ApiExtraModels(model), ApiBody({ type: model }));
}

export function ApiEnvelopeOk(
  model: ModelClass,
  options?: { description?: string; isArray?: boolean },
) {
  return applyDecorators(
    ApiExtraModels(ErrorPayloadDoc, model),
    ApiOkResponse({
      description: options?.description,
      schema: buildSuccessEnvelopeSchema(model, options?.isArray ?? false),
    }),
  );
}

export function ApiValidationErrorResponse(description = "Validation error") {
  return ApiBadRequestResponse({
    description,
    schema: buildFailureEnvelopeSchema(),
  });
}

export function ApiOwnerAuthResponses() {
  return applyDecorators(
    ApiBearerAuth("owner-jwt"),
    ApiUnauthorizedResponse({
      description: "A valid Owner Bearer token is required.",
      schema: buildFailureEnvelopeSchema(),
    }),
    ApiValidationErrorResponse(),
  );
}

export function ApiRpcFailureResponse() {
  return ApiBadGatewayResponse({
    description: "Chain RPC is unavailable.",
    schema: buildFailureEnvelopeSchema(),
  });
}

function buildSuccessEnvelopeSchema(
  model: ModelClass,
  isArray: boolean,
): SchemaObject {
  const dataSchema: ReferenceObject | SchemaObject = isArray
    ? {
        type: "array",
        items: { $ref: getSchemaPath(model) },
      }
    : { $ref: getSchemaPath(model) };

  return {
    type: "object",
    required: ["success", "data", "error"],
    properties: {
      success: {
        type: "boolean",
        enum: [true],
      },
      data: dataSchema,
      error: {
        type: "null",
        nullable: true,
        example: null,
      },
    },
  };
}

function buildFailureEnvelopeSchema(): SchemaObject {
  return {
    type: "object",
    required: ["success", "data", "error"],
    properties: {
      success: {
        type: "boolean",
        enum: [false],
      },
      data: {
        type: "null",
        nullable: true,
        example: null,
      },
      error: {
        $ref: getSchemaPath(ErrorPayloadDoc),
      },
    },
  };
}
