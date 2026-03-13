const test = require("node:test");
const assert = require("node:assert/strict");
const {
  AddressBookService,
  TransferTargetResolverService,
} = require("../dist/index.cjs");
const { WalletDomainError } = require("@superise/domain");

function createAddressBookRepos() {
  const contacts = [];
  const audits = [];

  return {
    contacts,
    audits,
    repos: {
      wallets: {
        async getCurrent() {
          return null;
        },
        async saveCurrent() {},
      },
      ownerCredentials: {
        async getCurrent() {
          return null;
        },
        async saveCurrent() {},
      },
      transfers: {
        async getById() {
          return null;
        },
        async listByStatuses() {
          return [];
        },
        async save() {},
      },
      addressBooks: {
        async getByName(name) {
          return contacts.find((contact) => contact.name === name) ?? null;
        },
        async getByNormalizedName(normalizedName) {
          return (
            contacts.find((contact) => contact.normalizedName === normalizedName) ??
            null
          );
        },
        async listAll() {
          return [...contacts].sort((left, right) => left.name.localeCompare(right.name));
        },
        async searchByNormalizedName(query) {
          return contacts
            .filter((contact) => contact.normalizedName.includes(query))
            .sort((left, right) => left.name.localeCompare(right.name));
        },
        async listByNormalizedAddress(chain, normalizedAddress) {
          const key =
            chain === "ckb"
              ? "normalizedNervosAddress"
              : "normalizedEthereumAddress";
          return contacts
            .filter((contact) => contact[key] === normalizedAddress)
            .sort((left, right) => left.name.localeCompare(right.name));
        },
        async save(contact) {
          const index = contacts.findIndex(
            (current) => current.contactId === contact.contactId,
          );
          if (index >= 0) {
            contacts[index] = contact;
            return;
          }

          contacts.push(contact);
        },
        async deleteById(contactId) {
          const index = contacts.findIndex((contact) => contact.contactId === contactId);
          if (index < 0) {
            return false;
          }

          contacts.splice(index, 1);
          return true;
        },
      },
      signs: {
        async save() {},
      },
      audits: {
        async listRecent() {
          return audits;
        },
        async save(log) {
          audits.push(log);
        },
      },
      systemConfig: {
        async getCurrent() {
          return null;
        },
        async saveCurrent() {},
      },
      assetLimitPolicies: {
        async getByChainAsset() {
          return null;
        },
        async listAll() {
          return [];
        },
        async save() {},
      },
      assetLimitReservations: {
        async getByOperationId() {
          return null;
        },
        async listByChainAsset() {
          return [];
        },
        async save() {},
      },
    },
  };
}

function createUnitOfWork(repos) {
  return {
    async run(work) {
      return work(repos);
    },
  };
}

function createCkb() {
  return {
    async normalizeAddress(address) {
      const trimmed = address.trim().toLowerCase();
      if (!trimmed.startsWith("ckt1") && !trimmed.startsWith("ckb1")) {
        throw new WalletDomainError("VALIDATION_ERROR", "invalid nervos address");
      }

      return trimmed;
    },
  };
}

function createEvm() {
  return {
    async normalizeAddress(address) {
      const trimmed = address.trim().toLowerCase();
      if (!/^0x[a-f0-9]{40}$/.test(trimmed)) {
        throw new WalletDomainError("VALIDATION_ERROR", "invalid ethereum address");
      }

      return trimmed;
    },
  };
}

test("AddressBookService manages contacts and exact-address lookups", async () => {
  const { repos, contacts, audits } = createAddressBookRepos();
  const service = new AddressBookService(
    repos,
    createUnitOfWork(repos),
    createCkb(),
    createEvm(),
  );

  const created = await service.create("OWNER", {
    contact: {
      name: " Alice ",
      note: " OTC partner ",
      addresses: {
        nervosAddress: "ckt1qyqszqgpqyqszqgpqyqszqgpqyqszqgph7l5j9",
        ethereumAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      },
    },
  });

  assert.equal(created.contact.name, "Alice");
  assert.deepEqual(created.contact.addresses, {
    nervosAddress: "ckt1qyqszqgpqyqszqgpqyqszqgpqyqszqgph7l5j9",
    ethereumAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  });

  const listed = await service.list();
  const searched = await service.search("ali");
  const fetched = await service.get("Alice");
  const lookup = await service.lookupByAddress(
    "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  );
  const unmatched = await service.lookupByAddress("not-a-supported-address");

  assert.equal(listed.contacts.length, 1);
  assert.equal(listed.contacts[0].chains.join(","), "NERVOS,ETHEREUM");
  assert.equal(searched.contacts[0].name, "Alice");
  assert.equal(fetched.contact.note, "OTC partner");
  assert.equal(lookup.matched, true);
  assert.equal(lookup.chain, "ethereum");
  assert.deepEqual(lookup.contacts, ["Alice"]);
  assert.equal(unmatched.matched, false);
  assert.deepEqual(unmatched.contacts, []);

  const updated = await service.update("OWNER", {
    currentName: "Alice",
    contact: {
      name: "Alice Treasury",
      note: null,
      addresses: {
        nervosAddress: "ckt1qyqszqgpqyqszqgpqyqszqgpqyqszqgph7l5j9",
        ethereumAddress: null,
      },
    },
  });

  assert.equal(updated.contact.name, "Alice Treasury");
  assert.equal(updated.contact.addresses.ethereumAddress, null);

  const deleted = await service.delete("OWNER", {
    name: "Alice Treasury",
  });

  assert.equal(deleted.deleted, true);
  assert.equal(contacts.length, 0);
  assert.equal(audits.length, 3);
});

test("TransferTargetResolverService resolves by chain and defaults omitted toType to address", async () => {
  const { repos, contacts } = createAddressBookRepos();
  contacts.push({
    contactId: "contact_alice",
    name: "Alice",
    normalizedName: "alice",
    note: null,
    nervosAddress: null,
    normalizedNervosAddress: null,
    ethereumAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    normalizedEthereumAddress: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    createdAt: "2026-03-13T00:00:00.000Z",
    updatedAt: "2026-03-13T00:00:00.000Z",
  });

  const resolver = new TransferTargetResolverService(repos.addressBooks, {
    ckb: createCkb(),
    evm: createEvm(),
  });

  const byAddress = await resolver.resolve("evm", {
    to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  });
  const byContact = await resolver.resolve("evm", {
    to: "Alice",
    toType: "contact_name",
  });

  assert.equal(byAddress.toType, "address");
  assert.equal(byAddress.resolvedContactName, null);
  assert.equal(
    byAddress.resolvedAddress,
    "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  );
  assert.equal(byContact.targetType, "CONTACT_NAME");
  assert.equal(byContact.resolvedContactName, "Alice");

  await assert.rejects(
    () =>
      resolver.resolve("ckb", {
        to: "Alice",
        toType: "contact_name",
      }),
    (error) =>
      error instanceof WalletDomainError &&
      error.code === "ADDRESS_BOOK_ADDRESS_NOT_FOUND_FOR_CHAIN",
  );
});
