// Utility functions for constructing unsigned CKB transactions
import { ccc } from "@ckb-ccc/shell";
import { completeInputsCapacityAndFee } from "@/commands/transfer/helps";
import { getWallet } from "@/services/sign-server";

export async function buildUnsignedCkbTransfer(
  client: ccc.Client,
  toAddress: string,
  amount: bigint,
  feeRate?: ccc.NumLike | null,
): Promise<{ tx: ccc.Transaction; fromAddress: string }> {
  const walletInfo = await getWallet();
  if (!walletInfo) {
    throw new Error("No wallet found");
  }
  // const balance = BigInt(walletInfo.balance);

  // Verify sufficient balance
  // if (balance < amount) {
  //   throw new Error(
  //     `Insufficient balance. Required: ${amount.toString()} shannon, Available: ${balance.toString()} shannon`,
  //   );
  // }
  // Create signer from public key, used only for transaction construction
  const signer = new ccc.SignerCkbPublicKey(client, walletInfo.publicKey);
  const receiver = await ccc.Address.fromString(toAddress, signer.client);

  const tx = ccc.Transaction.from({
    outputs: [{ lock: receiver.script, capacity: amount }],
  });

  const changeLock = (await signer.getRecommendedAddressObj()).script;
  await completeInputsCapacityAndFee(tx, signer, { feeRate, changeLock });

  const fromAddress = walletInfo.address;
  return { tx, fromAddress };
}

