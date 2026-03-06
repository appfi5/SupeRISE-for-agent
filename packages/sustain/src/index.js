/**
 * @superise/sustain
 *
 * Standalone sustain package — migrated from SupeRISECli/src/core/sustain.
 * This package owns sustain types, config, defaults, and the engine.
 * Per docs/refactor/ARCHITECTURE.md §4.8 this is a structure-only migration;
 * no business-rule changes were made.
 */

export { DEFAULT_POLICY } from "./defaults.js";
export {
  getConfig,
  getConfigValue,
  setConfigValue,
  setConfig,
  resetConfig,
  getConfigFilePath,
  hasConfigFile,
  getCronSchedule,
  getTopUpAmountRange,
  validateTopUpAmount,
  describeConfig,
} from "./config.js";
export {
  loadLocalPolicy,
  classifyStatus,
  calculateBurnRate,
  buildForecast,
} from "./engine.js";
