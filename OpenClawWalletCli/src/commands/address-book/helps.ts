import { getConfig } from "../../utils/config.js";

export function parseContactName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Contact name cannot be empty.");
  }
  if (trimmed.length > 50) {
    throw new Error("Contact name must be 50 characters or less.");
  }
  if (/[<>:"/\\|?*\x00-\x1F]/.test(trimmed)) {
    throw new Error("Contact name contains invalid characters.");
  }
  return trimmed;
}

export function validateAndNormalizeAddress(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("CKB address cannot be empty.");
  }
  // Basic format validation for CKB addresses
  // CKB addresses start with ckb1 or ckt1 (testnet) and are at least 20 chars
  if (!/^ck[bt]1[a-z0-9]{20,}$/.test(trimmed)) {
    throw new Error("Invalid CKB address format. Address must start with 'ckb1' or 'ckt1' and contain only alphanumeric characters.");
  }
  return trimmed;
}

export function checkContactNameExists(name: string): boolean {
  const config = getConfig();
  return config.addressBook ? name in config.addressBook : false;
}

export function lookupAddressByName(name: string): string | null {
  const config = getConfig();
  if (!config.addressBook) return null;
  return config.addressBook[name] || null;
}
