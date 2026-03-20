const test = require("node:test");
const assert = require("node:assert/strict");
const {
  addressBookCreateRequestSchema,
  addressBookLookupByAddressResponseSchema,
  assetLimitExceededDetailSchema,
  ethereumIdentitySchema,
  ethereumSignMessageResponseSchema,
  ethereumBalanceUsdcSchema,
  ethereumTransferEthRequestSchema,
  nervosIdentitySchema,
  nervosSignMessageResponseSchema,
  ownerUpdateAssetLimitRequestSchema,
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
    toType: "contact_name",
    amount: "1000000000000000000",
  });

  assert.equal(parsed.amount, "1000000000000000000");
  assert.equal(parsed.toType, "contact_name");
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
  assert.ok(MCP_TOOL_NAMES.includes("address_book.list"));
  assert.ok(MCP_TOOL_NAMES.includes("address_book.lookup_by_address"));
  assert.ok(MCP_TOOL_NAMES.includes("address_book.delete"));
  assert.ok(MCP_TOOL_NAMES.includes("nervos.identity"));
  assert.ok(MCP_TOOL_NAMES.includes("ethereum.transfer.eth"));
  assert.ok(MCP_TOOL_NAMES.includes("ethereum.identity"));
  assert.ok(MCP_TOOL_NAMES.includes("ethereum.balance.usdc"));
  assert.ok(MCP_TOOL_NAMES.includes("ethereum.transfer.usdc"));
  assert.ok(MCP_TOOL_NAMES.includes("ethereum.tx_status"));
  assert.ok(MCP_TOOL_NAMES.includes("nervos.tx_status"));
});

test("identity and sign schemas include public keys", () => {
  const nervosIdentity = nervosIdentitySchema.parse({
    chain: "nervos",
    address: "ckt1qyq...",
    publicKey: "0x03abc",
  });
  const ethereumIdentity = ethereumIdentitySchema.parse({
    chain: "ethereum",
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    publicKey: "0x04def",
  });
  const nervosSign = nervosSignMessageResponseSchema.parse({
    chain: "nervos",
    signingAddress: "ckt1qyq...",
    publicKey: "0x03abc",
    signature: "0x123",
  });
  const ethereumSign = ethereumSignMessageResponseSchema.parse({
    chain: "ethereum",
    signingAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    publicKey: "0x04def",
    signature: "0x456",
  });

  assert.equal(nervosIdentity.publicKey, "0x03abc");
  assert.equal(ethereumIdentity.publicKey, "0x04def");
  assert.equal(nervosSign.publicKey, "0x03abc");
  assert.equal(ethereumSign.publicKey, "0x04def");
});

test("ethereum USDC balance schema exposes the fixed symbol and decimals", () => {
  const parsed = ethereumBalanceUsdcSchema.parse({
    chain: "ethereum",
    asset: "USDC",
    amount: "1000000",
    decimals: 6,
    symbol: "USDC",
  });

  assert.equal(parsed.symbol, "USDC");
  assert.equal(parsed.decimals, 6);
});

test("owner asset limit update schema requires at least one field", () => {
  const parsed = ownerUpdateAssetLimitRequestSchema.parse({
    dailyLimit: "1000",
  });

  assert.equal(parsed.dailyLimit, "1000");
  assert.throws(
    () => ownerUpdateAssetLimitRequestSchema.parse({}),
    /At least one limit field/i,
  );
});

test("asset limit exceeded details carry the structured limit payload", () => {
  const parsed = assetLimitExceededDetailSchema.parse({
    limit: {
      chain: "ethereum",
      asset: "USDC",
      window: "DAILY",
      limitAmount: "1000000",
      usedAmount: "600000",
      requestedAmount: "500000",
      remainingAmount: "400000",
      resetsAt: "2026-03-13T00:00:00.000Z",
    },
  });

  assert.equal(parsed.limit.asset, "USDC");
  assert.equal(parsed.limit.window, "DAILY");
});

test("address book create schema requires at least one address", () => {
  const parsed = addressBookCreateRequestSchema.parse({
    contact: {
      name: "Alice",
      note: "Treasury",
      addresses: {
        ethereumAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      },
    },
  });

  assert.equal(parsed.contact.name, "Alice");
  assert.throws(
    () =>
      addressBookCreateRequestSchema.parse({
        contact: {
          name: "Alice",
          addresses: {},
        },
      }),
    /At least one contact address/i,
  );
});

test("address lookup response keeps exact-address matching semantics", () => {
  const parsed = addressBookLookupByAddressResponseSchema.parse({
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    chain: "ethereum",
    matched: true,
    contacts: ["Alice", "Treasury"],
  });

  assert.equal(parsed.chain, "ethereum");
  assert.deepEqual(parsed.contacts, ["Alice", "Treasury"]);
});
