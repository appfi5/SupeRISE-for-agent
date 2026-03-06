import { z } from "zod";

export const CKB_ADDRESS_PATTERN = /^ck[bt]1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{20,}$/;

export const importWalletSchema = z.object({
  name: z.string().min(1).max(64),
  privateKey: z.string().min(64),
});

export const signMessageSchema = z.object({
  message: z.string().min(1),
});

export const transferCkbSchema = z.object({
  toAddress: z.string().min(1).regex(CKB_ADDRESS_PATTERN, "Invalid CKB address format"),
  amountShannon: z.coerce.bigint().positive(),
});

export const walletIdParamSchema = z.object({
  walletId: z.string().min(1),
});

export function parse(schema, payload) {
  return schema.parse(payload);
}
