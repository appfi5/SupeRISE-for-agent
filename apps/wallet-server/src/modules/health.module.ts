import { Module } from "@nestjs/common";
import { HealthController } from "../controllers/health.controller";
import { WalletModule } from "./wallet.module";

@Module({
  imports: [WalletModule],
  controllers: [HealthController],
})
export class HealthModule {}
