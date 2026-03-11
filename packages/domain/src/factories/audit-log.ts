import { createPrefixedId, nowIso, type ErrorCode } from "@superise/shared";
import type { ActorRole, AuditLog, AuditResult, ChainKind, SignOperation } from "../entities/types";

export function createAuditLog(input: {
  actorRole: ActorRole;
  action: string;
  result: AuditResult;
  metadata?: Record<string, unknown>;
}): AuditLog {
  return {
    auditId: createPrefixedId("audit"),
    actorRole: input.actorRole,
    action: input.action,
    result: input.result,
    metadata: input.metadata ?? {},
    createdAt: nowIso(),
  };
}

export function createSignOperation(input: {
  role: Extract<ActorRole, "AGENT" | "OWNER">;
  chain: ChainKind;
  messageDigest: string;
  result: AuditResult;
  errorCode?: ErrorCode | null;
}): SignOperation {
  return {
    id: createPrefixedId("sign"),
    role: input.role,
    chain: input.chain,
    messageDigest: input.messageDigest,
    result: input.result,
    errorCode: input.errorCode ?? null,
    createdAt: nowIso(),
  };
}
