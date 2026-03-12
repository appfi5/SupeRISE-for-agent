import { z } from "zod";
import { PRIVATE_KEY_HEX_PATTERN } from "@superise/shared";

export const privateKeyHexSchema = z
  .string()
  .trim()
  .regex(PRIVATE_KEY_HEX_PATTERN, "Private key must be a 32-byte hex string");

export const messageEncodingSchema = z.enum(["utf8", "hex"]).default("utf8");

export const transferStatusSchema = z.enum([
  "RESERVED",
  "SUBMITTED",
  "CONFIRMED",
  "FAILED",
]);

export const txStatusSchema = z.enum([
  "NOT_FOUND",
  "PENDING",
  "CONFIRMED",
  "FAILED",
]);

export const credentialStatusSchema = z.enum([
  "DEFAULT_PENDING_ROTATION",
  "ACTIVE",
]);

export const publicChainSchema = z.enum(["nervos", "ethereum"]);

export const supportedAssetSchema = z.enum([
  "CKB",
  "ETH",
  "USDT",
  "USDC",
]);

export const assetLimitWindowSchema = z.enum([
  "DAILY",
  "WEEKLY",
  "MONTHLY",
]);

export const nonNegativeIntegerStringSchema = z
  .string()
  .trim()
  .regex(
    /^(0|[1-9]\d*)$/,
    "Value must be a non-negative integer string in the asset's smallest unit",
  );

export const positiveIntegerStringSchema = z
  .string()
  .trim()
  .regex(
    /^[1-9]\d*$/,
    "Value must be a positive integer string in the asset's smallest unit",
  );
