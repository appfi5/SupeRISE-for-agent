import {
  Address,
  CellOutput,
  ClientPublicMainnet,
  ClientPublicTestnet,
  SignerCkbPrivateKey,
  Transaction,
  fixedPointFrom,
  type ScriptInfoLike,
} from "@ckb-ccc/core";
import type { NervosTransferCkbRequest } from "@superise/app-contracts";
import type { CkbWalletAdapter } from "@superise/application";
import { WalletDomainError } from "@superise/domain";
import { normalizePrivateKeyHex } from "@superise/shared";
import { CustomCkbClient } from "./custom-ckb-client";
import { CkbSplitEndpointTransport } from "./split-endpoint-transport";

export type CkbAdapterConfig =
  | {
      mode: "preset";
      preset: "testnet" | "mainnet";
      rpcUrl: string;
      indexerUrl: string;
      expectedGenesisHash: `0x${string}`;
    }
  | {
      mode: "custom";
      rpcUrl: string;
      indexerUrl: string;
      expectedGenesisHash: `0x${string}`;
      addressPrefix: string;
      scripts: Record<string, ScriptInfoLike>;
    };

export class CkbCccWalletAdapter implements CkbWalletAdapter {
  constructor(private readonly config: CkbAdapterConfig) {}

  async deriveAddress(privateKey: string): Promise<string> {
    return this.createSigner(privateKey).getRecommendedAddress();
  }

  async normalizeAddress(address: string): Promise<string> {
    try {
      const parsed = await Address.fromString(address.trim(), this.createClient());
      return parsed.toString();
    } catch (error) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `Nervos address is invalid: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getBalance(privateKey: string): Promise<string> {
    const balance = await this.createSigner(privateKey).getBalance();
    return balance.toString();
  }

  async signMessage(
    privateKey: string,
    message: string | Uint8Array,
  ): Promise<string> {
    return this.createSigner(privateKey).signMessageRaw(message);
  }

  async transfer(
    privateKey: string,
    request: NervosTransferCkbRequest,
  ): Promise<{ txHash: string }> {
    const signer = this.createSigner(privateKey);
    const receiver = await Address.fromString(
      await this.normalizeAddress(request.to),
      signer.client,
    );
    const amount = BigInt(request.amount);
    const minimumCapacity = fixedPointFrom(
      CellOutput.from({ capacity: 0n, lock: receiver.script }).occupiedSize,
    );

    if (amount < minimumCapacity) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `CKB transfer amount is below the minimum cell capacity for recipient address: requires at least ${minimumCapacity.toString()} Shannon`,
      );
    }

    const tx = Transaction.from({
      outputs: [{ lock: receiver.script, capacity: amount }],
    });

    await tx.completeInputsByCapacity(signer);
    const prepared = await signer.prepareTransaction(tx);
    await prepared.completeFeeBy(signer);

    const txHash = await signer.sendTransaction(prepared);
    return { txHash };
  }

  async getTxStatus(txHash: string) {
    try {
      const client = this.createClient();
      const transaction = await client.getTransaction(txHash);

      if (!transaction || transaction.status === "unknown") {
        return {
          txHash,
          status: "NOT_FOUND" as const,
        };
      }

      if (transaction.status === "rejected") {
        return {
          txHash,
          status: "FAILED" as const,
          reason: transaction.reason,
        };
      }

      if (transaction.status === "committed") {
        const tip = await client.getTip();
        const blockNumber = transaction.blockNumber?.toString();
        const confirmations =
          blockNumber !== undefined
            ? (BigInt(tip.toString()) - BigInt(blockNumber) + 1n).toString()
            : undefined;

        return {
          txHash,
          status: "CONFIRMED" as const,
          blockNumber,
          blockHash: transaction.blockHash?.toString(),
          confirmations,
          reason: transaction.reason,
        };
      }

      return {
        txHash,
        status: "PENDING" as const,
        blockNumber: transaction.blockNumber?.toString(),
        blockHash: transaction.blockHash?.toString(),
        reason: transaction.reason,
      };
    } catch (error) {
      throw new WalletDomainError(
        "CHAIN_UNAVAILABLE",
        `CKB tx status lookup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async checkHealth(): Promise<void> {
    try {
      const client = this.createClient();
      await client.getTip();
      const genesisHeader = await client.getHeaderByNumber(0n);

      if (!genesisHeader) {
        throw new WalletDomainError(
          "CHAIN_UNAVAILABLE",
          "CKB RPC did not return the genesis header",
        );
      }

      if (genesisHeader.hash !== this.config.expectedGenesisHash) {
        throw new WalletDomainError(
          "VALIDATION_ERROR",
          `CKB genesisHash mismatch: expected ${this.config.expectedGenesisHash}, received ${genesisHeader.hash}`,
        );
      }
    } catch (error) {
      if (error instanceof WalletDomainError) {
        throw error;
      }

      throw new WalletDomainError(
        "CHAIN_UNAVAILABLE",
        `CKB RPC is unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private createClient():
    | ClientPublicMainnet
    | ClientPublicTestnet
    | CustomCkbClient {
    if (this.config.mode === "custom") {
      return new CustomCkbClient({
        rpcUrl: this.config.rpcUrl,
        indexerUrl: this.config.indexerUrl,
        addressPrefix: this.config.addressPrefix,
        scripts: this.config.scripts,
      });
    }

    const transport = new CkbSplitEndpointTransport(
      this.config.rpcUrl,
      this.config.indexerUrl,
    );

    return this.config.preset === "mainnet"
      ? new ClientPublicMainnet({
          url: this.config.rpcUrl,
          transport,
        })
      : new ClientPublicTestnet({
          url: this.config.rpcUrl,
          transport,
        });
  }

  private createSigner(privateKey: string): SignerCkbPrivateKey {
    return new SignerCkbPrivateKey(
      this.createClient(),
      normalizePrivateKeyHex(privateKey),
    );
  }
}
