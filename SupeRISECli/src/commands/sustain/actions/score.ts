/**
 * Score Action
 */

import { getLatestScore, initDatabase } from "@/storage/sqlite-store";
import { formatScore } from "../helpers";

export async function scoreAction(options: { json?: boolean }): Promise<void> {
  try {
    await initDatabase();
    const result = getLatestScore();

    if (!result) {
      console.log("No scores recorded yet");
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatScore(result));
    }
  } catch (error) {
    console.error("Score retrieval failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
