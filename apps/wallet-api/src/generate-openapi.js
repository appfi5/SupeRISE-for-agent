/**
 * Generate openapi.json from the live @fastify/swagger spec.
 *
 * Usage:  node src/generate-openapi.js
 * Output: apps/wallet-api/openapi.json
 */

import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createWalletApiApp } from "./app.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const stubService = {
  importWallet: async () => ({}),
  exportWalletSecret: async () => ({}),
  listWallets: () => [],
  getWalletIdentity: () => ({}),
  signMessage: async () => ({}),
  transferCkb: async () => ({}),
};

const app = await createWalletApiApp({
  walletService: stubService,
  adminToken: "x",
  runtimeToken: "x",
});

await app.ready();
const spec = app.swagger();
const outPath = resolve(__dirname, "..", "openapi.json");
await writeFile(outPath, JSON.stringify(spec, null, 2) + "\n", "utf8");
console.log(`Written to ${outPath}`);
await app.close();
