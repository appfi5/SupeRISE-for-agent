import { Module } from "@nestjs/common";
import { WalletToolsController } from "../controllers/wallet-tools.controller";
import { WalletModule } from "./wallet.module";
import { WalletToolRegistryService } from "./wallet-tools/wallet-tool-registry.service";

@Module({
  imports: [WalletModule],
  providers: [WalletToolRegistryService],
  controllers: [WalletToolsController],
  exports: [WalletToolRegistryService],
})
export class WalletToolsModule {}
