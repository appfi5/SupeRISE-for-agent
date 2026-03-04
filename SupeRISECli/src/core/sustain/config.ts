/**
 * Sustain Configuration Management
 * 
 * Provides a layered configuration system with sensible defaults.
 * Priority: CLI config > Environment variables > Defaults
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";

export type CronMode = "dev" | "production";

export type SustainConfig = {
  // Cron configuration
  cronMode: CronMode;
  
  // Platform configuration
  platformBaseUrl: string;
};

/**
 * Default configuration with sensible values
 */
const DEFAULT_CONFIG: SustainConfig = {
  cronMode: "production",
  platformBaseUrl: "https://superise-market.superise.net",
};

/**
 * Get config file path
 */
function getConfigPath(): string {
  const riseHome = process.env.RISE_HOME || join(homedir(), ".rise");
  const sustainHome = join(riseHome, "sustain");
  return join(sustainHome, "config.json");
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
  const defaults = DEFAULT_CONFIG;
  const envConfig = loadConfigFromEnv();
  const fileConfig = loadConfigFile();
  
  return {
    ...defaults,
    ...envConfig,
    ...fileConfig,
  };
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
  const riseHome = process.env.RISE_HOME || join(homedir(), ".rise");
  const sessionPath = join(riseHome, "market-session.json");
  try {
    if (existsSync(sessionPath)) {
      const { unlinkSync } = require("fs");
      unlinkSync(sessionPath);
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
  const fileConfig = loadConfigFile();
  const oldValue = fileConfig[key];
  fileConfig[key] = value;
  saveConfigFile(fileConfig);

  if (key === "platformBaseUrl" && oldValue !== value) {
    clearAuthSession();
  }
}

/**
 * Set multiple config values
 */
export function setConfig(updates: Partial<SustainConfig>): void {
  const fileConfig = loadConfigFile();
  const oldUrl = fileConfig.platformBaseUrl;
  const newConfig = { ...fileConfig, ...updates };
  saveConfigFile(newConfig);

  if (updates.platformBaseUrl !== undefined && updates.platformBaseUrl !== oldUrl) {
    clearAuthSession();
  }
}

/**
 * Reset config to defaults (removes config file)
 */
export function resetConfig(): void {
  const configPath = getConfigPath();
  if (existsSync(configPath)) {
    const { unlinkSync } = require("fs");
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
    `Config File: ${getConfigPath()}`,
    `Config Exists: ${hasConfigFile() ? "Yes" : "No (using defaults)"}`,
  ];
  
  return lines.join("\n");
}
