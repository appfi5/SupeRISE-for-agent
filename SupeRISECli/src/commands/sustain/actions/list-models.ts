/**
 * List Models Action
 */

import { getMarketClient } from "@/services/superise-market";
import { openclawModelsStatus } from "@/services/openclaw-cli";
import { formatModelsList } from "../helpers";

export async function listModelsAction(options: { json?: boolean }): Promise<void> {
  try {
    const client = getMarketClient();
    const models = await client.fetchModels();
    const status = await openclawModelsStatus();

    const result = {
      candidates: models.map((m) => ({
        model: m.shortName,
        modelRef: m.modelRef,
        displayName: m.displayName,
        provider: m.provider,
        minPrice: m.minPrice,
        avgPrice: m.avgPrice,
        quotationCount: m.quotationCount,
      })),
      currentModel: status?.model || null,
      currentModelRef: status?.modelRef || null,
      observedAt: new Date().toISOString(),
    };

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatModelsList(result));
    }
  } catch (error) {
    console.error("List models failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
