import pc from "picocolors";
import { updateConfig } from "@/utils/config";

export function clearFeeRateAction(): void {
  updateConfig({ feeRate: null });
  console.log(pc.green("feeRate cleared."));
}
