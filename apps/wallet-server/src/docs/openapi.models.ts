import { ApiProperty } from "@nestjs/swagger";
import { MCP_TOOL_NAMES } from "@superise/app-contracts";
import { ERROR_CODES } from "@superise/shared";

export class ErrorPayloadDoc {
  @ApiProperty({ enum: ERROR_CODES })
  code!: (typeof ERROR_CODES)[number];

  @ApiProperty()
  message!: string;

  @ApiProperty({
    required: false,
    nullable: true,
    type: () => Object,
    additionalProperties: true,
  })
  details?: Record<string, unknown> | null;
}

export class HealthStatusDoc {
  @ApiProperty({ enum: ["ok"] })
  status!: "ok";

  @ApiProperty({
    type: () => Object,
    example: {
      database: "ok",
    },
  })
  checks!: {
    database: "ok";
  };
}

export class OwnerLoginRequestDoc {
  @ApiProperty({ minLength: 8, example: "owner-password-123" })
  password!: string;
}

export class OwnerLoginResponseDoc {
  @ApiProperty({ enum: ["DEFAULT_PENDING_ROTATION", "ACTIVE"] })
  credentialStatus!: "DEFAULT_PENDING_ROTATION" | "ACTIVE";

  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ enum: ["Bearer"] })
  tokenType!: "Bearer";

  @ApiProperty({ example: 3600 })
  expiresInSeconds!: number;

  @ApiProperty({ example: "2026-03-09T09:00:00.000Z" })
  expiresAt!: string;
}

export class OwnerCredentialStatusDoc {
  @ApiProperty({ enum: ["DEFAULT_PENDING_ROTATION", "ACTIVE"] })
  credentialStatus!: "DEFAULT_PENDING_ROTATION" | "ACTIVE";
}

export class OwnerRotateCredentialRequestDoc {
  @ApiProperty({ minLength: 8 })
  currentPassword!: string;

  @ApiProperty({ minLength: 8 })
  newPassword!: string;
}

export class RotatedResponseDoc {
  @ApiProperty({ enum: [true] })
  rotated!: true;
}

export class OwnerLogoutResponseDoc {
  @ApiProperty({ enum: [true] })
  loggedOut!: true;
}

export class WalletCurrentDoc {
  @ApiProperty()
  walletFingerprint!: string;

  @ApiProperty({ enum: ["ACTIVE", "EMPTY"] })
  status!: "ACTIVE" | "EMPTY";

  @ApiProperty({ enum: ["AUTO_GENERATED", "IMPORTED", "UNKNOWN"] })
  source!: "AUTO_GENERATED" | "IMPORTED" | "UNKNOWN";
}

export class WalletToolArgumentDoc {
  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ["string", "object"] })
  type!: "string" | "object";

  @ApiProperty()
  required!: boolean;

  @ApiProperty()
  description!: string;
}

export class WalletToolCatalogItemDoc {
  @ApiProperty({ enum: MCP_TOOL_NAMES })
  name!: (typeof MCP_TOOL_NAMES)[number];

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: () => [WalletToolArgumentDoc] })
  arguments!: WalletToolArgumentDoc[];
}

export class WalletToolCallRequestDoc {
  @ApiProperty({ enum: MCP_TOOL_NAMES })
  name!: (typeof MCP_TOOL_NAMES)[number];

  @ApiProperty({
    type: () => Object,
    additionalProperties: true,
    default: {},
  })
  arguments!: Record<string, unknown>;
}

export class WalletToolCallResponseDoc {
  @ApiProperty({ enum: MCP_TOOL_NAMES })
  name!: (typeof MCP_TOOL_NAMES)[number];

  @ApiProperty({
    type: () => Object,
    additionalProperties: true,
  })
  result!: Record<string, unknown>;
}

export class OwnerWalletPrivateKeyRequestDoc {
  @ApiProperty({
    description: "32-byte secp256k1 private key in hex, with optional 0x prefix.",
    example:
      "0x4c0883a69102937d6231471b5dbb6204fe51296170827978d6ab2e5f3f6b6f8d",
  })
  privateKey!: string;

  @ApiProperty({
    enum: [true],
    description: "Must be true to confirm that the current wallet will be replaced.",
  })
  confirmed!: true;
}

export class OwnerWalletExportRequestDoc {
  @ApiProperty({ enum: [true] })
  confirmed!: true;
}

export class OwnerWalletExportResponseDoc {
  @ApiProperty()
  privateKey!: string;
}

export class OwnerAssetLimitWindowUsageDoc {
  @ApiProperty({ enum: ["DAILY", "WEEKLY", "MONTHLY"] })
  window!: "DAILY" | "WEEKLY" | "MONTHLY";

  @ApiProperty({ nullable: true, required: false })
  limitAmount!: string | null;

  @ApiProperty()
  consumedAmount!: string;

  @ApiProperty()
  reservedAmount!: string;

  @ApiProperty()
  effectiveUsedAmount!: string;

  @ApiProperty({ nullable: true, required: false })
  remainingAmount!: string | null;

  @ApiProperty()
  resetsAt!: string;
}

export class OwnerAssetLimitUsageDoc {
  @ApiProperty({ type: () => OwnerAssetLimitWindowUsageDoc })
  daily!: OwnerAssetLimitWindowUsageDoc;

  @ApiProperty({ type: () => OwnerAssetLimitWindowUsageDoc })
  weekly!: OwnerAssetLimitWindowUsageDoc;

  @ApiProperty({ type: () => OwnerAssetLimitWindowUsageDoc })
  monthly!: OwnerAssetLimitWindowUsageDoc;
}

export class OwnerAssetLimitEntryDoc {
  @ApiProperty({ enum: ["nervos", "ethereum"] })
  chain!: "nervos" | "ethereum";

  @ApiProperty({ enum: ["CKB", "ETH", "USDT", "USDC"] })
  asset!: "CKB" | "ETH" | "USDT" | "USDC";

  @ApiProperty()
  decimals!: number;

  @ApiProperty({ nullable: true, required: false })
  dailyLimit!: string | null;

  @ApiProperty({ nullable: true, required: false })
  weeklyLimit!: string | null;

  @ApiProperty({ nullable: true, required: false })
  monthlyLimit!: string | null;

  @ApiProperty({ type: () => OwnerAssetLimitUsageDoc })
  usage!: OwnerAssetLimitUsageDoc;

  @ApiProperty({ nullable: true, required: false })
  updatedAt!: string | null;

  @ApiProperty({ enum: ["OWNER", "SYSTEM"], nullable: true, required: false })
  updatedBy!: "OWNER" | "SYSTEM" | null;
}

export class OwnerUpdateAssetLimitRequestDoc {
  @ApiProperty({ required: false, nullable: true })
  dailyLimit?: string | null;

  @ApiProperty({ required: false, nullable: true })
  weeklyLimit?: string | null;

  @ApiProperty({ required: false, nullable: true })
  monthlyLimit?: string | null;
}

export class AuditLogDoc {
  @ApiProperty()
  auditId!: string;

  @ApiProperty({ enum: ["AGENT", "OWNER", "SYSTEM"] })
  actorRole!: "AGENT" | "OWNER" | "SYSTEM";

  @ApiProperty()
  action!: string;

  @ApiProperty({ enum: ["SUCCESS", "FAILED"] })
  result!: "SUCCESS" | "FAILED";

  @ApiProperty({ type: () => Object, additionalProperties: true })
  metadata!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: string;
}
