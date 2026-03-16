import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common";
import type {
  BootstrapOwnerCredentialService,
  BootstrapWalletService,
  HealthCheckService,
  TransferSettlementService,
} from "@superise/application";
import { WalletDatabase, type WalletServerConfig } from "@superise/infrastructure";
import { TOKENS } from "./tokens";

@Injectable()
export class BootstrapService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(BootstrapService.name);
  private settlementTimer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(TOKENS.CONFIG) private readonly config: WalletServerConfig,
    @Inject(TOKENS.DATABASE) private readonly database: WalletDatabase,
    @Inject(TOKENS.HEALTH_CHECK_SERVICE)
    private readonly healthCheckService: HealthCheckService,
    @Inject(TOKENS.BOOTSTRAP_WALLET_SERVICE)
    private readonly bootstrapWalletService: BootstrapWalletService,
    @Inject(TOKENS.BOOTSTRAP_OWNER_CREDENTIAL_SERVICE)
    private readonly bootstrapOwnerCredentialService: BootstrapOwnerCredentialService,
    @Inject(TOKENS.TRANSFER_SETTLEMENT_SERVICE)
    private readonly transferSettlementService: TransferSettlementService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.database.migrate();
    await this.healthCheckService.execute();
    await this.bootstrapWalletService.ensureWallet();
    const ckbConfig =
      this.config.chainConfig.ckb.mode === "custom"
        ? {
            mode: "custom",
            preset: null,
            configPath: this.config.ckbChainConfigPath ?? null,
            rpcUrl: this.config.chainConfig.ckb.rpcUrl,
            indexerUrl: this.config.chainConfig.ckb.indexerUrl,
            genesisHash: this.config.chainConfig.ckb.genesisHash,
            addressPrefix: this.config.chainConfig.ckb.addressPrefix,
            scripts: this.config.chainConfig.ckb.scripts,
          }
        : {
            mode: "preset",
            preset: this.config.chainConfig.ckb.preset,
            configPath: null,
            rpcUrl: this.config.chainConfig.ckb.rpcUrl,
            indexerUrl: this.config.chainConfig.ckb.indexerUrl,
            genesisHash: this.config.chainConfig.ckb.genesisHash,
            addressPrefix: this.config.chainConfig.ckb.addressPrefix,
            scripts: null,
          };
    const evmConfig =
      this.config.chainConfig.evm.mode === "custom"
        ? {
            mode: "custom",
            preset: null,
            configPath: this.config.evmChainConfigPath ?? null,
            rpcUrl: this.config.chainConfig.evm.rpcUrl,
            chainId: this.config.chainConfig.evm.chainId,
            networkName: this.config.chainConfig.evm.networkName,
            tokens: this.config.chainConfig.evm.tokens,
          }
        : {
            mode: "preset",
            preset: this.config.chainConfig.evm.preset,
            configPath: null,
            rpcUrl: this.config.chainConfig.evm.rpcUrl,
            chainId: this.config.chainConfig.evm.chainId,
            networkName: this.config.chainConfig.evm.networkName,
            tokens: this.config.chainConfig.evm.tokens,
          };
    const ownerCredential = await this.bootstrapOwnerCredentialService.ensureCredential({
      ownerCredentialNoticePath: this.config.ownerNoticePath,
      chainRpcConfig: {
        ckb: ckbConfig,
        evm: evmConfig,
      },
    });
    if (
      this.config.deploymentProfile === "quickstart" &&
      ownerCredential.created &&
      ownerCredential.initialPassword
    ) {
      this.logger.warn(
        `Quickstart initial Owner credential notice written to ${ownerCredential.noticePath}`,
      );
      this.logger.warn(
        `Quickstart initial Owner password (shown once): ${ownerCredential.initialPassword}`,
      );
      this.logger.warn("Rotate the initial Owner password after the first login.");
    }
    this.settlementTimer = setInterval(() => {
      void this.transferSettlementService.execute().catch(() => undefined);
    }, this.config.transferSettlementIntervalMs);
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.settlementTimer) {
      clearInterval(this.settlementTimer);
      this.settlementTimer = null;
    }
    await this.database.close();
  }
}
