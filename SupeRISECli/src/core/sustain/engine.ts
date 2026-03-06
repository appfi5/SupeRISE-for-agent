/**
 * Sustain Engine
 *
 * Provides sustain observability primitives only.
 * Decisions remain the responsibility of the agent using the CLI.
 */

import type {
  HealthCheckResult,
  HealthStatus,
  ForecastResult,
  SustainPolicy,
  BalanceObservation,
} from "./types";
import { getMarketClient } from "@/services/superise-market";
import { openclawModelsStatus } from "@/services/openclaw-cli";
import {
  initDatabase,
  appendObservation,
  getRecentObservations,
  loadPolicy,
  savePolicy,
} from "@/storage/sqlite-store";
import { DEFAULT_POLICY } from "./defaults";

let dbInitialized = false;

async function ensureDbInit(): Promise<void> {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

export function loadLocalPolicy(): SustainPolicy {
  const stored = loadPolicy();
  if (stored) {
    return {
      ...DEFAULT_POLICY,
      ...stored,
      thresholds: {
        ...DEFAULT_POLICY.thresholds,
        ...stored.thresholds,
      },
      budget: {
        ...DEFAULT_POLICY.budget,
        ...stored.budget,
      },
    };
  }

  savePolicy(DEFAULT_POLICY);
  return DEFAULT_POLICY;
}

export async function healthCheck(): Promise<HealthCheckResult> {
  await ensureDbInit();
  const client = getMarketClient();
  const balanceStatus = await client.fetchBalance();
  const policy = loadLocalPolicy();
  const observedAt = new Date().toISOString();

  appendObservation({
    ts: observedAt,
    remaining: balanceStatus.balance,
  });

  return {
    status: classifyStatus(
      balanceStatus.balance,
      policy.thresholds.critical,
      policy.thresholds.low,
    ),
    balance: balanceStatus.balance,
    userName: balanceStatus.userName,
    thresholds: policy.thresholds,
    observedAt,
  };
}

function classifyStatus(
  balance: number,
  critical: number,
  low: number,
): HealthStatus {
  if (balance <= critical) {
    return "critical";
  }
  if (balance <= low) {
    return "low";
  }
  return "healthy";
}

export async function forecast(): Promise<ForecastResult> {
  await ensureDbInit();
  const observations = getRecentObservations(500);

  if (observations.length < 2) {
    return {
      burnRate: await estimateBurnRateFromPricing(),
      etaCritical: -1,
      etaZero: -1,
      confidence: 0,
      observationCount: observations.length,
    };
  }

  const burnRate = calculateBurnRate(observations);
  const policy = loadLocalPolicy();
  const currentBalance = observations[0].remaining;
  const etaCritical =
    burnRate > 0 ? (currentBalance - policy.thresholds.critical) / burnRate : -1;
  const etaZero = burnRate > 0 ? currentBalance / burnRate : -1;

  return {
    burnRate,
    etaCritical,
    etaZero,
    confidence: Math.min(1, observations.length / 50),
    observationCount: observations.length,
  };
}

function calculateBurnRate(observations: BalanceObservation[]): number {
  if (observations.length < 2) {
    return 0;
  }

  const sorted = [...observations].sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
  );

  let totalRate = 0;
  let count = 0;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const timeDiffMinutes =
      (new Date(current.ts).getTime() - new Date(previous.ts).getTime()) / (1000 * 60);
    if (timeDiffMinutes <= 0) {
      continue;
    }

    const balanceDiff = previous.remaining - current.remaining;
    if (balanceDiff < 0) {
      continue;
    }

    totalRate += balanceDiff / timeDiffMinutes;
    count += 1;
  }

  return count > 0 ? totalRate / count : 0;
}

async function estimateBurnRateFromPricing(): Promise<number> {
  try {
    const client = getMarketClient();
    const models = await client.fetchModels();
    const status = await openclawModelsStatus();

    if (!status) {
      return 1;
    }

    const currentModel =
      models.find((model) => model.modelRef === status.modelRef) ??
      models.find(
        (model) =>
          model.shortName === status.model && model.provider === status.provider,
      );

    return currentModel?.avgPrice ?? 1;
  } catch {
    return 1;
  }
}
