import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import type {
  EncryptedWalletMaterial,
  KekkedMetadata,
  RewrappedDekMaterial,
  VaultPort,
} from "@superise/application";
import type { WalletAggregate } from "@superise/domain";
import { WalletDomainError } from "@superise/domain";
import { toErrorMessage } from "@superise/shared";
import type { WalletServerConfig } from "../config/wallet-server-config";
import {
  decryptWithAesGcm,
  encryptWithAesGcm,
  normalizeKek,
} from "./crypto";

export class AesGcmVaultService implements VaultPort {
  private readonly kek: Buffer;
  private readonly metadata: KekkedMetadata;

  constructor(private readonly config: WalletServerConfig) {
    const resolved = this.resolveKek();
    this.kek = resolved.kek;
    this.metadata = resolved.metadata;
  }

  async validateKek(): Promise<void> {
    this.assertKekLength(this.kek, "KEK");
  }

  async encryptPrivateKey(privateKey: string): Promise<EncryptedWalletMaterial> {
    const dek = randomBytes(32);
    const privateKeyEncrypted = encryptWithAesGcm(dek, Buffer.from(privateKey, "utf8"));
    const dekEncrypted = encryptWithAesGcm(this.kek, dek);

    return {
      encryptedPrivateKey: privateKeyEncrypted.ciphertext,
      encryptedDek: dekEncrypted.ciphertext,
      privateKeyIv: privateKeyEncrypted.iv,
      privateKeyTag: privateKeyEncrypted.tag,
      dekIv: dekEncrypted.iv,
      dekTag: dekEncrypted.tag,
    };
  }

  async decryptPrivateKey(wallet: WalletAggregate): Promise<string> {
    try {
      const dek = decryptWithAesGcm(this.kek, {
        ciphertext: wallet.encryptedDek,
        iv: wallet.dekIv,
        tag: wallet.dekTag,
      });
      return decryptWithAesGcm(dek, {
        ciphertext: wallet.encryptedPrivateKey,
        iv: wallet.privateKeyIv,
        tag: wallet.privateKeyTag,
      }).toString("utf8");
    } catch (error) {
      throw new WalletDomainError(
        "VAULT_ERROR",
        `Failed to decrypt wallet private key: ${toErrorMessage(error)}`,
      );
    }
  }

  async rewrapDek(
    wallet: WalletAggregate,
    nextKek: string,
  ): Promise<RewrappedDekMaterial> {
    const nextKekBytes = normalizeKek(nextKek);
    this.assertKekLength(nextKekBytes, "Next KEK");

    try {
      const dek = decryptWithAesGcm(this.kek, {
        ciphertext: wallet.encryptedDek,
        iv: wallet.dekIv,
        tag: wallet.dekTag,
      });
      const dekEncrypted = encryptWithAesGcm(nextKekBytes, dek);

      return {
        encryptedDek: dekEncrypted.ciphertext,
        dekIv: dekEncrypted.iv,
        dekTag: dekEncrypted.tag,
      };
    } catch (error) {
      throw new WalletDomainError(
        "VAULT_ERROR",
        `Failed to rewrap wallet DEK: ${toErrorMessage(error)}`,
      );
    }
  }

  getMetadata(): KekkedMetadata {
    return this.metadata;
  }

  private assertKekLength(kek: Buffer, label: string): void {
    if (kek.length !== 32) {
      throw new WalletDomainError("VAULT_ERROR", `${label} length must be 32 bytes`);
    }
  }

  private resolveKek(): { kek: Buffer; metadata: KekkedMetadata } {
    if (this.config.walletKekPath && existsSync(this.config.walletKekPath)) {
      return {
        kek: normalizeKek(readFileSync(this.config.walletKekPath, "utf8").trim()),
        metadata: {
          provider: "file-path",
          reference: this.config.walletKekPath,
        },
      };
    }

    if (this.config.walletKek) {
      if (!this.config.allowPlaintextKekEnv) {
        throw new WalletDomainError(
          "VAULT_ERROR",
          "WALLET_KEK is set but ALLOW_PLAINTEXT_KEK_ENV is false",
        );
      }
      return {
        kek: normalizeKek(this.config.walletKek),
        metadata: {
          provider: "env",
          reference: "WALLET_KEK",
        },
      };
    }

    if (this.config.nodeEnv !== "production") {
      const devKekPath = resolve(this.config.dataDir, "wallet.kek.dev");
      if (!existsSync(devKekPath)) {
        writeFileSync(devKekPath, randomBytes(32).toString("hex"), "utf8");
      }
      return {
        kek: normalizeKek(readFileSync(devKekPath, "utf8").trim()),
        metadata: {
          provider: "development-auto",
          reference: devKekPath,
        },
      };
    }

    throw new WalletDomainError(
      "VAULT_ERROR",
      "KEK is required. Set WALLET_KEK_PATH or WALLET_KEK.",
    );
  }
}
