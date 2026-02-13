export function parseFeeRate(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("feeRate is required.");
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new Error("feeRate must be a number.");
  }
  if (parsed < 1000) {
    throw new Error("feeRate must be at least 1000.");
  }
  return parsed;
}

export function parseApiKey(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("apiKey cannot be empty.");
  }
  return trimmed;
}

export function parseSignServerUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("signServerUrl cannot be empty.");
  }
  try {
    new URL(trimmed);
  } catch {
    throw new Error("signServerUrl must be a valid URL.");
  }
  return trimmed;
}
