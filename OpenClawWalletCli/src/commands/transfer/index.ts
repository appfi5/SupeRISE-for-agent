import { Command } from "commander";
import { transferCkbAction } from "./actions/ckb.js";

function withTransferOptions(command: Command): Command {
  return command
    .option("--to <value>", "Recipient address")
    .option("--amount <value>", "Amount to transfer")
    .option("--fee-rate <value>", "Transaction fee rate in shannon per 1000 bytes")
    .option("--dry-run", "Simulate transaction without sending")
    .option("--no-json", "Disable JSON output");
}

export function registerTransferCommand(program: Command): void {
  const transfer = program
    .command("transfer")
    .description("Transfer CKB tokens");

  withTransferOptions(transfer).action(transferCkbAction);

  withTransferOptions(
    transfer
      .command("ckb")
      .description("Transfer CKB"),
  ).action(transferCkbAction);
}
