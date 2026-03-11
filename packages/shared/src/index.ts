import { createHash, randomUUID } from "node:crypto";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "AUTH_ERROR",
  "WALLET_NOT_FOUND",
  "WALLET_IMPORT_FAILED",
  "WALLET_EXPORT_FAILED",
  "VAULT_ERROR",
  "DATABASE_UNAVAILABLE",
  "CHAIN_UNAVAILABLE",
  "INSUFFICIENT_BALANCE",
  "TRANSFER_BUILD_FAILED",
  "TRANSFER_BROADCAST_FAILED",
  "SIGN_MESSAGE_FAILED",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];
export const PRIVATE_KEY_HEX_PATTERN = /^(0x)?[0-9a-fA-F]{64}$/;

export function nowIso(): string {
  return new Date().toISOString();
}

export function createPrefixedId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createWalletFingerprint(privateKey: string): string {
  return `wlt_${sha256Hex(normalizePrivateKeyHex(privateKey)).slice(0, 16)}`;
}

export function ensure0xHex(value: string): `0x${string}` {
  const normalized = value.startsWith("0x") ? value : `0x${value}`;
  return normalized as `0x${string}`;
}

export function normalizePrivateKeyHex(value: string): `0x${string}` {
  const trimmed = value.trim();
  if (!PRIVATE_KEY_HEX_PATTERN.test(trimmed)) {
    throw new Error("Private key must be a 32-byte hex string");
  }

  const normalized = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  return `0x${normalized.toLowerCase()}` as `0x${string}`;
}

export function decodeMessage(
  message: string,
  encoding: "utf8" | "hex",
): string | Uint8Array {
  if (encoding === "hex") {
    const normalized = message.startsWith("0x") ? message.slice(2) : message;
    return Uint8Array.from(Buffer.from(normalized, "hex"));
  }

  return message;
}

export function serializeJson(value: unknown): string {
  return JSON.stringify(value);
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}

export function readRequired(value: string | undefined, field: string): string {
  if (!value) {
    throw new Error(`${field} is required`);
  }
  return value;
}
