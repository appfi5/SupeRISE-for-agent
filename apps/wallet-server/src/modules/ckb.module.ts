import { Global, Module } from "@nestjs/common";
import { CkbCccWalletAdapter } from "@superise/adapters-ckb";
import type { WalletServerConfig } from "@superise/infrastructure";
import { TOKENS } from "../tokens";

@Global()
@Module({
  providers: [
    {
      provide: TOKENS.CKB_ADAPTER,
      inject: [TOKENS.CONFIG],
      useFactory: (config: WalletServerConfig) => {
        const ckbConfig = config.chainConfig.ckb;

        return new CkbCccWalletAdapter(
          ckbConfig.mode === "custom"
            ? {
                mode: "custom",
                rpcUrl: ckbConfig.rpcUrl,
                indexerUrl: ckbConfig.indexerUrl,
                expectedGenesisHash: ckbConfig.genesisHash,
                addressPrefix: ckbConfig.addressPrefix,
                scripts: ckbConfig.scripts,
              }
            : {
                mode: "preset",
                preset: ckbConfig.preset,
                rpcUrl: ckbConfig.rpcUrl,
                indexerUrl: ckbConfig.indexerUrl,
                expectedGenesisHash: ckbConfig.genesisHash,
              },
        );
      },
    },
  ],
  exports: [TOKENS.CKB_ADAPTER],
})
export class CkbModule {}
