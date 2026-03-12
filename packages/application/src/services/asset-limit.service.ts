import type {
  AssetLimitExceededDetail,
  OwnerAssetLimitEntryDto,
  OwnerAssetLimitListResponse,
} from "@superise/app-contracts";
import {
  createAssetLimitPolicy,
  createAssetLimitReservation,
  createAuditLog,
  releaseAssetLimitReservation,
  updateAssetLimitPolicy,
  consumeAssetLimitReservation,
  WalletDomainError,
  type ActorRole,
  type AssetKind,
  type AssetLimitPolicy,
  type AssetLimitReservation,
  type ChainKind,
} from "@superise/domain";
import type {
  AssetLimitLocker,
  RepositoryBundle,
  UnitOfWork,
} from "../ports";
import {
  getSupportedAssetLimitTarget,
  SUPPORTED_ASSET_LIMIT_TARGETS,
  toPublicChain,
} from "../utils/asset-limit-targets";

type AssetLimitWindowBoundary = {
  start: string;
  resetsAt: string;
};

type AssetLimitWindowBoundaries = {
  daily: AssetLimitWindowBoundary;
  weekly: AssetLimitWindowBoundary;
  monthly: AssetLimitWindowBoundary;
};

type AssetLimitUsageTotals = {
  dailyConsumed: bigint;
  weeklyConsumed: bigint;
  monthlyConsumed: bigint;
  dailyReserved: bigint;
  weeklyReserved: bigint;
  monthlyReserved: bigint;
};

const ZERO = 0n;

