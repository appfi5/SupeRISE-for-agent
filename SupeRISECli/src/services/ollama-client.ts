/**
 * LM Studio Client
 * 
 * Fetches real local LM Studio models via API
 */

export type LMStudioModel = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

export type LMStudioModelsResponse = {
  object: string;
  data: LMStudioModel[];
};

const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_BASE_URL || process.env.OLLAMA_BASE_URL || "http://localhost:1234";

export async function fetchLMStudioModels(): Promise<LMStudioModel[]> {
  try {
    const response = await fetch(`${LM_STUDIO_BASE_URL}/v1/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as LMStudioModelsResponse;
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch LM Studio models:", error);
    return [];
  }
}

export async function isLMStudioAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${LM_STUDIO_BASE_URL}/v1/models`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Legacy exports for backward compatibility
export const fetchOllamaModels = fetchLMStudioModels;
export const isOllamaAvailable = isLMStudioAvailable;
export type OllamaModel = LMStudioModel;
export type OllamaModelsResponse = LMStudioModelsResponse;
