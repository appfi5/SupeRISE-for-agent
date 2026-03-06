import { z } from "zod";

export const importWalletSchema = z.object({
  name: z.string().min(1).max(64),
  privateKey: z.string().min(64),
});

export const signMessageSchema = z.object({
  message: z.string().min(1),
});

export const transferCkbSchema = z.object({
  toAddress: z.string().min(1),
  amountShannon: z.coerce.bigint().positive(),
});

export const walletIdParamSchema = z.object({
  walletId: z.string().min(1),
});

export function parse(schema, payload) {
  return schema.parse(payload);
}
