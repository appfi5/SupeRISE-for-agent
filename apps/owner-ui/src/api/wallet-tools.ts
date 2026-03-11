import type {
  McpToolName,
  WalletToolCallResponse,
  WalletToolCatalogItemDto,
} from "@superise/app-contracts";
import { request } from "./client";

export async function listWalletToolCatalog(): Promise<WalletToolCatalogItemDto[]> {
  return request<WalletToolCatalogItemDto[]>("/api/wallet-tools/catalog");
}

export async function callWalletTool<TResult extends Record<string, unknown>>(
  name: McpToolName,
  argumentsValue: Record<string, unknown> = {},
): Promise<TResult> {
  const response = await request<WalletToolCallResponse>("/api/wallet-tools/call", {
    method: "POST",
    body: JSON.stringify({
      name,
      arguments: argumentsValue,
    }),
  });

  return response.result as TResult;
}
