import { createPrefixedId, nowIso } from "@superise/shared";
import type {
  AssetKind,
  AssetLimitReservation,
  ChainKind,
} from "../entities/types";

export function createAssetLimitReservation(input: {
  operationId: string;
  chain: ChainKind;
  asset: AssetKind;
  amount: string;
  dailyWindowStart: string;
  weeklyWindowStart: string;
  monthlyWindowStart: string;
}): AssetLimitReservation {
  const timestamp = nowIso();

  return {
    reservationId: createPrefixedId("alr"),
    operationId: input.operationId,
    actorRole: "AGENT",
    chain: input.chain,
    asset: input.asset,
    amount: input.amount,
    dailyWindowStart: input.dailyWindowStart,
    weeklyWindowStart: input.weeklyWindowStart,
    monthlyWindowStart: input.monthlyWindowStart,
    status: "ACTIVE",
    releaseReason: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    settledAt: null,
  };
}

export function consumeAssetLimitReservation(
  reservation: AssetLimitReservation,
): AssetLimitReservation {
  const timestamp = nowIso();

  return {
    ...reservation,
    status: "CONSUMED",
    releaseReason: null,
    updatedAt: timestamp,
    settledAt: timestamp,
  };
}

export function releaseAssetLimitReservation(
  reservation: AssetLimitReservation,
  reason: string,
): AssetLimitReservation {
  const timestamp = nowIso();

  return {
    ...reservation,
    status: "RELEASED",
    releaseReason: reason,
    updatedAt: timestamp,
    settledAt: timestamp,
  };
}
