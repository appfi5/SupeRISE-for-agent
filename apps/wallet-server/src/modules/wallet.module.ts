import { Module } from "@nestjs/common";
import {
  AuditLogQueryService,
  BootstrapWalletService,
  CurrentWalletQueryService,
  EthereumAddressQueryService,
  EthereumEthBalanceQueryService,
  EthereumEthTransferService,
  EthereumMessageSigningService,
  EthereumUsdtBalanceQueryService,
  EthereumUsdtTransferService,
  HealthCheckService,
  NervosAddressQueryService,
  NervosCkbBalanceQueryService,
  NervosCkbTransferService,
  NervosMessageSigningService,
  OperationStatusQueryService,
  OwnerCredentialStatusQueryService,
  RuntimeHealthCheckService,
  WalletExportService,
  WalletImportService,
  type ChainWriteLocker,
  type CkbWalletAdapter,
  type EvmWalletAdapter,
  type RepositoryBundle,
  type UnitOfWork,
  type VaultPort,
  type WalletPrivateKeyFactory,
} from "@superise/application";
import { InMemoryChainWriteLocker } from "@superise/infrastructure";
import { TOKENS } from "../tokens";

@Module({
  providers: [
    {
      provide: TOKENS.CHAIN_LOCKER,
      useFactory: () => new InMemoryChainWriteLocker(),
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
      provide: TOKENS.OWNER_CREDENTIAL_STATUS_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES],
      useFactory: (repos: RepositoryBundle) =>
        new OwnerCredentialStatusQueryService(repos.ownerCredentials),
    },
    {
      provide: TOKENS.NERVOS_ADDRESS_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.VAULT, TOKENS.CKB_ADAPTER],
      useFactory: (
        repos: RepositoryBundle,
        vault: VaultPort,
        ckb: CkbWalletAdapter,
      ) => new NervosAddressQueryService(repos.wallets, vault, ckb),
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
        TOKENS.VAULT,
        TOKENS.CKB_ADAPTER,
      ],
      useFactory: (
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        locker: ChainWriteLocker,
        vault: VaultPort,
        ckb: CkbWalletAdapter,
      ) => new NervosCkbTransferService(repos, unitOfWork, locker, vault, ckb),
    },
    {
      provide: TOKENS.ETHEREUM_ADDRESS_QUERY_SERVICE,
      inject: [TOKENS.REPOSITORIES, TOKENS.VAULT, TOKENS.EVM_ADAPTER],
      useFactory: (
        repos: RepositoryBundle,
        vault: VaultPort,
        evm: EvmWalletAdapter,
      ) => new EthereumAddressQueryService(repos.wallets, vault, evm),
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
        TOKENS.VAULT,
        TOKENS.EVM_ADAPTER,
      ],
      useFactory: (
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        locker: ChainWriteLocker,
        vault: VaultPort,
        evm: EvmWalletAdapter,
      ) => new EthereumEthTransferService(repos, unitOfWork, locker, vault, evm),
    },
    {
      provide: TOKENS.ETHEREUM_USDT_TRANSFER_SERVICE,
      inject: [
        TOKENS.REPOSITORIES,
        TOKENS.UNIT_OF_WORK,
        TOKENS.CHAIN_LOCKER,
        TOKENS.VAULT,
        TOKENS.EVM_ADAPTER,
      ],
      useFactory: (
        repos: RepositoryBundle,
        unitOfWork: UnitOfWork,
        locker: ChainWriteLocker,
        vault: VaultPort,
        evm: EvmWalletAdapter,
      ) => new EthereumUsdtTransferService(repos, unitOfWork, locker, vault, evm),
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
    TOKENS.OWNER_CREDENTIAL_STATUS_QUERY_SERVICE,
    TOKENS.NERVOS_ADDRESS_QUERY_SERVICE,
    TOKENS.NERVOS_CKB_BALANCE_QUERY_SERVICE,
    TOKENS.NERVOS_MESSAGE_SIGNING_SERVICE,
    TOKENS.NERVOS_CKB_TRANSFER_SERVICE,
    TOKENS.ETHEREUM_ADDRESS_QUERY_SERVICE,
    TOKENS.ETHEREUM_ETH_BALANCE_QUERY_SERVICE,
    TOKENS.ETHEREUM_USDT_BALANCE_QUERY_SERVICE,
    TOKENS.ETHEREUM_MESSAGE_SIGNING_SERVICE,
    TOKENS.ETHEREUM_ETH_TRANSFER_SERVICE,
    TOKENS.ETHEREUM_USDT_TRANSFER_SERVICE,
    TOKENS.WALLET_IMPORT_SERVICE,
    TOKENS.WALLET_EXPORT_SERVICE,
    TOKENS.OPERATION_STATUS_QUERY_SERVICE,
    TOKENS.AUDIT_LOG_QUERY_SERVICE,
    TOKENS.HEALTH_CHECK_SERVICE,
    TOKENS.RUNTIME_HEALTH_CHECK_SERVICE,
  ],
})
export class WalletModule {}
