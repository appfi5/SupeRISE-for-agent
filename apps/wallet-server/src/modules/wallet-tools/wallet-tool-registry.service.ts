import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  apiEnvelopeSchema,
  ethereumAddressSchema,
  ethereumBalanceEthSchema,
  ethereumBalanceUsdtSchema,
  ethereumSignMessageRequestSchema,
  ethereumSignMessageResponseSchema,
  ethereumTransferEthResponseSchema,
  ethereumTransferEthRequestSchema,
  ethereumTransferUsdtResponseSchema,
  ethereumTransferUsdtRequestSchema,
  nervosAddressSchema,
  nervosBalanceCkbSchema,
  nervosSignMessageRequestSchema,
  nervosSignMessageResponseSchema,
  nervosTransferCkbResponseSchema,
  nervosTransferCkbRequestSchema,
  operationStatusRequestSchema,
  operationStatusResponseSchema,
  type McpToolName,
  type WalletToolArgumentDto,
  type WalletToolCatalogItemDto,
  walletCurrentSchema,
} from "@superise/app-contracts";
import type {
  CurrentWalletQueryService,
  EthereumAddressQueryService,
  EthereumEthBalanceQueryService,
  EthereumEthTransferService,
  EthereumMessageSigningService,
  EthereumUsdtBalanceQueryService,
  EthereumUsdtTransferService,
  NervosAddressQueryService,
  NervosCkbBalanceQueryService,
  NervosCkbTransferService,
  NervosMessageSigningService,
  OperationStatusQueryService,
} from "@superise/application";
import { WalletDomainError } from "@superise/domain";
import { toErrorMessage } from "@superise/shared";
import { TOKENS } from "../../tokens";

export type WalletToolActorRole = "AGENT" | "OWNER";

export type WalletToolExecutionContext = {
  actorRole: WalletToolActorRole;
};

type WalletToolShape = Record<string, z.ZodTypeAny>;

type WalletToolDefinition = {
  name: McpToolName;
  title: string;
  description: string;
  arguments: WalletToolArgumentDto[];
  inputShape: WalletToolShape;
  outputSchema: z.ZodTypeAny;
  annotations: WalletToolAnnotations;
  parseArguments: (argumentsValue: unknown) => Record<string, unknown>;
  execute: (
    argumentsValue: Record<string, unknown>,
    context: WalletToolExecutionContext,
  ) => Promise<Record<string, unknown>>;
};

const EMPTY_TOOL_ARGUMENTS_SCHEMA = z.object({});

@Injectable()
export class WalletToolRegistryService {
  private readonly definitions: WalletToolDefinition[];
  private readonly definitionsByName: Map<McpToolName, WalletToolDefinition>;

  constructor(
    @Inject(TOKENS.CURRENT_WALLET_QUERY_SERVICE)
    private readonly currentWalletQueryService: CurrentWalletQueryService,
    @Inject(TOKENS.NERVOS_ADDRESS_QUERY_SERVICE)
    private readonly nervosAddressQueryService: NervosAddressQueryService,
    @Inject(TOKENS.NERVOS_CKB_BALANCE_QUERY_SERVICE)
    private readonly nervosBalanceQueryService: NervosCkbBalanceQueryService,
    @Inject(TOKENS.NERVOS_MESSAGE_SIGNING_SERVICE)
    private readonly nervosMessageSigningService: NervosMessageSigningService,
    @Inject(TOKENS.NERVOS_CKB_TRANSFER_SERVICE)
    private readonly nervosTransferService: NervosCkbTransferService,
    @Inject(TOKENS.ETHEREUM_ADDRESS_QUERY_SERVICE)
    private readonly ethereumAddressQueryService: EthereumAddressQueryService,
    @Inject(TOKENS.ETHEREUM_ETH_BALANCE_QUERY_SERVICE)
    private readonly ethereumEthBalanceQueryService: EthereumEthBalanceQueryService,
    @Inject(TOKENS.ETHEREUM_USDT_BALANCE_QUERY_SERVICE)
    private readonly ethereumUsdtBalanceQueryService: EthereumUsdtBalanceQueryService,
    @Inject(TOKENS.ETHEREUM_MESSAGE_SIGNING_SERVICE)
    private readonly ethereumMessageSigningService: EthereumMessageSigningService,
    @Inject(TOKENS.ETHEREUM_ETH_TRANSFER_SERVICE)
    private readonly ethereumEthTransferService: EthereumEthTransferService,
    @Inject(TOKENS.ETHEREUM_USDT_TRANSFER_SERVICE)
    private readonly ethereumUsdtTransferService: EthereumUsdtTransferService,
    @Inject(TOKENS.OPERATION_STATUS_QUERY_SERVICE)
    private readonly operationStatusQueryService: OperationStatusQueryService,
  ) {
    this.definitions = this.createDefinitions();
    this.definitionsByName = new Map(
      this.definitions.map((definition) => [definition.name, definition]),
    );
  }

