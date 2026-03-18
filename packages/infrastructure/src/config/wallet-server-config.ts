import { randomBytes } from "node:crypto";
import { dirname, resolve } from "node:path";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { z } from "zod";
import {
  loadChainConfig,
  type WalletServerChainConfig,
} from "./chain-config";

export type DeploymentProfile = "quickstart" | "managed";
export type WalletServerConfigLoadOptions = {
  quickstartMountInfoPath?: string;
  requireQuickstartRuntimeMount?: boolean;
};

export type WalletServerConfig = {
  nodeEnv: string;
  deploymentProfile: DeploymentProfile;
  enableApiDocs: boolean;
  host: string;
  port: number;
  dataDir: string;
  runtimeSecretDir: string;
  sqlitePath: string;
  walletKekPath?: string;
  walletKek?: string;
  allowPlaintextKekEnv: boolean;
  ownerNoticePath: string;
  ckbChainConfigPath?: string;
  evmChainConfigPath?: string;
  chainConfig: WalletServerChainConfig;
  ownerJwtSecret: string;
  ownerJwtTtlSeconds: number;
  transferSettlementIntervalMs: number;
  transferReservedTimeoutMs: number;
  transferSubmittedTimeoutMs: number;
};

const configSchema = z.object({
  NODE_ENV: z.string().default("development"),
  DEPLOYMENT_PROFILE: z.enum(["quickstart", "managed"]).default("quickstart"),
  ENABLE_API_DOCS: z
    .preprocess((value) => {
      if (typeof value === "string") {
        return value === "true";
      }

      return value;
    }, z.boolean())
    .default(false),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(18799),
  DATA_DIR: z.string().default("./data"),
  RUNTIME_SECRET_DIR: z.string().optional(),
  SQLITE_PATH: z.string().optional(),
  WALLET_KEK_PATH: z.string().optional(),
  WALLET_KEK: z.string().optional(),
  ALLOW_PLAINTEXT_KEK_ENV: z
    .preprocess((value) => {
      if (typeof value === "string") {
        return value === "true";
      }

      return value;
    }, z.boolean())
    .default(false),
  OWNER_NOTICE_PATH: z.string().optional(),
  OWNER_JWT_SECRET: z.string().optional(),
  OWNER_JWT_TTL: z.coerce.number().int().positive().optional(),
  TRANSFER_SETTLEMENT_INTERVAL_MS: z.coerce.number().int().positive().default(15000),
  TRANSFER_RESERVED_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  TRANSFER_SUBMITTED_TIMEOUT_MS: z.coerce.number().int().positive().default(1800000),
});

const OFFICIAL_QUICKSTART_DATA_DIR = "/app/runtime-data";
const OFFICIAL_QUICKSTART_VOLUME_NAME = "superise-agent-wallet-data";
const DEFAULT_MOUNT_INFO_PATH = "/proc/self/mountinfo";

