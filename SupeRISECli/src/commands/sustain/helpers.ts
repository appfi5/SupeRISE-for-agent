/**
 * Sustain Command Helpers
 * 
 * Formatting utilities for sustain CLI output.
 */

import Table from "cli-table3";
import pc from "picocolors";
import type {
  HealthCheckResult,
  ForecastResult,
  PlanRecord,
  ActionRecord,
  ScoreRecord,
} from "@/core/sustain/types";

export function formatHealthCheck(result: HealthCheckResult): string {
  const statusColor =
    result.status === "healthy"
      ? pc.green
      : result.status === "low"
      ? pc.yellow
      : pc.red;

  const lines = [
    pc.bold("Health Check"),
    "",
    `Status: ${statusColor(result.status.toUpperCase())}`,
    `Balance: ${result.balance}`,
    `User: ${result.userName}`,
    `Thresholds: critical=${result.thresholds.critical}, low=${result.thresholds.low}`,
    `Observed: ${result.observedAt}`,
  ];

  return lines.join("\n");
}

export function formatForecast(result: ForecastResult): string {
  const lines = [
    pc.bold("Forecast"),
    "",
    `Burn Rate: ${result.burnRate.toFixed(2)} credits/min`,
    `ETA Critical: ${result.etaCritical > 0 ? `${result.etaCritical.toFixed(0)} min` : "N/A"}`,
    `ETA Zero: ${result.etaZero > 0 ? `${result.etaZero.toFixed(0)} min` : "N/A"}`,
    `Confidence: ${(result.confidence * 100).toFixed(0)}%`,
    `Observations: ${result.observationCount}`,
  ];

  return lines.join("\n");
}

export function formatPlan(result: PlanRecord): string {
  const actionColor =
    result.action === "noop"
      ? pc.gray
      : result.action === "switch_model"
      ? pc.yellow
      : pc.red;

  const lines = [
    pc.bold("Plan"),
    "",
    `ID: ${result.id}`,
    `Action: ${actionColor(result.action)}`,
    `Balance: ${result.balance}`,
    `Burn Rate: ${result.burnRate.toFixed(2)} credits/min`,
    `ETA Critical: ${result.etaCritical > 0 ? `${result.etaCritical.toFixed(0)} min` : "N/A"}`,
  ];

  if (result.targetModel) {
    lines.push(`Target Model: ${result.targetModel}`);
  }

  if (result.topUpAmount) {
    lines.push(`Top-up Amount: ${result.topUpAmount} CKB`);
  }

  lines.push(`Reason: ${result.reason}`);
  lines.push(`Timestamp: ${result.ts}`);

  return lines.join("\n");
}

export function formatAction(result: ActionRecord): string {
  const statusColor = result.success ? pc.green : pc.red;

  const lines = [
    pc.bold("Action"),
    "",
    `ID: ${result.id}`,
    `Plan ID: ${result.planId}`,
    `Action: ${result.action}`,
    `Status: ${statusColor(result.success ? "SUCCESS" : "FAILED")}`,
  ];

  if (result.targetModel) {
    lines.push(`Target Model: ${result.targetModel}`);
  }

  if (result.topUpAmount) {
    lines.push(`Top-up Amount: ${result.topUpAmount} CKB`);
  }

  if (result.txHash) {
    lines.push(`TX Hash: ${result.txHash}`);
  }

  if (result.error) {
    lines.push(`Error: ${pc.red(result.error)}`);
  }

  lines.push(`Timestamp: ${result.ts}`);

  return lines.join("\n");
}

export function formatScore(result: ScoreRecord): string {
  const lines = [
    pc.bold("Decision Score"),
    "",
    `ID: ${result.id}`,
    `Action ID: ${result.actionId}`,
    "",
    `Availability: ${formatScoreValue(result.score.availability)}`,
    `Cost: ${formatScoreValue(result.score.cost)}`,
    `Stability: ${formatScoreValue(result.score.stability)}`,
    `Overall: ${formatScoreValue(result.score.overall)}`,
  ];

  if (result.score.note) {
    lines.push(`Note: ${result.score.note}`);
  }

  lines.push(`Timestamp: ${result.ts}`);

  return lines.join("\n");
}

function formatScoreValue(value: number): string {
  const color = value > 0.3 ? pc.green : value > -0.3 ? pc.yellow : pc.red;
  return color(value.toFixed(2));
}

export function formatTick(result: {
  health: HealthCheckResult;
  forecast: ForecastResult;
  plan: PlanRecord;
  action?: ActionRecord;
  score?: ScoreRecord;
}): string {
  const sections = [
    pc.bold("=== Tick Cycle ==="),
    "",
    formatHealthCheck(result.health),
    "",
    formatForecast(result.forecast),
    "",
    formatPlan(result.plan),
  ];

  if (result.action) {
    sections.push("", formatAction(result.action));
  }

  if (result.score) {
    sections.push("", formatScore(result.score));
  }

  return sections.join("\n");
}

/**
 * Build a plain-text tick summary for system event notification.
 * No ANSI colors — this goes into the OpenClaw agent session as a message.
 */
export function buildTickSummary(result: {
  health: HealthCheckResult;
  forecast: ForecastResult;
  plan: PlanRecord;
  action?: ActionRecord;
  score?: ScoreRecord;
}): string {
  const h = result.health;
  const f = result.forecast;
  const p = result.plan;

  const lines = [
    `[Sustain Tick] ${new Date().toISOString()}`,
    `Status: ${h.status.toUpperCase()} | Balance: ${h.balance}`,
    `Burn: ${f.burnRate.toFixed(2)}/min | ETA critical: ${f.etaCritical ?? "N/A"} min | ETA zero: ${f.etaZero ?? "N/A"} min`,
    `Plan: ${p.action}${p.targetModel ? ` → ${p.targetModel}` : ""}${p.topUpAmount ? ` (${p.topUpAmount} CKB)` : ""}`,
    `Reason: ${p.reason}`,
  ];

  if (result.action) {
    const a = result.action;
    lines.push(`Action: ${a.action} — ${a.success ? "✅ success" : "❌ failed"}${a.error ? ` (${a.error})` : ""}`);
  }

  if (result.score) {
    const s = result.score.score;
    lines.push(`Score: avail=${(s.availability ?? 0).toFixed(1)} cost=${(s.cost ?? 0).toFixed(1)} stab=${(s.stability ?? 0).toFixed(1)} overall=${(s.overall ?? 0).toFixed(1)}`);
  }

  return lines.join("\n");
}

export function formatModelsList(result: {
  candidates: Array<{
    model: string;
    modelRef: string;
    displayName: string;
    provider: string;
    minPrice: number;
    avgPrice: number;
    quotationCount: number;
  }>;
  currentModel: string | null;
  currentModelRef: string | null;
}): string {
  const table = new Table({
    head: ["Model", "Display Name", "Provider", "Min Price", "Avg Price", "Quotations"],
    colWidths: [20, 25, 15, 12, 12, 12],
  });

  for (const model of result.candidates) {
    const isCurrent = model.model === result.currentModel;
    const modelName = isCurrent ? pc.green(`${model.model} *`) : model.model;

    table.push([
      modelName,
      model.displayName,
      model.provider,
      model.minPrice.toString(),
      model.avgPrice.toString(),
      model.quotationCount.toString(),
    ]);
  }

  const lines = [pc.bold("Available Models"), ""];

  if (result.currentModel) {
    lines.push(`Current: ${pc.green(result.currentModelRef || result.currentModel)}`);
    lines.push("");
  }

  lines.push(table.toString());

  return lines.join("\n");
}
