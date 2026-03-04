/**
 * Act Action
 */

import { act } from "@/core/sustain/engine";
import { formatAction } from "../helpers";

export async function actAction(
  planId: string,
  options: { dryRun?: boolean; json?: boolean }
): Promise<void> {
  try {
    const result = await act(planId, options.dryRun || false);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatAction(result));
    }
  } catch (error) {
    console.error("Action execution failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
