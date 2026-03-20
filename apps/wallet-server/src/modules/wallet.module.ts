import { Module } from "@nestjs/common";
import {
  AddressBookService,
  AssetLimitService,
  AuditLogQueryService,
  BootstrapWalletService,
  CurrentWalletQueryService,
  EthereumEthBalanceQueryService,
  EthereumEthTransferService,
  EthereumIdentityQueryService,
  EthereumMessageSigningService,
  EthereumTxStatusQueryService,
  EthereumUsdcBalanceQueryService,
  EthereumUsdcTransferService,
  EthereumUsdtBalanceQueryService,
  EthereumUsdtTransferService,
  HealthCheckService,
  NervosCkbBalanceQueryService,
  NervosCkbTransferService,
  NervosIdentityQueryService,
  NervosMessageSigningService,
  NervosTxStatusQueryService,
  OperationStatusQueryService,
  OwnerCredentialStatusQueryService,
  RuntimeHealthCheckService,
  TransferSettlementService,
  WalletExportService,
  WalletImportService,
  type AssetLimitLocker,
  type ChainWriteLocker,
  type CkbWalletAdapter,
  type EvmWalletAdapter,
  type RepositoryBundle,
  type UnitOfWork,
  type VaultPort,
  type WalletPrivateKeyFactory,
} from "@superise/application";
import {
  InMemoryAssetLimitLocker,
  InMemoryChainWriteLocker,
  type WalletServerConfig,
} from "@superise/infrastructure";
import { TOKENS } from "../tokens";

