/**
 * Admin wallet routes (import / export / list / get).
 */
import {
  importWalletSchema,
  walletIdParamSchema,
  parse,
} from "@superise/contracts";
import { isAuthorized } from "../plugins/auth.js";

export default async function adminRoutes(app, { walletService, adminToken }) {
  const adminRateLimit = { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } };

  app.post("/api/v1/admin/wallets/import", {
    ...adminRateLimit,
    schema: {
      tags: ["admin"],
      summary: "Import wallet",
      security: [{ AdminTokenAuth: [] }],
      body: {
        type: "object",
        required: ["name", "privateKey"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 64 },
          privateKey: { type: "string", minLength: 64 },
        },
      },
      response: {
        200: { type: "object", properties: { walletId: { type: "string" }, name: { type: "string" }, chain: { type: "string" }, address: { type: "string" }, publicKey: { type: "string" } } },
        400: { type: "object", properties: { message: { type: "string" } } },
        401: { type: "object", properties: { message: { type: "string" } } },
      },
    },
  }, async (req, reply) => {
    if (!isAuthorized(req, "x-admin-token", adminToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const payload = parse(importWalletSchema, req.body);
    return walletService.importWallet(payload);
  });

  app.post("/api/v1/admin/wallets/:walletId/export", {
    ...adminRateLimit,
    schema: {
      tags: ["admin"],
      summary: "Export wallet private key",
      security: [{ AdminTokenAuth: [] }],
      params: {
        type: "object",
        properties: { walletId: { type: "string" } },
        required: ["walletId"],
      },
      response: {
        200: { type: "object", properties: { privateKey: { type: "string" } } },
        401: { type: "object", properties: { message: { type: "string" } } },
      },
    },
  }, async (req, reply) => {
    if (!isAuthorized(req, "x-admin-token", adminToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const { walletId } = parse(walletIdParamSchema, req.params);
    return walletService.exportWalletSecret(walletId);
  });

  app.get("/api/v1/admin/wallets", {
    ...adminRateLimit,
    schema: {
      tags: ["admin"],
      summary: "List wallets",
      security: [{ AdminTokenAuth: [] }],
      response: {
        200: { type: "object", properties: { wallets: { type: "array" } } },
        401: { type: "object", properties: { message: { type: "string" } } },
      },
    },
  }, async (req, reply) => {
    if (!isAuthorized(req, "x-admin-token", adminToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    return { wallets: walletService.listWallets() };
  });

  app.get("/api/v1/admin/wallets/:walletId", {
    ...adminRateLimit,
    schema: {
      tags: ["admin"],
      summary: "Get wallet identity",
      security: [{ AdminTokenAuth: [] }],
      params: {
        type: "object",
        properties: { walletId: { type: "string" } },
        required: ["walletId"],
      },
      response: {
        200: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, chain: { type: "string" }, address: { type: "string" }, publicKey: { type: "string" } } },
        401: { type: "object", properties: { message: { type: "string" } } },
      },
    },
  }, async (req, reply) => {
    if (!isAuthorized(req, "x-admin-token", adminToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const { walletId } = parse(walletIdParamSchema, req.params);
    return walletService.getWalletIdentity(walletId);
  });
}
