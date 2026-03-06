import { ccc } from "@ckb-ccc/shell";
import { cccA as cccAdvanced } from "@ckb-ccc/shell/advanced";

function normalizePrivateKey(privateKey) {
  return privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
}

function createClient() {
  const rpc = process.env.CKB_RPC_URL;
  const indexer = process.env.CKB_INDEXER_URL;
  const url = indexer ?? rpc ?? "https://testnet.ckb.dev";
  return new ccc.ClientPublicTestnet({
    url,
    fallbacks: [indexer, rpc].filter(Boolean),
  });
}

export class CkbAdapter {
  async #createSigner(privateKey) {
    const client = createClient();
    return new ccc.SignerCkbPrivateKey(client, normalizePrivateKey(privateKey));
  }

  async deriveIdentity(privateKey) {
    const signer = await this.#createSigner(privateKey);
    return {
      chain: "ckb",
      publicKey: signer.publicKey,
      address: await signer.getRecommendedAddress(),
    };
  }

  async signMessage(privateKey, message) {
    const signer = await this.#createSigner(privateKey);
    const signed = await signer.signMessage(message);
    return signed.signature;
  }

  async transfer(privateKey, toAddress, amountShannon) {
    const signer = await this.#createSigner(privateKey);
    const receiver = await ccc.Address.fromString(toAddress, signer.client);
    const tx = ccc.Transaction.from({
      outputs: [{ lock: receiver.script, capacity: BigInt(amountShannon) }],
    });

    await tx.completeInputsByCapacity(signer);
    const prepared = await signer.prepareTransaction(tx);
    await prepared.completeFeeBy(signer, cccAdvanced.DEFAULT_MIN_FEE_RATE);
    const signedTx = await signer.signTransaction(prepared);
    const txHash = await signer.sendTransaction(signedTx);

    return {
      txHash,
      toAddress: receiver.toString(),
      amountShannon: BigInt(amountShannon).toString(),
    };
  }
}
