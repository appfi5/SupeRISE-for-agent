import pc from "picocolors";
import { updateConfig } from "@/utils/config";
import { promptText } from "@/utils/prompts";
import { parseFeeRate } from "../helps";

export async function setFeeRateAction(rate?: string): Promise<void> {
  let value = rate?.trim();
  if (!value) {
    value = await promptText("Fee rate (shannon per 1000 bytes)", "1000");
  }
  const parsed = parseFeeRate(value);
  updateConfig({ feeRate: parsed });
  console.log(pc.green(`feeRate set to ${parsed}.`));
}
