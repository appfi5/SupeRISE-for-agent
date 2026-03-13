import {
  type Chain,
  createPublicClient,
  createWalletClient,
  defineChain,
  erc20Abi,
  getAddress,
  http,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, sepolia } from "viem/chains";
import type {
  EthereumTransferEthRequest,
  EthereumTransferUsdcRequest,
  EthereumTransferUsdtRequest,
} from "@superise/app-contracts";
import type { EvmWalletAdapter } from "@superise/application";
import { WalletDomainError } from "@superise/domain";
import { normalizePrivateKeyHex } from "@superise/shared";

const USDT_DECIMALS = 6;
const USDC_DECIMALS = 6;
const TX_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;

export type EvmAdapterConfig = {
  mode: "preset" | "custom";
  preset?: "testnet" | "mainnet";
  rpcUrl: string;
  chainId: number;
  networkName: string;
  tokens: {
    erc20: {
      usdt: {
        standard: "erc20";
        contractAddress: `0x${string}`;
      };
      usdc: {
        standard: "erc20";
        contractAddress: `0x${string}`;
      };
    };
  };
};

export class ViemEvmWalletAdapter implements EvmWalletAdapter {
  constructor(private readonly config: EvmAdapterConfig) {}

  async deriveAddress(privateKey: string): Promise<string> {
    return privateKeyToAccount(normalizePrivateKeyHex(privateKey)).address;
  }

  async normalizeAddress(address: string): Promise<string> {
    return this.normalizeAddressOrThrow(address, "Address");
  }

  async getEthBalance(privateKey: string): Promise<string> {
    const address = await this.deriveAddress(privateKey);
    const balance = await this.createPublicClient().getBalance({
      address: this.normalizeAddressOrThrow(address, "Wallet"),
    });

    return balance.toString();
  }

  async getUsdtBalance(privateKey: string): Promise<string> {
    const address = await this.deriveAddress(privateKey);
    const balance = await this.createPublicClient().readContract({
      address: this.getUsdtContractAddress(),
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    return balance.toString();
  }

  async getUsdcBalance(privateKey: string): Promise<string> {
    const address = await this.deriveAddress(privateKey);
    const balance = await this.createPublicClient().readContract({
      address: this.getUsdcContractAddress(),
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    return balance.toString();
  }

  async signMessage(
    privateKey: string,
    message: string | Uint8Array,
  ): Promise<string> {
    const account = privateKeyToAccount(normalizePrivateKeyHex(privateKey));
    return account.signMessage({
      message: typeof message === "string" ? message : { raw: message },
    });
  }

  async transferUsdt(
    privateKey: string,
    request: EthereumTransferUsdtRequest,
  ): Promise<{ txHash: string }> {
    const account = privateKeyToAccount(normalizePrivateKeyHex(privateKey));
    const chain = this.getChain();
    const publicClient = this.createPublicClient();
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(this.getRpcUrl()),
    });

    const amount = BigInt(request.amount);
    const { request: txRequest } = await publicClient.simulateContract({
      account,
      address: this.getUsdtContractAddress(),
      abi: erc20Abi,
      functionName: "transfer",
      args: [this.normalizeAddressOrThrow(request.to, "Recipient"), amount],
    });
    const txHash = await walletClient.writeContract(txRequest);
    return { txHash };
  }

  async transferUsdc(
    privateKey: string,
    request: EthereumTransferUsdcRequest,
  ): Promise<{ txHash: string }> {
    const account = privateKeyToAccount(normalizePrivateKeyHex(privateKey));
    const chain = this.getChain();
    const publicClient = this.createPublicClient();
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(this.getRpcUrl()),
    });

    const amount = BigInt(request.amount);
    const { request: txRequest } = await publicClient.simulateContract({
      account,
      address: this.getUsdcContractAddress(),
      abi: erc20Abi,
      functionName: "transfer",
      args: [this.normalizeAddressOrThrow(request.to, "Recipient"), amount],
    });
    const txHash = await walletClient.writeContract(txRequest);
    return { txHash };
  }

  async transferEth(
    privateKey: string,
    request: EthereumTransferEthRequest,
  ): Promise<{ txHash: string }> {
    const account = privateKeyToAccount(normalizePrivateKeyHex(privateKey));
    const walletClient = createWalletClient({
      account,
      chain: this.getChain(),
      transport: http(this.getRpcUrl()),
    });

    const txHash = await walletClient.sendTransaction({
      account,
      to: this.normalizeAddressOrThrow(request.to, "Recipient"),
      value: BigInt(request.amount),
    });

    return { txHash };
  }

