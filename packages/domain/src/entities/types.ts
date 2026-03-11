import type { ErrorCode, JsonValue } from "@superise/shared";

export type WalletStatus = "ACTIVE" | "EMPTY";
export type WalletSource = "AUTO_GENERATED" | "IMPORTED" | "UNKNOWN";
export type ActorRole = "AGENT" | "OWNER" | "SYSTEM";
export type ChainKind = "ckb" | "evm";

export type AssetKind = "CKB" | "ETH" | "USDT";
export type TransferStatus = "PENDING" | "SUBMITTED" | "CONFIRMED" | "FAILED";
export type AuditResult = "SUCCESS" | "FAILED";
export type CredentialStatus = "DEFAULT_PENDING_ROTATION" | "ACTIVE";

export type WalletAggregate = {
  walletId: string;
  fingerprint: string;
  source: WalletSource;
  status: WalletStatus;
  encryptedPrivateKey: string;
  encryptedDek: string;
  privateKeyIv: string;
  privateKeyTag: string;
  dekIv: string;
  dekTag: string;
  createdAt: string;
  updatedAt: string;
};

export type OwnerCredential = {
  credentialId: string;
  passwordHash: string;
  mustRotate: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TransferOperation = {
  operationId: string;
  actorRole: Extract<ActorRole, "AGENT" | "OWNER">;
  chain: ChainKind;
  asset: AssetKind;
  requestPayload: Record<string, unknown>;
  status: TransferStatus;
  txHash: string | null;
  errorCode: ErrorCode | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SignOperation = {
  id: string;
  role: Extract<ActorRole, "AGENT" | "OWNER">;
  chain: ChainKind;
  messageDigest: string;
  result: AuditResult;
  errorCode: ErrorCode | null;
  createdAt: string;
};

export type AuditLog = {
  auditId: string;
  actorRole: ActorRole;
  action: string;
  result: AuditResult;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type SystemConfigSnapshot = {
  id: string;
  ownerCredentialNoticePath: string;
  vaultMode: "LOCAL_DEK_KEK";
  kekProvider: "docker-secret" | "file-path" | "env" | "development-auto";
  kekReference: string;
  chainRpcConfig: Record<string, JsonValue>;
  createdAt: string;
  updatedAt: string;
};
