const test = require("node:test");
const assert = require("node:assert/strict");
const { CkbCccWalletAdapter } = require("../dist/index.cjs");

test("CkbCccWalletAdapter normalizes nested tx_status fields and null reason", async () => {
  const adapter = new CkbCccWalletAdapter({
    mode: "preset",
    preset: "testnet",
    rpcUrl: "https://testnet.ckb.dev",
    indexerUrl: "https://testnet.ckb.dev/indexer",
    expectedGenesisHash:
      "0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606",
  });

  adapter.createClient = () => ({
    getTransaction: async () => ({
      tx_status: {
        status: "committed",
        block_number: "0x10",
        block_hash: "0xabc",
        reason: null,
      },
    }),
    getTip: async () => "0x12",
  });

  const result = await adapter.getTxStatus("0x1");

  assert.deepEqual(result, {
    txHash: "0x1",
    status: "CONFIRMED",
    blockNumber: "16",
    blockHash: "0xabc",
    confirmations: "3",
    reason: undefined,
  });
});
