import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

export type WalletChainMode = "preset" | "custom";
export type SupportedCkbPreset = "testnet" | "mainnet";
export type SupportedEvmPreset = "testnet" | "mainnet";

export type WalletServerCkbScriptReferenceConfig = {
  codeHash: `0x${string}`;
  hashType: "type" | "data" | "data1" | "data2";
  args: `0x${string}`;
};

export type WalletServerCkbScriptCellDepConfig = {
  cellDep: {
    outPoint: {
      txHash: `0x${string}`;
      index: number;
    };
    depType: "code" | "depGroup";
  };
  type?: WalletServerCkbScriptReferenceConfig;
};

export type WalletServerCkbScriptConfig = {
  codeHash: `0x${string}`;
  hashType: "type" | "data" | "data1" | "data2";
  cellDeps: WalletServerCkbScriptCellDepConfig[];
};

export type WalletServerCkbScriptsConfig = Record<
  string,
  WalletServerCkbScriptConfig
>;

type WalletServerCkbBaseChainConfig = {
  rpcUrl: string;
  indexerUrl: string;
  genesisHash: `0x${string}`;
  addressPrefix: string;
};

export type WalletServerCkbPresetChainConfig =
  WalletServerCkbBaseChainConfig & {
    mode: "preset";
    preset: SupportedCkbPreset;
  };

export type WalletServerCkbCustomChainConfig =
  WalletServerCkbBaseChainConfig & {
    mode: "custom";
    scripts: WalletServerCkbScriptsConfig;
  };

export type WalletServerCkbChainConfig =
  | WalletServerCkbPresetChainConfig
  | WalletServerCkbCustomChainConfig;

export type WalletServerErc20TokenConfig = {
  standard: "erc20";
  contractAddress: `0x${string}`;
};

export type WalletServerEvmTokensConfig = {
  erc20: {
    usdt: WalletServerErc20TokenConfig;
  };
};

type WalletServerEvmBaseChainConfig = {
  rpcUrl: string;
  chainId: number;
  networkName: string;
  tokens: WalletServerEvmTokensConfig;
};

export type WalletServerEvmPresetChainConfig = WalletServerEvmBaseChainConfig & {
  mode: "preset";
  preset: SupportedEvmPreset;
};

export type WalletServerEvmCustomChainConfig = WalletServerEvmBaseChainConfig & {
  mode: "custom";
};

export type WalletServerEvmChainConfig =
  | WalletServerEvmPresetChainConfig
  | WalletServerEvmCustomChainConfig;

export type WalletServerChainConfig = {
  ckb: WalletServerCkbChainConfig;
  evm: WalletServerEvmChainConfig;
};

const HEX_PATTERN = /^0x(?:[a-fA-F0-9]{2})*$/;
const HEX_32_BYTE_PATTERN = /^0x[a-fA-F0-9]{64}$/;
const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const ADDRESS_PREFIX_PATTERN = /^[a-z0-9]+$/;
const KNOWN_SCRIPT_SET = new Set<string>([
  "NervosDao",
  "Secp256k1Blake160",
  "Secp256k1Multisig",
  "Secp256k1MultisigV2",
  "AnyoneCanPay",
  "TypeId",
  "XUdt",
  "JoyId",
  "COTA",
  "PWLock",
  "OmniLock",
  "NostrLock",
  "UniqueType",
  "AlwaysSuccess",
  "InputTypeProxyLock",
  "OutputTypeProxyLock",
  "LockProxyLock",
  "SingleUseLock",
  "TypeBurnLock",
  "EasyToDiscoverType",
  "TimeLock",
]);

const scriptReferenceSchema = z.object({
  codeHash: z.string().trim().regex(HEX_32_BYTE_PATTERN),
  hashType: z.enum(["type", "data", "data1", "data2"]),
  args: z.string().trim().regex(HEX_PATTERN),
});

