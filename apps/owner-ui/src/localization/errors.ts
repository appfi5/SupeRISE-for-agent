import type { ErrorPayload } from "@superise/app-contracts";
import { ApiError } from "../api/client";
import type { TranslationKey } from "./catalog";

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

export function getLocalizedErrorMessage(
  error: unknown,
  t: Translate,
  fallbackKey: TranslationKey,
): string {
  if (!(error instanceof ApiError)) {
    return t(fallbackKey);
  }

  if (error.status === 401) {
    return t("toast.session_expired");
  }

  if (error.code === "ASSET_LIMIT_EXCEEDED") {
    const details = extractAssetLimitDetails(error.details);
    if (details) {
      return t("error.asset_limit_exceeded", {
        asset: details.asset,
        window: formatWindow(details.window, t),
      });
    }
  }

  const mappedKey = error.code ? ERROR_CODE_MESSAGES[error.code] : undefined;
  if (mappedKey) {
    return t(mappedKey);
  }

  if (error.status >= 500) {
    return t("error.request_failed");
  }

  if (error.reason === "server_non_json") {
    return t("error.server_non_json");
  }

  if (error.reason === "server_invalid_json") {
    return t("error.server_invalid_json");
  }

  return t(fallbackKey);
}

const ERROR_CODE_MESSAGES: Record<ErrorPayload["code"], TranslationKey> = {
  VALIDATION_ERROR: "error.validation",
  AUTH_ERROR: "error.auth",
  WALLET_NOT_FOUND: "error.wallet_not_found",
  WALLET_IMPORT_FAILED: "error.wallet_import_failed",
  WALLET_EXPORT_FAILED: "error.wallet_export_failed",
  VAULT_ERROR: "error.vault",
  DATABASE_UNAVAILABLE: "error.database_unavailable",
  CHAIN_UNAVAILABLE: "error.chain_unavailable",
  INSUFFICIENT_BALANCE: "error.insufficient_balance",
  TRANSFER_BUILD_FAILED: "error.transfer_build_failed",
  TRANSFER_BROADCAST_FAILED: "error.transfer_broadcast_failed",
  SIGN_MESSAGE_FAILED: "error.sign_message_failed",
  ASSET_LIMIT_EXCEEDED: "error.asset_limit_exceeded",
  ADDRESS_BOOK_CONTACT_NOT_FOUND: "error.address_book.contact_not_found",
  ADDRESS_BOOK_CONTACT_ALREADY_EXISTS: "error.address_book.contact_exists",
  ADDRESS_BOOK_CONTACT_EMPTY: "error.address_book.contact_empty",
  ADDRESS_BOOK_INVALID_NERVOS_ADDRESS: "error.address_book.invalid_nervos_address",
  ADDRESS_BOOK_INVALID_ETHEREUM_ADDRESS: "error.address_book.invalid_ethereum_address",
  ADDRESS_BOOK_ADDRESS_NOT_FOUND_FOR_CHAIN: "error.address_book.address_not_found_for_chain",
};

function extractAssetLimitDetails(details: unknown):
  | { asset: string; window: "DAILY" | "WEEKLY" | "MONTHLY" }
  | null {
  if (!details || typeof details !== "object" || !("limit" in details)) {
    return null;
  }

  const limit = (details as { limit?: unknown }).limit;
  if (!limit || typeof limit !== "object") {
    return null;
  }

  const asset = (limit as { asset?: unknown }).asset;
  const window = (limit as { window?: unknown }).window;
  if (
    typeof asset !== "string" ||
    (window !== "DAILY" && window !== "WEEKLY" && window !== "MONTHLY")
  ) {
    return null;
  }

  return {
    asset,
    window,
  };
}

function formatWindow(
  window: "DAILY" | "WEEKLY" | "MONTHLY",
  t: Translate,
): string {
  switch (window) {
    case "DAILY":
      return t("limits.window.day");
    case "WEEKLY":
      return t("limits.window.week");
    case "MONTHLY":
      return t("limits.window.month");
  }
}
