#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { registerConfigCommands } from "./commands/config/index.js";
import { registerTransferCommand } from "./commands/transfer/index.js";
import { registerAddressBookCommands } from "./commands/address-book/index.js";
import { reportError } from "./utils/errors.js";

const program = new Command();

program
  .name("rise")
  .description("RISE - CKB testnet CLI for CKB and UDT transfers")
  .version(process.env.npm_package_version ?? "0.1.0")
  .showHelpAfterError();

registerConfigCommands(program);
registerTransferCommand(program);
registerAddressBookCommands(program);

program.parseAsync(process.argv).catch((err) => {
  reportError(err);
  if (process.env.DEBUG && err instanceof Error) {
    console.error(err.stack ?? err.message);
  } else {
    console.error(pc.dim("Run with DEBUG=1 for more details."));
  }
  process.exit(1);
});
