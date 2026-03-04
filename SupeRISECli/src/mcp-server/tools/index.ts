/**
 * MCP Tools Index
 */

import type { ToolDefinition } from "../types";
import { balanceTools } from "./balance";
import { billingTools } from "./billing";
import { marketTools } from "./market";
export const tools: ToolDefinition[] = [
  ...balanceTools,    // market.user.get_balance, market.models.get_pricing
  ...billingTools,    // market.order.create
  ...marketTools,     // market.user.get_info, market.models.list
];
