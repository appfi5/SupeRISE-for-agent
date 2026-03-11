import type { WalletCurrentDto } from "@superise/app-contracts";
import type { WalletAggregate } from "@superise/domain";
import {
  createAuditLog,
  WalletDomainError,
} from "@superise/domain";
import {
  createWalletFingerprint,
  normalizePrivateKeyHex,
  nowIso,
  toErrorMessage,
} from "@superise/shared";
import type {
  CkbWalletAdapter,
  EvmWalletAdapter,
  RepositoryBundle,
  UnitOfWork,
  VaultPort,
} from "../ports";
import { loadDecryptedPrivateKey } from "../utils/wallet-access";

export class WalletImportService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly unitOfWork: UnitOfWork,
    private readonly vault: VaultPort,
    private readonly ckb: CkbWalletAdapter,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(input: {
    privateKey: string;
    confirmed: true;
  }): Promise<WalletCurrentDto> {
    if (input.confirmed !== true) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        "Wallet import requires confirmed=true because it replaces the current wallet",
      );
    }

    const normalizedPrivateKey = normalizePrivateKeyHex(input.privateKey);

    try {
      await Promise.all([
        this.ckb.deriveAddress(normalizedPrivateKey),
        this.evm.deriveAddress(normalizedPrivateKey),
      ]);
      const encrypted = await this.vault.encryptPrivateKey(normalizedPrivateKey);
      const now = nowIso();
      const wallet: WalletAggregate = {
        walletId: "wallet_current",
        fingerprint: createWalletFingerprint(normalizedPrivateKey),
        source: "IMPORTED",
        status: "ACTIVE",
        ...encrypted,
        createdAt: now,
        updatedAt: now,
      };

      await this.unitOfWork.run(async (repos) => {
        await repos.wallets.saveCurrent(wallet);
        await repos.audits.save(
          createAuditLog({
            actorRole: "OWNER",
            action: "wallet.import",
            result: "SUCCESS",
            metadata: { walletFingerprint: wallet.fingerprint },
          }),
        );
      });

      return {
        walletFingerprint: wallet.fingerprint,
        status: wallet.status,
        source: wallet.source,
      };
    } catch (error) {
      await this.repos.audits.save(
        createAuditLog({
          actorRole: "OWNER",
          action: "wallet.import",
          result: "FAILED",
          metadata: { error: toErrorMessage(error) },
        }),
      );

      throw new WalletDomainError(
        "WALLET_IMPORT_FAILED",
        `Wallet import failed: ${toErrorMessage(error)}`,
      );
    }
  }
}

export class WalletExportService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly vault: VaultPort,
  ) {}

  async execute(): Promise<{ privateKey: string }> {
    try {
      const { wallet, privateKey } = await loadDecryptedPrivateKey(this.repos.wallets, this.vault);
      await this.repos.audits.save(
        createAuditLog({
          actorRole: "OWNER",
          action: "wallet.export",
          result: "SUCCESS",
          metadata: { walletFingerprint: wallet.fingerprint },
        }),
      );
      return { privateKey };
    } catch (error) {
      await this.repos.audits.save(
        createAuditLog({
          actorRole: "OWNER",
          action: "wallet.export",
          result: "FAILED",
          metadata: { error: toErrorMessage(error) },
        }),
      );

      throw new WalletDomainError(
        "WALLET_EXPORT_FAILED",
        `Wallet export failed: ${toErrorMessage(error)}`,
      );
    }
  }
}
