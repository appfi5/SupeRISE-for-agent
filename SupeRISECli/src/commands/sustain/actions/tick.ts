/**
 * Tick Action
 *
 * --notify: after tick, push a summary to the OpenClaw agent session
 *           via `openclaw system event` so the user sees the report.
 */

import { tick } from "@/core/sustain/engine";
import { formatTick, buildTickSummary } from "../helpers";
import { sendSystemEvent } from "@/services/openclaw-cli";

export async function tickAction(options: {
  execute?: boolean;
  notify?: boolean;
  json?: boolean;
}): Promise<void> {
  try {
    const result = await tick(options.execute || false);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatTick(result));
    }

    if (options.notify) {
      const summary = buildTickSummary(result);
      const sent = await sendSystemEvent(summary);
      if (!sent) {
        console.error("⚠️  Failed to send report to OpenClaw session");
      }
    }
  } catch (error) {
    console.error("Tick failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