  listCatalog(): WalletToolCatalogItemDto[] {
    return this.definitions.map((definition) => ({
      name: definition.name,
      description: definition.description,
      arguments: definition.arguments,
    }));
  }

  listDefinitions(): ReadonlyArray<WalletToolDefinition> {
    return this.definitions;
  }

  async call(
    name: McpToolName,
    argumentsValue: unknown,
    context: WalletToolExecutionContext,
  ): Promise<Record<string, unknown>> {
    const definition = this.definitionsByName.get(name);
    if (!definition) {
      throw new WalletDomainError("VALIDATION_ERROR", `Wallet tool ${name} is not registered`);
    }

    const parsedArguments = definition.parseArguments(argumentsValue);
    return definition.execute(parsedArguments, context);
  }

  private createDefinitions(): WalletToolDefinition[] {
    return [
      {
        name: "wallet.current",
        title: "Get Current Wallet",
        description:
          "Return metadata for the currently loaded wallet without exposing the private key. The result includes walletFingerprint, lifecycle status, and source.",
        arguments: [],
        inputShape: {},
        outputSchema: apiEnvelopeSchema(walletCurrentSchema),
        annotations: createReadOnlyAnnotations(),
        parseArguments: (argumentsValue) =>
          this.parseArguments(EMPTY_TOOL_ARGUMENTS_SCHEMA, argumentsValue),
        execute: async () => this.currentWalletQueryService.execute(),
      },
      {
        name: "wallet.operation_status",
        title: "Get Operation Status",
        description:
          "Look up the latest recorded status for a previously submitted transfer by operationId. Use this after any transfer tool call to track submission, confirmation, or failure details.",
        arguments: [
          createStringArgument("operationId", true, "Transfer operation identifier."),
        ],
        inputShape: {
          operationId: z.string().min(1),
        },
        outputSchema: apiEnvelopeSchema(operationStatusResponseSchema),
        annotations: createReadOnlyAnnotations(),
        parseArguments: (argumentsValue) =>
          this.parseArguments(operationStatusRequestSchema, argumentsValue),
        execute: async (argumentsValue) =>
          this.operationStatusQueryService.execute(argumentsValue.operationId as string),
      },
      {
        name: "nervos.address",
        title: "Get Nervos Address",
        description:
          "Return the active Nervos address derived from the current wallet. The result contains { chain, address }.",
        arguments: [],
        inputShape: {},
        outputSchema: apiEnvelopeSchema(nervosAddressSchema),
        annotations: createReadOnlyAnnotations(),
        parseArguments: (argumentsValue) =>
          this.parseArguments(EMPTY_TOOL_ARGUMENTS_SCHEMA, argumentsValue),
        execute: async () => this.nervosAddressQueryService.execute(),
      },
      {
        name: "nervos.balance.ckb",
        title: "Get CKB Balance",
        description:
          "Return the current Nervos CKB balance for the active wallet. The result contains { chain, asset, amount, decimals }; amount is a non-negative integer string in Shannon, where 100000000 means 1 CKB.",
        arguments: [],
        inputShape: {},
        outputSchema: apiEnvelopeSchema(nervosBalanceCkbSchema),
        annotations: createReadOnlyAnnotations(),
        parseArguments: (argumentsValue) =>
          this.parseArguments(EMPTY_TOOL_ARGUMENTS_SCHEMA, argumentsValue),
        execute: async () => this.nervosBalanceQueryService.execute(),
      },
      {
        name: "nervos.sign_message",
        title: "Sign Nervos Message",
        description:
          "Sign an application-provided message with the current Nervos wallet. Set encoding to utf8 for plain text or hex for raw bytes. The result contains { chain, signingAddress, signature }.",
        arguments: [
          createStringArgument("message", true, "Message to sign."),
          createStringArgument(
            "encoding",
            false,
            "Message encoding. Allowed values: utf8 or hex.",
          ),
        ],
        inputShape: {
          message: z.string().min(1),
          encoding: z.enum(["utf8", "hex"]).default("utf8"),
        },
        outputSchema: apiEnvelopeSchema(nervosSignMessageResponseSchema),
        annotations: createSignAnnotations(),
        parseArguments: (argumentsValue) =>
          this.parseArguments(nervosSignMessageRequestSchema, argumentsValue),
        execute: async (argumentsValue, context) =>
          this.nervosMessageSigningService.execute(context.actorRole, {
            message: argumentsValue.message as string,
            encoding: argumentsValue.encoding as "utf8" | "hex",
          }),
      },
      {
        name: "nervos.transfer.ckb",
        title: "Transfer CKB",
        description:
          "Submit a Nervos CKB transfer from the current wallet. amount must be a positive integer string in Shannon, where 100000000 means 1 CKB. The result contains submission data { chain, asset, operationId, txHash, status }; use wallet.operation_status to track later progress.",
        arguments: [
          createStringArgument("to", true, "Recipient CKB address."),
          createStringArgument(
            "amount",
            true,
            "Positive integer string in Shannon. 100000000 means 1 CKB.",
          ),
        ],
        inputShape: {
          to: z.string().min(1),
          amount: z
            .string()
            .regex(
              /^[1-9]\d*$/,
              "amount must be a positive integer string in Shannon (100000000 = 1 CKB)",
            ),
        },
        outputSchema: apiEnvelopeSchema(nervosTransferCkbResponseSchema),
        annotations: createTransferAnnotations(),
        parseArguments: (argumentsValue) =>
          this.parseArguments(nervosTransferCkbRequestSchema, argumentsValue),
        execute: async (argumentsValue, context) =>
          this.nervosTransferService.execute(context.actorRole, {
            to: argumentsValue.to as string,
            amount: argumentsValue.amount as string,
          }),
      },
      {
        name: "ethereum.address",
        title: "Get Ethereum Address",
        description:
          "Return the active Ethereum address derived from the current wallet. The result contains { chain, address }.",
        arguments: [],
        inputShape: {},
        outputSchema: apiEnvelopeSchema(ethereumAddressSchema),
        annotations: createReadOnlyAnnotations(),
        parseArguments: (argumentsValue) =>
          this.parseArguments(EMPTY_TOOL_ARGUMENTS_SCHEMA, argumentsValue),
        execute: async () => this.ethereumAddressQueryService.execute(),
      },
      {
        name: "ethereum.balance.eth",
        title: "Get ETH Balance",
        description:
          "Return the current Ethereum native ETH balance for the active wallet. The result contains { chain, asset, amount, decimals }; amount is a non-negative integer string in wei, where 1000000000000000000 means 1 ETH.",
        arguments: [],
        inputShape: {},
        outputSchema: apiEnvelopeSchema(ethereumBalanceEthSchema),
        annotations: createReadOnlyAnnotations(),
        parseArguments: (argumentsValue) =>
          this.parseArguments(EMPTY_TOOL_ARGUMENTS_SCHEMA, argumentsValue),
        execute: async () => this.ethereumEthBalanceQueryService.execute(),
      },
      {
        name: "ethereum.balance.usdt",
        title: "Get USDT Balance",
        description:
          "Return the current Ethereum ERC-20 USDT balance for the active wallet. The result contains { chain, asset, amount, decimals }; amount is a non-negative integer string in the smallest USDT unit, where 1000000 means 1 USDT.",
        arguments: [],
        inputShape: {},
        outputSchema: apiEnvelopeSchema(ethereumBalanceUsdtSchema),
        annotations: createReadOnlyAnnotations(),
        parseArguments: (argumentsValue) =>
          this.parseArguments(EMPTY_TOOL_ARGUMENTS_SCHEMA, argumentsValue),
        execute: async () => this.ethereumUsdtBalanceQueryService.execute(),
      },
      {
        name: "ethereum.sign_message",
        title: "Sign Ethereum Message",
        description:
          "Sign an application-provided message with the current Ethereum wallet. Set encoding to utf8 for plain text or hex for raw bytes. The result contains { chain, signingAddress, signature }.",
        arguments: [
          createStringArgument("message", true, "Message to sign."),
          createStringArgument(
            "encoding",
            false,
            "Message encoding. Allowed values: utf8 or hex.",
          ),
        ],
        inputShape: {
          message: z.string().min(1),
          encoding: z.enum(["utf8", "hex"]).default("utf8"),
        },
        outputSchema: apiEnvelopeSchema(ethereumSignMessageResponseSchema),
        annotations: createSignAnnotations(),
        parseArguments: (argumentsValue) =>
          this.parseArguments(ethereumSignMessageRequestSchema, argumentsValue),
        execute: async (argumentsValue, context) =>
          this.ethereumMessageSigningService.execute(context.actorRole, {
            message: argumentsValue.message as string,
            encoding: argumentsValue.encoding as "utf8" | "hex",
          }),
      },
      {
        name: "ethereum.transfer.eth",
        title: "Transfer ETH",
        description:
          "Submit an Ethereum native ETH transfer from the current wallet. amount must be a positive integer string in wei, where 1000000000000000000 means 1 ETH. The result contains submission data { chain, asset, operationId, txHash, status }; use wallet.operation_status to track later progress.",
        arguments: [
          createStringArgument("to", true, "Recipient Ethereum address."),
          createStringArgument(
            "amount",
            true,
            "Positive integer string in wei. 1000000000000000000 means 1 ETH.",
          ),
        ],
        inputShape: {
          to: z.string().min(1),
          amount: z
            .string()
            .regex(
              /^[1-9]\d*$/,
              "amount must be a positive integer string in wei (1000000000000000000 = 1 ETH)",
            ),
        },
        outputSchema: apiEnvelopeSchema(ethereumTransferEthResponseSchema),
        annotations: createTransferAnnotations(),
        parseArguments: (argumentsValue) =>
          this.parseArguments(ethereumTransferEthRequestSchema, argumentsValue),
        execute: async (argumentsValue, context) =>
          this.ethereumEthTransferService.execute(context.actorRole, {
            to: argumentsValue.to as string,
            amount: argumentsValue.amount as string,
          }),
      },
      {
        name: "ethereum.transfer.usdt",
        title: "Transfer USDT",
        description:
          "Submit an Ethereum ERC-20 USDT transfer from the current wallet. amount must be a positive integer string in the smallest USDT unit, where 1000000 means 1 USDT. The result contains submission data { chain, asset, operationId, txHash, status }; use wallet.operation_status to track later progress.",
        arguments: [
          createStringArgument("to", true, "Recipient Ethereum address."),
          createStringArgument(
            "amount",
            true,
            "Positive integer string in the smallest USDT unit. 1000000 means 1 USDT.",
          ),
        ],
        inputShape: {
          to: z.string().min(1),
          amount: z
            .string()
            .regex(
              /^[1-9]\d*$/,
              "amount must be a positive integer string in base units (1000000 = 1 USDT)",
            ),
        },
        outputSchema: apiEnvelopeSchema(ethereumTransferUsdtResponseSchema),
        annotations: createTransferAnnotations(),
        parseArguments: (argumentsValue) =>
          this.parseArguments(ethereumTransferUsdtRequestSchema, argumentsValue),
        execute: async (argumentsValue, context) =>
          this.ethereumUsdtTransferService.execute(context.actorRole, {
            to: argumentsValue.to as string,
            amount: argumentsValue.amount as string,
          }),
      },
    ];
  }

  private parseArguments<T extends Record<string, unknown>>(
    schema: { parse: (value: unknown) => T },
    argumentsValue: unknown,
  ): T {
    try {
      return schema.parse(argumentsValue ?? {});
    } catch (error) {
      throw new WalletDomainError(
        "VALIDATION_ERROR",
        `Wallet tool arguments validation failed: ${toErrorMessage(error)}`,
      );
    }
  }
}

function createStringArgument(
  name: string,
  required: boolean,
  description: string,
): WalletToolArgumentDto {
  return {
    name,
    type: "string",
    required,
    description,
  };
}

type WalletToolAnnotations = {
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
};

function createReadOnlyAnnotations(): WalletToolAnnotations {
  return {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };
}

function createSignAnnotations(): WalletToolAnnotations {
  return {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };
}

function createTransferAnnotations(): WalletToolAnnotations {
  return {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true,
  };
}
