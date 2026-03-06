/**
 * Default Sustain Policy
 *
 * Default configuration for sustain keep-alive system.
 */

/** @type {import("./types.js").SustainPolicy} */
export const DEFAULT_POLICY = {
  strategy: "balanced",
  autoTopUpEnabled: true,
  topUpAmountDefault: 1000,
  thresholds: {
    critical: 10,
    low: 100,
  },
  budget: {
    dailyTopUpLimit: 3,
    dailyTopUpCount: 0,
    singleTopUpMinCKB: 1000,
    singleTopUpMaxCKB: 20000,
    renewCounterDate: new Date().toISOString().split("T")[0],
  },
};
