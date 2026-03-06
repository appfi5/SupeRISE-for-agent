import { SqliteWalletRepository } from "@superise/storage-sqlite";
import { CkbAdapter } from "@superise/chain-ckb";
import { WalletCoreService } from "@superise/wallet-core";
import { createWalletApiApp } from "./app.js";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DB_PATH ?? "./data/wallet.sqlite";
const masterKey = process.env.MASTER_KEY;
const adminToken = process.env.ADMIN_TOKEN ?? "admin-token";
const runtimeToken = process.env.RUNTIME_TOKEN ?? "runtime-token";

if (!masterKey) {
  throw new Error("MASTER_KEY is required for wallet-api startup.");
}

const repository = new SqliteWalletRepository(dbPath);
const ckbAdapter = new CkbAdapter();
const walletService = new WalletCoreService({ repository, ckbAdapter, masterKey });
const app = await createWalletApiApp({ walletService, adminToken, runtimeToken });

app.listen({ host, port }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
