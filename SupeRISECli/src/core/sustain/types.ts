/**
 * Sustain Core Type Definitions
 * 
 * Core types for the sustain keep-alive system.
 * See: docs/sustain/DESIGN.md
 */

// ===== Strategy & Policy =====

export type SustainStrategy = "availability" | "balanced" | "cost";

export type Thresholds = {
  critical: number;
  low: number;
};

export type SustainPolicy = {
  strategy: SustainStrategy;
  autoTopUpEnabled: boolean;
  topUpAmountDefault: number;
  thresholds: Thresholds;
  budget: {
    dailyTopUpLimit: number;
    dailyTopUpCount: number;
    singleTopUpMinCKB: number;
    singleTopUpMaxCKB: number;
    renewCounterDate: string;
  };
};

// ===== Actions =====

export type SustainActionType =
  | "noop"
  | "switch_model"
  | "top_up"
  | "switch_then_top_up";

export type SustainAction = {
  type: SustainActionType;
  targetModel?: string;
  topUpAmount?: number;
  reason: string;
};

// ===== Observations =====

export type BalanceObservation = {
  ts: string;
  remaining: number;
};

// ===== Forecast =====

export type ForecastResult = {
  burnRate: number;
  etaCritical: number;
  etaZero: number;
  confidence: number;
  observationCount: number;
};

// ===== Plan =====

export type PlanRecord = {
  id: string;
  ts: string;
  balance: number;
  burnRate: number;
  etaCritical: number;
  action: SustainActionType;
  targetModel?: string;
  topUpAmount?: number;
  reason: string;
};

// ===== Action Execution =====

export type ActionRecord = {
  id: string;
  planId: string;
  ts: string;
  action: SustainActionType;
  targetModel?: string;
  topUpAmount?: number;
  success: boolean;
  error?: string;
  txHash?: string;
};

// ===== Scoring =====

export type DecisionScore = {
  availability: number;
  cost: number;
  stability: number;
  overall: number;
  note?: string;
};

export type ScoreRecord = {
  id: string;
  actionId: string;
  ts: string;
  score: DecisionScore;
};

// ===== Health Status =====

export type HealthStatus = "healthy" | "low" | "critical";

export type HealthCheckResult = {
  status: HealthStatus;
  balance: number;
  userName: string;
  thresholds: Thresholds;
  observedAt: string;
};
