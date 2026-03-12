import { z } from "zod";
import {
  messageEncodingSchema,
  nonNegativeIntegerStringSchema,
  privateKeyHexSchema,
  positiveIntegerStringSchema,
  transferStatusSchema,
  txStatusSchema,
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
  symbol: z.literal("ETH"),
});

export const ethereumBalanceUsdtSchema = z.object({
  chain: z.literal("ethereum"),
  asset: z.literal("USDT"),
  amount: nonNegativeIntegerStringSchema,
  decimals: z.literal(6),
  symbol: z.literal("USDT"),
});

export const ethereumBalanceUsdcSchema = z.object({
  chain: z.literal("ethereum"),
  asset: z.literal("USDC"),
  amount: nonNegativeIntegerStringSchema,
  decimals: z.literal(6),
  symbol: z.literal("USDC"),
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

export const ethereumTransferUsdcRequestSchema = z.object({
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

export const ethereumTransferUsdcResponseSchema = z.object({
  chain: z.literal("ethereum"),
  asset: z.literal("USDC"),
  operationId: z.string(),
  txHash: z.string(),
  status: transferStatusSchema,
});

export const ethereumTxStatusRequestSchema = z.object({
  txHash: z.string().min(1),
});

export const ethereumTxStatusResponseSchema = z.object({
  chain: z.literal("ethereum"),
  txHash: z.string(),
  status: txStatusSchema,
  blockNumber: nonNegativeIntegerStringSchema.optional(),
  blockHash: z.string().optional(),
  confirmations: nonNegativeIntegerStringSchema.optional(),
  reason: z.string().optional(),
});

export type EthereumAddressDto = z.infer<typeof ethereumAddressSchema>;
export type EthereumBalanceEthDto = z.infer<typeof ethereumBalanceEthSchema>;
export type EthereumBalanceUsdtDto = z.infer<typeof ethereumBalanceUsdtSchema>;
export type EthereumBalanceUsdcDto = z.infer<typeof ethereumBalanceUsdcSchema>;
export type EthereumDeriveAddressRequest = z.infer<typeof ethereumDeriveAddressRequestSchema>;
export type EthereumSignMessageRequest = z.infer<typeof ethereumSignMessageRequestSchema>;
export type EthereumSignMessageResponse = z.infer<typeof ethereumSignMessageResponseSchema>;
export type EthereumTransferEthRequest = z.infer<typeof ethereumTransferEthRequestSchema>;
export type EthereumTransferEthResponse = z.infer<typeof ethereumTransferEthResponseSchema>;
export type EthereumTransferUsdtRequest = z.infer<typeof ethereumTransferUsdtRequestSchema>;
export type EthereumTransferUsdtResponse = z.infer<typeof ethereumTransferUsdtResponseSchema>;
export type EthereumTransferUsdcRequest = z.infer<typeof ethereumTransferUsdcRequestSchema>;
export type EthereumTransferUsdcResponse = z.infer<typeof ethereumTransferUsdcResponseSchema>;
export type EthereumTxStatusRequest = z.infer<typeof ethereumTxStatusRequestSchema>;
export type EthereumTxStatusResponse = z.infer<typeof ethereumTxStatusResponseSchema>;
