/**
 * Default Sustain Policy
 * 
 * Default configuration for sustain keep-alive system.
 */

import type { SustainPolicy } from "./types";

export const DEFAULT_POLICY: SustainPolicy = {
  strategy: "balanced",
  autoTopUpEnabled: true,
  topUpAmountDefault: 100,
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