@Module({
  providers: [
    {
      provide: TOKENS.CHAIN_LOCKER,
      useFactory: () => new InMemoryChainWriteLocker(),
    },
    {
      provide: TOKENS.ASSET_LIMIT_LOCKER,
      useFactory: () => new InMemoryAssetLimitLocker(),
    },
    {
      provide: TOKENS.BOOTSTRAP_WALLET_SERVICE,
      inject: [
        TOKENS.REPOSITORIES,
        TOKENS.UNIT_OF_WORK,
        TOKENS.VAULT,
        TOKENS.PRIVATE_KEY_FACTORY,
      ],
      useFactory: (
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        vault: VaultPort,
        privateKeyFactory: WalletPrivateKeyFactory,
      ) =>
        new BootstrapWalletService(repos, unitOfWork, vault, privateKeyFactory),
    },
    {
      provide: TOKENS.CURRENT_WALLET_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES],
      useFactory: (repos: RepositoryBundle) =>
        new CurrentWalletQueryService(repos.wallets),
    },
    {
      provide: TOKENS.ADDRESS_BOOK_SERVICE,
      inject: [
        TOKENS.REPOSITORIES,
        TOKENS.UNIT_OF_WORK,
        TOKENS.CKB_ADAPTER,
        TOKENS.EVM_ADAPTER,
      ],
      useFactory: (
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        ckb: CkbWalletAdapter,
        evm: EvmWalletAdapter,
      ) => new AddressBookService(repos, unitOfWork, ckb, evm),
    },
    {
      provide: TOKENS.OWNER_CREDENTIAL_STATUS_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES],
      useFactory: (repos: RepositoryBundle) =>
        new OwnerCredentialStatusQueryService(repos.ownerCredentials),
    },
    {
      provide: TOKENS.NERVOS_IDENTITY_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.VAULT, TOKENS.CKB_ADAPTER],
      useFactory: (
        repos: RepositoryBundle,
        vault: VaultPort,
        ckb: CkbWalletAdapter,
      ) => new NervosIdentityQueryService(repos.wallets, vault, ckb),
    },
    {
      provide: TOKENS.NERVOS_CKB_BALANCE_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.VAULT, TOKENS.CKB_ADAPTER],
      useFactory: (
        repos: RepositoryBundle,
        vault: VaultPort,
        ckb: CkbWalletAdapter,
      ) => new NervosCkbBalanceQueryService(repos.wallets, vault, ckb),
    },
    {
      provide: TOKENS.NERVOS_MESSAGE_SIGNING_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.VAULT, TOKENS.CKB_ADAPTER],
      useFactory: (
        repos: RepositoryBundle,
        vault: VaultPort,
        ckb: CkbWalletAdapter,
      ) => new NervosMessageSigningService(repos, vault, ckb),
    },
    {
      provide: TOKENS.NERVOS_CKB_TRANSFER_SERVICE,
      inject: [
        TOKENS.REPOSITORIES,
        TOKENS.UNIT_OF_WORK,
        TOKENS.CHAIN_LOCKER,
        TOKENS.ASSET_LIMIT_SERVICE,
        TOKENS.VAULT,
        TOKENS.CKB_ADAPTER,
      ],
      useFactory: (
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        locker: ChainWriteLocker,
        assetLimits: AssetLimitService,
        vault: VaultPort,
        ckb: CkbWalletAdapter,
      ) =>
        new NervosCkbTransferService(
          repos,
          unitOfWork,
          locker,
          assetLimits,
          vault,
          ckb,
        ),
    },
    {
      provide: TOKENS.NERVOS_TX_STATUS_QUERY_SERVICE,
      inject: [TOKENS.CKB_ADAPTER],
      useFactory: (ckb: CkbWalletAdapter) => new NervosTxStatusQueryService(ckb),
    },
    {
      provide: TOKENS.ETHEREUM_IDENTITY_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.VAULT, TOKENS.EVM_ADAPTER],
      useFactory: (
        repos: RepositoryBundle,
        vault: VaultPort,
        evm: EvmWalletAdapter,
      ) => new EthereumIdentityQueryService(repos.wallets, vault, evm),
    },
    {
      provide: TOKENS.ETHEREUM_USDT_BALANCE_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.VAULT, TOKENS.EVM_ADAPTER],
      useFactory: (
        repos: RepositoryBundle,
        vault: VaultPort,
        evm: EvmWalletAdapter,
      ) => new EthereumUsdtBalanceQueryService(repos.wallets, vault, evm),
    },
    {
      provide: TOKENS.ETHEREUM_USDC_BALANCE_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.VAULT, TOKENS.EVM_ADAPTER],
      useFactory: (
        repos: RepositoryBundle,
        vault: VaultPort,
        evm: EvmWalletAdapter,
      ) => new EthereumUsdcBalanceQueryService(repos.wallets, vault, evm),
    },
    {
      provide: TOKENS.ETHEREUM_ETH_BALANCE_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.VAULT, TOKENS.EVM_ADAPTER],
      useFactory: (
        repos: RepositoryBundle,
        vault: VaultPort,
        evm: EvmWalletAdapter,
      ) => new EthereumEthBalanceQueryService(repos.wallets, vault, evm),
    },
    {
      provide: TOKENS.ETHEREUM_MESSAGE_SIGNING_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.VAULT, TOKENS.EVM_ADAPTER],
      useFactory: (
        repos: RepositoryBundle,
        vault: VaultPort,
        evm: EvmWalletAdapter,
      ) => new EthereumMessageSigningService(repos, vault, evm),
    },
    {
      provide: TOKENS.ETHEREUM_ETH_TRANSFER_SERVICE,
      inject: [
        TOKENS.REPOSITORIES,
        TOKENS.UNIT_OF_WORK,
        TOKENS.CHAIN_LOCKER,
        TOKENS.ASSET_LIMIT_SERVICE,
        TOKENS.VAULT,
        TOKENS.EVM_ADAPTER,
      ],
      useFactory: (
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        locker: ChainWriteLocker,
        assetLimits: AssetLimitService,
        vault: VaultPort,
        evm: EvmWalletAdapter,
      ) =>
        new EthereumEthTransferService(
          repos,
          unitOfWork,
          locker,
          assetLimits,
          vault,
          evm,
        ),
    },
    {
      provide: TOKENS.ETHEREUM_USDT_TRANSFER_SERVICE,
      inject: [
        TOKENS.REPOSITORIES,
        TOKENS.UNIT_OF_WORK,
        TOKENS.CHAIN_LOCKER,
        TOKENS.ASSET_LIMIT_SERVICE,
        TOKENS.VAULT,
        TOKENS.EVM_ADAPTER,
      ],
      useFactory: (
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        locker: ChainWriteLocker,
        assetLimits: AssetLimitService,
        vault: VaultPort,
        evm: EvmWalletAdapter,
      ) =>
        new EthereumUsdtTransferService(
          repos,
          unitOfWork,
          locker,
          assetLimits,
          vault,
          evm,
        ),
    },
    {
      provide: TOKENS.ETHEREUM_USDC_TRANSFER_SERVICE,
      inject: [
        TOKENS.REPOSITORIES,
        TOKENS.UNIT_OF_WORK,
        TOKENS.CHAIN_LOCKER,
        TOKENS.ASSET_LIMIT_SERVICE,
        TOKENS.VAULT,
        TOKENS.EVM_ADAPTER,
      ],
      useFactory: (
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        locker: ChainWriteLocker,
        assetLimits: AssetLimitService,
        vault: VaultPort,
        evm: EvmWalletAdapter,
      ) =>
        new EthereumUsdcTransferService(
          repos,
          unitOfWork,
          locker,
          assetLimits,
          vault,
          evm,
        ),
    },
    {
      provide: TOKENS.ETHEREUM_TX_STATUS_QUERY_SERVICE,
      inject: [TOKENS.EVM_ADAPTER],
      useFactory: (evm: EvmWalletAdapter) => new EthereumTxStatusQueryService(evm),
    },
    {
      provide: TOKENS.ASSET_LIMIT_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.UNIT_OF_WORK, TOKENS.ASSET_LIMIT_LOCKER],
      useFactory: (
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        locker: AssetLimitLocker,
      ) => new AssetLimitService(repos, unitOfWork, locker),
    },
    {
      provide: TOKENS.TRANSFER_SETTLEMENT_SERVICE,
      inject: [
        TOKENS.CONFIG,
        TOKENS.REPOSITORIES,
        TOKENS.UNIT_OF_WORK,
        TOKENS.ASSET_LIMIT_SERVICE,
        TOKENS.NERVOS_TX_STATUS_QUERY_SERVICE,
        TOKENS.ETHEREUM_TX_STATUS_QUERY_SERVICE,
      ],
      useFactory: (
        config: WalletServerConfig,
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        assetLimits: AssetLimitService,
        nervosTxStatus: NervosTxStatusQueryService,
        ethereumTxStatus: EthereumTxStatusQueryService,
      ) =>
        new TransferSettlementService(
          repos,
          unitOfWork,
          assetLimits,
          nervosTxStatus,
          ethereumTxStatus,
          config.transferReservedTimeoutMs,
          config.transferSubmittedTimeoutMs,
        ),
    },
    {
      provide: TOKENS.WALLET_IMPORT_SERVICE,
      inject: [
        TOKENS.REPOSITORIES,
        TOKENS.UNIT_OF_WORK,
        TOKENS.VAULT,
        TOKENS.CKB_ADAPTER,
        TOKENS.EVM_ADAPTER,
      ],
      useFactory: (
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        vault: VaultPort,
        ckb: CkbWalletAdapter,
        evm: EvmWalletAdapter,
      ) => new WalletImportService(repos, unitOfWork, vault, ckb, evm),
    },
    {
      provide: TOKENS.WALLET_EXPORT_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.VAULT],
      useFactory: (repos: RepositoryBundle, vault: VaultPort) =>
        new WalletExportService(repos, vault),
    },
    {
      provide: TOKENS.OPERATION_STATUS_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES],
      useFactory: (repos: RepositoryBundle) =>
        new OperationStatusQueryService(repos.transfers),
    },
    {
      provide: TOKENS.AUDIT_LOG_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES],
      useFactory: (repos: RepositoryBundle) =>
        new AuditLogQueryService(repos.audits),
    },
    {
      provide: TOKENS.HEALTH_CHECK_SERVICE,
      inject: [TOKENS.DATABASE, TOKENS.VAULT, TOKENS.CKB_ADAPTER, TOKENS.EVM_ADAPTER],
      useFactory: (
        database: { checkHealth: () => Promise<void> },
        vault: VaultPort,
        ckb: CkbWalletAdapter,
        evm: EvmWalletAdapter,
      ) => new HealthCheckService(database, vault, ckb, evm),
    },
    {
      provide: TOKENS.RUNTIME_HEALTH_CHECK_SERVICE,
      inject: [TOKENS.DATABASE],
      useFactory: (database: { checkHealth: () => Promise<void> }) =>
        new RuntimeHealthCheckService(database),
    },
  ],
  exports: [
    TOKENS.CHAIN_LOCKER,
    TOKENS.BOOTSTRAP_WALLET_SERVICE,
    TOKENS.CURRENT_WALLET_QUERY_SERVICE,
    TOKENS.ADDRESS_BOOK_SERVICE,
    TOKENS.OWNER_CREDENTIAL_STATUS_QUERY_SERVICE,
    TOKENS.NERVOS_IDENTITY_QUERY_SERVICE,
    TOKENS.NERVOS_CKB_BALANCE_QUERY_SERVICE,
    TOKENS.NERVOS_MESSAGE_SIGNING_SERVICE,
    TOKENS.NERVOS_CKB_TRANSFER_SERVICE,
    TOKENS.NERVOS_TX_STATUS_QUERY_SERVICE,
    TOKENS.ETHEREUM_IDENTITY_QUERY_SERVICE,
    TOKENS.ETHEREUM_ETH_BALANCE_QUERY_SERVICE,
    TOKENS.ETHEREUM_USDT_BALANCE_QUERY_SERVICE,
    TOKENS.ETHEREUM_USDC_BALANCE_QUERY_SERVICE,
    TOKENS.ETHEREUM_MESSAGE_SIGNING_SERVICE,
    TOKENS.ETHEREUM_ETH_TRANSFER_SERVICE,
    TOKENS.ETHEREUM_USDT_TRANSFER_SERVICE,
    TOKENS.ETHEREUM_USDC_TRANSFER_SERVICE,
    TOKENS.ETHEREUM_TX_STATUS_QUERY_SERVICE,
    TOKENS.ASSET_LIMIT_SERVICE,
    TOKENS.TRANSFER_SETTLEMENT_SERVICE,
    TOKENS.WALLET_IMPORT_SERVICE,
    TOKENS.WALLET_EXPORT_SERVICE,
    TOKENS.OPERATION_STATUS_QUERY_SERVICE,
    TOKENS.AUDIT_LOG_QUERY_SERVICE,
    TOKENS.HEALTH_CHECK_SERVICE,
    TOKENS.RUNTIME_HEALTH_CHECK_SERVICE,
  ],
})
export class WalletModule {}
