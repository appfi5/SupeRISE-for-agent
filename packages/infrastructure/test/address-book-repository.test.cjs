const test = require("node:test");
const assert = require("node:assert/strict");
const BetterSqlite3 = require("better-sqlite3");
const { mkdtempSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const {
  WalletDatabase,
  createRepositoryBundle,
  loadWalletServerConfig,
} = require("../dist/index.cjs");

function createDatabase() {
  const cwd = mkdtempSync(join(tmpdir(), "superise-address-book-"));
  const config = loadWalletServerConfig({}, cwd);
  return {
    config,
    database: new WalletDatabase(config),
  };
}

test("WalletDatabase migrates legacy transfer_operations to address-book schema", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "superise-legacy-transfer-"));
  const config = loadWalletServerConfig({}, cwd);
  const legacy = new BetterSqlite3(config.sqlitePath);

  legacy
    .prepare(
      `
        create table transfer_operations (
          id text primary key,
          role text not null,
          chain text not null,
          asset text not null,
          request_payload text not null,
          status text not null,
          tx_hash text,
          error_code text,
          error_message text,
          created_at text not null,
          updated_at text not null
        )
      `,
    )
    .run();
  legacy.close();

  const database = new WalletDatabase(config);

  try {
    await database.migrate();

    const transferColumns = database.sqlite
      .prepare("PRAGMA table_info(transfer_operations)")
      .all()
      .map((column) => column.name);
    const addressBookColumns = database.sqlite
      .prepare("PRAGMA table_info(address_book_contacts)")
      .all()
      .map((column) => column.name);

    assert.ok(transferColumns.includes("target_type"));
    assert.ok(transferColumns.includes("resolved_to_address"));
    assert.ok(transferColumns.includes("requested_amount"));
    assert.ok(transferColumns.includes("last_chain_status"));
    assert.ok(addressBookColumns.includes("normalized_name"));
    assert.ok(addressBookColumns.includes("normalized_ethereum_address"));
  } finally {
    await database.close();
  }
});

test("address book repository persists contacts and transfer target metadata", async () => {
  const { database } = createDatabase();

  try {
    await database.migrate();
    const repos = createRepositoryBundle(database.db);

    const contact = {
      contactId: "contact_alice",
      name: "Alice",
      normalizedName: "alice",
      note: "Trusted counterparty",
      nervosAddress: "ckt1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      normalizedNervosAddress: "ckt1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      ethereumAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      normalizedEthereumAddress: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
      createdAt: "2026-03-13T08:00:00.000Z",
      updatedAt: "2026-03-13T08:00:00.000Z",
    };

    await repos.addressBooks.save(contact);

    const byName = await repos.addressBooks.getByName("Alice");
    const byNormalizedName = await repos.addressBooks.getByNormalizedName("alice");
    const search = await repos.addressBooks.searchByNormalizedName("ali");
    const evmMatches = await repos.addressBooks.listByNormalizedAddress(
      "evm",
      "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    );

    assert.equal(byName?.name, "Alice");
    assert.equal(byNormalizedName?.contactId, "contact_alice");
    assert.equal(search.length, 1);
    assert.equal(evmMatches.length, 1);
    assert.equal(evmMatches[0].name, "Alice");

    await repos.transfers.save({
      operationId: "op_address_book",
      actorRole: "OWNER",
      chain: "evm",
      asset: "ETH",
      targetType: "CONTACT_NAME",
      targetInput: "Alice",
      resolvedToAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      resolvedContactName: "Alice",
      requestedAmount: "1000000000000000000",
      requestPayload: {
        to: "Alice",
        toType: "contact_name",
        amount: "1000000000000000000",
      },
      status: "SUBMITTED",
      txHash: "0xabc123",
      errorCode: null,
      errorMessage: null,
      submittedAt: "2026-03-13T08:01:00.000Z",
      confirmedAt: null,
      failedAt: null,
      lastChainStatus: "PENDING",
      lastChainCheckedAt: "2026-03-13T08:02:00.000Z",
      limitWindow: null,
      limitSnapshot: null,
      createdAt: "2026-03-13T08:00:00.000Z",
      updatedAt: "2026-03-13T08:02:00.000Z",
    });

    const transfer = await repos.transfers.getById("op_address_book");

    assert.equal(transfer?.targetType, "CONTACT_NAME");
    assert.equal(transfer?.resolvedContactName, "Alice");
    assert.equal(transfer?.resolvedToAddress, contact.ethereumAddress);
    assert.equal(transfer?.lastChainStatus, "PENDING");

    const deleted = await repos.addressBooks.deleteById("contact_alice");
    const remaining = await repos.addressBooks.listAll();

    assert.equal(deleted, true);
    assert.equal(remaining.length, 0);
  } finally {
    await database.close();
  }
});
