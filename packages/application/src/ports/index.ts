import type {
  EthereumTransferEthRequest,
  EthereumTransferUsdcRequest,
  EthereumTransferUsdtRequest,
  NervosTransferCkbRequest,
} from "@superise/app-contracts";
import type {
  AuditLog,
  AssetLimitPolicy,
  AssetLimitReservation,
  ChainTransactionStatus,
  ChainKind,
  OwnerCredential,
  SignOperation,
  SystemConfigSnapshot,
  TransferOperation,
  TransferStatus,
  WalletAggregate,
} from "@superise/domain";
import type { JsonValue } from "@superise/shared";

export type EncryptedWalletMaterial = {
  encryptedPrivateKey: string;
  encryptedDek: string;
  privateKeyIv: string;
  privateKeyTag: string;
  dekIv: string;
  dekTag: string;
};

export type RewrappedDekMaterial = Pick<
  EncryptedWalletMaterial,
  "encryptedDek" | "dekIv" | "dekTag"
>;

export type KekkedMetadata = {
  provider: "docker-secret" | "file-path" | "env" | "development-auto";
  reference: string;
};

export interface WalletRepository {
  getCurrent(): Promise<WalletAggregate | null>;
  saveCurrent(wallet: WalletAggregate): Promise<void>;
}

export interface OwnerCredentialRepository {
  getCurrent(): Promise<OwnerCredential | null>;
  saveCurrent(credential: OwnerCredential): Promise<void>;
}

export interface TransferOperationRepository {
  getById(operationId: string): Promise<TransferOperation | null>;
  listByStatuses(statuses: TransferStatus[], limit: number): Promise<TransferOperation[]>;
  save(operation: TransferOperation): Promise<void>;
}

export interface SignOperationRepository {
  save(operation: SignOperation): Promise<void>;
}

export interface AuditLogRepository {
  listRecent(limit: number): Promise<AuditLog[]>;
  save(log: AuditLog): Promise<void>;
}

export interface SystemConfigRepository {
  getCurrent(): Promise<SystemConfigSnapshot | null>;
  saveCurrent(config: SystemConfigSnapshot): Promise<void>;
}

export interface AssetLimitPolicyRepository {
  getByChainAsset(
    chain: ChainKind,
    asset: AssetLimitPolicy["asset"],
  ): Promise<AssetLimitPolicy | null>;
  listAll(): Promise<AssetLimitPolicy[]>;
  save(policy: AssetLimitPolicy): Promise<void>;
}

export interface AssetLimitReservationRepository {
  getByOperationId(operationId: string): Promise<AssetLimitReservation | null>;
  listByChainAsset(
    chain: ChainKind,
    asset: AssetLimitReservation["asset"],
  ): Promise<AssetLimitReservation[]>;
  save(reservation: AssetLimitReservation): Promise<void>;
}

export type RepositoryBundle = {
  wallets: WalletRepository;
  ownerCredentials: OwnerCredentialRepository;
  transfers: TransferOperationRepository;
  signs: SignOperationRepository;
  audits: AuditLogRepository;
  systemConfig: SystemConfigRepository;
  assetLimitPolicies: AssetLimitPolicyRepository;
  assetLimitReservations: AssetLimitReservationRepository;
};

export interface UnitOfWork {
  run<T>(work: (repos: RepositoryBundle) => Promise<T>): Promise<T>;
}

export interface DatabaseHealthPort {
  checkHealth(): Promise<void>;
}

export interface VaultPort {
  validateKek(): Promise<void>;
  encryptPrivateKey(privateKey: string): Promise<EncryptedWalletMaterial>;
  decryptPrivateKey(wallet: WalletAggregate): Promise<string>;
  rewrapDek(
    wallet: WalletAggregate,
    nextKek: string,
  ): Promise<RewrappedDekMaterial>;
  getMetadata(): KekkedMetadata;
}

export interface PasswordHasher {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, passwordHash: string): Promise<boolean>;
  generateOwnerPassword(): string;
}

export type OwnerAccessTokenIssueInput = {
  credentialId: string;
  credentialUpdatedAt: string;
};

export type OwnerAccessTokenClaims = {
  subject: "owner";
  credentialId: string;
  credentialUpdatedAt: string;
  issuedAt: string;
  expiresAt: string;
  tokenId: string;
};

export type IssuedOwnerAccessToken = {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  expiresAt: string;
};

export interface OwnerAccessTokenPort {
  issue(input: OwnerAccessTokenIssueInput): Promise<IssuedOwnerAccessToken>;
  verify(token: string): Promise<OwnerAccessTokenClaims>;
}

export interface OwnerCredentialNoticeWriter {
  write(password: string): Promise<string>;
}

export interface ChainWriteLocker {
  execute<T>(chain: ChainKind, task: () => Promise<T>): Promise<T>;
}

export interface AssetLimitLocker {
  execute<T>(key: string, task: () => Promise<T>): Promise<T>;
}

export type ChainTxStatusResult = {
  txHash: string;
  status: ChainTransactionStatus;
  blockNumber?: string;
  blockHash?: string;
  confirmations?: string;
  reason?: string;
};

export interface CkbWalletAdapter {
  deriveAddress(privateKey: string): Promise<string>;
  getBalance(privateKey: string): Promise<string>;
  signMessage(
    privateKey: string,
    message: string | Uint8Array,
  ): Promise<string>;
  transfer(
    privateKey: string,
    request: NervosTransferCkbRequest,
  ): Promise<{ txHash: string }>;
  getTxStatus(txHash: string): Promise<ChainTxStatusResult>;
  checkHealth(): Promise<void>;
}

export interface EvmWalletAdapter {
  deriveAddress(privateKey: string): Promise<string>;
  getEthBalance(privateKey: string): Promise<string>;
  getUsdtBalance(privateKey: string): Promise<string>;
  getUsdcBalance(privateKey: string): Promise<string>;
  signMessage(
    privateKey: string,
    message: string | Uint8Array,
  ): Promise<string>;
  transferEth(
    privateKey: string,
    request: EthereumTransferEthRequest,
  ): Promise<{ txHash: string }>;
  transferUsdt(
    privateKey: string,
    request: EthereumTransferUsdtRequest,
  ): Promise<{ txHash: string }>;
  transferUsdc(
    privateKey: string,
    request: EthereumTransferUsdcRequest,
  ): Promise<{ txHash: string }>;
  getTxStatus(txHash: string): Promise<ChainTxStatusResult>;
  checkHealth(): Promise<void>;
}

export interface WalletPrivateKeyFactory {
  create(): Promise<string>;
}

export type RuntimeSnapshotInput = {
  ownerCredentialNoticePath: string;
  chainRpcConfig: Record<string, JsonValue>;
};
