/**
 * @typedef {"availability" | "balanced" | "cost"} SustainStrategy
 *
 * @typedef {{ critical: number; low: number }} Thresholds
 *
 * @typedef {{
 *   strategy: SustainStrategy;
 *   autoTopUpEnabled: boolean;
 *   topUpAmountDefault: number;
 *   thresholds: Thresholds;
 *   budget: {
 *     dailyTopUpLimit: number;
 *     dailyTopUpCount: number;
 *     singleTopUpMinCKB: number;
 *     singleTopUpMaxCKB: number;
 *     renewCounterDate: string;
 *   };
 * }} SustainPolicy
 *
 * @typedef {"noop" | "switch_model" | "top_up" | "switch_then_top_up"} SustainActionType
 *
 * @typedef {{
 *   type: SustainActionType;
 *   targetModel?: string;
 *   topUpAmount?: number;
 *   reason: string;
 * }} SustainAction
 *
 * @typedef {{ ts: string; remaining: number }} BalanceObservation
 *
 * @typedef {{
 *   burnRate: number;
 *   etaCritical: number;
 *   etaZero: number;
 *   confidence: number;
 *   observationCount: number;
 * }} ForecastResult
 *
 * @typedef {{
 *   id: string;
 *   ts: string;
 *   balance: number;
 *   burnRate: number;
 *   etaCritical: number;
 *   action: SustainActionType;
 *   targetModel?: string;
 *   topUpAmount?: number;
 *   reason: string;
 * }} PlanRecord
 *
 * @typedef {{
 *   id: string;
 *   planId: string;
 *   ts: string;
 *   action: SustainActionType;
 *   targetModel?: string;
 *   topUpAmount?: number;
 *   success: boolean;
 *   error?: string;
 *   txHash?: string;
 * }} ActionRecord
 *
 * @typedef {{
 *   availability: number;
 *   cost: number;
 *   stability: number;
 *   overall: number;
 *   note?: string;
 * }} DecisionScore
 *
 * @typedef {{
 *   id: string;
 *   actionId: string;
 *   ts: string;
 *   score: DecisionScore;
 * }} ScoreRecord
 *
 * @typedef {"healthy" | "low" | "critical"} HealthStatus
 *
 * @typedef {{
 *   status: HealthStatus;
 *   balance: number;
 *   userName: string;
 *   thresholds: Thresholds;
 *   observedAt: string;
 * }} HealthCheckResult
 */

export {};
