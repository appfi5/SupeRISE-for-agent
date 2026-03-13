import { z } from "zod";
import { MCP_TOOL_NAMES } from "./mcp";

export const walletToolNameSchema = z.enum(MCP_TOOL_NAMES);

export const walletToolArgumentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["string", "object"]),
  required: z.boolean(),
  description: z.string().min(1),
});

export const walletToolCatalogItemSchema = z.object({
  name: walletToolNameSchema,
  description: z.string().min(1),
  arguments: z.array(walletToolArgumentSchema),
});

export const walletToolCallRequestSchema = z.object({
  name: walletToolNameSchema,
  arguments: z.record(z.unknown()).default({}),
});

export const walletToolCallResponseSchema = z.object({
  name: walletToolNameSchema,
  result: z.record(z.unknown()),
});

export type WalletToolName = z.infer<typeof walletToolNameSchema>;
export type WalletToolArgumentDto = z.infer<typeof walletToolArgumentSchema>;
export type WalletToolCatalogItemDto = z.infer<typeof walletToolCatalogItemSchema>;
export type WalletToolCallRequest = z.infer<typeof walletToolCallRequestSchema>;
export type WalletToolCallResponse = z.infer<typeof walletToolCallResponseSchema>;