export class AssetLimitService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly unitOfWork: UnitOfWork,
    private readonly locker: AssetLimitLocker,
  ) {}

  async listForOwner(now = new Date()): Promise<OwnerAssetLimitListResponse> {
    const boundaries = getAssetLimitWindowBoundaries(now);
    const policies = await this.repos.assetLimitPolicies.listAll();
    const policiesByKey = new Map(
      policies.map((policy) => [createPolicyKey(policy.chain, policy.asset), policy]),
    );

    return Promise.all(
      SUPPORTED_ASSET_LIMIT_TARGETS.map(async (target) =>
        this.buildOwnerEntry(
          target.chain,
          target.asset,
          policiesByKey.get(createPolicyKey(target.chain, target.asset)) ?? null,
          boundaries,
        ),
      ),
    );
  }

  async updatePolicy(input: {
    chain: ChainKind;
    asset: AssetKind;
    dailyLimit?: string | null;
    weeklyLimit?: string | null;
    monthlyLimit?: string | null;
    updatedBy: Extract<ActorRole, "OWNER" | "SYSTEM">;
  }): Promise<OwnerAssetLimitEntryDto> {
    const target = getSupportedAssetLimitTarget(input.chain, input.asset);
    if (!target) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `Unsupported asset limit target: ${input.chain}/${input.asset}`,
      );
    }

    const policy = await this.unitOfWork.run<AssetLimitPolicy>(async (repos) => {
      const current = await repos.assetLimitPolicies.getByChainAsset(
        input.chain,
        input.asset,
      );
      const next = current
        ? updateAssetLimitPolicy(current, {
            dailyLimit:
              input.dailyLimit !== undefined ? input.dailyLimit : current.dailyLimit,
            weeklyLimit:
              input.weeklyLimit !== undefined ? input.weeklyLimit : current.weeklyLimit,
            monthlyLimit:
              input.monthlyLimit !== undefined
                ? input.monthlyLimit
                : current.monthlyLimit,
            updatedBy: input.updatedBy,
          })
        : createAssetLimitPolicy({
            chain: input.chain,
            asset: input.asset,
            dailyLimit: input.dailyLimit ?? null,
            weeklyLimit: input.weeklyLimit ?? null,
            monthlyLimit: input.monthlyLimit ?? null,
            updatedBy: input.updatedBy,
          });

      await repos.assetLimitPolicies.save(next);
      await repos.audits.save(
        createAuditLog({
          actorRole: input.updatedBy,
          action: "owner.asset_limit.update",
          result: "SUCCESS",
          metadata: {
            chain: toPublicChain(input.chain),
            asset: input.asset,
            dailyLimit: next.dailyLimit,
            weeklyLimit: next.weeklyLimit,
            monthlyLimit: next.monthlyLimit,
          },
        }),
      );

      return next;
    });

    return this.buildOwnerEntry(
      target.chain,
      target.asset,
      policy,
      getAssetLimitWindowBoundaries(new Date()),
    );
  }

  async reserveForAgentTransfer(input: {
    operationId: string;
    chain: ChainKind;
    asset: AssetKind;
    amount: string;
  }): Promise<AssetLimitReservation> {
    const target = getSupportedAssetLimitTarget(input.chain, input.asset);
    if (!target) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `Unsupported asset limit target: ${input.chain}/${input.asset}`,
      );
    }

    return this.locker.execute(createPolicyKey(input.chain, input.asset), async () =>
      this.unitOfWork.run(async (repos) => {
        const boundaries = getAssetLimitWindowBoundaries(new Date());
        const [policy, reservations] = await Promise.all([
          repos.assetLimitPolicies.getByChainAsset(input.chain, input.asset),
          repos.assetLimitReservations.listByChainAsset(input.chain, input.asset),
        ]);
        const usage = calculateUsageTotals(reservations, boundaries);
        const detail = evaluateLimitExceedance({
          chain: input.chain,
          asset: input.asset,
          amount: BigInt(input.amount),
          policy,
          usage,
          boundaries,
        });

        if (detail) {
          throw new WalletDomainError(
            "ASSET_LIMIT_EXCEEDED",
            `${detail.limit.asset} ${detail.limit.window.toLowerCase()} limit exceeded`,
            detail,
          );
        }

        const reservation = createAssetLimitReservation({
          operationId: input.operationId,
          chain: input.chain,
          asset: input.asset,
          amount: input.amount,
          dailyWindowStart: boundaries.daily.start,
          weeklyWindowStart: boundaries.weekly.start,
          monthlyWindowStart: boundaries.monthly.start,
        });

        await repos.assetLimitReservations.save(reservation);
        return reservation;
      }),
    );
  }

  async consumeReservation(operationId: string): Promise<void> {
    await this.updateReservation(operationId, (reservation) =>
      reservation.status === "CONSUMED"
        ? reservation
        : consumeAssetLimitReservation(reservation),
    );
  }

  async releaseReservation(operationId: string, reason: string): Promise<void> {
    await this.updateReservation(operationId, (reservation) =>
      reservation.status === "RELEASED"
        ? reservation
        : releaseAssetLimitReservation(reservation, reason),
    );
  }

  private async updateReservation(
    operationId: string,
    transform: (reservation: AssetLimitReservation) => AssetLimitReservation,
  ): Promise<void> {
    await this.unitOfWork.run(async (repos) => {
      const reservation = await repos.assetLimitReservations.getByOperationId(operationId);
      if (!reservation) {
        return;
      }

      await repos.assetLimitReservations.save(transform(reservation));
    });
  }

  private async buildOwnerEntry(
    chain: ChainKind,
    asset: AssetKind,
    policy: AssetLimitPolicy | null,
    boundaries: AssetLimitWindowBoundaries,
  ): Promise<OwnerAssetLimitEntryDto> {
    const target = getSupportedAssetLimitTarget(chain, asset);
    if (!target) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `Unsupported asset limit target: ${chain}/${asset}`,
      );
    }

    const reservations = await this.repos.assetLimitReservations.listByChainAsset(
      chain,
      asset,
    );
    const usage = calculateUsageTotals(reservations, boundaries);

    return {
      chain: target.publicChain,
      asset: target.asset,
      decimals: target.decimals,
      dailyLimit: policy?.dailyLimit ?? null,
      weeklyLimit: policy?.weeklyLimit ?? null,
      monthlyLimit: policy?.monthlyLimit ?? null,
      usage: {
        daily: buildWindowUsage(
          "DAILY",
          policy?.dailyLimit ?? null,
          usage.dailyConsumed,
          usage.dailyReserved,
          boundaries.daily.resetsAt,
        ),
        weekly: buildWindowUsage(
          "WEEKLY",
          policy?.weeklyLimit ?? null,
          usage.weeklyConsumed,
          usage.weeklyReserved,
          boundaries.weekly.resetsAt,
        ),
        monthly: buildWindowUsage(
          "MONTHLY",
          policy?.monthlyLimit ?? null,
          usage.monthlyConsumed,
          usage.monthlyReserved,
          boundaries.monthly.resetsAt,
        ),
      },
      updatedAt: policy?.updatedAt ?? null,
      updatedBy: policy?.updatedBy ?? null,
    };
  }
}

