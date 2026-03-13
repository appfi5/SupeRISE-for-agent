import { z } from "zod";
import {
  addressBookChainSchema,
  publicChainSchema,
} from "./_common";

const contactNameSchema = z.string().trim().min(1);
const optionalNoteSchema = z.string().trim().min(1).nullable().optional();
const addressSchema = z.string().trim().min(1);
const nullableAddressSchema = addressSchema.nullable().optional();

function hasAtLeastOneAddress(value: {
  nervosAddress?: string | null;
  ethereumAddress?: string | null;
}): boolean {
  return (
    (value.nervosAddress ?? null) !== null ||
    (value.ethereumAddress ?? null) !== null
  );
}

export const addressBookContactAddressesSchema = z.object({
  nervosAddress: nullableAddressSchema,
  ethereumAddress: nullableAddressSchema,
});

export const addressBookContactSummarySchema = z.object({
  name: contactNameSchema,
  note: z.string().nullable().optional(),
  chains: z.array(addressBookChainSchema).min(1).max(2),
  updatedAt: z.string().datetime(),
});

export const addressBookContactSchema = z.object({
  name: contactNameSchema,
  note: z.string().nullable().optional(),
  addresses: addressBookContactAddressesSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const addressBookListResponseSchema = z.object({
  contacts: z.array(addressBookContactSummarySchema),
});

export const addressBookSearchRequestSchema = z.object({
  query: z.string().trim().min(1),
});

export const addressBookSearchResponseSchema = addressBookListResponseSchema;

export const addressBookGetRequestSchema = z.object({
  name: contactNameSchema,
});

export const addressBookGetResponseSchema = z.object({
  contact: addressBookContactSchema,
});

export const addressBookLookupByAddressRequestSchema = z.object({
  address: addressSchema,
});

export const addressBookLookupByAddressResponseSchema = z.object({
  address: addressSchema,
  chain: publicChainSchema.optional(),
  matched: z.boolean(),
  contacts: z.array(contactNameSchema),
});

export const addressBookGetAllResponseSchema = z.object({
  contacts: z.array(addressBookContactSchema),
});

export const addressBookCreateContactInputSchema = z
  .object({
    name: contactNameSchema,
    note: optionalNoteSchema,
    addresses: z.object({
      nervosAddress: addressSchema.optional(),
      ethereumAddress: addressSchema.optional(),
    }),
  })
  .refine((value) => hasAtLeastOneAddress(value.addresses), {
    message: "At least one contact address must be provided",
    path: ["addresses"],
  });

export const addressBookCreateRequestSchema = z.object({
  contact: addressBookCreateContactInputSchema,
});

export const addressBookCreateResponseSchema = z.object({
  contact: addressBookContactSchema,
});

export const addressBookUpdateContactInputSchema = z
  .object({
    name: contactNameSchema,
    note: optionalNoteSchema,
    addresses: addressBookContactAddressesSchema,
  })
  .refine((value) => hasAtLeastOneAddress(value.addresses), {
    message: "At least one contact address must remain after update",
    path: ["addresses"],
  });

export const addressBookUpdateRequestSchema = z.object({
  currentName: contactNameSchema,
  contact: addressBookUpdateContactInputSchema,
});

export const addressBookUpdateResponseSchema = z.object({
  contact: addressBookContactSchema,
});

export const addressBookDeleteRequestSchema = z.object({
  name: contactNameSchema,
});

export const addressBookDeleteResponseSchema = z.object({
  deleted: z.literal(true),
  name: contactNameSchema,
});

export type AddressBookChain = z.infer<typeof addressBookChainSchema>;
export type AddressBookContactAddressesDto = z.infer<
  typeof addressBookContactAddressesSchema
>;
export type AddressBookContactSummaryDto = z.infer<
  typeof addressBookContactSummarySchema
>;
export type AddressBookContactDto = z.infer<typeof addressBookContactSchema>;
export type AddressBookListResponse = z.infer<
  typeof addressBookListResponseSchema
>;
export type AddressBookSearchRequest = z.infer<
  typeof addressBookSearchRequestSchema
>;
export type AddressBookSearchResponse = z.infer<
  typeof addressBookSearchResponseSchema
>;
export type AddressBookGetRequest = z.infer<typeof addressBookGetRequestSchema>;
export type AddressBookGetResponse = z.infer<typeof addressBookGetResponseSchema>;
export type AddressBookLookupByAddressRequest = z.infer<
  typeof addressBookLookupByAddressRequestSchema
>;
export type AddressBookLookupByAddressResponse = z.infer<
  typeof addressBookLookupByAddressResponseSchema
>;
export type AddressBookGetAllResponse = z.infer<
  typeof addressBookGetAllResponseSchema
>;
export type AddressBookCreateContactInput = z.infer<
  typeof addressBookCreateContactInputSchema
>;
export type AddressBookCreateRequest = z.infer<
  typeof addressBookCreateRequestSchema
>;
export type AddressBookCreateResponse = z.infer<
  typeof addressBookCreateResponseSchema
>;
export type AddressBookUpdateContactInput = z.infer<
  typeof addressBookUpdateContactInputSchema
>;
export type AddressBookUpdateRequest = z.infer<
  typeof addressBookUpdateRequestSchema
>;
export type AddressBookUpdateResponse = z.infer<
  typeof addressBookUpdateResponseSchema
>;
export type AddressBookDeleteRequest = z.infer<
  typeof addressBookDeleteRequestSchema
>;
export type AddressBookDeleteResponse = z.infer<
  typeof addressBookDeleteResponseSchema
>;
