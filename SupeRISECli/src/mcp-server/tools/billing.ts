/**
 * Billing MCP Tools - Pure Market API Mapping
 * 
 * These tools are direct wrappers around market platform APIs.
 * No business logic, no validation, no policy checks.
 * Business logic belongs in `rise sustain` commands.
 */

import type { ToolDefinition } from "../types";
import type { PlatformResponse, CreateOrderVo } from "@/services/platform-types";
import { getAuthService } from "@/services/platform-auth";
import { getConfigValue } from "@/core/sustain/config";

export const billingTools: ToolDefinition[] = [
  {
    name: "market.order.create",
    description: "Create a top-up order on the market platform. Returns orderId, toAddress (platform receiving address), and exchangeAmount. This is a pure API call - no validation or business logic. After creating order, you need to transfer CKB to toAddress and submit the tx hash.",
    inputSchema: {
      type: "object",
      properties: {
        amountCKB: {
          type: "number",
          description: "Amount of CKB to top up",
        },
      },
      required: ["amountCKB"],
    },
    handler: async (args) => {
      const auth = getAuthService();
      const token = await auth.ensureToken();
      const fromAddress = await auth.getAddress();
      const baseUrl = getConfigValue("platformBaseUrl");

      const response = await fetch(`${baseUrl}/api/v1/order/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          fromAddress,
          currencyType: 2,
          amount: args.amountCKB,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.statusText}`);
      }

      const data: PlatformResponse<CreateOrderVo> = await response.json();
      if (!data.success) {
        throw new Error(`Failed to create order: ${data.message}`);
      }

      return {
        orderId: data.data.id,
        toAddress: data.data.toAddress,
        amountCKB: args.amountCKB,
        exchangeAmount: data.data.exchangeAmount,
      };
    },
  },
];
