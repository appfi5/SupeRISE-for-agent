/**
 * Sign Server API Service
 *
 * Integrates with the OpenClaw Wallet Server for signing CKB transactions.
 */

import { getConfig } from "../utils/config.js";
import type { SignService } from "../types/index.js";
import type { ccc } from "@ckb-ccc/shell";
import { JsonRpcTransformers } from "@ckb-ccc/shell/advancedBarrel";

const SIGN_SERVER_DEFAULT_BASE_URL = "http://127.0.0.1:18799";

/**
 * Get the sign server base URL from config or use default
 */
function getSignServerBaseUrl(): string {
  const config = getConfig();
  const signServerUrl = config.signServerUrl;

  if (!signServerUrl) {
    return SIGN_SERVER_DEFAULT_BASE_URL;
  }
  // Remove trailing slash if present
  return signServerUrl.replace(/\/$/, "");
}

/**
 * Make a request to sign server
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = getSignServerBaseUrl();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Sign server request failed: ${response.status} ${response.statusText}. ${errorText}`,
    );
  }

  const json = await response.json();

  // Check for API-level errors
  if (json.success === false) {
    throw new Error(`Sign server error: ${json.message || "Unknown error"}`);
  }

  return json as T;
}

/**
 * Sign a CKB transaction
 *
 * POST /api/sign/sign-ckb-transaction
 *
 * @param request - The signing request containing address and transaction content
 * @returns The signed transaction response with address and signed content
 */
export async function signCkbTransaction(
  address: string,
  content: ccc.Transaction,
): Promise<SignService.SignServerResponse> {
  const response = await request<SignService.SignCkbTransactionResponse>(
    "/api/v1/agent/sign/sign-ckb-transaction",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address,
        content: JSON.stringify(JsonRpcTransformers.transactionFrom(content)),
      }),
    },
  );

  if (!response.data) {
    throw new Error("Sign server returned null data");
  }

  return response.data;
}

/**
 * List all key configurations
 *
 * GET /api/v1/key-config/list
 *
 * @returns Array of key configuration items
 */
export async function getWallet(): Promise<SignService.KeyConfigListItem | null | undefined> {
  const response = await request<SignService.KeyConfigListResponse>(
    "/api/v1/agent/key-config/list",
    {
      method: "GET",
    },
  );

  if (!response.data) {
    return null;
  }

  return response.data[0]!;
}
