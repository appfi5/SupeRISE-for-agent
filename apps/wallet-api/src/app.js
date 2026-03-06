import Fastify from "fastify";
import { ZodError } from "zod";
import {
  importWalletSchema,
  signMessageSchema,
  transferCkbSchema,
  walletIdParamSchema,
  parse,
} from "@superise/contracts";

function isAuthorized(req, tokenHeader, expectedToken) {
  const actual = req.headers[tokenHeader];
  return typeof actual === "string" && actual.length > 0 && actual === expectedToken;
}

export function createWalletApiApp({ walletService, adminToken, runtimeToken }) {
  const app = Fastify({ logger: true });

  app.get("/api/v1/healthz", async () => ({ status: "ok" }));

  app.addHook("onError", async (_req, reply, error) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ message: "Validation failed", issues: error.issues });
    }
    return reply.code(400).send({ message: error.message });
  });

  app.post("/api/v1/admin/wallets/import", async (req, reply) => {
    if (!isAuthorized(req, "x-admin-token", adminToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const payload = parse(importWalletSchema, req.body);
    return walletService.importWallet(payload);
  });

  app.post("/api/v1/admin/wallets/:walletId/export", async (req, reply) => {
    if (!isAuthorized(req, "x-admin-token", adminToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const { walletId } = parse(walletIdParamSchema, req.params);
    return walletService.exportWalletSecret(walletId);
  });

  app.get("/api/v1/admin/wallets", async (req, reply) => {
    if (!isAuthorized(req, "x-admin-token", adminToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    return { wallets: walletService.listWallets() };
  });

  app.get("/api/v1/admin/wallets/:walletId", async (req, reply) => {
    if (!isAuthorized(req, "x-admin-token", adminToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const { walletId } = parse(walletIdParamSchema, req.params);
    return walletService.getWalletIdentity(walletId);
  });

  app.get("/api/v1/wallets/current", async (req, reply) => {
    if (!isAuthorized(req, "x-runtime-token", runtimeToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    return walletService.getWalletIdentity();
  });

  app.post("/api/v1/wallets/:walletId/sign-message", async (req, reply) => {
    if (!isAuthorized(req, "x-runtime-token", runtimeToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const { walletId } = parse(walletIdParamSchema, req.params);
    const { message } = parse(signMessageSchema, req.body);
    return walletService.signMessage(walletId, message);
  });

  app.post("/api/v1/wallets/:walletId/transfers/ckb", async (req, reply) => {
    if (!isAuthorized(req, "x-runtime-token", runtimeToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const { walletId } = parse(walletIdParamSchema, req.params);
    const payload = parse(transferCkbSchema, req.body);
    return walletService.transferCkb(walletId, payload.toAddress, payload.amountShannon);
  });

  return app;
}