function getAssetLimitWindowBoundaries(now: Date): AssetLimitWindowBoundaries {
  const dailyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dailyReset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const weekday = dailyStart.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const weeklyStart = new Date(
    dailyStart.getFullYear(),
    dailyStart.getMonth(),
    dailyStart.getDate() + mondayOffset,
  );
  const weeklyReset = new Date(
    weeklyStart.getFullYear(),
    weeklyStart.getMonth(),
    weeklyStart.getDate() + 7,
  );

  const monthlyStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    daily: {
      start: dailyStart.toISOString(),
      resetsAt: dailyReset.toISOString(),
    },
    weekly: {
      start: weeklyStart.toISOString(),
      resetsAt: weeklyReset.toISOString(),
    },
    monthly: {
      start: monthlyStart.toISOString(),
      resetsAt: monthlyReset.toISOString(),
    },
  };
}

function calculateUsageTotals(
  reservations: AssetLimitReservation[],
  boundaries: AssetLimitWindowBoundaries,
): AssetLimitUsageTotals {
  const totals: AssetLimitUsageTotals = {
    dailyConsumed: ZERO,
    weeklyConsumed: ZERO,
    monthlyConsumed: ZERO,
    dailyReserved: ZERO,
    weeklyReserved: ZERO,
    monthlyReserved: ZERO,
  };

  for (const reservation of reservations) {
    if (reservation.status !== "ACTIVE" && reservation.status !== "CONSUMED") {
      continue;
    }

    const amount = BigInt(reservation.amount);
    const bucket = reservation.status === "CONSUMED" ? "Consumed" : "Reserved";

    if (reservation.dailyWindowStart === boundaries.daily.start) {
      totals[`daily${bucket}`] += amount;
    }
    if (reservation.weeklyWindowStart === boundaries.weekly.start) {
      totals[`weekly${bucket}`] += amount;
    }
    if (reservation.monthlyWindowStart === boundaries.monthly.start) {
      totals[`monthly${bucket}`] += amount;
    }
  }

  return totals;
}

function evaluateLimitExceedance(input: {
  chain: ChainKind;
  asset: AssetKind;
  amount: bigint;
  policy: AssetLimitPolicy | null;
  usage: AssetLimitUsageTotals;
  boundaries: AssetLimitWindowBoundaries;
}): AssetLimitExceededDetail | null {
  const candidate = [
    {
      window: "DAILY" as const,
      limitAmount: input.policy?.dailyLimit ?? null,
      usedAmount: input.usage.dailyConsumed + input.usage.dailyReserved,
      resetsAt: input.boundaries.daily.resetsAt,
    },
    {
      window: "WEEKLY" as const,
      limitAmount: input.policy?.weeklyLimit ?? null,
      usedAmount: input.usage.weeklyConsumed + input.usage.weeklyReserved,
      resetsAt: input.boundaries.weekly.resetsAt,
    },
    {
      window: "MONTHLY" as const,
      limitAmount: input.policy?.monthlyLimit ?? null,
      usedAmount: input.usage.monthlyConsumed + input.usage.monthlyReserved,
      resetsAt: input.boundaries.monthly.resetsAt,
    },
  ].find((window) => {
    if (window.limitAmount === null) {
      return false;
    }

    return window.usedAmount + input.amount > BigInt(window.limitAmount);
  });

  if (!candidate || candidate.limitAmount === null) {
    return null;
  }

  const remainingAmount = clampToZero(BigInt(candidate.limitAmount) - candidate.usedAmount);

  return {
    limit: {
      chain: toPublicChain(input.chain),
      asset: input.asset,
      window: candidate.window,
      limitAmount: candidate.limitAmount,
      usedAmount: candidate.usedAmount.toString(),
      requestedAmount: input.amount.toString(),
      remainingAmount: remainingAmount.toString(),
      resetsAt: candidate.resetsAt,
    },
  };
}

function buildWindowUsage<TWindow extends "DAILY" | "WEEKLY" | "MONTHLY">(
  window: TWindow,
  limitAmount: string | null,
  consumedAmount: bigint,
  reservedAmount: bigint,
  resetsAt: string,
): {
  window: TWindow;
  limitAmount: string | null;
  consumedAmount: string;
  reservedAmount: string;
  effectiveUsedAmount: string;
  remainingAmount: string | null;
  resetsAt: string;
} {
  const effectiveUsedAmount = consumedAmount + reservedAmount;

  return {
    window,
    limitAmount,
    consumedAmount: consumedAmount.toString(),
    reservedAmount: reservedAmount.toString(),
    effectiveUsedAmount: effectiveUsedAmount.toString(),
    remainingAmount:
      limitAmount === null
        ? null
        : clampToZero(BigInt(limitAmount) - effectiveUsedAmount).toString(),
    resetsAt,
  };
}

function clampToZero(value: bigint): bigint {
  return value > ZERO ? value : ZERO;
}

function createPolicyKey(chain: ChainKind, asset: AssetKind): string {
  return `${chain}:${asset}`;
}
