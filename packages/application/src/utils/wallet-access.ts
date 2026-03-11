import type { WalletAggregate } from "@superise/domain";
import { WalletDomainError } from "@superise/domain";
import type { VaultPort, WalletRepository } from "../ports";

export async function requireWallet(
  wallets: WalletRepository,
): Promise<WalletAggregate> {
  const wallet = await wallets.getCurrent();
  if (!wallet) {
    throw new WalletDomainError("WALLET_NOT_FOUND", "Current wallet not found");
  }

  return wallet;
}

export async function loadDecryptedPrivateKey(
  wallets: WalletRepository,
  vault: VaultPort,
): Promise<{ wallet: WalletAggregate; privateKey: string }> {
  const wallet = await requireWallet(wallets);
  const privateKey = await vault.decryptPrivateKey(wallet);
  return { wallet, privateKey };
}
