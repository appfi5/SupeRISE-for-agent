import type {
  EthereumAddressDto,
  EthereumBalanceEthDto,
  EthereumBalanceUsdtDto,
  EthereumSignMessageRequest,
  EthereumSignMessageResponse,
  EthereumTransferEthRequest,
  EthereumTransferEthResponse,
  EthereumTransferUsdtRequest,
  EthereumTransferUsdtResponse,
} from "@superise/app-contracts";
import type { ActorRole } from "@superise/domain";
import {
  createAuditLog,
  createSignOperation,
  createTransferOperation,
  markTransferFailed,
  markTransferSubmitted,
  WalletDomainError,
} from "@superise/domain";
import {
  decodeMessage,
  sha256Hex,
  toErrorMessage,
} from "@superise/shared";
import type {
  ChainWriteLocker,
  EvmWalletAdapter,
  RepositoryBundle,
  UnitOfWork,
  VaultPort,
  WalletRepository,
} from "../ports";
import { mapTransferErrorCode } from "../utils/transfer-errors";
import { loadDecryptedPrivateKey } from "../utils/wallet-access";

export class EthereumAddressQueryService {
  constructor(
    private readonly wallets: WalletRepository,
    private readonly vault: VaultPort,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(): Promise<EthereumAddressDto> {
    const { privateKey } = await loadDecryptedPrivateKey(this.wallets, this.vault);
    return {
      chain: "ethereum",
      address: await this.evm.deriveAddress(privateKey),
    };
  }
}

export class EthereumUsdtBalanceQueryService {
  constructor(
    private readonly wallets: WalletRepository,
    private readonly vault: VaultPort,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(): Promise<EthereumBalanceUsdtDto> {
    const { privateKey } = await loadDecryptedPrivateKey(this.wallets, this.vault);
    return {
      chain: "ethereum",
      asset: "USDT",
      amount: await this.evm.getUsdtBalance(privateKey),
      decimals: 6,
    };
  }
}

export class EthereumEthBalanceQueryService {
  constructor(
    private readonly wallets: WalletRepository,
    private readonly vault: VaultPort,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(): Promise<EthereumBalanceEthDto> {
    const { privateKey } = await loadDecryptedPrivateKey(this.wallets, this.vault);
    return {
      chain: "ethereum",
      asset: "ETH",
      amount: await this.evm.getEthBalance(privateKey),
      decimals: 18,
    };
  }
}

export class EthereumMessageSigningService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly vault: VaultPort,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(
    actorRole: Extract<ActorRole, "AGENT" | "OWNER">,
    request: EthereumSignMessageRequest,
  ): Promise<EthereumSignMessageResponse> {
    const digest = sha256Hex(`${request.encoding}:${request.message}`);

    try {
      const { privateKey } = await loadDecryptedPrivateKey(this.repos.wallets, this.vault);
      const [signature, signingAddress] = await Promise.all([
        this.evm.signMessage(privateKey, decodeMessage(request.message, request.encoding)),
        this.evm.deriveAddress(privateKey),
      ]);

      await Promise.all([
        this.repos.signs.save(
          createSignOperation({
            role: actorRole,
            chain: "evm",
            messageDigest: digest,
            result: "SUCCESS",
          }),
        ),
        this.repos.audits.save(
          createAuditLog({
            actorRole,
            action: "ethereum.sign_message",
            result: "SUCCESS",
            metadata: { signingAddress },
          }),
        ),
      ]);

      return {
        chain: "ethereum",
        signature,
        signingAddress,
      };
    } catch (error) {
      await Promise.all([
        this.repos.signs.save(
          createSignOperation({
            role: actorRole,
            chain: "evm",
            messageDigest: digest,
            result: "FAILED",
            errorCode: "SIGN_MESSAGE_FAILED",
          }),
        ),
        this.repos.audits.save(
          createAuditLog({
            actorRole,
            action: "ethereum.sign_message",
            result: "FAILED",
            metadata: { error: toErrorMessage(error) },
          }),
        ),
      ]);

      throw new WalletDomainError(
        "SIGN_MESSAGE_FAILED",
        `Ethereum message signing failed: ${toErrorMessage(error)}`,
      );
    }
  }
}

export class EthereumUsdtTransferService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly unitOfWork: UnitOfWork,
    private readonly locker: ChainWriteLocker,
    private readonly vault: VaultPort,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(
    actorRole: Extract<ActorRole, "AGENT" | "OWNER">,
    request: EthereumTransferUsdtRequest,
  ): Promise<EthereumTransferUsdtResponse> {
    const operation = createTransferOperation({
      actorRole,
      chain: "evm",
      asset: "USDT",
      requestPayload: request,
    });

    await this.repos.transfers.save(operation);

    try {
      const { privateKey } = await loadDecryptedPrivateKey(this.repos.wallets, this.vault);
      const transferResult = await this.locker.execute("evm", async () =>
        this.evm.transferUsdt(privateKey, request),
      );

      const submitted = markTransferSubmitted(operation, transferResult.txHash);

      await this.unitOfWork.run(async (repos) => {
        await repos.transfers.save(submitted);
        await repos.audits.save(
          createAuditLog({
            actorRole,
            action: "ethereum.transfer_usdt",
            result: "SUCCESS",
            metadata: {
              operationId: submitted.operationId,
              txHash: submitted.txHash,
            },
          }),
        );
      });

      return {
        chain: "ethereum",
        asset: "USDT",
        operationId: submitted.operationId,
        txHash: submitted.txHash ?? "",
        status: submitted.status,
      };
    } catch (error) {
      const failed = markTransferFailed(
        operation,
        mapTransferErrorCode(error, "evm"),
        toErrorMessage(error),
      );

      await this.unitOfWork.run(async (repos) => {
        await repos.transfers.save(failed);
        await repos.audits.save(
          createAuditLog({
            actorRole,
            action: "ethereum.transfer_usdt",
            result: "FAILED",
            metadata: {
              operationId: failed.operationId,
              errorCode: failed.errorCode,
              errorMessage: failed.errorMessage,
            },
          }),
        );
      });

      throw new WalletDomainError(
        failed.errorCode ?? "TRANSFER_BUILD_FAILED",
        failed.errorMessage ?? "Ethereum USDT transfer failed",
      );
    }
  }
}

export class EthereumEthTransferService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly unitOfWork: UnitOfWork,
    private readonly locker: ChainWriteLocker,
    private readonly vault: VaultPort,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(
    actorRole: Extract<ActorRole, "AGENT" | "OWNER">,
    request: EthereumTransferEthRequest,
  ): Promise<EthereumTransferEthResponse> {
    const operation = createTransferOperation({
      actorRole,
      chain: "evm",
      asset: "ETH",
      requestPayload: request,
    });

    await this.repos.transfers.save(operation);

    try {
      const { privateKey } = await loadDecryptedPrivateKey(this.repos.wallets, this.vault);
      const transferResult = await this.locker.execute("evm", async () =>
        this.evm.transferEth(privateKey, request),
      );

      const submitted = markTransferSubmitted(operation, transferResult.txHash);

      await this.unitOfWork.run(async (repos) => {
        await repos.transfers.save(submitted);
        await repos.audits.save(
          createAuditLog({
            actorRole,
            action: "ethereum.transfer_eth",
            result: "SUCCESS",
            metadata: {
              operationId: submitted.operationId,
              txHash: submitted.txHash,
            },
          }),
        );
      });

      return {
        chain: "ethereum",
        asset: "ETH",
        operationId: submitted.operationId,
        txHash: submitted.txHash ?? "",
        status: submitted.status,
      };
    } catch (error) {
      const failed = markTransferFailed(
        operation,
        mapTransferErrorCode(error, "evm"),
        toErrorMessage(error),
      );

      await this.unitOfWork.run(async (repos) => {
        await repos.transfers.save(failed);
        await repos.audits.save(
          createAuditLog({
            actorRole,
            action: "ethereum.transfer_eth",
            result: "FAILED",
            metadata: {
              operationId: failed.operationId,
              errorCode: failed.errorCode,
              errorMessage: failed.errorMessage,
            },
          }),
        );
      });

      throw new WalletDomainError(
        failed.errorCode ?? "TRANSFER_BUILD_FAILED",
        failed.errorMessage ?? "Ethereum ETH transfer failed",
      );
    }
  }
}
