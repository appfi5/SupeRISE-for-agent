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
  EthereumTransferUsdtRequest,
} from "@superise/app-contracts";
import type { EvmWalletAdapter } from "@superise/application";
import { WalletDomainError } from "@superise/domain";
import { normalizePrivateKeyHex } from "@superise/shared";

const USDT_DECIMALS = 6;

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
    };
  };
};

export class ViemEvmWalletAdapter implements EvmWalletAdapter {
  constructor(private readonly config: EvmAdapterConfig) {}

  async deriveAddress(privateKey: string): Promise<string> {
    return privateKeyToAccount(normalizePrivateKeyHex(privateKey)).address;
  }

  async getEthBalance(privateKey: string): Promise<string> {
    const address = await this.deriveAddress(privateKey);
    const balance = await this.createPublicClient().getBalance({
      address: this.normalizeAddress(address, "Wallet"),
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
      args: [this.normalizeAddress(request.to, "Recipient"), amount],
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
      to: this.normalizeAddress(request.to, "Recipient"),
      value: BigInt(request.amount),
    });

    return { txHash };
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

      const usdtContractAddress = this.getUsdtContractAddress();
      const bytecode = await publicClient.getBytecode({
        address: usdtContractAddress,
      });

      if (!bytecode || bytecode === "0x") {
        throw new WalletDomainError(
          "VALIDATION_ERROR",
          `USDT contract is missing bytecode at ${usdtContractAddress}`,
        );
      }

      const decimals = await publicClient.readContract({
        address: usdtContractAddress,
        abi: erc20Abi,
        functionName: "decimals",
      });

      if (Number(decimals) !== USDT_DECIMALS) {
        throw new WalletDomainError(
          "VALIDATION_ERROR",
          `USDT contract decimals mismatch: expected ${USDT_DECIMALS}, received ${Number(decimals)}`,
        );
      }
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
    return this.normalizeAddress(
      this.config.tokens.erc20.usdt.contractAddress,
      "USDT contract",
    );
  }

  private createPublicClient() {
    return createPublicClient({
      chain: this.getChain(),
      transport: http(this.getRpcUrl()),
    });
  }

  private normalizeAddress(address: string, label: string): `0x${string}` {
    const candidate = address.trim().toLowerCase();
    if (!isAddress(candidate)) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `${label} address is invalid: ${address}`,
      );
    }

    return getAddress(candidate);
  }
}
