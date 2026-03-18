import { Module } from "@nestjs/common";
import { BuildController } from "../controllers/build.controller";
import { HealthController } from "../controllers/health.controller";
import { WalletModule } from "./wallet.module";

@Module({
  imports: [WalletModule],
  controllers: [BuildController, HealthController],
})
export class HealthModule {}
