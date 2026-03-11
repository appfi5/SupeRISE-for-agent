import { createPrefixedId, nowIso } from "@superise/shared";
import type { OwnerCredential } from "../entities/types";

export function createOwnerCredential(passwordHash: string): OwnerCredential {
  const timestamp = nowIso();
  return {
    credentialId: createPrefixedId("cred"),
    passwordHash,
    mustRotate: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function rotateOwnerCredential(
  credential: OwnerCredential,
  nextPasswordHash: string,
): OwnerCredential {
  return {
    ...credential,
    passwordHash: nextPasswordHash,
    mustRotate: false,
    updatedAt: nowIso(),
  };
}
