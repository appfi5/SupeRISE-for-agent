const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const {
  RotateKekService,
} = require("@superise/application");
const {
  AesGcmVaultService,
  WalletDatabase,
  createRepositoryBundle,
  loadWalletServerConfig,
  SqliteUnitOfWork,
} = require("@superise/infrastructure");

async function main() {
  const cwd = process.cwd();
  const config = loadWalletServerConfig(process.env, cwd);
  const nextKekInput = resolveNextKekInput(process.env, cwd);
  const database = new WalletDatabase(config);

  try {
    await database.migrate();

    const rotateKekService = new RotateKekService(
      createRepositoryBundle(database.db),
      new SqliteUnitOfWork(database.db),
      new AesGcmVaultService(config),
    );

    const result = await rotateKekService.execute(nextKekInput);
    process.stdout.write(
      [
        "[rewrap-kek] wallet DEK rewrapped successfully",
        `walletFingerprint=${result.walletFingerprint}`,
        `kekProvider=${result.kekProvider}`,
        `kekReference=${result.kekReference}`,
        `rotatedAt=${result.rotatedAt}`,
      ].join("\n") + "\n",
    );
  } finally {
    await database.close();
  }
}

function resolveNextKekInput(env, cwd) {
  const nextKekPath = env.NEXT_WALLET_KEK_PATH?.trim();
  const nextKek = env.NEXT_WALLET_KEK?.trim();
  const nextKekProvider = env.NEXT_WALLET_KEK_PROVIDER?.trim();
  const nextKekReference = env.NEXT_WALLET_KEK_REFERENCE?.trim();

  if (nextKekPath) {
    const resolvedPath = resolve(cwd, nextKekPath);
    if (!existsSync(resolvedPath)) {
      throw new Error(`NEXT_WALLET_KEK_PATH does not exist: ${resolvedPath}`);
    }

    return {
      nextKek: readFileSync(resolvedPath, "utf8").trim(),
      nextKekProvider: nextKekProvider || inferPathProvider(resolvedPath),
      nextKekReference: nextKekReference || resolvedPath,
    };
  }

  if (nextKek) {
    return {
      nextKek,
      nextKekProvider: nextKekProvider || "env",
      nextKekReference: nextKekReference || "NEXT_WALLET_KEK",
    };
  }

  throw new Error(
    "Set NEXT_WALLET_KEK_PATH or NEXT_WALLET_KEK before running KEK rotation.",
  );
}

function inferPathProvider(pathname) {
  if (pathname.startsWith("/run/secrets/")) {
    return "docker-secret";
  }

  return "file-path";
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`[rewrap-kek] ${message}\n`);
  process.exitCode = 1;
});
