import { z } from "zod";

// Preliminary format guard for request validation only.
// Full chain-level validity (including checksum/script semantics) must be verified by chain adapters.
// Typical CKB addresses are long bech32 strings; 30..120 keeps obviously malformed payloads out
// without claiming full checksum/script correctness in this request-layer guard.
export const CKB_ADDRESS_PATTERN = /^ck[bt]1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{30,120}$/;

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
