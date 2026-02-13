import type { RiseConfig } from "../types/index.js";

export function maskHex(value: string, lead = 8, tail = 4): string {
  if (value.length <= lead + tail) {
    return value;
  }
  return `${value.slice(0, lead)}...${value.slice(-tail)}`;
}

export function formatConfigForDisplay(config: RiseConfig): RiseConfig {
  return config;
}
