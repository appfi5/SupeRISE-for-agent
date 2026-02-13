import pc from "picocolors";
import { updateConfig } from "../../../utils/config.js";
import { promptSecret } from "../../../utils/prompts.js";
import { parseApiKey } from "../helps.js";

export async function setApiKeyAction(key?: string): Promise<void> {
  let value = key?.trim();
  if (!value) {
    value = await promptSecret("API Key");
  }
  const parsed = parseApiKey(value);
  updateConfig({ apiKey: parsed });
  console.log(pc.green(`API key set.`));
}
