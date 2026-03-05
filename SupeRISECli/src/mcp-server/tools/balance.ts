/**
 * Balance MCP Tools - Pure Market API Mapping
 * 
 * Direct wrappers around market platform APIs.
 * No business logic - just fetch balance and model pricing from platform.
 */

import type { ToolDefinition } from "../types";
import { getMarketClient } from "@/services/superise-market";

export const balanceTools: ToolDefinition[] = [
  {
    name: "market.user.get_balance",
    description: "Get current account balance from market platform. Returns raw balance amount, user name, and email. This is a pure API call - no health status calculation or threshold comparison.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      const client = getMarketClient();
      return await client.fetchBalance();
    },
  },
  {
    name: "market.models.get_pricing",
    description: "Get pricing information for all available AI models on the platform. Returns each model's short name, display name, provider, and price range (min/avg/max). Pure API call - no filtering or recommendations.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      const client = getMarketClient();
      const models = await client.fetchModels();
      return {
        models: models.map((m) => ({
          model: m.shortName,
          displayName: m.displayName,
          provider: m.provider,
          minPrice: m.minPrice,
          avgPrice: m.avgPrice,
          maxPrice: m.maxPrice,
          quotationCount: m.quotationCount,
        })),
        observedAt: new Date().toISOString(),
      };
    },
  },
];
