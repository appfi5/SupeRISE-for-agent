import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
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
  app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });

  app.get("/api/v1/healthz", async () => ({ status: "ok" }));

  app.addHook("onError", async (_req, reply, error) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ message: "Validation failed", issues: error.issues });
    }
    app.log.error(error);
    return reply.code(500).send({ message: "Internal server error" });
  });

  const adminRateLimit = { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } };
  const runtimeRateLimit = { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } };

  app.post("/api/v1/admin/wallets/import", adminRateLimit, async (req, reply) => {
    if (!isAuthorized(req, "x-admin-token", adminToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const payload = parse(importWalletSchema, req.body);
    return walletService.importWallet(payload);
  });

  app.post("/api/v1/admin/wallets/:walletId/export", adminRateLimit, async (req, reply) => {
    if (!isAuthorized(req, "x-admin-token", adminToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const { walletId } = parse(walletIdParamSchema, req.params);
    return walletService.exportWalletSecret(walletId);
  });

  app.get("/api/v1/admin/wallets", adminRateLimit, async (req, reply) => {
    if (!isAuthorized(req, "x-admin-token", adminToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    return { wallets: walletService.listWallets() };
  });

  app.get("/api/v1/admin/wallets/:walletId", adminRateLimit, async (req, reply) => {
    if (!isAuthorized(req, "x-admin-token", adminToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const { walletId } = parse(walletIdParamSchema, req.params);
    return walletService.getWalletIdentity(walletId);
  });

  app.get("/api/v1/wallets/current", runtimeRateLimit, async (req, reply) => {
    if (!isAuthorized(req, "x-runtime-token", runtimeToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    return walletService.getWalletIdentity();
  });

  app.post("/api/v1/wallets/:walletId/sign-message", runtimeRateLimit, async (req, reply) => {
    if (!isAuthorized(req, "x-runtime-token", runtimeToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const { walletId } = parse(walletIdParamSchema, req.params);
    const { message } = parse(signMessageSchema, req.body);
    return walletService.signMessage(walletId, message);
  });

  app.post("/api/v1/wallets/:walletId/transfers/ckb", runtimeRateLimit, async (req, reply) => {
    if (!isAuthorized(req, "x-runtime-token", runtimeToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const { walletId } = parse(walletIdParamSchema, req.params);
    const payload = parse(transferCkbSchema, req.body);
    return walletService.transferCkb(walletId, payload.toAddress, payload.amountShannon);
  });

  return app;
}
