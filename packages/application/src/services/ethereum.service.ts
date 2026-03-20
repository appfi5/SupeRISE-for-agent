import type {
  EthereumIdentityDto,
  EthereumBalanceEthDto,
  EthereumBalanceUsdcDto,
  EthereumBalanceUsdtDto,
  EthereumSignMessageRequest,
  EthereumSignMessageResponse,
  EthereumTransferEthRequest,
  EthereumTransferEthResponse,
  EthereumTransferUsdcRequest,
  EthereumTransferUsdcResponse,
  EthereumTransferUsdtRequest,
  EthereumTransferUsdtResponse,
  EthereumTxStatusResponse,
} from "@superise/app-contracts";
import type { ActorRole, AssetKind } from "@superise/domain";
import {
  createAuditLog,
  createSignOperation,
  createTransferOperation,
  markTransferFailed,
  markTransferSubmitted,
  WalletDomainError,
} from "@superise/domain";
import { decodeMessage, sha256Hex, toErrorMessage } from "@superise/shared";
import type {
  ChainWriteLocker,
  EvmWalletAdapter,
  RepositoryBundle,
  UnitOfWork,
  VaultPort,
  WalletRepository,
} from "../ports";
import { AssetLimitService } from "./asset-limit.service";
import {
  extractLimitFailureContext,
  TransferTargetResolverService,
} from "./address-book.service";
import { mapTransferErrorCode } from "../utils/transfer-errors";
import { loadDecryptedPrivateKey } from "../utils/wallet-access";

export class EthereumIdentityQueryService {
  constructor(
    private readonly wallets: WalletRepository,
    private readonly vault: VaultPort,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(): Promise<EthereumIdentityDto> {
    const { privateKey } = await loadDecryptedPrivateKey(this.wallets, this.vault);
    return {
      chain: "ethereum",
      ...(await this.evm.getIdentity(privateKey)),
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
      symbol: "USDT",
    };
  }
}

export class EthereumUsdcBalanceQueryService {
  constructor(
    private readonly wallets: WalletRepository,
    private readonly vault: VaultPort,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(): Promise<EthereumBalanceUsdcDto> {
    const { privateKey } = await loadDecryptedPrivateKey(this.wallets, this.vault);
    return {
      chain: "ethereum",
      asset: "USDC",
      amount: await this.evm.getUsdcBalance(privateKey),
      decimals: 6,
      symbol: "USDC",
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
      symbol: "ETH",
    };
  }
}

export class EthereumTxStatusQueryService {
  constructor(private readonly evm: EvmWalletAdapter) {}

  async execute(txHash: string): Promise<EthereumTxStatusResponse> {
    const status = await this.evm.getTxStatus(txHash);
    return {
      chain: "ethereum",
      ...status,
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
      const [signature, identity] = await Promise.all([
        this.evm.signMessage(privateKey, decodeMessage(request.message, request.encoding)),
        this.evm.getIdentity(privateKey),
      ]);
      const signingAddress = identity.address;

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
        publicKey: identity.publicKey,
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
    private readonly assetLimits: AssetLimitService,
    private readonly vault: VaultPort,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(
    actorRole: Extract<ActorRole, "AGENT" | "OWNER">,
    request: EthereumTransferUsdtRequest,
  ): Promise<EthereumTransferUsdtResponse> {
    return executeEthereumTransfer({
      repos: this.repos,
      unitOfWork: this.unitOfWork,
      locker: this.locker,
      assetLimits: this.assetLimits,
      vault: this.vault,
      evm: this.evm,
      actorRole,
      asset: "USDT",
      action: "ethereum.transfer_usdt",
      request,
      transfer: (privateKey, to) =>
        this.evm.transferUsdt(privateKey, {
          ...request,
          to,
        }),
    });
  }
}

export class EthereumUsdcTransferService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly unitOfWork: UnitOfWork,
    private readonly locker: ChainWriteLocker,
    private readonly assetLimits: AssetLimitService,
    private readonly vault: VaultPort,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(
    actorRole: Extract<ActorRole, "AGENT" | "OWNER">,
    request: EthereumTransferUsdcRequest,
  ): Promise<EthereumTransferUsdcResponse> {
    return executeEthereumTransfer({
      repos: this.repos,
      unitOfWork: this.unitOfWork,
      locker: this.locker,
      assetLimits: this.assetLimits,
      vault: this.vault,
      evm: this.evm,
      actorRole,
      asset: "USDC",
      action: "ethereum.transfer_usdc",
      request,
      transfer: (privateKey, to) =>
        this.evm.transferUsdc(privateKey, {
          ...request,
          to,
        }),
    });
  }
}

export class EthereumEthTransferService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly unitOfWork: UnitOfWork,
    private readonly locker: ChainWriteLocker,
    private readonly assetLimits: AssetLimitService,
    private readonly vault: VaultPort,
    private readonly evm: EvmWalletAdapter,
  ) {}

