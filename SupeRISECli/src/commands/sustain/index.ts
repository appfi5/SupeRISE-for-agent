/**
 * Sustain Command Registration
 * 
 * Registers all sustain-related CLI commands.
 */

import { Command, InvalidArgumentError } from "commander";
import { getTopUpAmountRange, validateTopUpAmount } from "@/core/sustain/config";
import { healthCheckAction } from "./actions/health-check";
import { forecastAction } from "./actions/forecast";
import { setupAction } from "./actions/setup";
import { listModelsAction } from "./actions/list-models";
import { setModelAction } from "./actions/set-model";
import { mcpServerAction } from "./actions/mcp-server";
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
  const topUpRange = getTopUpAmountRange();
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
    .command("list-models")
    .description("List available models with pricing")
    .option("--json", "Output as JSON")
    .action(listModelsAction);

  sustain
    .command("set-model")
    .description("Set the current OpenClaw model")
    .argument("<model-ref>", "Model ref to activate, for example provider/model")
    .option("--json", "Output as JSON")
    .action(setModelAction);

  sustain
    .command("setup")
    .description("Setup sustain system (database, auth, cron)")
    .action(setupAction);

  sustain
    .command("mcp-server")
    .description("Start MCP server (stdio transport)")
    .action(mcpServerAction);

  sustain
    .command("top-up")
    .description("Top up account balance with CKB")
    .argument(
      "<amount>",
      `Amount of CKB to top up (${topUpRange.min}-${topUpRange.max} by current config)`,
      (value: string) => {
        try {
          return validateTopUpAmount(Number(value));
        } catch (error) {
          throw new InvalidArgumentError(
            error instanceof Error ? error.message : String(error),
          );
        }
      },
    )
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
