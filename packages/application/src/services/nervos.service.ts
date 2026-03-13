import type {
  NervosAddressDto,
  NervosBalanceCkbDto,
  NervosSignMessageRequest,
  NervosSignMessageResponse,
  NervosTransferCkbRequest,
  NervosTransferCkbResponse,
  NervosTxStatusResponse,
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
import { decodeMessage, sha256Hex, toErrorMessage } from "@superise/shared";
import type {
  ChainWriteLocker,
  CkbWalletAdapter,
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

export class NervosAddressQueryService {
  constructor(
    private readonly wallets: WalletRepository,
    private readonly vault: VaultPort,
    private readonly ckb: CkbWalletAdapter,
  ) {}

  async execute(): Promise<NervosAddressDto> {
    const { privateKey } = await loadDecryptedPrivateKey(this.wallets, this.vault);
    return {
      chain: "nervos",
      address: await this.ckb.deriveAddress(privateKey),
    };
  }
}

export class NervosCkbBalanceQueryService {
  constructor(
    private readonly wallets: WalletRepository,
    private readonly vault: VaultPort,
    private readonly ckb: CkbWalletAdapter,
  ) {}

  async execute(): Promise<NervosBalanceCkbDto> {
    const { privateKey } = await loadDecryptedPrivateKey(this.wallets, this.vault);
    return {
      chain: "nervos",
      asset: "CKB",
      amount: await this.ckb.getBalance(privateKey),
      decimals: 8,
      symbol: "CKB",
    };
  }
}

export class NervosTxStatusQueryService {
  constructor(private readonly ckb: CkbWalletAdapter) {}

  async execute(txHash: string): Promise<NervosTxStatusResponse> {
    const status = await this.ckb.getTxStatus(txHash);
    return {
      chain: "nervos",
      ...status,
    };
  }
}

export class NervosMessageSigningService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly vault: VaultPort,
    private readonly ckb: CkbWalletAdapter,
  ) {}

  async execute(
    actorRole: Extract<ActorRole, "AGENT" | "OWNER">,
    request: NervosSignMessageRequest,
  ): Promise<NervosSignMessageResponse> {
    const digest = sha256Hex(`${request.encoding}:${request.message}`);

    try {
      const { privateKey } = await loadDecryptedPrivateKey(this.repos.wallets, this.vault);
      const [signature, signingAddress] = await Promise.all([
        this.ckb.signMessage(privateKey, decodeMessage(request.message, request.encoding)),
        this.ckb.deriveAddress(privateKey),
      ]);

      await Promise.all([
        this.repos.signs.save(
          createSignOperation({
            role: actorRole,
            chain: "ckb",
            messageDigest: digest,
            result: "SUCCESS",
          }),
        ),
        this.repos.audits.save(
          createAuditLog({
            actorRole,
            action: "nervos.sign_message",
            result: "SUCCESS",
            metadata: { signingAddress },
          }),
        ),
      ]);

      return {
        chain: "nervos",
        signature,
        signingAddress,
      };
    } catch (error) {
      await Promise.all([
        this.repos.signs.save(
          createSignOperation({
            role: actorRole,
            chain: "ckb",
            messageDigest: digest,
            result: "FAILED",
            errorCode: "SIGN_MESSAGE_FAILED",
          }),
        ),
        this.repos.audits.save(
          createAuditLog({
            actorRole,
            action: "nervos.sign_message",
            result: "FAILED",
            metadata: { error: toErrorMessage(error) },
          }),
        ),
      ]);

      throw new WalletDomainError(
        "SIGN_MESSAGE_FAILED",
        `Nervos message signing failed: ${toErrorMessage(error)}`,
      );
    }
  }
}

export class NervosCkbTransferService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly unitOfWork: UnitOfWork,
    private readonly locker: ChainWriteLocker,
    private readonly assetLimits: AssetLimitService,
    private readonly vault: VaultPort,
    private readonly ckb: CkbWalletAdapter,
  ) {}

  async execute(
    actorRole: Extract<ActorRole, "AGENT" | "OWNER">,
    request: NervosTransferCkbRequest,
  ): Promise<NervosTransferCkbResponse> {
    const resolver = new TransferTargetResolverService(this.repos.addressBooks, {
      ckb: this.ckb,
    });
    const resolvedTarget = await resolver.resolve("ckb", {
      to: request.to,
      toType: request.toType,
    });
    const operation = createTransferOperation({
      actorRole,
      chain: "ckb",
      asset: "CKB",
      targetType: resolvedTarget.targetType,
      targetInput: resolvedTarget.inputValue,
      resolvedToAddress: resolvedTarget.resolvedAddress,
      resolvedContactName: resolvedTarget.resolvedContactName,
      requestedAmount: request.amount,
      requestPayload: request,
    });

    await this.repos.transfers.save(operation);

    let hasReservation = false;

    try {
      if (actorRole === "AGENT") {
        await this.assetLimits.reserveForAgentTransfer({
          operationId: operation.operationId,
          chain: "ckb",
          asset: "CKB",
          amount: request.amount,
        });
        hasReservation = true;
      }

      const { privateKey } = await loadDecryptedPrivateKey(this.repos.wallets, this.vault);
      const transferResult = await this.locker.execute("ckb", async () =>
        this.ckb.transfer(privateKey, {
          ...request,
          to: resolvedTarget.resolvedAddress,
        }),
      );

      const submitted = markTransferSubmitted(operation, transferResult.txHash);

      await this.unitOfWork.run(async (repos) => {
        await repos.transfers.save(submitted);
        await repos.audits.save(
          createAuditLog({
            actorRole,
            action: "nervos.transfer_ckb",
            result: "SUCCESS",
            metadata: {
              operationId: submitted.operationId,
              txHash: submitted.txHash,
            },
          }),
        );
      });

      return {
        chain: "nervos",
        asset: "CKB",
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
        await this.assetLimits.releaseReservation(
          operation.operationId,
          "transfer_failed:nervos.transfer_ckb",
        );
      }

      const failureContext = extractLimitFailureContext(error);
      const failed = markTransferFailed(
        operation,
        mapTransferErrorCode(error, "ckb"),
        toErrorMessage(error),
        {
          limitWindow: failureContext.limitWindow,
          limitSnapshot: failureContext.limitSnapshot,
        },
      );

      await this.unitOfWork.run(async (repos) => {
        await repos.transfers.save(failed);
        await repos.audits.save(
          createAuditLog({
            actorRole,
            action: "nervos.transfer_ckb",
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
        failed.errorMessage ?? "Nervos CKB transfer failed",
        error instanceof WalletDomainError ? error.details : undefined,
      );
    }
  }
}
