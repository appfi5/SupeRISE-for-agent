import pc from "picocolors";
import {
  buildSpinner,
  resolveAmount,
  resolveFeeRate,
  resolveRecipient,
  type TransferBaseOptions,
} from "../helps";
import { createClient } from "@/services/ckb";
import { executeCkbTransfer } from "@/services/ckb-transfer";

export async function transferCkbAction(options: TransferBaseOptions, command: any): Promise<void> {
  const parentOpts = command?.parent?.opts?.() || {};
  const actualOptions = { ...parentOpts, ...options };

  const client = createClient();
  const { address: toAddress } = await resolveRecipient(actualOptions.to);

  const amount = await resolveAmount(actualOptions.amount);
  const feeRate = await resolveFeeRate(actualOptions, client);
  const useJson = actualOptions.json === true;
  const useSpinner = !useJson;

  if (actualOptions.dryRun) {
    const spinner = buildSpinner(useSpinner, "Running dry-run...");
    const result = await executeCkbTransfer({
      toAddress,
      amountShannon: amount.raw,
      feeRate,
      dryRun: true,
    });
    spinner?.succeed("Dry-run succeeded.");

    if (useJson) {
      console.log(
        JSON.stringify(
          {
            network: "testnet",
            from: result.fromAddress,
            to: result.toAddress,
            amount: amount.display,
            amountShannon: result.amountShannon,
            fee: result.feeShannon,
            cycles: result.cycles,
            tx: result.tx,
          },
          null,
          2,
        ),
      );
    } else {
      console.log(pc.green("Dry-run accepted."));
      console.log(pc.dim(`Estimated cycles: ${result.cycles ?? "N/A"}`));
      console.log(pc.dim(`Fee: ${result.feeShannon} shannon`));
    }
    return;
  }

  const spinner = buildSpinner(useSpinner, "Sending transaction...");
  const result = await executeCkbTransfer({
    toAddress,
    amountShannon: amount.raw,
    feeRate,
  });
  spinner?.succeed("Transaction sent.");

  if (useJson) {
    console.log(
      JSON.stringify(
        {
          network: "testnet",
          from: result.fromAddress,
          to: result.toAddress,
          amount: amount.display,
          amountShannon: result.amountShannon,
          fee: result.feeShannon,
          txHash: result.txHash,
          tx: result.tx,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(pc.green(`Transaction hash: ${result.txHash}`));
    console.log(pc.dim(`Fee: ${result.feeShannon} shannon`));
  }
}
