import { homedir } from "os";
import { join } from "path";

export const CKB_DECIMALS = 8;

export const RISE_HOME = join(homedir(), ".rise");
export const SUSTAIN_HOME = join(RISE_HOME, "sustain");
export const SUSTAIN_DB_PATH = join(SUSTAIN_HOME, "state.db");