  async execute(
    actorRole: Extract<ActorRole, "AGENT" | "OWNER">,
    request: EthereumTransferEthRequest,
  ): Promise<EthereumTransferEthResponse> {
    return executeEthereumTransfer({
      repos: this.repos,
      unitOfWork: this.unitOfWork,
      locker: this.locker,
      assetLimits: this.assetLimits,
      vault: this.vault,
      evm: this.evm,
      actorRole,
      asset: "ETH",
      action: "ethereum.transfer_eth",
      request,
      transfer: (privateKey, to) =>
        this.evm.transferEth(privateKey, {
          ...request,
          to,
        }),
    });
  }
}

async function executeEthereumTransfer<
  TAsset extends Extract<AssetKind, "ETH" | "USDT" | "USDC">,
  TRequest extends {
    to: string;
    amount: string;
    toType: "address" | "contact_name";
  },
>(input: {
  repos: RepositoryBundle;
  unitOfWork: UnitOfWork;
  locker: ChainWriteLocker;
  assetLimits: AssetLimitService;
  vault: VaultPort;
  evm: EvmWalletAdapter;
  actorRole: Extract<ActorRole, "AGENT" | "OWNER">;
  asset: TAsset;
  action: "ethereum.transfer_eth" | "ethereum.transfer_usdt" | "ethereum.transfer_usdc";
  request: TRequest;
  transfer: (privateKey: string, to: string) => Promise<{ txHash: string }>;
}): Promise<{
  chain: "ethereum";
  asset: TAsset;
  toType: TRequest["toType"];
  operationId: string;
  txHash: string;
  status: "RESERVED" | "SUBMITTED" | "CONFIRMED" | "FAILED";
  resolvedAddress: string;
  contactName?: string;
}> {
  const resolver = new TransferTargetResolverService(input.repos.addressBooks, {
    evm: input.evm,
  });
  const resolvedTarget = await resolver.resolve("evm", {
    to: input.request.to,
    toType: input.request.toType,
  });
  const operation = createTransferOperation({
    actorRole: input.actorRole,
    chain: "evm",
    asset: input.asset,
    targetType: resolvedTarget.targetType,
    targetInput: resolvedTarget.inputValue,
    resolvedToAddress: resolvedTarget.resolvedAddress,
    resolvedContactName: resolvedTarget.resolvedContactName,
    requestedAmount: String(input.request.amount),
    requestPayload: input.request,
  });

  await input.repos.transfers.save(operation);

  let hasReservation = false;

  try {
    if (input.actorRole === "AGENT") {
      await input.assetLimits.reserveForAgentTransfer({
        operationId: operation.operationId,
        chain: "evm",
        asset: input.asset,
        amount: String(input.request.amount),
      });
      hasReservation = true;
    }

    const { privateKey } = await loadDecryptedPrivateKey(input.repos.wallets, input.vault);
    const transferResult = await input.locker.execute("evm", async () =>
      input.transfer(privateKey, resolvedTarget.resolvedAddress),
    );
    const submitted = markTransferSubmitted(operation, transferResult.txHash);

    await input.unitOfWork.run(async (repos) => {
      await repos.transfers.save(submitted);
      await repos.audits.save(
        createAuditLog({
          actorRole: input.actorRole,
          action: input.action,
          result: "SUCCESS",
          metadata: {
            operationId: submitted.operationId,
            txHash: submitted.txHash,
          },
        }),
      );
    });

    return {
      chain: "ethereum" as const,
      asset: input.asset,
      operationId: submitted.operationId,
      txHash: submitted.txHash ?? "",
      status: submitted.status,
      toType: resolvedTarget.toType,
      contactName: submitted.resolvedContactName ?? undefined,
      resolvedAddress:
        submitted.resolvedToAddress ?? resolvedTarget.resolvedAddress,
    };
  } catch (error) {
    if (hasReservation) {
      await input.assetLimits.releaseReservation(
        operation.operationId,
        `transfer_failed:${input.action}`,
      );
    }

    const failureContext = extractLimitFailureContext(error);
    const failed = markTransferFailed(
      operation,
      mapTransferErrorCode(error, "evm"),
      toErrorMessage(error),
      {
        limitWindow: failureContext.limitWindow,
        limitSnapshot: failureContext.limitSnapshot,
      },
    );

    await input.unitOfWork.run(async (repos) => {
      await repos.transfers.save(failed);
      await repos.audits.save(
        createAuditLog({
          actorRole: input.actorRole,
          action: input.action,
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
      failed.errorMessage ?? `Ethereum ${input.asset} transfer failed`,
      error instanceof WalletDomainError ? error.details : undefined,
    );
  }
}
