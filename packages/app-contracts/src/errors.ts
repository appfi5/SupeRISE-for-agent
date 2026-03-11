import { z } from "zod";
import { ERROR_CODES, type ErrorCode, type JsonValue } from "@superise/shared";

export const errorCodeSchema = z.enum(ERROR_CODES);
export const errorPayloadSchema = z.object({
  code: errorCodeSchema,
  message: z.string(),
  details: z.unknown().optional(),
});

export type ErrorPayload = {
  code: ErrorCode;
  message: string;
  details?: JsonValue;
};
