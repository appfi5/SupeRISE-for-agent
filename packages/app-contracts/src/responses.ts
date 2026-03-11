import { z } from "zod";
import type { ErrorPayload } from "./errors";
import { errorPayloadSchema } from "./errors";

export type ApiResponse<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ErrorPayload };

export function apiSuccess<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
  };
}

export function apiFailure(error: ErrorPayload): ApiResponse<never> {
  return {
    success: false,
    data: null,
    error,
  };
}

export function apiSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    error: z.null(),
  });
}

export function apiFailureSchema() {
  return z.object({
    success: z.literal(false),
    data: z.null(),
    error: errorPayloadSchema,
  });
}

export function apiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.union([apiSuccessSchema(dataSchema), apiFailureSchema()]);
}

export function apiEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: z.union([dataSchema, z.null()]),
    error: z.union([errorPayloadSchema, z.null()]),
  });
}
