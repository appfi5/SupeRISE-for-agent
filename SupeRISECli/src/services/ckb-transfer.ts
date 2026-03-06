import type { ccc } from "@ckb-ccc/shell";
import { JsonRpcTransformers } from "@ckb-ccc/shell/advanced";
import { createClient } from "@/services/ckb";
import { signCkbTransaction } from "@/services/sign-server";
import { buildUnsignedCkbTransfer } from "@/utils/tx-builder";
import { validateAddress } from "@/utils/validator";

export type ExecuteCkbTransferOptions = {
  toAddress: string;
  amountShannon: bigint;
  feeRate?: ccc.NumLike | null;
  dryRun?: boolean;
};

export type ExecuteCkbTransferResult = {
  fromAddress: string;
  toAddress: string;
  amountShannon: string;
  feeShannon: string;
  tx: unknown;
  txHash?: string;
  cycles?: string;
};

export async function executeCkbTransfer(
  options: ExecuteCkbTransferOptions,
): Promise<ExecuteCkbTransferResult> {
  const client = createClient();
  const validatedAddress = await validateAddress(options.toAddress, client);
  const { tx: unsignedTx, fromAddress } = await buildUnsignedCkbTransfer(
    client,
    validatedAddress.toString(),
    options.amountShannon,
    options.feeRate,
  );

  const inputsCapacity = await unsignedTx.getInputsCapacity(client);
  const outputsCapacity = unsignedTx.getOutputsCapacity();
  const feePaid = inputsCapacity - outputsCapacity;

  const result: ExecuteCkbTransferResult = {
    fromAddress,
    toAddress: validatedAddress.toString(),
    amountShannon: options.amountShannon.toString(),
    feeShannon: feePaid.toString(),
    tx: JsonRpcTransformers.transactionFrom(unsignedTx),
  };

  if (options.dryRun) {
    const cycles = await client.estimateCycles(unsignedTx);
    result.cycles = cycles.toString();
    return result;
  }

  const signed = await signCkbTransaction(fromAddress, unsignedTx);
  const txLike = JSON.parse(signed.content).tx_view;
  const tx = JsonRpcTransformers.transactionTo(txLike);
  result.txHash = await client.sendTransaction(tx);

  return result;
}
