/**
 * Sustain Engine
 * 
 * Core decision-making engine for keep-alive management.
 * Implements healthCheck, forecast, plan, act, tick, and score functions.
 */

import { randomUUID } from "crypto";
import type {
  HealthCheckResult,
  HealthStatus,
  ForecastResult,
  PlanRecord,
  ActionRecord,
  ScoreRecord,
  SustainPolicy,
  SustainActionType,
  BalanceObservation,
} from "./types";
import type { ModelWithPricing } from "@/services/platform-types";
import { getMarketClient } from "@/services/superise-market";
import {
  openclawModelsStatus,
  openclawModelsSet,
} from "@/services/openclaw-cli";
import {
  initDatabase,
  appendObservation,
  getRecentObservations,
  appendPlan,
  getRecentPlans,
  appendAction,
  getRecentActions,
  appendScore,
  getLatestScore,
  loadPolicy,
  savePolicy,
  pruneOldObservations,
} from "@/storage/sqlite-store";
import { DEFAULT_POLICY } from "./defaults";

// Ensure database is initialized
let dbInitialized = false;
async function ensureDbInit() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// ===== Policy Management =====

export function loadLocalPolicy(): SustainPolicy {
  const stored = loadPolicy();
  if (stored) {
    // Merge with defaults to handle missing fields from older stored policies
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

export function updateLocalPolicy(updates: Partial<SustainPolicy>): SustainPolicy {
  const current = loadLocalPolicy();
  const updated: SustainPolicy = {
    ...current,
    ...updates,
    thresholds: {
      ...current.thresholds,
      ...(updates.thresholds ?? {}),
    },
    budget: {
      ...current.budget,
      ...(updates.budget ?? {}),
    },
  };
  savePolicy(updated);
  return updated;
}

// ===== Health Check =====

export async function healthCheck(): Promise<HealthCheckResult> {
  await ensureDbInit();
  const client = getMarketClient();
  const balanceStatus = await client.fetchBalance();
  const policy = loadLocalPolicy();

  appendObservation({
    ts: new Date().toISOString(),
    remaining: balanceStatus.balance,
  });

  const status = classifyStatus(
    balanceStatus.balance,
    policy.thresholds.critical,
    policy.thresholds.low
  );

  return {
    status,
    balance: balanceStatus.balance,
    userName: balanceStatus.userName,
    thresholds: policy.thresholds,
    observedAt: new Date().toISOString(),
  };
}

function classifyStatus(
  balance: number,
  critical: number,
  low: number
): HealthStatus {
  if (balance <= critical) return "critical";
  if (balance <= low) return "low";
  return "healthy";
}

// ===== Forecast =====

export async function forecast(): Promise<ForecastResult> {
  await ensureDbInit();
  const observations = getRecentObservations(500);
  
  if (observations.length < 2) {
    const fallbackRate = await estimateBurnRateFromPricing();
    return {
      burnRate: fallbackRate,
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
    burnRate > 0
      ? (currentBalance - policy.thresholds.critical) / burnRate
      : -1;
  const etaZero = burnRate > 0 ? currentBalance / burnRate : -1;

  const confidence = Math.min(1.0, observations.length / 50);

  return {
    burnRate,
    etaCritical,
    etaZero,
    confidence,
    observationCount: observations.length,
  };
}

function calculateBurnRate(observations: BalanceObservation[]): number {
  if (observations.length < 2) return 0;

  const sorted = [...observations].sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
  );

  let totalRate = 0;
  let count = 0;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const timeDiff =
      (new Date(curr.ts).getTime() - new Date(prev.ts).getTime()) / (1000 * 60);
    if (timeDiff > 0) {
      const balanceDiff = prev.remaining - curr.remaining;
      // Skip top-up events (balance increased) to avoid skewing burn rate
      if (balanceDiff < 0) continue;
      const rate = balanceDiff / timeDiff;
      totalRate += rate;
      count++;
    }
  }

  return count > 0 ? totalRate / count : 0;
}

async function estimateBurnRateFromPricing(): Promise<number> {
  try {
    const client = getMarketClient();
    const models = await client.fetchModels();
    const status = await openclawModelsStatus();
    
    if (!status) return 1;

    const currentModel = models.find((m) => m.shortName === status.model);
    if (!currentModel) return 1;

    return currentModel.avgPrice;
  } catch {
    return 1;
  }
}

// ===== Plan =====

export async function plan(precomputed?: ForecastResult): Promise<PlanRecord> {
  await ensureDbInit();
  const forecastResult = precomputed ?? await forecast();
  const policy = loadLocalPolicy();
  const observations = getRecentObservations(1);
  const currentBalance = observations[0]?.remaining || 0;

  const status = classifyStatus(
    currentBalance,
    policy.thresholds.critical,
    policy.thresholds.low
  );

  let action: SustainActionType = "noop";
  let targetModel: string | undefined;
  let topUpAmount: number | undefined;
  let reason = "";

  if (status === "healthy") {
    action = "noop";
    reason = "Balance is healthy, no action needed";
  } else if (status === "low") {
    const cheaperModel = await selectCheaperModel();
    if (cheaperModel) {
      action = "switch_model";
      targetModel = cheaperModel.shortName;
      reason = `Balance low, switching to cheaper model ${cheaperModel.displayName} (price: ${cheaperModel.minPrice})`;
    } else {
      action = "noop";
      reason = "Balance low but no cheaper model available";
    }
  } else if (status === "critical") {
    if (policy.strategy === "cost") {
      const cheapestModel = await selectCheapestModel();
      if (cheapestModel) {
        action = "switch_model";
        targetModel = cheapestModel.shortName;
        reason = `Critical: switching to cheapest model ${cheapestModel.displayName}`;
      } else {
        action = "noop";
        reason = "Critical but no cheaper model available";
      }
    } else if (policy.strategy === "availability") {
      action = "top_up";
      reason = `Critical: top-up needed to maintain availability (burn=${forecastResult.burnRate.toFixed(2)}/min)`;
    } else {
      const cheaperModel = await selectCheaperModel();
      if (cheaperModel) {
        action = "switch_then_top_up";
        targetModel = cheaperModel.shortName;
        reason = `Critical: switching to ${cheaperModel.displayName} and top-up needed (burn=${forecastResult.burnRate.toFixed(2)}/min)`;
      } else {
        action = "top_up";
        reason = `Critical: top-up needed (burn=${forecastResult.burnRate.toFixed(2)}/min, no cheaper model available)`;
      }
    }
  }

  const planRecord: PlanRecord = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    balance: currentBalance,
    burnRate: forecastResult.burnRate,
    etaCritical: forecastResult.etaCritical,
    action,
    targetModel,
    topUpAmount,
    reason,
  };

  appendPlan(planRecord);
  return planRecord;
}

async function selectCheaperModel(): Promise<ModelWithPricing | null> {
  const client = getMarketClient();
  const models = await client.fetchModels();
  const status = await openclawModelsStatus();
  
  if (!status) return null;

  const current = models.find((m) => m.shortName === status.model);
  if (!current) return null;

  const candidates = models
    .filter((m) => m.shortName !== status.model && m.minPrice < current.minPrice)
    .sort((a, b) => b.minPrice - a.minPrice);

  return candidates[0] || null;
}

async function selectCheapestModel(): Promise<ModelWithPricing | null> {
  const client = getMarketClient();
  const models = await client.fetchModels();
  const status = await openclawModelsStatus();
  
  if (!status) return null;

  // Exclude the current model so we don't "switch" to it
  const candidates = models
    .filter((m) => m.shortName !== status.model)
    .sort((a, b) => a.minPrice - b.minPrice);
  return candidates[0] || null;
}

// ===== Act =====

export async function act(planId: string, dryRun: boolean = false): Promise<ActionRecord> {
  await ensureDbInit();
  const plans = getRecentPlans(100);
  const planRecord = plans.find((p) => p.id === planId);

  if (!planRecord) {
    throw new Error(`Plan ${planId} not found`);
  }

  const actionRecord: ActionRecord = {
    id: randomUUID(),
    planId,
    ts: new Date().toISOString(),
    action: planRecord.action,
    targetModel: planRecord.targetModel,
    topUpAmount: planRecord.topUpAmount,
    success: false,
  };

  if (dryRun) {
    actionRecord.success = true;
    actionRecord.error = "dry-run mode";
    appendAction(actionRecord);
    return actionRecord;
  }

  try {
    if (planRecord.action === "noop") {
      actionRecord.success = true;
    } else if (planRecord.action === "switch_model") {
      if (!planRecord.targetModel) {
        throw new Error("No target model specified");
      }
      const modelRef = `openrouter/${planRecord.targetModel}`;
      const success = await openclawModelsSet(modelRef);
      actionRecord.success = success;
      if (!success) {
        actionRecord.error = `Failed to switch to ${modelRef}`;
      }
    } else if (planRecord.action === "top_up") {
      if (!planRecord.topUpAmount) {
        throw new Error("No top-up amount specified");
      }
      const client = getMarketClient();
      const result = await client.topUp(planRecord.topUpAmount, false);
      actionRecord.success = result.success;
      actionRecord.txHash = result.txHash;
      if (!result.success) {
        actionRecord.error = result.error || "Top-up failed";
      }
    } else if (planRecord.action === "switch_then_top_up") {
      if (!planRecord.targetModel || !planRecord.topUpAmount) {
        throw new Error("Missing target model or top-up amount");
      }

      const modelRef = `openrouter/${planRecord.targetModel}`;
      const switchSuccess = await openclawModelsSet(modelRef);
      if (!switchSuccess) {
        actionRecord.success = false;
        actionRecord.error = `Failed to switch to ${modelRef}`;
      } else {
        const client = getMarketClient();
        const result = await client.topUp(planRecord.topUpAmount, false);
        actionRecord.success = result.success;
        actionRecord.txHash = result.txHash;
        if (!result.success) {
          actionRecord.error = result.error || "Top-up failed after switch";
        }
      }
    }
  } catch (error) {
    actionRecord.success = false;
    actionRecord.error = error instanceof Error ? error.message : String(error);
  }

  appendAction(actionRecord);
  return actionRecord;
}

// ===== Score =====

export async function scoreDecision(actionId: string): Promise<ScoreRecord> {
  await ensureDbInit();
  const actions = getRecentActions(100);
  const actionRecord = actions.find((a) => a.id === actionId);

  if (!actionRecord) {
    throw new Error(`Action ${actionId} not found`);
  }

  let availability = 0;
  let cost = 0;
  let stability = 0;

  if (!actionRecord.success) {
    availability = -1.0;
    cost = 0;
    stability = -0.5;
  } else if (actionRecord.action === "noop") {
    availability = 0.5;
    cost = 0.5;
    stability = 0.8;
  } else if (actionRecord.action === "switch_model") {
    availability = 0.3;
    cost = 0.4;
    stability = -0.2;
  } else if (actionRecord.action === "top_up") {
    // Verify top-up effect by comparing balance before/after
    const observations = getRecentObservations(2);
    if (observations.length >= 2) {
      const balanceGain = observations[0].remaining - observations[1].remaining;
      availability = balanceGain > 0 ? 1.0 : 0.2;
    } else {
      availability = 1.0;
    }
    cost = -0.6;
    stability = 0.5;
  } else if (actionRecord.action === "switch_then_top_up") {
    availability = 0.9;
    cost = -0.5;
    stability = -0.1;
  }

  const overall = (availability + cost + stability) / 3;

  const scoreRecord: ScoreRecord = {
    id: randomUUID(),
    actionId,
    ts: new Date().toISOString(),
    score: {
      availability,
      cost,
      stability,
      overall,
    },
  };

  appendScore(scoreRecord);
  return scoreRecord;
}

// ===== Tick =====

export async function tick(execute: boolean = false): Promise<{
  health: HealthCheckResult;
  forecast: ForecastResult;
  plan: PlanRecord;
  action?: ActionRecord;
  score?: ScoreRecord;
}> {
  await ensureDbInit();

  const health = await healthCheck();
  const forecastResult = await forecast();
  // Pass pre-computed forecast to plan() to avoid duplicate API calls
  const planRecord = await plan(forecastResult);

  // Prune old observations periodically
  pruneOldObservations(1000);

  if (!execute) {
    // Score noop actions too for complete decision history
    if (planRecord.action === "noop") {
      const noopAction: ActionRecord = {
        id: randomUUID(),
        planId: planRecord.id,
        ts: new Date().toISOString(),
        action: "noop",
        success: true,
      };
      appendAction(noopAction);
      const scoreRecord = await scoreDecision(noopAction.id);
      return {
        health,
        forecast: forecastResult,
        plan: planRecord,
        score: scoreRecord,
      };
    }
    return {
      health,
      forecast: forecastResult,
      plan: planRecord,
    };
  }

  if (planRecord.action === "noop") {
    const noopAction: ActionRecord = {
      id: randomUUID(),
      planId: planRecord.id,
      ts: new Date().toISOString(),
      action: "noop",
      success: true,
    };
    appendAction(noopAction);
    const scoreRecord = await scoreDecision(noopAction.id);
    return {
      health,
      forecast: forecastResult,
      plan: planRecord,
      score: scoreRecord,
    };
  }

  const actionRecord = await act(planRecord.id, false);
  const scoreRecord = await scoreDecision(actionRecord.id);

  return {
    health,
    forecast: forecastResult,
    plan: planRecord,
    action: actionRecord,
    score: scoreRecord,
  };
}
