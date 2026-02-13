import pc from "picocolors";
import { updateConfig } from "../../../utils/config.js";

export function clearFeeRateAction(): void {
  updateConfig({ feeRate: null });
  console.log(pc.green("feeRate cleared."));
}
