import ora from "ora";
import { ccc } from "@ckb-ccc/shell";
import { cccA } from "@ckb-ccc/shell/advanced";
import { getConfig } from "../../utils/config.js";
import { promptText } from "../../utils/prompts.js";
import { parseFixedPoint } from "../../utils/validator.js";
import { CKB_DECIMALS } from "../../utils/constants.js";
import { lookupAddressByName } from "../address-book/helps.js";

export type TransferBaseOptions = {
  to?: string;
  amount?: string;
  feeRate?: string;
  dryRun?: boolean;
  json?: boolean;
};

export async function resolveRecipient(
  to?: string,
): Promise<{ address: string }> {
  let recipient = to?.trim();
  if (!recipient) {
    recipient = await promptText("Recipient address or contact name");
  }

  // Try to look up as contact name first
  const addressFromBook = lookupAddressByName(recipient);
  if (addressFromBook) {
    return { address: addressFromBook };
  }

  // Treat as raw address
  return { address: recipient };
}

export async function resolveAmount(
  amount?: string,
  decimals = CKB_DECIMALS,
): Promise<{ raw: bigint; display: string }> {
  let value = amount?.trim();
  if (!value) {
    value = await promptText("Amount");
  }
  return { raw: parseFixedPoint(value, decimals), display: value };
}

export async function fetchFeeRate(client: ccc.Client): Promise<ccc.NumLike> {
  try {
    const stats = await client.getFeeRateStatistics();
    return stats?.median ?? cccA.DEFAULT_MIN_FEE_RATE;
  } catch {
    const rate = process.env.DEFAULT_FEE_RATE;
    if (rate === null || rate === undefined) {
      return cccA.DEFAULT_MIN_FEE_RATE;
    }
    return parseInt(rate, 10);
  }
}

export async function resolveFeeRate(
  options: TransferBaseOptions,
  client: ccc.Client,
): Promise<ccc.NumLike> {
  const config = getConfig();
  if (options.feeRate) {
    const parsed = Number(options.feeRate);
    if (!Number.isFinite(parsed)) {
      throw new Error("Fee rate must be a number.");
    }
    if (parsed < 1000) {
      throw new Error("Fee rate must be at least 1000.");
    }
    return parsed;
  }
  if (config.feeRate !== null) {
    return config.feeRate;
  }
  return fetchFeeRate(client);
}

export function buildSpinner(enabled: boolean, text: string) {
  return enabled ? ora(text).start() : null;
}

export async function completeInputsCapacityAndFee(
  tx: ccc.Transaction,
  signer: ccc.SignerCkbPublicKey,
  options: {
    feeRate?: ccc.NumLike | null;
    changeLock: ccc.Script;
  },
): Promise<ccc.Transaction> {
  const { feeRate } = options;

  await tx.completeInputsByCapacity(signer);
  const prepared = await signer.prepareTransaction(tx);
  if (feeRate !== null && feeRate !== undefined) {
    await prepared.completeFeeBy(signer, feeRate);
  } else {
    await prepared.completeFeeBy(signer);
  }
  return prepared;
}

export async function transferCKB(params: {
  signer: ccc.SignerCkbPublicKey;
  receiverAddress: string;
  amount: bigint;
  feeRate?: ccc.NumLike | null;
}): Promise<ccc.Transaction> {
  const { signer, receiverAddress, amount, feeRate } = params;
  const receiver = await ccc.Address.fromString(receiverAddress, signer.client);

  const tx = ccc.Transaction.from({
    outputs: [{ lock: receiver.script, capacity: amount }],
  });

  const changeLock = (await signer.getRecommendedAddressObj()).script;
  await completeInputsCapacityAndFee(tx, signer, { feeRate, changeLock });
  return signer.signTransaction(tx);
}
