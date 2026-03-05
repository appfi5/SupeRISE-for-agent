/**
 * OpenClaw CLI Integration
 * 
 * Provides interface to OpenClaw CLI for model management and provider detection.
 * See: https://docs.openclaw.ai/concepts/models#cli-commands
 */

import { exec } from "child_process";
import { promisify } from "util";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getCronSchedule, getConfigValue } from "@/core/sustain/config";

const execAsync = promisify(exec);

export type OpenClawModelStatus = {
  provider: string;
  model: string;
  modelRef: string;
  imageModel?: string;
};

export type OpenClawModelInfo = {
  ref: string;
  provider: string;
  model: string;
};

export async function resolveOpenclawBin(): Promise<string> {
  try {
    const { stdout } = await execAsync("which openclaw");
    return stdout.trim() || "openclaw";
  } catch {
    return "openclaw";
  }
}

export async function openclawModelsStatus(): Promise<OpenClawModelStatus | null> {
  try {
    const bin = await resolveOpenclawBin();
    const { stdout } = await execAsync(`${bin} models status --json`);
    const data = JSON.parse(stdout);
    
    if (!data.model) {
      return null;
    }

    const [provider, model] = data.model.split("/");
    return {
      provider: provider || "",
      model: model || data.model,
      modelRef: data.model,
      imageModel: data.imageModel,
    };
  } catch (error) {
    console.error("Failed to get OpenClaw model status:", error);
    return null;
  }
}

export async function openclawModelsList(options?: {
  all?: boolean;
  local?: boolean;
  provider?: string;
}): Promise<OpenClawModelInfo[]> {
  try {
    const bin = await resolveOpenclawBin();
    const flags: string[] = ["--json"];
    
    if (options?.all) flags.push("--all");
    if (options?.local) flags.push("--local");
    if (options?.provider) flags.push(`--provider ${options.provider}`);

    const { stdout } = await execAsync(`${bin} models list ${flags.join(" ")}`);
    const data = JSON.parse(stdout);
    
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item: any) => {
      const [provider, model] = item.ref?.split("/") || ["", item.ref || ""];
      return {
        ref: item.ref || "",
        provider: provider || "",
        model: model || item.ref || "",
      };
    });
  } catch (error) {
    console.error("Failed to list OpenClaw models:", error);
    return [];
  }
}

export async function openclawModelsSet(modelRef: string): Promise<boolean> {
  try {
    const bin = await resolveOpenclawBin();
    await execAsync(`${bin} models set ${modelRef}`);
    return true;
  } catch (error) {
    console.error(`Failed to set OpenClaw model to ${modelRef}:`, error);
    return false;
  }
}

/**
 * Send a system event to the OpenClaw agent session.
 * The agent will process this event and display it to the user.
 */
export async function sendSystemEvent(text: string): Promise<boolean> {
  try {
    const bin = await resolveOpenclawBin();
    await execAsync(`${bin} system event --text ${JSON.stringify(text)} --mode now`);
    return true;
  } catch {
    return false;
  }
}

export async function registerSustainCronJobs(): Promise<void> {
  const bin = await resolveOpenclawBin();
  
  const cronMode = getConfigValue("cronMode");
  const schedule = getCronSchedule();

  const cronJobs = [
    {
      name: "sustain-tick",
      every: schedule.tick,
      message: [
        "You are an autonomous agent. Execute a keep-alive self-check now.",
        "1. Run `rise sustain tick --execute --json`.",
        "2. Decide autonomously based on the result: if balance is healthy, do nothing; if low, switch to a cheaper model; if critical, top up immediately or switch model first then top up.",
        "3. You have full decision-making authority — execute `rise sustain top-up` or switch models without asking the user.",
        "4. After acting, briefly announce your status and any actions taken. If everything is normal, no need to bother the user.",
      ].join(" "),
      description: "Sustain keep-alive: autonomous observe → decide → act → report",
    },
    {
      name: "sustain-retry-orders",
      every: schedule.retryOrders,
      message: [
        "Run `rise sustain retry-orders --json` to check for pending top-up orders that need retry.",
        "If there are no pending orders, do not bother the user.",
        "If any orders have been escalated to manual review (manual_review), report full details to the user (orderId, txHash, amount) so they can intervene.",
      ].join(" "),
      description: "Retry pending top-up orders, escalate failures to user",
    },
  ];

  // Clean up legacy + current jobs before re-registering
  const legacyJobs = ["sustain-report", "sustain-score-review"];
  const allJobNames = [...cronJobs.map(j => j.name), ...legacyJobs];

  try {
    const { stdout } = await execAsync(`${bin} cron list --json`);
    const cronList = JSON.parse(stdout);
    const existingCrons = Array.isArray(cronList) ? cronList : (cronList.jobs || []);

    for (const name of allJobNames) {
      if (existingCrons.some((c: any) => c.name === name)) {
        await execAsync(`${bin} cron rm ${name}`);
      }
    }
  } catch {
    // cron list may fail if no jobs exist, ignore
  }

  for (const job of cronJobs) {
    try {
      await execAsync(
        `${bin} cron add` +
        ` --name ${JSON.stringify(job.name)}` +
        ` --every ${job.every}` +
        ` --session main` +
        ` --message ${JSON.stringify(job.message)}` +
        ` --announce` +
        ` --description ${JSON.stringify(job.description)}`
      );
      console.log(`✓ Registered: ${job.name} (every ${job.every})`);
    } catch (error) {
      console.error(`Failed to register ${job.name}:`, error);
    }
  }

  const modeLabel = cronMode === "dev" ? "Development" : "Production";
  console.log(`\n${modeLabel} Mode — Tick: every ${schedule.tick}, Retry Orders: every ${schedule.retryOrders}`);
}

export async function checkOpenClawAvailable(): Promise<boolean> {
  try {
    const bin = await resolveOpenclawBin();
    await execAsync(`${bin} --version`);
    return true;
  } catch {
    return false;
  }
}
