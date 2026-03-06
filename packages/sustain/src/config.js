/**
 * Sustain Configuration Management
 *
 * Provides a layered configuration system with sensible defaults.
 * Priority: Config file > Environment variables > Defaults
 *
 * Migrated from SupeRISECli/src/core/sustain/config.ts — structure only,
 * no business-rule changes per docs/refactor/ARCHITECTURE.md §4.8.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { homedir } from "node:os";

const RISE_DIR = resolve(homedir(), ".rise");
const SUSTAIN_CONFIG_PATH = resolve(RISE_DIR, "sustain", "config.json");
const MARKET_SESSION_PATH = resolve(RISE_DIR, "market-session.json");

/** @type {import("./types.js").SustainPolicy & { cronMode: string; platformBaseUrl: string; minTopUpCkb: number; maxTopUpCkb: number }} */
const DEFAULT_CONFIG = {
  cronMode: "production",
  platformBaseUrl: "https://superise-market.superise.net",
  minTopUpCkb: 1000,
  maxTopUpCkb: 20000,
};

function parsePositiveInteger(value, key) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer.`);
  }
  return parsed;
}

function normalizeConfig(config) {
  const cronMode = config.cronMode === "dev" ? "dev" : "production";
  const platformBaseUrl = config.platformBaseUrl ?? DEFAULT_CONFIG.platformBaseUrl;
  const minTopUpCkb = parsePositiveInteger(
    config.minTopUpCkb ?? DEFAULT_CONFIG.minTopUpCkb,
    "minTopUpCkb",
  );
  const maxTopUpCkb = parsePositiveInteger(
    config.maxTopUpCkb ?? DEFAULT_CONFIG.maxTopUpCkb,
    "maxTopUpCkb",
  );

  if (minTopUpCkb > maxTopUpCkb) {
    throw new Error("minTopUpCkb must be less than or equal to maxTopUpCkb.");
  }

  return { cronMode, platformBaseUrl, minTopUpCkb, maxTopUpCkb };
}

function ensureConfigDir() {
  const configDir = dirname(SUSTAIN_CONFIG_PATH);
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

function loadConfigFile() {
  if (!existsSync(SUSTAIN_CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(SUSTAIN_CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveConfigFile(config) {
  ensureConfigDir();
  writeFileSync(SUSTAIN_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

function loadConfigFromEnv() {
  const config = {};
  const cronMode = process.env.SUSTAIN_CRON_MODE?.toLowerCase();
  if (cronMode === "dev" || cronMode === "development") {
    config.cronMode = "dev";
  } else if (cronMode === "prod" || cronMode === "production") {
    config.cronMode = "production";
  }
  if (process.env.SUPERISE_MARKET_BASE_URL) {
    config.platformBaseUrl = process.env.SUPERISE_MARKET_BASE_URL;
  }
  return config;
}

function clearAuthSession() {
  try {
    if (existsSync(MARKET_SESSION_PATH)) unlinkSync(MARKET_SESSION_PATH);
  } catch {
    /* no-op */
  }
}

export function getConfig() {
  return normalizeConfig({
    ...DEFAULT_CONFIG,
    ...loadConfigFromEnv(),
    ...loadConfigFile(),
  });
}

export function getConfigValue(key) {
  return getConfig()[key];
}

export function setConfigValue(key, value) {
  const current = getConfig();
  const oldValue = current[key];
  const next = normalizeConfig({ ...current, [key]: value });
  saveConfigFile(next);
  if (key === "platformBaseUrl" && oldValue !== value) clearAuthSession();
}

export function setConfig(updates) {
  const current = getConfig();
  const oldUrl = current.platformBaseUrl;
  const next = normalizeConfig({ ...current, ...updates });
  saveConfigFile(next);
  if (next.platformBaseUrl !== oldUrl) clearAuthSession();
}

export function resetConfig() {
  if (existsSync(SUSTAIN_CONFIG_PATH)) unlinkSync(SUSTAIN_CONFIG_PATH);
  clearAuthSession();
}

export function getConfigFilePath() {
  return SUSTAIN_CONFIG_PATH;
}

export function hasConfigFile() {
  return existsSync(SUSTAIN_CONFIG_PATH);
}

export function getCronSchedule() {
  const cronMode = getConfigValue("cronMode");
  if (cronMode === "dev") {
    return { tick: "1m", retryOrders: "2m" };
  }
  return { tick: "5m", retryOrders: "10m" };
}

export function getTopUpAmountRange() {
  const config = getConfig();
  return { min: config.minTopUpCkb, max: config.maxTopUpCkb };
}

export function validateTopUpAmount(amount) {
  const { min, max } = getTopUpAmountRange();
  if (!Number.isFinite(amount) || amount < min || amount > max) {
    throw new Error(`amount must be between ${min} and ${max} CKB`);
  }
  return amount;
}

export function describeConfig() {
  const config = getConfig();
  const schedule = getCronSchedule();
  return [
    "Sustain Configuration:",
    "",
    `Cron Mode: ${config.cronMode}`,
    `  - Tick: ${schedule.tick}`,
    `  - Retry Orders: ${schedule.retryOrders}`,
    "",
    "Platform Settings:",
    `  - Base URL: ${config.platformBaseUrl}`,
    "",
    "Top-up Limits:",
    `  - Min Top-up: ${config.minTopUpCkb} CKB`,
    `  - Max Top-up: ${config.maxTopUpCkb} CKB`,
    "",
    `Config File: ${SUSTAIN_CONFIG_PATH}`,
    `Config Exists: ${hasConfigFile() ? "Yes" : "No (using defaults)"}`,
  ].join("\n");
}
