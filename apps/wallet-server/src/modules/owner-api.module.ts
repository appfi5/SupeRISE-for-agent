import { Module } from "@nestjs/common";
import { OwnerCredentialController } from "../controllers/owner-credential.controller";
import { OwnerAuthController } from "../controllers/owner-auth.controller";
import { OwnerAuditController } from "../controllers/owner-audit.controller";
import { OwnerWalletController } from "../controllers/owner-wallet.controller";
import { OwnerAuthModule } from "./owner-auth.module";
import { WalletModule } from "./wallet.module";

@Module({
  imports: [OwnerAuthModule, WalletModule],
  controllers: [
    OwnerAuthController,
    OwnerCredentialController,
    OwnerWalletController,
    OwnerAuditController,
  ],
})
export class OwnerApiModule {}
