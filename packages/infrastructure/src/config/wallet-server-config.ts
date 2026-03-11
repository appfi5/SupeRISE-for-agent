import { randomBytes } from "node:crypto";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { z } from "zod";
import {
  loadChainConfig,
  type WalletServerChainConfig,
} from "./chain-config";

export type WalletServerConfig = {
  nodeEnv: string;
  enableApiDocs: boolean;
  host: string;
  port: number;
  dataDir: string;
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
};

const configSchema = z.object({
  NODE_ENV: z.string().default("development"),
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
  OWNER_NOTICE_PATH: z.string().default("./data/owner-credential.txt"),
  OWNER_JWT_SECRET: z.string().optional(),
  OWNER_JWT_TTL: z.coerce.number().int().positive().optional(),
});

export function loadWalletServerConfig(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): WalletServerConfig {
  const parsed = configSchema.parse(env);
  const chain = loadChainConfig(env, cwd);
  const dataDir = resolve(cwd, parsed.DATA_DIR);
  const sqlitePath = resolve(cwd, parsed.SQLITE_PATH ?? `${parsed.DATA_DIR}/wallet.sqlite`);
  const ownerNoticePath = resolve(cwd, parsed.OWNER_NOTICE_PATH);

  mkdirSync(dataDir, { recursive: true });
  mkdirSync(dirname(sqlitePath), { recursive: true });
  mkdirSync(dirname(ownerNoticePath), { recursive: true });

  const ownerJwtSecret = resolveOwnerJwtSecret(parsed.NODE_ENV, parsed.OWNER_JWT_SECRET);

  return {
    nodeEnv: parsed.NODE_ENV,
    enableApiDocs: parsed.ENABLE_API_DOCS,
    host: parsed.HOST,
    port: parsed.PORT,
    dataDir,
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
  };
}

function resolveOwnerJwtSecret(nodeEnv: string, value: string | undefined): string {
  if (!value) {
    if (nodeEnv === "production") {
      throw new Error("OWNER_JWT_SECRET is required in production");
    }

    return randomBytes(32).toString("hex");
  }

  if (nodeEnv === "production" && Buffer.byteLength(value, "utf8") < 32) {
    throw new Error("OWNER_JWT_SECRET must be at least 32 bytes in production");
  }

  return value;
}
