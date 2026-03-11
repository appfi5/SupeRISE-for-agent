import { z } from "zod";
import { credentialStatusSchema, privateKeyHexSchema } from "./_common";

export const ownerLoginRequestSchema = z.object({
  password: z.string().min(8),
});

export const ownerLoginResponseSchema = z.object({
  credentialStatus: credentialStatusSchema,
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresInSeconds: z.number().int().positive(),
  expiresAt: z.string().datetime(),
});

export const ownerCredentialStatusSchema = z.object({
  credentialStatus: credentialStatusSchema,
});

export const ownerRotateCredentialRequestSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const ownerLogoutResponseSchema = z.object({
  loggedOut: z.literal(true),
});

export const ownerWalletImportRequestSchema = z.object({
  privateKey: privateKeyHexSchema,
  confirmed: z.literal(true),
});

export const ownerWalletExportRequestSchema = z.object({
  confirmed: z.literal(true),
});

export const ownerWalletExportResponseSchema = z.object({
  privateKey: z.string(),
});

export type OwnerLoginRequest = z.infer<typeof ownerLoginRequestSchema>;
export type OwnerLoginResponse = z.infer<typeof ownerLoginResponseSchema>;
export type OwnerCredentialStatusDto = z.infer<typeof ownerCredentialStatusSchema>;
export type OwnerRotateCredentialRequest = z.infer<
  typeof ownerRotateCredentialRequestSchema
>;
export type OwnerWalletImportRequest = z.infer<
  typeof ownerWalletImportRequestSchema
>;
export type OwnerWalletExportRequest = z.infer<
  typeof ownerWalletExportRequestSchema
>;
export type OwnerWalletExportResponse = z.infer<
  typeof ownerWalletExportResponseSchema
>;
