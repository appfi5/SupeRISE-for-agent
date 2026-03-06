/**
 * Sustain Configuration Management
 * 
 * Provides a layered configuration system with sensible defaults.
 * Priority: CLI config > Environment variables > Defaults
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { dirname } from "path";
import { MARKET_SESSION_PATH, SUSTAIN_CONFIG_PATH } from "@/utils/constants";

export type CronMode = "dev" | "production";

export type SustainConfig = {
  // Cron configuration
  cronMode: CronMode;
  
  // Platform configuration
  platformBaseUrl: string;

  // Top-up amount guardrails
  minTopUpCkb: number;
  maxTopUpCkb: number;
};

/**
 * Default configuration with sensible values
 */
const DEFAULT_CONFIG: SustainConfig = {
  cronMode: "production",
  platformBaseUrl: "https://superise-market.superise.net",
  minTopUpCkb: 1000,
  maxTopUpCkb: 20000,
};

function parsePositiveInteger(value: unknown, key: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer.`);
  }
  return parsed;
}

function normalizeConfig(config: Partial<SustainConfig>): SustainConfig {
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

  return {
    cronMode,
    platformBaseUrl,
    minTopUpCkb,
    maxTopUpCkb,
  };
}

/**
 * Get config file path
 */
function getConfigPath(): string {
  return SUSTAIN_CONFIG_PATH;
}

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  const configPath = getConfigPath();
  const configDir = dirname(configPath);
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

/**
 * Load config from file
 */
function loadConfigFile(): Partial<SustainConfig> {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    return {};
  }
  
  try {
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load config from ${configPath}:`, error);
    return {};
  }
}

/**
 * Save config to file
 */
function saveConfigFile(config: Partial<SustainConfig>): void {
  ensureConfigDir();
  const configPath = getConfigPath();
  
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    throw new Error(`Failed to save config to ${configPath}: ${error}`);
  }
}

/**
 * Load config from environment variables
 */
function loadConfigFromEnv(): Partial<SustainConfig> {
  const config: Partial<SustainConfig> = {};
  
  // Cron mode
  const cronMode = process.env.SUSTAIN_CRON_MODE?.toLowerCase();
  if (cronMode === "dev" || cronMode === "development") {
    config.cronMode = "dev";
  } else if (cronMode === "prod" || cronMode === "production") {
    config.cronMode = "production";
  }
  
  // Platform settings
  if (process.env.SUPERISE_MARKET_BASE_URL) {
    config.platformBaseUrl = process.env.SUPERISE_MARKET_BASE_URL;
  }
  
  return config;
}

/**
 * Get merged configuration
 * Priority (highest to lowest): Config file (~/.rise/sustain/config.json) > Environment variables > Defaults
 * 
 * Note: File config intentionally overrides env vars so that persistent user
 * settings (set via `rise sustain config`) take precedence over env vars.
 */
export function getConfig(): SustainConfig {
  return normalizeConfig({
    ...DEFAULT_CONFIG,
    ...loadConfigFromEnv(),
    ...loadConfigFile(),
  });
}

/**
 * Get a specific config value
 */
export function getConfigValue<K extends keyof SustainConfig>(key: K): SustainConfig[K] {
  const config = getConfig();
  return config[key];
}

/**
 * Clear the auth session file when platform URL changes.
 * The cached token is bound to a specific server and must be discarded on URL switch.
 */
function clearAuthSession(): void {
  try {
    if (existsSync(MARKET_SESSION_PATH)) {
      unlinkSync(MARKET_SESSION_PATH);
    }
  } catch {
    // Ignore errors — session will be re-created on next login
  }
}

/**
 * Set a config value (persists to file)
 */
export function setConfigValue<K extends keyof SustainConfig>(
  key: K,
  value: SustainConfig[K]
): void {
  const current = getConfig();
  const oldValue = current[key];
  const next = normalizeConfig({
    ...current,
    [key]: value,
  });
  saveConfigFile(next);

  if (key === "platformBaseUrl" && oldValue !== value) {
    clearAuthSession();
  }
}

/**
 * Set multiple config values
 */
export function setConfig(updates: Partial<SustainConfig>): void {
  const current = getConfig();
  const oldUrl = current.platformBaseUrl;
  const next = normalizeConfig({ ...current, ...updates });
  saveConfigFile(next);

  if (next.platformBaseUrl !== oldUrl) {
    clearAuthSession();
  }
}

/**
 * Reset config to defaults (removes config file)
 */
export function resetConfig(): void {
  const configPath = getConfigPath();
  if (existsSync(configPath)) {
    unlinkSync(configPath);
  }
  clearAuthSession();
}

/**
 * Get config file path for display
 */
export function getConfigFilePath(): string {
  return getConfigPath();
}

/**
 * Check if config file exists
 */
export function hasConfigFile(): boolean {
  return existsSync(getConfigPath());
}

/**
 * Get cron schedule based on current config
 */
export function getCronSchedule() {
  const cronMode = getConfigValue("cronMode");
  
  if (cronMode === "dev") {
    return {
      tick: "1m",           // Every 1 minute
      retryOrders: "2m",    // Every 2 minutes
    };
  } else {
    return {
      tick: "5m",           // Every 5 minutes
      retryOrders: "10m",   // Every 10 minutes
    };
  }
}

export function getTopUpAmountRange(): { min: number; max: number } {
  const config = getConfig();
  return {
    min: config.minTopUpCkb,
    max: config.maxTopUpCkb,
  };
}

export function validateTopUpAmount(amount: number): number {
  const { min, max } = getTopUpAmountRange();
  if (!Number.isFinite(amount) || amount < min || amount > max) {
    throw new Error(`amount must be between ${min} and ${max} CKB`);
  }
  return amount;
}

/**
 * Get human-readable description of current config
 */
export function describeConfig(): string {
  const config = getConfig();
  const schedule = getCronSchedule();
  
  const lines = [
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
    `Config File: ${getConfigPath()}`,
    `Config Exists: ${hasConfigFile() ? "Yes" : "No (using defaults)"}`,
  ];
  
  return lines.join("\n");
}
