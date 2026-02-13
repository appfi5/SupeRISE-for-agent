import pc from "picocolors";
import { updateConfig } from "../../../utils/config.js";
import { promptText } from "../../../utils/prompts.js";
import { parseSignServerUrl } from "../helps.js";

export async function setSignServerUrlAction(url?: string): Promise<void> {
  let value = url?.trim();
  if (!value) {
    value = await promptText("Sign server URL");
  }
  const parsed = parseSignServerUrl(value);
  updateConfig({ signServerUrl: parsed });
  console.log(pc.green(`Sign server URL set to ${pc.bold(parsed)}`));
}
