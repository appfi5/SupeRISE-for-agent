import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common";
import type {
  BootstrapOwnerCredentialService,
  BootstrapWalletService,
  HealthCheckService,
} from "@superise/application";
import { WalletDatabase, type WalletServerConfig } from "@superise/infrastructure";
import { TOKENS } from "./tokens";

@Injectable()
export class BootstrapService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(
    @Inject(TOKENS.CONFIG) private readonly config: WalletServerConfig,
    @Inject(TOKENS.DATABASE) private readonly database: WalletDatabase,
    @Inject(TOKENS.HEALTH_CHECK_SERVICE)
    private readonly healthCheckService: HealthCheckService,
    @Inject(TOKENS.BOOTSTRAP_WALLET_SERVICE)
    private readonly bootstrapWalletService: BootstrapWalletService,
    @Inject(TOKENS.BOOTSTRAP_OWNER_CREDENTIAL_SERVICE)
    private readonly bootstrapOwnerCredentialService: BootstrapOwnerCredentialService,
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
    await this.bootstrapOwnerCredentialService.ensureCredential({
      ownerCredentialNoticePath: this.config.ownerNoticePath,
      chainRpcConfig: {
        ckb: ckbConfig,
        evm: evmConfig,
      },
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.database.close();
  }
}