export function loadWalletServerConfig(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
  options: WalletServerConfigLoadOptions = {},
): WalletServerConfig {
  const parsed = configSchema.parse(env);
  const chain = loadChainConfig(env, cwd);
  const dataDir = resolve(cwd, parsed.DATA_DIR);
  const runtimeSecretDir = resolve(cwd, parsed.RUNTIME_SECRET_DIR ?? `${parsed.DATA_DIR}/secrets`);
  const sqlitePath = resolve(cwd, parsed.SQLITE_PATH ?? `${parsed.DATA_DIR}/wallet.sqlite`);
  const ownerNoticePath = resolve(
    cwd,
    parsed.OWNER_NOTICE_PATH ?? `${parsed.DATA_DIR}/owner-credential.txt`,
  );

  validateDeploymentProfileConstraints(parsed.DEPLOYMENT_PROFILE, parsed, chain.chainConfig);
  validateQuickstartRuntimeStorage({
    profile: parsed.DEPLOYMENT_PROFILE,
    dataDir,
    runtimeSecretDir,
    sqlitePath,
    ownerNoticePath,
    mountInfoPath: options.quickstartMountInfoPath ?? DEFAULT_MOUNT_INFO_PATH,
    requireMountedDataDir:
      options.requireQuickstartRuntimeMount ?? dataDir === OFFICIAL_QUICKSTART_DATA_DIR,
  });

  mkdirSync(dataDir, { recursive: true });
  mkdirSync(runtimeSecretDir, { recursive: true });
  mkdirSync(dirname(sqlitePath), { recursive: true });
  mkdirSync(dirname(ownerNoticePath), { recursive: true });

  const ownerJwtSecret = resolveOwnerJwtSecret(
    parsed.DEPLOYMENT_PROFILE,
    runtimeSecretDir,
    parsed.OWNER_JWT_SECRET,
  );

  return {
    nodeEnv: parsed.NODE_ENV,
    deploymentProfile: parsed.DEPLOYMENT_PROFILE,
    enableApiDocs: parsed.ENABLE_API_DOCS,
    host: parsed.HOST,
    port: parsed.PORT,
    dataDir,
    runtimeSecretDir,
    sqlitePath,
    walletKekPath: parsed.WALLET_KEK_PATH ? resolve(cwd, parsed.WALLET_KEK_PATH) : undefined,
    walletKek: parsed.WALLET_KEK,
    allowPlaintextKekEnv: parsed.ALLOW_PLAINTEXT_KEK_ENV,
    ownerNoticePath,
    ckbChainConfigPath: chain.ckbChainConfigPath,
    evmChainConfigPath: chain.evmChainConfigPath,
    chainConfig: chain.chainConfig,
    ownerJwtSecret,
    ownerJwtTtlSeconds: parsed.OWNER_JWT_TTL ?? 60 * 60,
    transferSettlementIntervalMs: parsed.TRANSFER_SETTLEMENT_INTERVAL_MS,
    transferReservedTimeoutMs: parsed.TRANSFER_RESERVED_TIMEOUT_MS,
    transferSubmittedTimeoutMs: parsed.TRANSFER_SUBMITTED_TIMEOUT_MS,
  };
}

function validateDeploymentProfileConstraints(
  profile: DeploymentProfile,
  parsed: z.infer<typeof configSchema>,
  chainConfig: WalletServerChainConfig,
): void {
  if (profile === "managed") {
    if (!parsed.WALLET_KEK_PATH && !parsed.WALLET_KEK) {
      throw new Error(
        "WALLET_KEK_PATH or WALLET_KEK is required when DEPLOYMENT_PROFILE=managed",
      );
    }
    if (!parsed.OWNER_JWT_SECRET) {
      throw new Error("OWNER_JWT_SECRET is required when DEPLOYMENT_PROFILE=managed");
    }
    return;
  }

  if (parsed.WALLET_KEK_PATH || parsed.WALLET_KEK) {
    throw new Error(
      "quickstart does not accept external KEK configuration. Remove legacy WALLET_KEK_PATH / WALLET_KEK from your environment, or set DEPLOYMENT_PROFILE=managed.",
    );
  }
  if (parsed.OWNER_JWT_SECRET) {
    throw new Error(
      "quickstart does not accept OWNER_JWT_SECRET. Remove legacy OWNER_JWT_SECRET from your environment, or set DEPLOYMENT_PROFILE=managed.",
    );
  }
  assertQuickstartChainConfig(chainConfig);
}

function assertQuickstartChainConfig(chainConfig: WalletServerChainConfig): void {
  if (chainConfig.ckb.mode !== "preset" || chainConfig.ckb.preset !== "testnet") {
    throw new Error(
      "quickstart only supports the built-in CKB testnet preset. Remove legacy CKB mainnet/custom chain config from your environment, or set DEPLOYMENT_PROFILE=managed.",
    );
  }
  if (chainConfig.evm.mode !== "preset" || chainConfig.evm.preset !== "testnet") {
    throw new Error(
      "quickstart only supports the built-in EVM testnet preset. Remove legacy EVM mainnet/custom chain config from your environment, or set DEPLOYMENT_PROFILE=managed.",
    );
  }
}

