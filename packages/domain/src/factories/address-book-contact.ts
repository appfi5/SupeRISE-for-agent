import { createPrefixedId, nowIso } from "@superise/shared";
import type { AddressBookContact } from "../entities/types";

export function createAddressBookContact(input: {
  name: string;
  normalizedName: string;
  note: string | null;
  nervosAddress: string | null;
  normalizedNervosAddress: string | null;
  ethereumAddress: string | null;
  normalizedEthereumAddress: string | null;
}): AddressBookContact {
  const timestamp = nowIso();

  return {
    contactId: createPrefixedId("contact"),
    name: input.name,
    normalizedName: input.normalizedName,
    note: input.note,
    nervosAddress: input.nervosAddress,
    normalizedNervosAddress: input.normalizedNervosAddress,
    ethereumAddress: input.ethereumAddress,
    normalizedEthereumAddress: input.normalizedEthereumAddress,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateAddressBookContact(
  contact: AddressBookContact,
  input: {
    name: string;
    normalizedName: string;
    note: string | null;
    nervosAddress: string | null;
    normalizedNervosAddress: string | null;
    ethereumAddress: string | null;
    normalizedEthereumAddress: string | null;
  },
): AddressBookContact {
  return {
    ...contact,
    name: input.name,
    normalizedName: input.normalizedName,
    note: input.note,
    nervosAddress: input.nervosAddress,
    normalizedNervosAddress: input.normalizedNervosAddress,
    ethereumAddress: input.ethereumAddress,
    normalizedEthereumAddress: input.normalizedEthereumAddress,
    updatedAt: nowIso(),
  };
}
