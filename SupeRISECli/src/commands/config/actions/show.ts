import pc from "picocolors";
import { formatConfigForDisplay } from "@/utils/formatter";
import { getConfig, getConfigPath } from "@/utils/config";

export function showConfigAction(): void {
  const current = getConfig();
  const display = formatConfigForDisplay(current);
  console.log(pc.dim(`Config file: ${getConfigPath()}`));
  console.log(JSON.stringify(display, null, 2));
}
