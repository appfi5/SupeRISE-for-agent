const test = require("node:test");
const assert = require("node:assert/strict");
const { apiSuccess, apiFailure } = require("@superise/app-contracts");
const {
  WalletToolRegistryService,
} = require("../dist/modules/wallet-tools/wallet-tool-registry.service.js");
const {
  McpServerFactory,
} = require("../dist/modules/mcp/mcp-server.factory.js");

function createRegistry() {
  return new WalletToolRegistryService(
    { execute: async () => ({ walletFingerprint: "wlt_test", status: "ACTIVE", source: "IMPORTED" }) },
    {
      list: async () => ({ contacts: [] }),
      search: async () => ({ contacts: [] }),
      lookupByAddress: async () => ({ address: "0x1", matched: false, contacts: [] }),
      get: async () => ({ contact: null }),
      getAll: async () => ({ contacts: [] }),
      create: async () => ({ contact: null }),
      update: async () => ({ contact: null }),
      delete: async () => ({ deleted: true, name: "Alice" }),
    },
    { execute: async () => ({ chain: "nervos", address: "ckt1qyq...", publicKey: "0x03abc" }) },
    { execute: async () => ({ chain: "nervos", asset: "CKB", amount: "100000000", decimals: 8, symbol: "CKB" }) },
    {
      execute: async () => ({
        chain: "nervos",
        signingAddress: "ckt1qyq...",
        publicKey: "0x03abc",
        signature: "0xabc",
      }),
    },
    {
      execute: async () => ({
        chain: "nervos",
        asset: "CKB",
        operationId: "op_ckb",
        txHash: "0x1",
        status: "SUBMITTED",
        toType: "address",
        resolvedAddress: "ckt1qyq...",
      }),
    },
    { execute: async () => ({ chain: "nervos", txHash: "0x1", status: "CONFIRMED" }) },
    {
      execute: async () => ({
        chain: "ethereum",
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        publicKey: "0x04def",
      }),
    },
    { execute: async () => ({ chain: "ethereum", asset: "ETH", amount: "1", decimals: 18, symbol: "ETH" }) },
    { execute: async () => ({ chain: "ethereum", asset: "USDT", amount: "1", decimals: 6, symbol: "USDT" }) },
    { execute: async () => ({ chain: "ethereum", asset: "USDC", amount: "1", decimals: 6, symbol: "USDC" }) },
    {
      execute: async () => ({
        chain: "ethereum",
        signingAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        publicKey: "0x04def",
        signature: "0xdef",
      }),
    },
    {
      execute: async () => ({
        chain: "ethereum",
        asset: "ETH",
        operationId: "op_eth",
        txHash: "0x2",
        status: "SUBMITTED",
        toType: "address",
        resolvedAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      }),
    },
    {
      execute: async () => ({
        chain: "ethereum",
        asset: "USDT",
        operationId: "op_usdt",
        txHash: "0x3",
        status: "SUBMITTED",
        toType: "address",
        resolvedAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      }),
    },
    {
      execute: async () => ({
        chain: "ethereum",
        asset: "USDC",
        operationId: "op_usdc",
        txHash: "0x4",
        status: "SUBMITTED",
        toType: "address",
        resolvedAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      }),
    },
    { execute: async () => ({ chain: "ethereum", txHash: "0x2", status: "CONFIRMED" }) },
    { execute: async () => ({ operationId: "op_eth", chain: "ethereum", asset: "ETH", status: "SUBMITTED", txHash: "0x2" }) },
  );
}

test("WalletToolRegistryService describes transfer tools with output schema and follow-up guidance", async () => {
  const registry = createRegistry();
  const definition = registry
    .listDefinitions()
    .find((item) => item.name === "ethereum.transfer.eth");

  assert.ok(definition);
  assert.match(definition.description, /wallet\.operation_status/);
  assert.equal(definition.annotations.destructiveHint, true);
  assert.equal(definition.annotations.idempotentHint, false);
  assert.equal(definition.annotations.openWorldHint, true);

  assert.equal(
    definition.outputSchema.safeParse(
      apiSuccess({
        chain: "ethereum",
        asset: "ETH",
        operationId: "op_eth",
        txHash: "0x2",
        status: "SUBMITTED",
        toType: "address",
        resolvedAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      }),
    ).success,
    true,
  );

  assert.equal(
    definition.outputSchema.safeParse(
      apiFailure({
        code: "TRANSFER_BROADCAST_FAILED",
        message: "broadcast failed",
      }),
    ).success,
    true,
  );
});

test("McpServerFactory registers tool title, annotations, and output schema for agents", async () => {
  const registry = createRegistry();
  const factory = new McpServerFactory(registry);
  const server = factory.createServer();
  const tool = server._registeredTools["wallet.current"];

  assert.ok(tool);
  assert.equal(tool.title, "Get Current Wallet");
  assert.equal(tool.annotations.readOnlyHint, true);
  assert.ok(tool.outputSchema);
});

test("WalletToolRegistryService exposes ethereum.tx_status for agent follow-up checks", async () => {
  const registry = createRegistry();
  const definition = registry
    .listDefinitions()
    .find((item) => item.name === "ethereum.tx_status");

  assert.ok(definition);
  assert.equal(definition.annotations.readOnlyHint, true);
});

test("WalletToolRegistryService exposes identity tools with publicKey output", async () => {
  const registry = createRegistry();
  const definition = registry
    .listDefinitions()
    .find((item) => item.name === "nervos.identity");

  assert.ok(definition);
  assert.equal(
    definition.outputSchema.safeParse(
      apiSuccess({
        chain: "nervos",
        address: "ckt1qyq...",
        publicKey: "0x03abc",
      }),
    ).success,
    true,
  );
});
