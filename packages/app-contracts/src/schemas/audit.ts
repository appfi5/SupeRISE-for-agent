import { z } from "zod";
import { errorCodeSchema } from "../errors";

export const auditLogSchema = z.object({
  auditId: z.string(),
  actorRole: z.enum(["AGENT", "OWNER", "SYSTEM"]),
  action: z.string(),
  result: z.enum(["SUCCESS", "FAILED"]),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
});

export const signOperationSchema = z.object({
  id: z.string(),
  role: z.enum(["AGENT", "OWNER"]),
  chain: z.enum(["ckb", "evm"]),
  result: z.enum(["SUCCESS", "FAILED"]),
  errorCode: errorCodeSchema.nullable().optional(),
  createdAt: z.string(),
});

export type AuditLogDto = z.infer<typeof auditLogSchema>;
export type SignOperationDto = z.infer<typeof signOperationSchema>;
