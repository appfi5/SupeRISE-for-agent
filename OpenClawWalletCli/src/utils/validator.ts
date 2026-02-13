import { ccc } from "@ckb-ccc/shell";

export function normalizeHex(value: string, bytes?: number): string {
  const hex = ccc.hexFrom(value);
  const length = ccc.bytesFrom(hex).length;
  if (bytes !== undefined && length !== bytes) {
    throw new Error(`Expected ${bytes} bytes, got ${length}`);
  }
  return hex.toLowerCase();
}

export function normalizeHashType(
  value: string,
): "type" | "data" | "data1" {
  const hashType = ccc.hashTypeFrom(value);
  if (hashType === "data2") {
    throw new Error("Hash type 'data2' is not supported.");
  }
  return hashType;
}

export async function validateAddress(address: string, client: ccc.Client): Promise<ccc.Address> {
  return ccc.Address.fromString(address, client);
}

export function parseFixedPoint(value: string, decimals: number): bigint {
  const num = ccc.fixedPointFrom(value, decimals);
  if (num <= 0n) {
    throw new Error("Amount must be greater than 0");
  }
  return num;
}
