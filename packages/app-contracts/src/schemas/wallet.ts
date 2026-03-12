import { z } from "zod";
import { errorCodeSchema } from "../errors";
import { supportedAssetSchema, transferStatusSchema } from "./_common";

export const walletCurrentSchema = z.object({
  walletFingerprint: z.string(),
  status: z.enum(["ACTIVE", "EMPTY"]),
  source: z.enum(["AUTO_GENERATED", "IMPORTED", "UNKNOWN"]),
});

export const operationStatusRequestSchema = z.object({
  operationId: z.string().min(1),
});

export const operationStatusResponseSchema = z.object({
  operationId: z.string(),
  chain: z.enum(["nervos", "ethereum"]),
  asset: supportedAssetSchema,
  status: transferStatusSchema,
  txHash: z.string().nullable().optional(),
  errorCode: errorCodeSchema.nullable().optional(),
  errorMessage: z.string().nullable().optional(),
});

export type WalletCurrentDto = z.infer<typeof walletCurrentSchema>;
export type OperationStatusRequest = z.infer<typeof operationStatusRequestSchema>;
export type OperationStatusResponse = z.infer<typeof operationStatusResponseSchema>;
