import {
  createAuditLog,
  WalletDomainError,
} from "@superise/domain";
import {
  nowIso,
  toErrorMessage,
} from "@superise/shared";
import type {
  KekkedMetadata,
  RepositoryBundle,
  UnitOfWork,
  VaultPort,
} from "../ports";

const VALID_KEK_PROVIDERS = new Set<KekkedMetadata["provider"]>([
  "docker-secret",
  "file-path",
  "env",
  "development-auto",
]);

export type RotateKekInput = {
  nextKek: string;
  nextKekProvider: KekkedMetadata["provider"];
  nextKekReference: string;
};

export type RotateKekResult = {
  walletFingerprint: string;
  kekProvider: KekkedMetadata["provider"];
  kekReference: string;
  rotatedAt: string;
};

export class RotateKekService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly unitOfWork: UnitOfWork,
    private readonly vault: VaultPort,
  ) {}

  async execute(input: RotateKekInput): Promise<RotateKekResult> {
    const wallet = await this.repos.wallets.getCurrent();
    if (!wallet) {
      throw new WalletDomainError("WALLET_NOT_FOUND", "Current wallet is not initialized");
    }

    const currentSnapshot = await this.repos.systemConfig.getCurrent();
    if (!currentSnapshot) {
      throw new WalletDomainError("VAULT_ERROR", "System config snapshot is not initialized");
    }

    const nextKekReference = input.nextKekReference.trim();
    if (!nextKekReference) {
      throw new WalletDomainError("VALIDATION_ERROR", "nextKekReference is required");
    }
    if (!VALID_KEK_PROVIDERS.has(input.nextKekProvider)) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `nextKekProvider is invalid: ${input.nextKekProvider}`,
      );
    }

    try {
      const rewrappedDek = await this.vault.rewrapDek(wallet, input.nextKek);
      const rotatedAt = nowIso();

      await this.unitOfWork.run(async (repos) => {
        await repos.wallets.saveCurrent({
          ...wallet,
          ...rewrappedDek,
          updatedAt: rotatedAt,
        });
        await repos.systemConfig.saveCurrent({
          ...currentSnapshot,
          kekProvider: input.nextKekProvider,
          kekReference: nextKekReference,
          updatedAt: rotatedAt,
        });
        await repos.audits.save(
          createAuditLog({
            actorRole: "SYSTEM",
            action: "vault.rotate_kek",
            result: "SUCCESS",
            metadata: {
              walletFingerprint: wallet.fingerprint,
              nextKekProvider: input.nextKekProvider,
              nextKekReference,
            },
          }),
        );
      });

      return {
        walletFingerprint: wallet.fingerprint,
        kekProvider: input.nextKekProvider,
        kekReference: nextKekReference,
        rotatedAt,
      };
    } catch (error) {
      await this.repos.audits.save(
        createAuditLog({
          actorRole: "SYSTEM",
          action: "vault.rotate_kek",
          result: "FAILED",
          metadata: {
            walletFingerprint: wallet.fingerprint,
            nextKekProvider: input.nextKekProvider,
            nextKekReference,
            error: toErrorMessage(error),
          },
        }),
      );

      throw new WalletDomainError(
        "VAULT_ERROR",
        `KEK rotation failed: ${toErrorMessage(error)}`,
      );
    }
  }
}
