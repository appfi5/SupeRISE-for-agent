import { z } from "zod";
import { ERROR_CODES, type ErrorCode, type JsonValue } from "@superise/shared";
import {
  assetLimitWindowSchema,
  nonNegativeIntegerStringSchema,
  publicChainSchema,
  supportedAssetSchema,
} from "./schemas/_common";

export const errorCodeSchema = z.enum(ERROR_CODES);

export const assetLimitExceededDetailSchema = z.object({
  limit: z.object({
    chain: publicChainSchema,
    asset: supportedAssetSchema,
    window: assetLimitWindowSchema,
    limitAmount: nonNegativeIntegerStringSchema,
    usedAmount: nonNegativeIntegerStringSchema,
    requestedAmount: nonNegativeIntegerStringSchema,
    remainingAmount: nonNegativeIntegerStringSchema,
    resetsAt: z.string().datetime(),
  }),
});

export const errorPayloadSchema = z.object({
  code: errorCodeSchema,
  message: z.string(),
  details: z.unknown().optional(),
});

export type ErrorPayload = {
  code: ErrorCode;
  message: string;
  details?: JsonValue;
};

export type AssetLimitExceededDetail = z.infer<typeof assetLimitExceededDetailSchema>;
