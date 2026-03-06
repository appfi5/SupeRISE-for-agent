import { openclawModelsSet, openclawModelsStatus } from "@/services/openclaw-cli";

export async function setModelAction(
  modelRef: string,
  options: { json?: boolean },
): Promise<void> {
  try {
    const success = await openclawModelsSet(modelRef);
    if (!success) {
      throw new Error(`Failed to switch model to ${modelRef}`);
    }

    const status = await openclawModelsStatus();
    const result = {
      success: true,
      requestedModelRef: modelRef,
      currentModelRef: status?.modelRef ?? modelRef,
      currentModel: status?.model ?? null,
      provider: status?.provider ?? null,
      observedAt: new Date().toISOString(),
    };

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`Switched model to: ${result.currentModelRef}`);
  } catch (error) {
    console.error("Set model failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
