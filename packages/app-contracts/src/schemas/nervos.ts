import { z } from "zod";
import {
  nonNegativeIntegerStringSchema,
  messageEncodingSchema,
  privateKeyHexSchema,
  positiveIntegerStringSchema,
  transferTargetTypeSchema,
  transferStatusSchema,
  txStatusSchema,
} from "./_common";

export const nervosIdentitySchema = z.object({
  chain: z.literal("nervos"),
  address: z.string(),
  publicKey: z.string(),
});

export const nervosBalanceCkbSchema = z.object({
  chain: z.literal("nervos"),
  asset: z.literal("CKB"),
  amount: nonNegativeIntegerStringSchema,
  decimals: z.literal(8),
  symbol: z.literal("CKB"),
});

export const nervosDeriveAddressRequestSchema = z.object({
  privateKey: privateKeyHexSchema,
});

export const nervosSignMessageRequestSchema = z.object({
  message: z.string().min(1),
  encoding: messageEncodingSchema,
});

export const nervosSignMessageResponseSchema = z.object({
  chain: z.literal("nervos"),
  signingAddress: z.string(),
  publicKey: z.string(),
  signature: z.string(),
});

export const nervosTransferCkbRequestSchema = z.object({
  to: z.string().min(1),
  toType: transferTargetTypeSchema,
  amount: positiveIntegerStringSchema,
});

export const nervosTransferCkbResponseSchema = z.object({
  chain: z.literal("nervos"),
  asset: z.literal("CKB"),
  operationId: z.string(),
  txHash: z.string(),
  status: transferStatusSchema,
  toType: transferTargetTypeSchema,
  contactName: z.string().trim().min(1).optional(),
  resolvedAddress: z.string().trim().min(1),
});

export const nervosTxStatusRequestSchema = z.object({
  txHash: z.string().min(1),
});

export const nervosTxStatusResponseSchema = z.object({
  chain: z.literal("nervos"),
  txHash: z.string(),
  status: txStatusSchema,
  blockNumber: nonNegativeIntegerStringSchema.optional(),
  blockHash: z.string().optional(),
  confirmations: nonNegativeIntegerStringSchema.optional(),
  reason: z.string().optional(),
});

export const nervosAddressSchema = nervosIdentitySchema;

export type NervosIdentityDto = z.infer<typeof nervosIdentitySchema>;
export type NervosAddressDto = NervosIdentityDto;
export type NervosBalanceCkbDto = z.infer<typeof nervosBalanceCkbSchema>;
export type NervosDeriveAddressRequest = z.infer<typeof nervosDeriveAddressRequestSchema>;
export type NervosSignMessageRequest = z.infer<typeof nervosSignMessageRequestSchema>;
export type NervosSignMessageResponse = z.infer<typeof nervosSignMessageResponseSchema>;
export type NervosTransferCkbRequest = z.infer<typeof nervosTransferCkbRequestSchema>;
export type NervosTransferCkbResponse = z.infer<typeof nervosTransferCkbResponseSchema>;
export type NervosTxStatusRequest = z.infer<typeof nervosTxStatusRequestSchema>;
export type NervosTxStatusResponse = z.infer<typeof nervosTxStatusResponseSchema>;
