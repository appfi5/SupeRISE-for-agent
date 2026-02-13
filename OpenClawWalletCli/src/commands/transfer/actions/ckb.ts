import pc from "picocolors";
import { JsonRpcTransformers } from "@ckb-ccc/shell/advanced";
import { createClient } from "../../../services/ckb.js";
import {
  buildSpinner,
  resolveAmount,
  resolveFeeRate,
  resolveRecipient,
  type TransferBaseOptions,
} from "../helps.js";
import { validateAddress } from "../../../utils/validator.js";
import { buildUnsignedCkbTransfer } from "../../../utils/tx-builder.js";
import { signCkbTransaction } from "../../../services/sign-server.js";

export async function transferCkbAction(options: TransferBaseOptions, command: any): Promise<void> {
  const parentOpts = command?.parent?.opts?.() || {};
  const actualOptions = { ...parentOpts, ...options };

  const client = createClient();
  const { address: toAddress } = await resolveRecipient(actualOptions.to);
  const toAddressObj = await validateAddress(toAddress, client);

  const amount = await resolveAmount(actualOptions.amount);
  const feeRate = await resolveFeeRate(actualOptions, client);
  const useJson = actualOptions.json !== false;
  const useSpinner = !useJson;

  const { tx: unsignedTx, fromAddress } = await buildUnsignedCkbTransfer(
    client,
    toAddressObj.toString(),
    amount.raw,
    feeRate,
  );

  const inputsCapacity = await unsignedTx.getInputsCapacity(client);
  const outputsCapacity = unsignedTx.getOutputsCapacity();
  const feePaid = inputsCapacity - outputsCapacity;

  if (actualOptions.dryRun) {
    const spinner = buildSpinner(useSpinner, "Running dry-run...");
    const cycles = await client.estimateCycles(unsignedTx);
    spinner?.succeed("Dry-run succeeded.");

    if (useJson) {
      console.log(
        JSON.stringify(
          {
            network: "testnet",
            from: fromAddress,
            to: toAddress,
            amount: amount.display,
            amountShannon: amount.raw.toString(),
            fee: feePaid.toString(),
            cycles: cycles.toString(),
            tx: JsonRpcTransformers.transactionFrom(unsignedTx),
          },
          null,
          2,
        ),
      );
    }
    console.log(pc.green("Dry-run accepted."));
    console.log(pc.dim(`Estimated cycles: ${cycles.toString()}`));
    console.log(pc.dim(`Fee: ${feePaid.toString()} shannon`));
    return;
  }

  const spinner = buildSpinner(useSpinner, "Sending transaction...");
  const result = await signCkbTransaction(fromAddress, unsignedTx);
  const txLike = JSON.parse(result.content).tx_view;
  const tx = JsonRpcTransformers.transactionTo(txLike);
  const hex = await client.sendTransaction(tx);
  spinner?.succeed("Transaction sent.");

  if (useJson) {
    console.log(
      JSON.stringify(
        {
          network: "testnet",
          from: fromAddress,
          to: toAddress,
          amount: amount.display,
          amountShannon: amount.raw.toString(),
          fee: feePaid.toString(),
          txHash: hex,
          tx: JsonRpcTransformers.transactionFrom(unsignedTx),
        },
        null,
        2,
      ),
    );
  }
  console.log(pc.green(`Transaction hash: ${hex}`));
  console.log(pc.dim(`Fee: ${feePaid.toString()} shannon`));
}
