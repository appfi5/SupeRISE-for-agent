const test = require("node:test");
const assert = require("node:assert/strict");
const { AssetLimitService } = require("../dist/index.cjs");
const { WalletDomainError } = require("@superise/domain");

function createRepos() {
  const policies = [];
  const reservations = [];
  const audits = [];

  return {
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
      signs: {
        async save() {},
      },
      audits: {
        async listRecent() {
          return [];
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
        async getByChainAsset(chain, asset) {
          return policies.find((item) => item.chain === chain && item.asset === asset) ?? null;
        },
        async listAll() {
          return policies;
        },
        async save(policy) {
          const index = policies.findIndex(
            (item) => item.chain === policy.chain && item.asset === policy.asset,
          );
          if (index >= 0) {
            policies[index] = policy;
            return;
          }

          policies.push(policy);
        },
      },
      assetLimitReservations: {
        async getByOperationId(operationId) {
          return reservations.find((item) => item.operationId === operationId) ?? null;
        },
        async listByChainAsset(chain, asset) {
          return reservations.filter((item) => item.chain === chain && item.asset === asset);
        },
        async save(reservation) {
          const index = reservations.findIndex((item) => item.operationId === reservation.operationId);
          if (index >= 0) {
            reservations[index] = reservation;
            return;
          }

          reservations.push(reservation);
        },
      },
    },
    policies,
    reservations,
    audits,
  };
}

function createUnitOfWork(repos) {
  return {
    async run(work) {
      return work(repos);
    },
  };
}

const locker = {
  async execute(_key, task) {
    return task();
  },
};

test("AssetLimitService lists all supported assets with default unlimited limits", async () => {
  const { repos } = createRepos();
  const service = new AssetLimitService(repos, createUnitOfWork(repos), locker);

  const result = await service.listForOwner(new Date("2026-03-12T09:00:00.000Z"));

  assert.equal(result.length, 4);
  assert.equal(result[0].dailyLimit, null);
  assert.equal(result[0].usage.daily.effectiveUsedAmount, "0");
});

test("AssetLimitService blocks agent reservations when the configured limit is exceeded", async () => {
  const { repos, policies, reservations } = createRepos();
  const now = new Date();
  const dailyWindowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();
  const weekday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const weeklyWindowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + mondayOffset,
  ).toISOString();
  const monthlyWindowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  policies.push({
    policyId: "alp_test",
    chain: "evm",
    asset: "USDC",
    dailyLimit: "100",
    weeklyLimit: null,
    monthlyLimit: null,
    updatedBy: "OWNER",
    createdAt: "2026-03-12T00:00:00.000Z",
    updatedAt: "2026-03-12T00:00:00.000Z",
  });
  reservations.push({
    reservationId: "alr_existing",
    operationId: "op_existing",
    actorRole: "AGENT",
    chain: "evm",
    asset: "USDC",
    amount: "80",
    dailyWindowStart,
    weeklyWindowStart,
    monthlyWindowStart,
    status: "CONSUMED",
    releaseReason: null,
    createdAt: "2026-03-12T01:00:00.000Z",
    updatedAt: "2026-03-12T01:00:00.000Z",
    settledAt: "2026-03-12T01:05:00.000Z",
  });

  const service = new AssetLimitService(repos, createUnitOfWork(repos), locker);

  await assert.rejects(
    () =>
      service.reserveForAgentTransfer({
        operationId: "op_new",
        chain: "evm",
        asset: "USDC",
        amount: "30",
      }),
    (error) =>
      error instanceof WalletDomainError &&
      error.code === "ASSET_LIMIT_EXCEEDED" &&
      error.details?.limit?.asset === "USDC",
  );
});
