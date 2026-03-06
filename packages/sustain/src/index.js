const DEFAULT_SUSTAIN_CONFIG = {
  enabled: true,
  cronMode: "production",
  platformBaseUrl: "https://superise-market.superise.net",
  minTopUpCkb: 1000,
  maxTopUpCkb: 20000,
};

export function createDefaultSustainConfig() {
  return { ...DEFAULT_SUSTAIN_CONFIG };
}

export function mergeSustainConfig(overrides = {}) {
  const next = { ...DEFAULT_SUSTAIN_CONFIG, ...overrides };
  if (next.minTopUpCkb > next.maxTopUpCkb) {
    throw new Error("minTopUpCkb must be less than or equal to maxTopUpCkb");
  }
  return next;
}

export function normalizeSustainConfig(config = {}) {
  return mergeSustainConfig(config);
}
