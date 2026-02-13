import Conf from "conf";
import os from "os";
import path from "path";
import type { RiseConfig } from "../types/index.js";

const CONFIG_DIR = process.env.RISE_CONFIG_DIR
  ? path.resolve(process.env.RISE_CONFIG_DIR)
  : path.join(os.homedir(), ".rise");

const DEFAULT_CONFIG: RiseConfig = {
  rpc: "https://testnet.ckb.dev",
  indexer: "https://testnet.ckb.dev/indexer",
  apiKey: undefined,
  feeRate: null,
  addressBook: {},
  signServerUrl: "http://127.0.0.1:18799",
};

const store = new Conf<RiseConfig>({
  cwd: CONFIG_DIR,
  configName: "config",
  defaults: DEFAULT_CONFIG,
  accessPropertiesByDotNotation: false,
});

type LegacyRiseConfig = RiseConfig & { defaultFee?: string | number | null; addressBook?: unknown };

function normalizeFeeRate(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  if (parsed < 1000) {
    throw new Error("feeRate must be at least 1000.");
  }
  return parsed;
}

function normalizeConfig(config: LegacyRiseConfig): RiseConfig {
  const feeRate = normalizeFeeRate(
    config.feeRate ?? config.defaultFee ?? null,
  );

  // Normalize addressBook to always be an object
  let addressBook: Record<string, string> = {};
  if (config.addressBook && typeof config.addressBook === "object" && !Array.isArray(config.addressBook)) {
    addressBook = config.addressBook as Record<string, string>;
  }

  const normalized: RiseConfig = {
    rpc: config.rpc ?? DEFAULT_CONFIG.rpc,
    indexer: config.indexer ?? DEFAULT_CONFIG.indexer,
    apiKey: config.apiKey,
    feeRate,
    addressBook,
    signServerUrl: config.signServerUrl ?? DEFAULT_CONFIG.signServerUrl,
  };
  return normalized;
}

export function getConfig(): RiseConfig {
  const normalized = normalizeConfig(store.store as LegacyRiseConfig);
  if (normalized !== store.store) {
    store.store = normalized;
  }
  return normalized;
}

export function setConfig(next: RiseConfig): void {
  store.store = normalizeConfig(next);
}

export function updateConfig(partial: Partial<RiseConfig>): RiseConfig {
  store.store = normalizeConfig({
    ...store.store,
    ...partial,
  } as LegacyRiseConfig);
  return store.store;
}

export function getConfigPath(): string {
  return store.path;
}

export function configStore(): Conf<RiseConfig> {
  return store;
}
