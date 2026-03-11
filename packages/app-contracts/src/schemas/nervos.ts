import { z } from "zod";
import {
  messageEncodingSchema,
  nonNegativeIntegerStringSchema,
  privateKeyHexSchema,
  positiveIntegerStringSchema,
  transferStatusSchema,
} from "./_common";

export const nervosAddressSchema = z.object({
  chain: z.literal("nervos"),
  address: z.string(),
});

export const nervosBalanceCkbSchema = z.object({
  chain: z.literal("nervos"),
  asset: z.literal("CKB"),
  amount: nonNegativeIntegerStringSchema,
  decimals: z.literal(8),
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
  signature: z.string(),
});

export const nervosTransferCkbRequestSchema = z.object({
  to: z.string().min(1),
  amount: positiveIntegerStringSchema,
});

export const nervosTransferCkbResponseSchema = z.object({
  chain: z.literal("nervos"),
  asset: z.literal("CKB"),
  operationId: z.string(),
  txHash: z.string(),
  status: transferStatusSchema,
});

export type NervosAddressDto = z.infer<typeof nervosAddressSchema>;
export type NervosBalanceCkbDto = z.infer<typeof nervosBalanceCkbSchema>;
export type NervosDeriveAddressRequest = z.infer<typeof nervosDeriveAddressRequestSchema>;
export type NervosSignMessageRequest = z.infer<typeof nervosSignMessageRequestSchema>;
export type NervosSignMessageResponse = z.infer<typeof nervosSignMessageResponseSchema>;
export type NervosTransferCkbRequest = z.infer<typeof nervosTransferCkbRequestSchema>;
export type NervosTransferCkbResponse = z.infer<typeof nervosTransferCkbResponseSchema>;
