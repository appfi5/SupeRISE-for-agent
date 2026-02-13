import pc from "picocolors";
import { updateConfig } from "../../../utils/config.js";

export function clearSignServerUrlAction(): void {
  updateConfig({ signServerUrl: undefined });
  console.log(pc.green("Sign server URL cleared."));
}
