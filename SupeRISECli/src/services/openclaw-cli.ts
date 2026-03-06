/**
 * OpenClaw CLI Integration
 *
 * Provides interface to OpenClaw CLI for model management and cron setup.
 */

import { spawn } from "child_process";
import { getCronSchedule, getConfigValue } from "@/core/sustain/config";

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

type CommandResult = {
  stdout: string;
  stderr: string;
};

function getOpenclawBin(): string {
  return "openclaw";
}

function runCommand(command: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const details = stderr.trim() || stdout.trim() || `exit code ${code ?? "unknown"}`;
      reject(new Error(details));
    });
  });
}

async function runOpenclaw(args: string[]): Promise<CommandResult> {
  return runCommand(getOpenclawBin(), args);
}

export async function openclawModelsStatus(): Promise<OpenClawModelStatus | null> {
  try {
    const { stdout } = await runOpenclaw(["models", "status", "--json"]);
    const data = JSON.parse(stdout);

    if (!data.model) {
      return null;
    }

    const [provider, model] = String(data.model).split("/");
    return {
      provider: provider || "",
      model: model || String(data.model),
      modelRef: String(data.model),
      imageModel: typeof data.imageModel === "string" ? data.imageModel : undefined,
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
    const args = ["models", "list", "--json"];
    if (options?.all) {
      args.push("--all");
    }
    if (options?.local) {
      args.push("--local");
    }
    if (options?.provider) {
      args.push("--provider", options.provider);
    }

    const { stdout } = await runOpenclaw(args);
    const data = JSON.parse(stdout);

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item: any) => {
      const ref = typeof item.ref === "string" ? item.ref : "";
      const [provider, model] = ref.split("/");
      return {
        ref,
        provider: provider || "",
        model: model || ref,
      };
    });
  } catch (error) {
    console.error("Failed to list OpenClaw models:", error);
    return [];
  }
}

export async function openclawModelsSet(modelRef: string): Promise<boolean> {
  try {
    await runOpenclaw(["models", "set", modelRef]);
    return true;
  } catch (error) {
    console.error(`Failed to set OpenClaw model to ${modelRef}:`, error);
    return false;
  }
}

export async function sendSystemEvent(text: string): Promise<boolean> {
  try {
    await runOpenclaw(["system", "event", "--text", text, "--mode", "now"]);
    return true;
  } catch {
    return false;
  }
}

export async function registerSustainCronJobs(): Promise<void> {
  const cronMode = getConfigValue("cronMode");
  const schedule = getCronSchedule();

  const cronJobs = [
    {
      name: "sustain-tick",
      every: schedule.tick,
      message: [
        "You are an autonomous agent. Run a keep-alive review now.",
        "1. Run `rise sustain health-check --json` and `rise sustain forecast --json`.",
        "2. If balance is healthy, do nothing.",
        "3. If balance is low, run `rise sustain list-models --json`, decide whether a cheaper `superise-market/...` model is worth switching to, and if needed run `rise sustain set-model <modelRef>`.",
        "4. Before topping up, inspect `rise sustain config get minTopUpCkb` and `rise sustain config get maxTopUpCkb`.",
        "5. If balance is critical, decide the top-up amount yourself within that configured range, then run `rise sustain top-up <amount>`.",
        "6. Use your own judgment. The CLI gives you capabilities, not decisions.",
        "7. Briefly announce important actions. Stay quiet if nothing needs to be done.",
      ].join(" "),
      description: "Sustain keep-alive: observe, decide, act, and report",
    },
    {
      name: "sustain-retry-orders",
      every: schedule.retryOrders,
      message: [
        "Run `rise sustain retry-orders --json` to check for pending top-up orders that need retry.",
        "If there are no pending orders, do not bother the user.",
        "If any orders have been escalated to manual review (manual_review), report full details to the user (orderId, txHash, amount) so they can intervene.",
      ].join(" "),
      description: "Retry pending top-up orders and escalate true failures",
    },
  ];

  const legacyJobs = ["sustain-report", "sustain-score-review"];
  const allJobNames = [...cronJobs.map((job) => job.name), ...legacyJobs];

  try {
    const { stdout } = await runOpenclaw(["cron", "list", "--json"]);
    const cronList = JSON.parse(stdout);
    const existingCrons = Array.isArray(cronList) ? cronList : (cronList.jobs || []);

    for (const name of allJobNames) {
      if (existingCrons.some((cron: any) => cron.name === name)) {
        await runOpenclaw(["cron", "rm", name]);
      }
    }
  } catch {
    // Ignore empty or unavailable cron state.
  }

  for (const job of cronJobs) {
    try {
      await runOpenclaw([
        "cron",
        "add",
        "--name",
        job.name,
        "--every",
        job.every,
        "--session",
        "main",
        "--message",
        job.message,
        "--announce",
        "--description",
        job.description,
      ]);
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
    await runOpenclaw(["--version"]);
    return true;
  } catch {
    return false;
  }
}
