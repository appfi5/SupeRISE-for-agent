/**
 * Plan Action
 */

import { plan } from "@/core/sustain/engine";
import { formatPlan } from "../helpers";

export async function planAction(options: { json?: boolean }): Promise<void> {
  try {
    const result = await plan();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatPlan(result));
    }
  } catch (error) {
    console.error("Planning failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
