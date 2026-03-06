import { createHash, createHmac } from "node:crypto";

function normalizePrivateKey(privateKey) {
  return privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
}

export class CkbAdapter {
  deriveIdentity(privateKey) {
    const normalized = normalizePrivateKey(privateKey);
    const publicKey = createHash("sha256").update(normalized).digest("hex");
    return {
      chain: "ckb",
      publicKey: `0x${publicKey}`,
      address: `ckt1${publicKey.slice(0, 39)}`,
    };
  }

  signMessage(privateKey, message) {
    const normalized = normalizePrivateKey(privateKey);
    const signature = createHmac("sha256", Buffer.from(normalized, "hex"))
      .update(message)
      .digest("hex");
    return `0x${signature}`;
  }

  transfer(privateKey, toAddress, amountShannon) {
    const normalized = normalizePrivateKey(privateKey);
    const txHash = createHash("sha256")
      .update(`${normalized}:${toAddress}:${amountShannon.toString()}:${Date.now()}`)
      .digest("hex");
    return {
      txHash: `0x${txHash}`,
      toAddress,
      amountShannon: amountShannon.toString(),
    };
  }
}
