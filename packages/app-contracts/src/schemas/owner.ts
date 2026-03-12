import { z } from "zod";
import {
  assetLimitWindowSchema,
  credentialStatusSchema,
  nonNegativeIntegerStringSchema,
  privateKeyHexSchema,
  publicChainSchema,
  supportedAssetSchema,
} from "./_common";

export const ownerLoginRequestSchema = z.object({
  password: z.string().min(8),
});

export const ownerLoginResponseSchema = z.object({
  credentialStatus: credentialStatusSchema,
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresInSeconds: z.number().int().positive(),
  expiresAt: z.string().datetime(),
});

export const ownerCredentialStatusSchema = z.object({
  credentialStatus: credentialStatusSchema,
});

export const ownerRotateCredentialRequestSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const ownerLogoutResponseSchema = z.object({
  loggedOut: z.literal(true),
});

export const ownerWalletImportRequestSchema = z.object({
  privateKey: privateKeyHexSchema,
  confirmed: z.literal(true),
});

export const ownerWalletExportRequestSchema = z.object({
  confirmed: z.literal(true),
});

export const ownerWalletExportResponseSchema = z.object({
  privateKey: z.string(),
});

const nullableLimitAmountSchema = nonNegativeIntegerStringSchema.nullable();

export const ownerAssetLimitWindowUsageSchema = z.object({
  window: assetLimitWindowSchema,
  limitAmount: nullableLimitAmountSchema,
  consumedAmount: nonNegativeIntegerStringSchema,
  reservedAmount: nonNegativeIntegerStringSchema,
  effectiveUsedAmount: nonNegativeIntegerStringSchema,
  remainingAmount: nullableLimitAmountSchema,
  resetsAt: z.string().datetime(),
});

export const ownerAssetLimitEntrySchema = z.object({
  chain: publicChainSchema,
  asset: supportedAssetSchema,
  decimals: z.number().int().nonnegative(),
  dailyLimit: nullableLimitAmountSchema,
  weeklyLimit: nullableLimitAmountSchema,
  monthlyLimit: nullableLimitAmountSchema,
  usage: z.object({
    daily: ownerAssetLimitWindowUsageSchema.extend({
      window: z.literal("DAILY"),
    }),
    weekly: ownerAssetLimitWindowUsageSchema.extend({
      window: z.literal("WEEKLY"),
    }),
    monthly: ownerAssetLimitWindowUsageSchema.extend({
      window: z.literal("MONTHLY"),
    }),
  }),
  updatedAt: z.string().datetime().nullable(),
  updatedBy: z.enum(["OWNER", "SYSTEM"]).nullable(),
});

export const ownerAssetLimitListResponseSchema = z.array(ownerAssetLimitEntrySchema);

export const ownerUpdateAssetLimitRequestSchema = z
  .object({
    dailyLimit: nullableLimitAmountSchema.optional(),
    weeklyLimit: nullableLimitAmountSchema.optional(),
    monthlyLimit: nullableLimitAmountSchema.optional(),
  })
  .refine(
    (value) =>
      value.dailyLimit !== undefined ||
      value.weeklyLimit !== undefined ||
      value.monthlyLimit !== undefined,
    "At least one limit field must be provided",
  );

export const ownerAssetLimitPathParamsSchema = z.object({
  chain: publicChainSchema,
  asset: supportedAssetSchema,
});

export type OwnerLoginRequest = z.infer<typeof ownerLoginRequestSchema>;
export type OwnerLoginResponse = z.infer<typeof ownerLoginResponseSchema>;
export type OwnerCredentialStatusDto = z.infer<typeof ownerCredentialStatusSchema>;
export type OwnerRotateCredentialRequest = z.infer<
  typeof ownerRotateCredentialRequestSchema
>;
export type OwnerWalletImportRequest = z.infer<
  typeof ownerWalletImportRequestSchema
>;
export type OwnerWalletExportRequest = z.infer<
  typeof ownerWalletExportRequestSchema
>;
export type OwnerWalletExportResponse = z.infer<
  typeof ownerWalletExportResponseSchema
>;
export type OwnerAssetLimitWindowUsageDto = z.infer<
  typeof ownerAssetLimitWindowUsageSchema
>;
export type OwnerAssetLimitEntryDto = z.infer<typeof ownerAssetLimitEntrySchema>;
export type OwnerAssetLimitListResponse = z.infer<
  typeof ownerAssetLimitListResponseSchema
>;
export type OwnerUpdateAssetLimitRequest = z.infer<
  typeof ownerUpdateAssetLimitRequestSchema
>;
export type OwnerAssetLimitPathParams = z.infer<
  typeof ownerAssetLimitPathParamsSchema
>;