  async getTxStatus(txHash: string) {
    const normalizedHash = this.normalizeTxHash(txHash);
    const publicClient = this.createPublicClient();

    try {
      const [receipt, currentBlock] = await Promise.all([
        publicClient.getTransactionReceipt({ hash: normalizedHash }),
        publicClient.getBlockNumber(),
      ]);

      return {
        txHash: normalizedHash,
        status: receipt.status === "success" ? ("CONFIRMED" as const) : ("FAILED" as const),
        blockNumber: receipt.blockNumber.toString(),
        blockHash: receipt.blockHash,
        confirmations: (currentBlock - receipt.blockNumber + 1n).toString(),
        reason:
          receipt.status === "success" ? undefined : "Transaction reverted on chain",
      };
    } catch (receiptError) {
      try {
        await publicClient.getTransaction({ hash: normalizedHash });
        return {
          txHash: normalizedHash,
          status: "PENDING" as const,
        };
      } catch (transactionError) {
        if (isLikelyNotFoundError(receiptError) || isLikelyNotFoundError(transactionError)) {
          return {
            txHash: normalizedHash,
            status: "NOT_FOUND" as const,
          };
        }

        throw new WalletDomainError(
          "CHAIN_UNAVAILABLE",
          `ETH tx status lookup failed: ${
            transactionError instanceof Error
              ? transactionError.message
              : String(transactionError)
          }`,
        );
      }
    }
  }

  async checkHealth(): Promise<void> {
    try {
      const publicClient = this.createPublicClient();
      const actualChainId = await publicClient.getChainId();

      if (actualChainId !== this.config.chainId) {
        throw new WalletDomainError(
          "VALIDATION_ERROR",
          `EVM chainId mismatch: expected ${this.config.chainId}, received ${actualChainId}`,
        );
      }

      if (this.config.tokens.erc20.usdt.standard !== "erc20") {
        throw new WalletDomainError(
          "VALIDATION_ERROR",
          `USDT token standard mismatch: expected erc20, received ${this.config.tokens.erc20.usdt.standard}`,
        );
      }

      if (this.config.tokens.erc20.usdc.standard !== "erc20") {
        throw new WalletDomainError(
          "VALIDATION_ERROR",
          `USDC token standard mismatch: expected erc20, received ${this.config.tokens.erc20.usdc.standard}`,
        );
      }

      await Promise.all([
        this.validateErc20Token(publicClient, {
          label: "USDT",
          address: this.getUsdtContractAddress(),
          decimals: USDT_DECIMALS,
        }),
        this.validateErc20Token(publicClient, {
          label: "USDC",
          address: this.getUsdcContractAddress(),
          decimals: USDC_DECIMALS,
        }),
      ]);
    } catch (error) {
      if (error instanceof WalletDomainError) {
        throw error;
      }

      throw new WalletDomainError(
        "CHAIN_UNAVAILABLE",
        `ETH RPC is unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private getChain(): Chain {
    if (this.config.mode === "preset" && this.config.preset === "mainnet") {
      return mainnet;
    }

    if (this.config.mode === "preset" && this.config.preset === "testnet") {
      return sepolia;
    }

    return defineChain({
      id: this.config.chainId,
      name: this.config.networkName,
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [this.config.rpcUrl],
        },
      },
    });
  }

  private getRpcUrl(): string {
    return this.config.rpcUrl;
  }

  private getUsdtContractAddress(): `0x${string}` {
    return this.normalizeAddressOrThrow(
      this.config.tokens.erc20.usdt.contractAddress,
      "USDT contract",
    );
  }

  private normalizeAddressOrThrow(
    address: string,
    label: string,
  ): `0x${string}` {
    const candidate = address.trim();
    if (!isAddress(candidate)) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `${label} address is invalid: ${address}`,
      );
    }

    return getAddress(candidate);
  }

  private getUsdcContractAddress(): `0x${string}` {
    return this.normalizeAddressOrThrow(
      this.config.tokens.erc20.usdc.contractAddress,
      "USDC contract",
    );
  }

  private createPublicClient() {
    return createPublicClient({
      chain: this.getChain(),
      transport: http(this.getRpcUrl()),
    });
  }

  private normalizeTxHash(txHash: string): `0x${string}` {
    const candidate = txHash.trim();
    if (!TX_HASH_PATTERN.test(candidate)) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `Transaction hash is invalid: ${txHash}`,
      );
    }

    return candidate.toLowerCase() as `0x${string}`;
  }

  private async validateErc20Token(
    publicClient: ReturnType<ViemEvmWalletAdapter["createPublicClient"]>,
    input: {
      label: "USDT" | "USDC";
      address: `0x${string}`;
      decimals: number;
    },
  ): Promise<void> {
    const bytecode = await publicClient.getBytecode({
      address: input.address,
    });

    if (!bytecode || bytecode === "0x") {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `${input.label} contract is missing bytecode at ${input.address}`,
      );
    }

    const decimals = await publicClient.readContract({
      address: input.address,
      abi: erc20Abi,
      functionName: "decimals",
    });

    if (Number(decimals) !== input.decimals) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `${input.label} contract decimals mismatch: expected ${input.decimals}, received ${Number(decimals)}`,
      );
    }
  }
}

function isLikelyNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("not found") || message.includes("does not exist");
}
