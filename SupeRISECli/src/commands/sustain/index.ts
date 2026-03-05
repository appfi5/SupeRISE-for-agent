/**
 * Sustain Command Registration
 * 
 * Registers all sustain-related CLI commands.
 */

import { Command, InvalidArgumentError } from "commander";
import { healthCheckAction } from "./actions/health-check";
import { forecastAction } from "./actions/forecast";
import { planAction } from "./actions/plan";
import { actAction } from "./actions/act";
import { tickAction } from "./actions/tick";
import { scoreAction } from "./actions/score";
import { setupAction } from "./actions/setup";
import { listModelsAction } from "./actions/list-models";
import { mcpServerAction } from "./actions/mcp-server";
import { sendReportAction } from "./actions/send-report";
import { sendScoreReportAction } from "./actions/send-score-report";
import { topUpAction } from "./actions/top-up";
import { retryOrdersAction } from "./actions/retry-orders";
import {
  configShowAction,
  configGetAction,
  configSetAction,
  configResetAction,
  configEditAction,
} from "./actions/config";

export function registerSustainCommands(program: Command): void {
  const sustain = program
    .command("sustain")
    .description("Self-sustaining operations for SupeRISE Market platform");

  sustain
    .command("health-check")
    .description("Check current balance and health status")
    .option("--json", "Output as JSON")
    .action(healthCheckAction);

  sustain
    .command("forecast")
    .description("Forecast balance consumption and ETA")
    .option("--json", "Output as JSON")
    .action(forecastAction);

  sustain
    .command("plan")
    .description("Generate action plan based on current status")
    .option("--json", "Output as JSON")
    .action(planAction);

  sustain
    .command("act")
    .description("Execute a plan")
    .argument("<plan-id>", "Plan ID to execute")
    .option("--dry-run", "Simulate execution without making changes")
    .option("--json", "Output as JSON")
    .action(actAction);

  sustain
    .command("tick")
    .description("Run full supervision cycle")
    .option("--execute", "Execute planned actions (default: dry-run)")
    .option("--notify", "Push report to OpenClaw session via system event")
    .option("--json", "Output as JSON")
    .action(tickAction);

  sustain
    .command("score")
    .description("Show latest decision score")
    .option("--json", "Output as JSON")
    .action(scoreAction);

  sustain
    .command("list-models")
    .description("List available models with pricing")
    .option("--json", "Output as JSON")
    .action(listModelsAction);

  sustain
    .command("setup")
    .description("Setup sustain system (database, auth, policy, cron)")
    .action(setupAction);

  sustain
    .command("mcp-server")
    .description("Start MCP server (stdio transport)")
    .action(mcpServerAction);

  sustain
    .command("send-report")
    .description("Send health check and forecast report to OpenClaw channel")
    .action(sendReportAction);

  sustain
    .command("send-score-report")
    .description("Send score review report to OpenClaw channel")
    .action(sendScoreReportAction);

  sustain
    .command("top-up")
    .description("Top up account balance with CKB")
    .argument("<amount>", "Amount of CKB to top up (1000–20000)", (value: string) => {
      const amount = Number(value);
      if (!Number.isFinite(amount) || amount < 1000 || amount > 20000) {
        throw new InvalidArgumentError("amount must be between 1000 and 20000 CKB");
      }
      return amount;
    })
    .option("--dry-run", "Simulate without executing")
    .option("--json", "Output as JSON")
    .action(topUpAction);

  sustain
    .command("retry-orders")
    .description("Retry pending top-up orders (transfer OK, submission failed)")
    .option("--notify", "Push report to OpenClaw session via system event")
    .option("--json", "Output as JSON")
    .action(retryOrdersAction);

  // Config command with subcommands
  const config = sustain
    .command("config")
    .description("Manage sustain configuration");

  config
    .command("show")
    .description("Show current configuration")
    .action(configShowAction);

  config
    .command("get")
    .description("Get a config value")
    .argument("<key>", "Config key to get")
    .action(configGetAction);

  config
    .command("set")
    .description("Set a config value")
    .argument("<key>", "Config key to set")
    .argument("<value>", "Value to set")
    .action(configSetAction);

  config
    .command("edit")
    .description("Interactive config editor")
    .action(configEditAction);

  config
    .command("reset")
    .description("Reset config to defaults")
    .option("--confirm", "Skip confirmation prompt")
    .action(configResetAction);
}
