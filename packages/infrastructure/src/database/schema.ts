import type { Kysely, Transaction } from "kysely";

export type WalletStateTable = {
  id: string;
  status: string;
  encrypted_private_key: string;
  encrypted_dek: string;
  private_key_iv: string;
  private_key_tag: string;
  dek_iv: string;
  dek_tag: string;
  wallet_fingerprint: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export type OwnerCredentialsTable = {
  id: string;
  password_hash: string;
  must_rotate: number;
  created_at: string;
  updated_at: string;
};

export type TransferOperationsTable = {
  id: string;
  role: string;
  chain: string;
  asset: string;
  target_type: string;
  target_input: string;
  resolved_to_address: string | null;
  resolved_contact_name: string | null;
  requested_amount: string;
  request_payload: string;
  status: string;
  tx_hash: string | null;
  error_code: string | null;
  error_message: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  failed_at: string | null;
  last_chain_status: string | null;
  last_chain_checked_at: string | null;
  limit_window: string | null;
  limit_snapshot: string | null;
  created_at: string;
  updated_at: string;
};

export type AddressBookContactsTable = {
  id: string;
  name: string;
  normalized_name: string;
  note: string | null;
  nervos_address: string | null;
  normalized_nervos_address: string | null;
  ethereum_address: string | null;
  normalized_ethereum_address: string | null;
  created_at: string;
  updated_at: string;
};

export type SignOperationsTable = {
  id: string;
  role: string;
  message_digest: string;
  chain: string;
  result: string;
  error_code: string | null;
  created_at: string;
};

export type AuditLogsTable = {
  id: string;
  actor_role: string;
  action: string;
  result: string;
  metadata: string;
  created_at: string;
};

export type AssetLimitPoliciesTable = {
  id: string;
  chain: string;
  asset: string;
  daily_limit: string | null;
  weekly_limit: string | null;
  monthly_limit: string | null;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

export type AssetLimitReservationsTable = {
  id: string;
  operation_id: string;
  actor_role: string;
  chain: string;
  asset: string;
  amount: string;
  daily_window_start: string;
  weekly_window_start: string;
  monthly_window_start: string;
  status: string;
  release_reason: string | null;
  created_at: string;
  updated_at: string;
  settled_at: string | null;
};

export type SystemConfigTable = {
  id: string;
  owner_credential_notice_path: string;
  vault_mode: string;
  kek_provider: string;
  kek_reference: string;
  chain_rpc_config: string;
  created_at: string;
  updated_at: string;
};

export type DatabaseSchema = {
  wallet_state: WalletStateTable;
  owner_credentials: OwnerCredentialsTable;
  transfer_operations: TransferOperationsTable;
  address_book_contacts: AddressBookContactsTable;
  sign_operations: SignOperationsTable;
  audit_logs: AuditLogsTable;
  asset_limit_policies: AssetLimitPoliciesTable;
  asset_limit_reservations: AssetLimitReservationsTable;
  system_config: SystemConfigTable;
};

export type Executor = Kysely<DatabaseSchema> | Transaction<DatabaseSchema>;
