import { z } from "zod";
import {
  messageEncodingSchema,
  nonNegativeIntegerStringSchema,
  privateKeyHexSchema,
  positiveIntegerStringSchema,
  transferStatusSchema,
} from "./_common";

export const ethereumAddressSchema = z.object({
  chain: z.literal("ethereum"),
  address: z.string(),
});

export const ethereumBalanceEthSchema = z.object({
  chain: z.literal("ethereum"),
  asset: z.literal("ETH"),
  amount: nonNegativeIntegerStringSchema,
  decimals: z.literal(18),
});

export const ethereumBalanceUsdtSchema = z.object({
  chain: z.literal("ethereum"),
  asset: z.literal("USDT"),
  amount: nonNegativeIntegerStringSchema,
  decimals: z.literal(6),
});

export const ethereumDeriveAddressRequestSchema = z.object({
  privateKey: privateKeyHexSchema,
});

export const ethereumSignMessageRequestSchema = z.object({
  message: z.string().min(1),
  encoding: messageEncodingSchema,
});

export const ethereumSignMessageResponseSchema = z.object({
  chain: z.literal("ethereum"),
  signingAddress: z.string(),
  signature: z.string(),
});

export const ethereumTransferUsdtRequestSchema = z.object({
  to: z.string().min(1),
  amount: positiveIntegerStringSchema,
});

export const ethereumTransferEthRequestSchema = z.object({
  to: z.string().min(1),
  amount: positiveIntegerStringSchema,
});

export const ethereumTransferEthResponseSchema = z.object({
  chain: z.literal("ethereum"),
  asset: z.literal("ETH"),
  operationId: z.string(),
  txHash: z.string(),
  status: transferStatusSchema,
});

export const ethereumTransferUsdtResponseSchema = z.object({
  chain: z.literal("ethereum"),
  asset: z.literal("USDT"),
  operationId: z.string(),
  txHash: z.string(),
  status: transferStatusSchema,
});

export type EthereumAddressDto = z.infer<typeof ethereumAddressSchema>;
export type EthereumBalanceEthDto = z.infer<typeof ethereumBalanceEthSchema>;
export type EthereumBalanceUsdtDto = z.infer<typeof ethereumBalanceUsdtSchema>;
export type EthereumDeriveAddressRequest = z.infer<typeof ethereumDeriveAddressRequestSchema>;
export type EthereumSignMessageRequest = z.infer<typeof ethereumSignMessageRequestSchema>;
export type EthereumSignMessageResponse = z.infer<typeof ethereumSignMessageResponseSchema>;
export type EthereumTransferEthRequest = z.infer<typeof ethereumTransferEthRequestSchema>;
export type EthereumTransferEthResponse = z.infer<typeof ethereumTransferEthResponseSchema>;
export type EthereumTransferUsdtRequest = z.infer<typeof ethereumTransferUsdtRequestSchema>;
export type EthereumTransferUsdtResponse = z.infer<typeof ethereumTransferUsdtResponseSchema>;
