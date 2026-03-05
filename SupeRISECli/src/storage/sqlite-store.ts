/**
 * SQLite Storage Layer for Sustain
 * 
 * Manages persistent storage for observations, plans, actions, scores, and KV data.
 * Schema follows design in docs/sustain/DESIGN.md
 */

import { mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import { SUSTAIN_DB_PATH } from "@/utils/constants";
import type {
  BalanceObservation,
  PlanRecord,
  ActionRecord,
  ScoreRecord,
  SustainPolicy,
} from "@/core/sustain/types";

type DatabaseInstance = any;

let db: DatabaseInstance | null = null;
let Database: any = null;
let isBunSqlite = false;

export async function initDatabase() {
  if (Database) return;
  
  // Try Bun first, fallback to better-sqlite3 for Node.js
  try {
    const bunSqlite = await import("bun:sqlite");
    Database = bunSqlite.Database;
    isBunSqlite = true;
  } catch {
    // Fallback to better-sqlite3 for Node.js
    const betterSqlite3 = await import("better-sqlite3");
    Database = betterSqlite3.default;
    isBunSqlite = false;
  }
}

export function getDb(): DatabaseInstance {
  if (db) return db;

  if (!Database) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }

  const dbDir = dirname(SUSTAIN_DB_PATH);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  if (isBunSqlite) {
    db = new Database(SUSTAIN_DB_PATH, { create: true });
    db.run("PRAGMA journal_mode = WAL");
  } else {
    db = new Database(SUSTAIN_DB_PATH);
    db.pragma("journal_mode = WAL");
  }
  
  initSchema(db);
  return db;
}

