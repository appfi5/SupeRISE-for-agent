// 构造未签名 CKB 交易的工具函数
import { ccc } from "@ckb-ccc/shell";
import { completeInputsCapacityAndFee } from "../commands/transfer/helps.js";
import { getWallet } from "../services/sign-server.js";

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

  // 校验余额是否充足
  // if (balance < amount) {
  //   throw new Error(
  //     `Insufficient balance. Required: ${amount.toString()} shannon, Available: ${balance.toString()} shannon`,
  //   );
  // }
  // 使用公钥创建 signer，仅用于构建交易
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

