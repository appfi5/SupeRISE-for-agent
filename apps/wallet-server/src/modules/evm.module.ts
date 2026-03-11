import { Global, Module } from "@nestjs/common";
import { ViemEvmWalletAdapter } from "@superise/adapters-evm";
import type { WalletServerConfig } from "@superise/infrastructure";
import { TOKENS } from "../tokens";

@Global()
@Module({
  providers: [
    {
      provide: TOKENS.EVM_ADAPTER,
      inject: [TOKENS.CONFIG],
      useFactory: (config: WalletServerConfig) => {
        const evmConfig = config.chainConfig.evm;

        return new ViemEvmWalletAdapter({
          mode: evmConfig.mode,
          preset: evmConfig.mode === "preset" ? evmConfig.preset : undefined,
          rpcUrl: evmConfig.rpcUrl,
          chainId: evmConfig.chainId,
          networkName: evmConfig.networkName,
          tokens: evmConfig.tokens,
        });
      },
    },
  ],
  exports: [TOKENS.EVM_ADAPTER],
})
export class EvmModule {}
