const test = require("node:test");
const assert = require("node:assert/strict");
const {
  ethereumTransferEthRequestSchema,
  ownerWalletImportRequestSchema,
  MCP_TOOL_NAMES,
} = require("../dist/index.cjs");

const VALID_PRIVATE_KEY =
  "0x4c0883a69102937d6231471b5dbb6204fe51296170827978d6ab2e5f3f6b6f8d";

test("owner wallet import schema requires explicit confirmed=true", () => {
  const parsed = ownerWalletImportRequestSchema.parse({
    privateKey: VALID_PRIVATE_KEY,
    confirmed: true,
  });

  assert.deepEqual(parsed, {
    privateKey: VALID_PRIVATE_KEY,
    confirmed: true,
  });

  assert.throws(
    () =>
      ownerWalletImportRequestSchema.parse({
        privateKey: VALID_PRIVATE_KEY,
      }),
    /confirmed/i,
  );
});

test("ethereum ETH transfer schema only accepts smallest-unit integer amounts", () => {
  const parsed = ethereumTransferEthRequestSchema.parse({
    to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    amount: "1000000000000000000",
  });

  assert.equal(parsed.amount, "1000000000000000000");
  assert.throws(
    () =>
      ethereumTransferEthRequestSchema.parse({
        to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        amount: "1.5",
      }),
    /smallest unit|positive integer/i,
  );
});

test("MCP tool names include ethereum.transfer.eth", () => {
  assert.ok(MCP_TOOL_NAMES.includes("ethereum.transfer.eth"));
});
