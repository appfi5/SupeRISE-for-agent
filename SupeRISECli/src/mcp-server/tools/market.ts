/**
 * Market MCP Tools - Pure Platform API Mapping
 * 
 * These tools are direct 1:1 wrappers around market platform APIs.
 * Zero business logic - just expose the raw platform capabilities.
 * 
 * All business logic (validation, policy, orchestration) belongs in `rise sustain` commands.
 */

import type { ToolDefinition } from "../types";
import { getMarketClient } from "@/services/superise-market";

export const marketTools: ToolDefinition[] = [
  {
    name: "market.user.get_info",
    description: "Get user account information from market platform. Returns balance, userName, email, and observedAt timestamp. Pure API wrapper - no health status calculation.",
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
    name: "market.models.list",
    description: "List all available AI models with pricing from market platform. Returns model catalog with shortName, displayName, provider, and price range. Pure API wrapper - no filtering or recommendations.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      const client = getMarketClient();
      return await client.fetchModels();
    },
  },
];
