import { createPrefixedId, nowIso } from "@superise/shared";
import type { ActorRole, AssetKind, AssetLimitPolicy, ChainKind } from "../entities/types";

export function createAssetLimitPolicy(input: {
  chain: ChainKind;
  asset: AssetKind;
  dailyLimit: string | null;
  weeklyLimit: string | null;
  monthlyLimit: string | null;
  updatedBy: Extract<ActorRole, "OWNER" | "SYSTEM">;
}): AssetLimitPolicy {
  const timestamp = nowIso();

  return {
    policyId: createPrefixedId("alp"),
    chain: input.chain,
    asset: input.asset,
    dailyLimit: input.dailyLimit,
    weeklyLimit: input.weeklyLimit,
    monthlyLimit: input.monthlyLimit,
    updatedBy: input.updatedBy,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateAssetLimitPolicy(
  policy: AssetLimitPolicy,
  patch: {
    dailyLimit: string | null;
    weeklyLimit: string | null;
    monthlyLimit: string | null;
    updatedBy: Extract<ActorRole, "OWNER" | "SYSTEM">;
  },
): AssetLimitPolicy {
  return {
    ...policy,
    dailyLimit: patch.dailyLimit,
    weeklyLimit: patch.weeklyLimit,
    monthlyLimit: patch.monthlyLimit,
    updatedBy: patch.updatedBy,
    updatedAt: nowIso(),
  };
}