function resolveOwnerJwtSecret(
  profile: DeploymentProfile,
  runtimeSecretDir: string,
  value: string | undefined,
): string {
  if (profile === "managed") {
    if (!value) {
      throw new Error("OWNER_JWT_SECRET is required when DEPLOYMENT_PROFILE=managed");
    }
    assertOwnerJwtSecretStrength(value);
    return value;
  }

  const secretPath = resolve(runtimeSecretDir, "owner-jwt.secret");
  if (!existsSync(secretPath)) {
    writeFileSync(secretPath, randomBytes(32).toString("hex"), {
      encoding: "utf8",
      mode: 0o600,
    });
    chmodSync(secretPath, 0o600);
  }

  const secret = readFileSync(secretPath, "utf8").trim();
  assertOwnerJwtSecretStrength(secret);
  return secret;
}

function assertOwnerJwtSecretStrength(value: string): void {
  if (Buffer.byteLength(value, "utf8") < 32) {
    throw new Error("OWNER_JWT_SECRET must be at least 32 bytes");
  }
}

type QuickstartRuntimeValidationInput = {
  profile: DeploymentProfile;
  dataDir: string;
  runtimeSecretDir: string;
  sqlitePath: string;
  ownerNoticePath: string;
  mountInfoPath: string;
  requireMountedDataDir: boolean;
};

function validateQuickstartRuntimeStorage(
  input: QuickstartRuntimeValidationInput,
): void {
  if (input.profile !== "quickstart") {
    return;
  }

  if (input.requireMountedDataDir) {
    assertMountedDataDir(input.dataDir, input.mountInfoPath);
  }

  assertQuickstartRuntimeState(input.runtimeSecretDir, input.sqlitePath, input.ownerNoticePath);
}

function assertMountedDataDir(dataDir: string, mountInfoPath: string): void {
  let mountInfo: string;
  try {
    mountInfo = readFileSync(mountInfoPath, "utf8");
  } catch (error) {
    throw new Error(
      `quickstart could not verify whether ${dataDir} is an explicit persistent volume mount: ${String(
        error,
      )}. Start the official image with: ${formatQuickstartDockerRunCommand()}`,
    );
  }

  const mountedPaths = mountInfo
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => line.split(" ")[4])
    .filter((path): path is string => typeof path === "string")
    .map(decodeMountInfoPath);

  if (mountedPaths.includes(dataDir)) {
    return;
  }

  throw new Error(
    `quickstart requires an explicit persistent volume mounted at ${dataDir}. Start the official image with: ${formatQuickstartDockerRunCommand()}`,
  );
}

function assertQuickstartRuntimeState(
  runtimeSecretDir: string,
  sqlitePath: string,
  ownerNoticePath: string,
): void {
  const criticalFiles = [
    {
      label: "wallet.kek",
      path: resolve(runtimeSecretDir, "wallet.kek"),
    },
    {
      label: "owner-jwt.secret",
      path: resolve(runtimeSecretDir, "owner-jwt.secret"),
    },
    {
      label: "wallet.sqlite",
      path: sqlitePath,
    },
    {
      label: "owner-credential.txt",
      path: ownerNoticePath,
    },
  ];
  const existing = criticalFiles.filter((file) => existsSync(file.path));

  if (existing.length === 0 || existing.length === criticalFiles.length) {
    return;
  }

  const missing = criticalFiles.filter((file) => !existsSync(file.path));
  throw new Error(
    `quickstart runtime data is incomplete. Present files: ${existing
      .map((file) => file.label)
      .join(", ")}. Missing files: ${missing
      .map((file) => file.label)
      .join(", ")}. Restore the original ${OFFICIAL_QUICKSTART_VOLUME_NAME} data or remove the incomplete runtime directory before restarting quickstart.`,
  );
}

function decodeMountInfoPath(value: string): string {
  return value
    .replaceAll("\\040", " ")
    .replaceAll("\\011", "\t")
    .replaceAll("\\012", "\n")
    .replaceAll("\\134", "\\");
}

function formatQuickstartDockerRunCommand(): string {
  return `docker run -p 18799:18799 -v ${OFFICIAL_QUICKSTART_VOLUME_NAME}:${OFFICIAL_QUICKSTART_DATA_DIR} <image>`;
}