function initSchema(db: DatabaseInstance): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      remaining INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_observations_ts ON observations(ts DESC);

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      ts TEXT NOT NULL,
      balance INTEGER NOT NULL,
      burn_rate REAL NOT NULL,
      eta_critical REAL NOT NULL,
      action TEXT NOT NULL,
      target_model TEXT,
      top_up_amount INTEGER,
      reason TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_plans_ts ON plans(ts DESC);

    CREATE TABLE IF NOT EXISTS actions (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      ts TEXT NOT NULL,
      action TEXT NOT NULL,
      target_model TEXT,
      top_up_amount INTEGER,
      success INTEGER NOT NULL,
      error TEXT,
      tx_hash TEXT,
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    );

    CREATE INDEX IF NOT EXISTS idx_actions_ts ON actions(ts DESC);
    CREATE INDEX IF NOT EXISTS idx_actions_plan_id ON actions(plan_id);

    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      action_id TEXT NOT NULL,
      ts TEXT NOT NULL,
      availability REAL NOT NULL,
      cost REAL NOT NULL,
      stability REAL NOT NULL,
      overall REAL NOT NULL,
      note TEXT,
      FOREIGN KEY (action_id) REFERENCES actions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_scores_ts ON scores(ts DESC);
    CREATE INDEX IF NOT EXISTS idx_scores_action_id ON scores(action_id);

    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_orders (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      amount_ckb REAL NOT NULL,
      platform_base_url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    );

    CREATE TABLE IF NOT EXISTS manual_review_orders (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      amount_ckb REAL NOT NULL,
      platform_base_url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      escalated_at TEXT NOT NULL,
      retry_count INTEGER NOT NULL,
      last_error TEXT
    );
  `);
}

// ===== Observations =====

export function appendObservation(obs: BalanceObservation): void {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO observations (ts, remaining) VALUES (?, ?)"
  );
  stmt.run(obs.ts, obs.remaining);
}

export function getRecentObservations(limit: number = 500): BalanceObservation[] {
  const db = getDb();
  const stmt = db.prepare(
    "SELECT ts, remaining FROM observations ORDER BY ts DESC LIMIT ?"
  );
  const rows = stmt.all(limit) as Array<{ ts: string; remaining: number }>;
  return rows.map((r) => ({ ts: r.ts, remaining: r.remaining }));
}

export function getObservationCount(): number {
  const db = getDb();
  const stmt = db.prepare("SELECT COUNT(*) as count FROM observations");
  const result = stmt.get() as { count: number };
  return result.count;
}

export function pruneOldObservations(keepCount: number = 500): void {
  const db = getDb();
  const stmt = db.prepare(`
    DELETE FROM observations 
    WHERE id NOT IN (
      SELECT id FROM observations ORDER BY ts DESC LIMIT ?
    )
  `);
  stmt.run(keepCount);
}

// ===== Plans =====

export function appendPlan(plan: PlanRecord): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO plans (id, ts, balance, burn_rate, eta_critical, action, target_model, top_up_amount, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    plan.id,
    plan.ts,
    plan.balance,
    plan.burnRate,
    plan.etaCritical,
    plan.action,
    plan.targetModel || null,
    plan.topUpAmount || null,
    plan.reason
  );
}

export function getLatestPlan(): PlanRecord | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM plans ORDER BY ts DESC LIMIT 1");
  const row = stmt.get() as any;
  if (!row) return null;

  return {
    id: row.id,
    ts: row.ts,
    balance: row.balance,
    burnRate: row.burn_rate,
    etaCritical: row.eta_critical,
    action: row.action,
    targetModel: row.target_model,
    topUpAmount: row.top_up_amount,
    reason: row.reason,
  };
}

export function getRecentPlans(limit: number = 50): PlanRecord[] {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM plans ORDER BY ts DESC LIMIT ?");
  const rows = stmt.all(limit) as any[];
  return rows.map((row) => ({
    id: row.id,
    ts: row.ts,
    balance: row.balance,
    burnRate: row.burn_rate,
    etaCritical: row.eta_critical,
    action: row.action,
    targetModel: row.target_model,
    topUpAmount: row.top_up_amount,
    reason: row.reason,
  }));
}

// ===== Actions =====

export function appendAction(action: ActionRecord): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO actions (id, plan_id, ts, action, target_model, top_up_amount, success, error, tx_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    action.id,
    action.planId,
    action.ts,
    action.action,
    action.targetModel || null,
    action.topUpAmount || null,
    action.success ? 1 : 0,
    action.error || null,
    action.txHash || null
  );
}

export function getLatestAction(): ActionRecord | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM actions ORDER BY ts DESC LIMIT 1");
  const row = stmt.get() as any;
  if (!row) return null;

  return {
    id: row.id,
    planId: row.plan_id,
    ts: row.ts,
    action: row.action,
    targetModel: row.target_model,
    topUpAmount: row.top_up_amount,
    success: row.success === 1,
    error: row.error,
    txHash: row.tx_hash,
  };
}

export function getRecentActions(limit: number = 50): ActionRecord[] {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM actions ORDER BY ts DESC LIMIT ?");
  const rows = stmt.all(limit) as any[];
  return rows.map((row) => ({
    id: row.id,
    planId: row.plan_id,
    ts: row.ts,
    action: row.action,
    targetModel: row.target_model,
    topUpAmount: row.top_up_amount,
    success: row.success === 1,
    error: row.error,
    txHash: row.tx_hash,
  }));
}

// ===== Scores =====

export function appendScore(score: ScoreRecord): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO scores (id, action_id, ts, availability, cost, stability, overall, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    score.id,
    score.actionId,
    score.ts,
    score.score.availability,
    score.score.cost,
    score.score.stability,
    score.score.overall,
    score.score.note || null
  );
}

export function getLatestScore(): ScoreRecord | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM scores ORDER BY ts DESC LIMIT 1");
  const row = stmt.get() as any;
  if (!row) return null;

  return {
    id: row.id,
    actionId: row.action_id,
    ts: row.ts,
    score: {
      availability: row.availability,
      cost: row.cost,
      stability: row.stability,
      overall: row.overall,
      note: row.note,
    },
  };
}

export function getRecentScores(limit: number = 50): ScoreRecord[] {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM scores ORDER BY ts DESC LIMIT ?");
  const rows = stmt.all(limit) as any[];
  return rows.map((row) => ({
    id: row.id,
    actionId: row.action_id,
    ts: row.ts,
    score: {
      availability: row.availability,
      cost: row.cost,
      stability: row.stability,
      overall: row.overall,
      note: row.note,
    },
  }));
}

// ===== KV Store =====

export function kvSet(key: string, value: any): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO kv (key, value, updated_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(key, JSON.stringify(value), new Date().toISOString());
}

export function kvGet<T>(key: string): T | null {
  const db = getDb();
  const stmt = db.prepare("SELECT value FROM kv WHERE key = ?");
  const row = stmt.get(key) as { value: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.value) as T;
}

export function kvDelete(key: string): void {
  const db = getDb();
  const stmt = db.prepare("DELETE FROM kv WHERE key = ?");
  stmt.run(key);
}

// ===== Policy Helpers =====

export function savePolicy(policy: SustainPolicy): void {
  kvSet("policy", policy);
}

export function loadPolicy(): SustainPolicy | null {
  return kvGet<SustainPolicy>("policy");
}

// ===== Cleanup =====

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
