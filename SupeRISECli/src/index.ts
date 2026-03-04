#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { registerConfigCommands } from "@/commands/config/index";
import { registerTransferCommand } from "@/commands/transfer/index";
import { registerAddressBookCommands } from "@/commands/address-book/index";
import { registerSustainCommands } from "@/commands/sustain/index";
import { registerWhoamiCommand } from "@/commands/whoami";
import { registerSignMessageCommand } from "@/commands/sign-message";
import { reportError } from "@/utils/errors";

const program = new Command();

program
  .name("rise")
  .description("RISE - CKB testnet CLI for CKB and UDT transfers")
  .version(process.env.npm_package_version ?? "0.1.0")
  .showHelpAfterError();

registerConfigCommands(program);
registerTransferCommand(program);
registerAddressBookCommands(program);
registerSustainCommands(program);
registerWhoamiCommand(program);
registerSignMessageCommand(program);

program.parseAsync(process.argv).catch((err) => {
  reportError(err);
  if (process.env.DEBUG && err instanceof Error) {
    console.error(err.stack ?? err.message);
  } else {
    console.error(pc.dim("Run with DEBUG=1 for more details."));
  }
  process.exit(1);
});
