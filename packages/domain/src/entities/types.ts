import type { ErrorCode, JsonValue } from "@superise/shared";

export type WalletStatus = "ACTIVE" | "EMPTY";
export type WalletSource = "AUTO_GENERATED" | "IMPORTED" | "UNKNOWN";
export type ActorRole = "AGENT" | "OWNER" | "SYSTEM";
export type ChainKind = "ckb" | "evm";

export type AssetKind = "CKB" | "ETH" | "USDT" | "USDC";
export type TransferStatus = "RESERVED" | "SUBMITTED" | "CONFIRMED" | "FAILED";
export type TransferTargetType = "ADDRESS" | "CONTACT_NAME";
export type AuditResult = "SUCCESS" | "FAILED";
export type CredentialStatus = "DEFAULT_PENDING_ROTATION" | "ACTIVE";
export type AssetLimitWindow = "DAILY" | "WEEKLY" | "MONTHLY";
export type AssetLimitReservationStatus = "ACTIVE" | "CONSUMED" | "RELEASED";
export type ChainTransactionStatus = "NOT_FOUND" | "PENDING" | "CONFIRMED" | "FAILED";

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
  targetType: TransferTargetType;
  targetInput: string;
  resolvedToAddress: string | null;
  resolvedContactName: string | null;
  requestedAmount: string;
  requestPayload: Record<string, unknown>;
  status: TransferStatus;
  txHash: string | null;
  errorCode: ErrorCode | null;
  errorMessage: string | null;
  submittedAt: string | null;
  confirmedAt: string | null;
  failedAt: string | null;
  lastChainStatus: ChainTransactionStatus | null;
  lastChainCheckedAt: string | null;
  limitWindow: AssetLimitWindow | null;
  limitSnapshot: JsonValue | null;
  createdAt: string;
  updatedAt: string;
};

export type AddressBookContact = {
  contactId: string;
  name: string;
  normalizedName: string;
  note: string | null;
  nervosAddress: string | null;
  normalizedNervosAddress: string | null;
  ethereumAddress: string | null;
  normalizedEthereumAddress: string | null;
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

export type AssetLimitPolicy = {
  policyId: string;
  chain: ChainKind;
  asset: AssetKind;
  dailyLimit: string | null;
  weeklyLimit: string | null;
  monthlyLimit: string | null;
  updatedBy: Extract<ActorRole, "OWNER" | "SYSTEM">;
  createdAt: string;
  updatedAt: string;
};

export type AssetLimitReservation = {
  reservationId: string;
  operationId: string;
  actorRole: "AGENT";
  chain: ChainKind;
  asset: AssetKind;
  amount: string;
  dailyWindowStart: string;
  weeklyWindowStart: string;
  monthlyWindowStart: string;
  status: AssetLimitReservationStatus;
  releaseReason: string | null;
  createdAt: string;
  updatedAt: string;
  settledAt: string | null;
};

export type AssetLimitUsageSnapshot = {
  chain: ChainKind;
  asset: AssetKind;
  dailyConsumed: string;
  weeklyConsumed: string;
  monthlyConsumed: string;
  dailyReserved: string;
  weeklyReserved: string;
  monthlyReserved: string;
  dailyResetsAt: string;
  weeklyResetsAt: string;
  monthlyResetsAt: string;
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
