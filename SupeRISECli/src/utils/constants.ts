import { homedir } from "os";
import { join } from "path";

export const CKB_DECIMALS = 8;

export const RISE_DIR = join(homedir(), ".rise");
export const RISE_CONFIG_PATH = join(RISE_DIR, "config.json");
export const MARKET_SESSION_PATH = join(RISE_DIR, "market-session.json");
export const SUSTAIN_DIR = join(RISE_DIR, "sustain");
export const SUSTAIN_CONFIG_PATH = join(SUSTAIN_DIR, "config.json");
export const SUSTAIN_DB_PATH = join(SUSTAIN_DIR, "state.db");
