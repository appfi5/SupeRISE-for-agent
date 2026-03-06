/**
 * Sustain Engine
 *
 * Provides sustain observability primitives.
 * Decisions remain the responsibility of the agent using the CLI.
 *
 * Migrated from SupeRISECli/src/core/sustain/engine.ts — structure only,
 * no business-rule changes per docs/refactor/ARCHITECTURE.md §4.8.
 *
 * External service adapters (market client, openclaw) are injected at call-sites
 * so that the engine itself has no hard dependency on specific HTTP clients.
 */

import { DEFAULT_POLICY } from "./defaults.js";

/**
 * Merge stored policy with defaults.
 * @param {object} stored  persisted policy (or null)
 * @returns {import("./types.js").SustainPolicy}
 */
export function loadLocalPolicy(stored) {
  if (stored) {
    return {
      ...DEFAULT_POLICY,
      ...stored,
      thresholds: { ...DEFAULT_POLICY.thresholds, ...stored.thresholds },
      budget: { ...DEFAULT_POLICY.budget, ...stored.budget },
    };
  }
  return { ...DEFAULT_POLICY };
}

/**
 * Classify health status based on balance & thresholds.
 * @param {number} balance
 * @param {number} critical
 * @param {number} low
 * @returns {import("./types.js").HealthStatus}
 */
export function classifyStatus(balance, critical, low) {
  if (balance <= critical) return "critical";
  if (balance <= low) return "low";
  return "healthy";
}

/**
 * Calculate average burn rate from a list of chronological observations.
 * @param {import("./types.js").BalanceObservation[]} observations
 * @returns {number}  burn rate in credits/min (0 when insufficient data)
 */
export function calculateBurnRate(observations) {
  if (observations.length < 2) return 0;

  const sorted = [...observations].sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
  );

  let totalRate = 0;
  let count = 0;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const diffMin = (new Date(cur.ts).getTime() - new Date(prev.ts).getTime()) / 60_000;
    if (diffMin <= 0) continue;
    const balanceDiff = prev.remaining - cur.remaining;
    if (balanceDiff < 0) continue;
    totalRate += balanceDiff / diffMin;
    count++;
  }

  return count > 0 ? totalRate / count : 0;
}

/**
 * Build a forecast from observations + policy.
 * @param {import("./types.js").BalanceObservation[]} observations
 * @param {import("./types.js").SustainPolicy} policy
 * @param {number} [fallbackBurnRate]
 * @returns {import("./types.js").ForecastResult}
 */
export function buildForecast(observations, policy, fallbackBurnRate = 1) {
  if (observations.length < 2) {
    return {
      burnRate: fallbackBurnRate,
      etaCritical: -1,
      etaZero: -1,
      confidence: 0,
      observationCount: observations.length,
    };
  }

  const burnRate = calculateBurnRate(observations);
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