const ckbScriptSchema = z.object({
  codeHash: z.string().trim().regex(HEX_32_BYTE_PATTERN),
  hashType: z.enum(["type", "data", "data1", "data2"]),
  cellDeps: z.array(
    z.object({
      cellDep: z.object({
        outPoint: z.object({
          txHash: z.string().trim().regex(HEX_32_BYTE_PATTERN),
          index: z.number().int().nonnegative(),
        }),
        depType: z.enum(["code", "depGroup"]),
      }),
      type: scriptReferenceSchema.optional(),
    }),
  ),
});

const ckbScriptsSchema = z
  .record(z.string().trim().min(1), ckbScriptSchema)
  .superRefine((scripts, ctx) => {
    if (!scripts.Secp256k1Blake160) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "scripts.Secp256k1Blake160 is required",
        path: ["Secp256k1Blake160"],
      });
    }

    for (const name of Object.keys(scripts)) {
      if (!KNOWN_SCRIPT_SET.has(name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unsupported CKB known script key: ${name}`,
          path: [name],
        });
      }
    }
  });

const ckbCustomChainConfigSchema = z.object({
  rpcUrl: z.string().url(),
  indexerUrl: z.string().url(),
  genesisHash: z.string().trim().regex(HEX_32_BYTE_PATTERN),
  addressPrefix: z.string().trim().min(1).regex(ADDRESS_PREFIX_PATTERN),
  scripts: ckbScriptsSchema,
});

const evmCustomChainConfigSchema = z.object({
  rpcUrl: z.string().url(),
  chainId: z.number().int().positive(),
  networkName: z.string().trim().min(1).optional(),
  tokens: z.object({
    erc20: z.object({
      usdt: z.object({
        standard: z.literal("erc20"),
        contractAddress: z.string().trim().regex(EVM_ADDRESS_PATTERN),
      }),
    }),
  }),
});

const chainModeSchema = z.object({
  CKB_CHAIN_MODE: z.enum(["preset", "custom"]).default("preset"),
  CKB_CHAIN_PRESET: z.enum(["testnet", "mainnet"]).default("testnet"),
  CKB_CHAIN_CONFIG_PATH: z.string().trim().min(1).optional(),
  EVM_CHAIN_MODE: z.enum(["preset", "custom"]).default("preset"),
  EVM_CHAIN_PRESET: z.enum(["testnet", "mainnet"]).default("testnet"),
  EVM_CHAIN_CONFIG_PATH: z.string().trim().min(1).optional(),
});

const CKB_PRESET_BY_NAME: Record<
  SupportedCkbPreset,
  WalletServerCkbPresetChainConfig
> = {
  testnet: {
    mode: "preset",
    preset: "testnet",
    rpcUrl: "https://testnet.ckb.dev",
    indexerUrl: "https://testnet.ckb.dev/indexer",
    genesisHash: "0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606",
    addressPrefix: "ckt",
  },
  mainnet: {
    mode: "preset",
    preset: "mainnet",
    rpcUrl: "https://mainnet.ckb.dev",
    indexerUrl: "https://mainnet.ckb.dev/indexer",
    genesisHash: "0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5",
    addressPrefix: "ckb",
  },
};

const EVM_PRESET_BY_NAME: Record<
  SupportedEvmPreset,
  WalletServerEvmPresetChainConfig
> = {
  testnet: {
    mode: "preset",
    preset: "testnet",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    chainId: 11155111,
    networkName: "sepolia",
    tokens: {
      erc20: {
        usdt: {
          standard: "erc20",
          contractAddress: "0x0cF531D755F7324B910879b3Cf7beDFAb872513E",
        },
      },
    },
  },
  mainnet: {
    mode: "preset",
    preset: "mainnet",
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    chainId: 1,
    networkName: "mainnet",
    tokens: {
      erc20: {
        usdt: {
          standard: "erc20",
          contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        },
      },
    },
  },
};

export function loadChainConfig(
  env: NodeJS.ProcessEnv,
  cwd: string,
): {
  ckbChainConfigPath?: string;
  evmChainConfigPath?: string;
  chainConfig: WalletServerChainConfig;
} {
  const parsed = chainModeSchema.parse(env);
  const ckb = loadCkbChainConfig(parsed, cwd);
  const evm = loadEvmChainConfig(parsed, cwd);

  return {
    ckbChainConfigPath: ckb.configPath,
    evmChainConfigPath: evm.configPath,
    chainConfig: {
      ckb: ckb.config,
      evm: evm.config,
    },
  };
}

function loadCkbChainConfig(
  env: z.infer<typeof chainModeSchema>,
  cwd: string,
): {
  configPath?: string;
  config: WalletServerCkbChainConfig;
} {
  if (env.CKB_CHAIN_MODE === "custom") {
    if (!env.CKB_CHAIN_CONFIG_PATH) {
      throw new Error(
        "CKB_CHAIN_CONFIG_PATH is required when CKB_CHAIN_MODE=custom",
      );
    }

    const configPath = resolve(cwd, env.CKB_CHAIN_CONFIG_PATH);
    const rawConfig = parseJsonConfig(
      configPath,
      ckbCustomChainConfigSchema,
      "CKB_CHAIN_CONFIG_PATH",
    );

    return {
      configPath,
      config: {
        mode: "custom",
        rpcUrl: rawConfig.rpcUrl,
        indexerUrl: rawConfig.indexerUrl,
        genesisHash: rawConfig.genesisHash as `0x${string}`,
        addressPrefix: rawConfig.addressPrefix,
        scripts: rawConfig.scripts as WalletServerCkbScriptsConfig,
      },
    };
  }

  if (env.CKB_CHAIN_CONFIG_PATH) {
    throw new Error(
      `CKB_CHAIN_CONFIG_PATH must not be set when CKB_CHAIN_MODE=${env.CKB_CHAIN_MODE}`,
    );
  }

  return {
    config: CKB_PRESET_BY_NAME[env.CKB_CHAIN_PRESET],
  };
}

function loadEvmChainConfig(
  env: z.infer<typeof chainModeSchema>,
  cwd: string,
): {
  configPath?: string;
  config: WalletServerEvmChainConfig;
} {
  if (env.EVM_CHAIN_MODE === "custom") {
    if (!env.EVM_CHAIN_CONFIG_PATH) {
      throw new Error(
        "EVM_CHAIN_CONFIG_PATH is required when EVM_CHAIN_MODE=custom",
      );
    }

    const configPath = resolve(cwd, env.EVM_CHAIN_CONFIG_PATH);
    const rawConfig = parseJsonConfig(
      configPath,
      evmCustomChainConfigSchema,
      "EVM_CHAIN_CONFIG_PATH",
    );

    return {
      configPath,
      config: {
        mode: "custom",
        rpcUrl: rawConfig.rpcUrl,
        chainId: rawConfig.chainId,
        networkName: rawConfig.networkName ?? `custom-${rawConfig.chainId}`,
        tokens: {
          erc20: {
            usdt: {
              standard: "erc20",
              contractAddress: rawConfig.tokens.erc20.usdt
                .contractAddress as `0x${string}`,
            },
          },
        },
      },
    };
  }

  if (env.EVM_CHAIN_CONFIG_PATH) {
    throw new Error(
      `EVM_CHAIN_CONFIG_PATH must not be set when EVM_CHAIN_MODE=${env.EVM_CHAIN_MODE}`,
    );
  }

  return {
    config: EVM_PRESET_BY_NAME[env.EVM_CHAIN_PRESET],
  };
}

function parseJsonConfig<T>(
  path: string,
  schema: z.ZodSchema<T>,
  envName: string,
): T {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(
      `Failed to read ${envName} (${path}): ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  try {
    return schema.parse(parsedJson);
  } catch (error) {
    throw new Error(
      `${envName} JSON validation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
