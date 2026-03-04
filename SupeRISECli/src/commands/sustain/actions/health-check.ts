/**
 * Health Check Action
 */

import { healthCheck } from "@/core/sustain/engine";
import { formatHealthCheck } from "../helpers";

export async function healthCheckAction(options: { json?: boolean }): Promise<void> {
  try {
    const result = await healthCheck();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatHealthCheck(result));
    }
  } catch (error) {
    console.error("Health check failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
