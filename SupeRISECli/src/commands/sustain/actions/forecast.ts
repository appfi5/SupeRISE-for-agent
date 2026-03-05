/**
 * Forecast Action
 */

import { forecast } from "@/core/sustain/engine";
import { formatForecast } from "../helpers";

export async function forecastAction(options: { json?: boolean }): Promise<void> {
  try {
    const result = await forecast();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatForecast(result));
    }
  } catch (error) {
    console.error("Forecast failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
