import { Command } from "commander";
import { showConfigAction } from "./actions/show.js";
import { setFeeRateAction } from "./actions/setFeeRate.js";
import { clearFeeRateAction } from "./actions/clearFeeRate.js";
import { setApiKeyAction } from "./actions/setApiKey.js";
import { clearApiKeyAction } from "./actions/clearApiKey.js";
import { setSignServerUrlAction } from "./actions/setSignServerUrl.js";
import { clearSignServerUrlAction } from "./actions/clearSignServerUrl.js";

export function registerConfigCommands(program: Command): void {
  const config = program.command("config").description("Configuration commands");

  config
    .command("show")
    .description("Display current configuration")
    .action(showConfigAction);

  config
    .command("set-fee-rate")
    .argument("[rate]", "Fee rate in shannon per 1000 bytes")
    .description("Set the default fee rate")
    .action(setFeeRateAction);

  config
    .command("clear-fee-rate")
    .description("Clear the default fee rate")
    .action(clearFeeRateAction);

  config
    .command("set-api-key")
    .argument("[key]", "API Key")
    .description("Set the API key for Superise API")
    .action(setApiKeyAction);

  config
    .command("clear-api-key")
    .description("Clear the API key")
    .action(clearApiKeyAction);

  config
    .command("set-sign-server-url")
    .argument("[url]", "Sign server URL")
    .description("Set the sign server URL")
    .action(setSignServerUrlAction);

  config
    .command("clear-sign-server-url")
    .description("Clear the sign server URL (use default)")
    .action(clearSignServerUrlAction);
}
