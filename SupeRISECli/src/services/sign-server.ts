/**
 * Sign Server API Service
 *
 * Integrates with the OpenClaw Wallet Server for signing CKB and ETH/USDC transactions.
 */

import { getConfig } from "@/utils/config";
import type { SignService } from "../types/index";
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
 * Sign a message
 *
 * POST /api/v1/agent/sign/sign-message
 * Request:  { address: string, message: string }
 * Response: { address: string, signature: string }
 *
 * The address is the wallet address from key-config/list (same as `rise whoami`).
 *
 * @param message - The message to sign
 * @returns Object containing the signature
 */
export async function signMessage(
  message: string,
): Promise<{ signature: string }> {
  const wallet = await getWallet();
  if (!wallet) {
    throw new Error("No wallet configured. Cannot sign message without address.");
  }

  const response = await request<SignService.SignServerResponseData<{ address: string; signature: string }>>(
    "/api/v1/agent/sign/sign-message",
    {
      method: "POST",
      body: JSON.stringify({ address: wallet.address, message }),
    },
  );

  if (!response.data) {
    throw new Error("Sign server returned null data for sign-message");
  }

  return response.data;
}

/**
 * Sign an ETH or USDC transaction.
 *
 * POST /api/v1/agent/sign/sign-eth-transaction
 *
 * The `content` field is a JSON-serialised {@link SignService.EthUnsignedTransaction}.
 *
 * For a plain ETH transfer, set `data` to "0x".
 * For a USDC (ERC-20) transfer, ABI-encode the `transfer(address,uint256)`
 * call and set it as `data`.
 *
 * @param address - The ETH wallet address to sign with
 * @param tx      - The unsigned transaction
 * @returns Signed transaction hex and its hash
 */
export async function signEthTransaction(
  address: string,
  tx: SignService.EthUnsignedTransaction,
): Promise<SignService.SignEthTransactionResponse> {
  const response = await request<SignService.SignEthTransactionServerResponse>(
    "/api/v1/agent/sign/sign-eth-transaction",
    {
      method: "POST",
      body: JSON.stringify({
        address,
        content: JSON.stringify({ ...tx, data: tx.data ?? "0x" }),
      }),
    },
  );

  if (!response.data) {
    throw new Error("Sign server returned null data for sign-eth-transaction");
  }

  return response.data;
}

/**
 * Get wallet info (address, publicKey) from sign server.
 *
 * GET /api/v1/agent/key-config/list → data[0]
 *
 * @returns First key config item containing address and publicKey, or null
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
