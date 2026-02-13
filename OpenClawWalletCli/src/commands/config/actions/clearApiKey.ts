import pc from "picocolors";
import { updateConfig } from "../../../utils/config.js";

export function clearApiKeyAction(): void {
  updateConfig({ apiKey: undefined });
  console.log(pc.green("API key cleared."));
}
