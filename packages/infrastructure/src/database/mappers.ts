import type {
  AuditLog,
  AssetLimitPolicy,
  AssetLimitReservation,
  OwnerCredential,
  SignOperation,
  SystemConfigSnapshot,
  TransferOperation,
  WalletAggregate,
} from "@superise/domain";
import { parseJson, serializeJson } from "@superise/shared";
import type { Insertable, Selectable } from "kysely";
import type {
  AuditLogsTable,
  AssetLimitPoliciesTable,
  AssetLimitReservationsTable,
  OwnerCredentialsTable,
  SignOperationsTable,
  SystemConfigTable,
  TransferOperationsTable,
  WalletStateTable,
} from "./schema";

export function walletFromRow(row: Selectable<WalletStateTable>): WalletAggregate {
  return {
    walletId: row.id,
    fingerprint: row.wallet_fingerprint,
    source: row.source as WalletAggregate["source"],
    status: row.status as WalletAggregate["status"],
    encryptedPrivateKey: row.encrypted_private_key,
    encryptedDek: row.encrypted_dek,
    privateKeyIv: row.private_key_iv,
    privateKeyTag: row.private_key_tag,
    dekIv: row.dek_iv,
    dekTag: row.dek_tag,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function walletToRow(
  wallet: WalletAggregate,
): Insertable<WalletStateTable> {
  return {
    id: "wallet_current",
    status: wallet.status,
    encrypted_private_key: wallet.encryptedPrivateKey,
    encrypted_dek: wallet.encryptedDek,
    private_key_iv: wallet.privateKeyIv,
    private_key_tag: wallet.privateKeyTag,
    dek_iv: wallet.dekIv,
    dek_tag: wallet.dekTag,
    wallet_fingerprint: wallet.fingerprint,
    source: wallet.source,
    created_at: wallet.createdAt,
    updated_at: wallet.updatedAt,
  };
}

export function ownerCredentialFromRow(
  row: Selectable<OwnerCredentialsTable>,
): OwnerCredential {
  return {
    credentialId: row.id,
    passwordHash: row.password_hash,
    mustRotate: Boolean(row.must_rotate),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function ownerCredentialToRow(
  credential: OwnerCredential,
): Insertable<OwnerCredentialsTable> {
  return {
    id: "owner_credential_current",
    password_hash: credential.passwordHash,
    must_rotate: credential.mustRotate ? 1 : 0,
    created_at: credential.createdAt,
    updated_at: credential.updatedAt,
  };
}

export function transferOperationFromRow(
  row: Selectable<TransferOperationsTable>,
): TransferOperation {
  return {
    operationId: row.id,
    actorRole: row.role as TransferOperation["actorRole"],
    chain: row.chain as TransferOperation["chain"],
    asset: row.asset as TransferOperation["asset"],
    requestPayload: parseJson(row.request_payload, {}),
    status: row.status as TransferOperation["status"],
    txHash: row.tx_hash,
    errorCode: row.error_code as TransferOperation["errorCode"],
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function transferOperationToRow(
  operation: TransferOperation,
): Insertable<TransferOperationsTable> {
  return {
    id: operation.operationId,
    role: operation.actorRole,
    chain: operation.chain,
    asset: operation.asset,
    request_payload: serializeJson(operation.requestPayload),
    status: operation.status,
    tx_hash: operation.txHash,
    error_code: operation.errorCode,
    error_message: operation.errorMessage,
    created_at: operation.createdAt,
    updated_at: operation.updatedAt,
  };
}

export function signOperationToRow(
  operation: SignOperation,
): Insertable<SignOperationsTable> {
  return {
    id: operation.id,
    role: operation.role,
    message_digest: operation.messageDigest,
    chain: operation.chain,
    result: operation.result,
    error_code: operation.errorCode,
    created_at: operation.createdAt,
  };
}

export function auditLogFromRow(row: Selectable<AuditLogsTable>): AuditLog {
  return {
    auditId: row.id,
    actorRole: row.actor_role as AuditLog["actorRole"],
    action: row.action,
    result: row.result as AuditLog["result"],
    metadata: parseJson(row.metadata, {}),
    createdAt: row.created_at,
  };
}

export function auditLogToRow(log: AuditLog): Insertable<AuditLogsTable> {
  return {
    id: log.auditId,
    actor_role: log.actorRole,
    action: log.action,
    result: log.result,
    metadata: serializeJson(log.metadata),
    created_at: log.createdAt,
  };
}

export function assetLimitPolicyFromRow(
  row: Selectable<AssetLimitPoliciesTable>,
): AssetLimitPolicy {
  return {
    policyId: row.id,
    chain: row.chain as AssetLimitPolicy["chain"],
    asset: row.asset as AssetLimitPolicy["asset"],
    dailyLimit: row.daily_limit,
    weeklyLimit: row.weekly_limit,
    monthlyLimit: row.monthly_limit,
    updatedBy: row.updated_by as AssetLimitPolicy["updatedBy"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function assetLimitPolicyToRow(
  policy: AssetLimitPolicy,
): Insertable<AssetLimitPoliciesTable> {
  return {
    id: policy.policyId,
    chain: policy.chain,
    asset: policy.asset,
    daily_limit: policy.dailyLimit,
    weekly_limit: policy.weeklyLimit,
    monthly_limit: policy.monthlyLimit,
    updated_by: policy.updatedBy,
    created_at: policy.createdAt,
    updated_at: policy.updatedAt,
  };
}

export function assetLimitReservationFromRow(
  row: Selectable<AssetLimitReservationsTable>,
): AssetLimitReservation {
  return {
    reservationId: row.id,
    operationId: row.operation_id,
    actorRole: row.actor_role as AssetLimitReservation["actorRole"],
    chain: row.chain as AssetLimitReservation["chain"],
    asset: row.asset as AssetLimitReservation["asset"],
    amount: row.amount,
    dailyWindowStart: row.daily_window_start,
    weeklyWindowStart: row.weekly_window_start,
    monthlyWindowStart: row.monthly_window_start,
    status: row.status as AssetLimitReservation["status"],
    releaseReason: row.release_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    settledAt: row.settled_at,
  };
}

export function assetLimitReservationToRow(
  reservation: AssetLimitReservation,
): Insertable<AssetLimitReservationsTable> {
  return {
    id: reservation.reservationId,
    operation_id: reservation.operationId,
    actor_role: reservation.actorRole,
    chain: reservation.chain,
    asset: reservation.asset,
    amount: reservation.amount,
    daily_window_start: reservation.dailyWindowStart,
    weekly_window_start: reservation.weeklyWindowStart,
    monthly_window_start: reservation.monthlyWindowStart,
    status: reservation.status,
    release_reason: reservation.releaseReason,
    created_at: reservation.createdAt,
    updated_at: reservation.updatedAt,
    settled_at: reservation.settledAt,
  };
}

export function systemConfigFromRow(
  row: Selectable<SystemConfigTable>,
): SystemConfigSnapshot {
  return {
    id: row.id,
    ownerCredentialNoticePath: row.owner_credential_notice_path,
    vaultMode: row.vault_mode as SystemConfigSnapshot["vaultMode"],
    kekProvider: row.kek_provider as SystemConfigSnapshot["kekProvider"],
    kekReference: row.kek_reference,
    chainRpcConfig: parseJson(row.chain_rpc_config, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function systemConfigToRow(
  config: SystemConfigSnapshot,
): Insertable<SystemConfigTable> {
  return {
    id: "system_config_current",
    owner_credential_notice_path: config.ownerCredentialNoticePath,
    vault_mode: config.vaultMode,
    kek_provider: config.kekProvider,
    kek_reference: config.kekReference,
    chain_rpc_config: serializeJson(config.chainRpcConfig),
    created_at: config.createdAt,
    updated_at: config.updatedAt,
  };
}
