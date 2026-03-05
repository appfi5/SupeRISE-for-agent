import pc from "picocolors";
import { updateConfig } from "@/utils/config";

export function clearApiKeyAction(): void {
  updateConfig({ apiKey: undefined });
  console.log(pc.green("API key cleared."));
}
