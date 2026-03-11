import type { WalletAggregate } from "@superise/domain";
import {
  createAuditLog,
  createOwnerCredential,
} from "@superise/domain";
import {
  createWalletFingerprint,
  nowIso,
} from "@superise/shared";
import type {
  OwnerCredentialNoticeWriter,
  PasswordHasher,
  RepositoryBundle,
  RuntimeSnapshotInput,
  UnitOfWork,
  VaultPort,
  WalletPrivateKeyFactory,
} from "../ports";

export class BootstrapWalletService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly unitOfWork: UnitOfWork,
    private readonly vault: VaultPort,
    private readonly keyFactory: WalletPrivateKeyFactory,
  ) {}

  async ensureWallet(): Promise<WalletAggregate> {
    const existing = await this.repos.wallets.getCurrent();
    if (existing) {
      return existing;
    }

    const privateKey = await this.keyFactory.create();
    const encrypted = await this.vault.encryptPrivateKey(privateKey);
    const now = nowIso();
    const wallet: WalletAggregate = {
      walletId: "wallet_current",
      fingerprint: createWalletFingerprint(privateKey),
      source: "AUTO_GENERATED",
      status: "ACTIVE",
      ...encrypted,
      createdAt: now,
      updatedAt: now,
    };

    await this.unitOfWork.run(async (repos) => {
      await repos.wallets.saveCurrent(wallet);
      await repos.audits.save(
        createAuditLog({
          actorRole: "SYSTEM",
          action: "wallet.bootstrap",
          result: "SUCCESS",
          metadata: {
            walletFingerprint: wallet.fingerprint,
            source: wallet.source,
          },
        }),
      );
    });

    return wallet;
  }
}

export class BootstrapOwnerCredentialService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly unitOfWork: UnitOfWork,
    private readonly passwordHasher: PasswordHasher,
    private readonly noticeWriter: OwnerCredentialNoticeWriter,
    private readonly vault: VaultPort,
  ) {}

  async ensureCredential(input: RuntimeSnapshotInput): Promise<void> {
    const existing = await this.repos.ownerCredentials.getCurrent();
    const currentSnapshot = await this.repos.systemConfig.getCurrent();

    if (!existing) {
      const password = this.passwordHasher.generateOwnerPassword();
      const passwordHash = await this.passwordHasher.hashPassword(password);
      const credential = createOwnerCredential(passwordHash);
      const noticePath = await this.noticeWriter.write(password);

      await this.unitOfWork.run(async (repos) => {
        await repos.ownerCredentials.saveCurrent(credential);
        await repos.systemConfig.saveCurrent({
          id: "system_config_current",
          ownerCredentialNoticePath: noticePath,
          vaultMode: "LOCAL_DEK_KEK",
          kekProvider: this.vault.getMetadata().provider,
          kekReference: this.vault.getMetadata().reference,
          chainRpcConfig: input.chainRpcConfig,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
        await repos.audits.save(
          createAuditLog({
            actorRole: "SYSTEM",
            action: "owner_credential.bootstrap",
            result: "SUCCESS",
            metadata: { noticePath },
          }),
        );
      });

      return;
    }

    if (!currentSnapshot) {
      await this.repos.systemConfig.saveCurrent({
        id: "system_config_current",
        ownerCredentialNoticePath: input.ownerCredentialNoticePath,
        vaultMode: "LOCAL_DEK_KEK",
        kekProvider: this.vault.getMetadata().provider,
        kekReference: this.vault.getMetadata().reference,
        chainRpcConfig: input.chainRpcConfig,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }
  }
}
