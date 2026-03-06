/**
 * Runtime wallet routes (current / sign-message / transfer-ckb).
 */
import {
  signMessageSchema,
  transferCkbSchema,
  walletIdParamSchema,
  parse,
} from "@superise/contracts";
import { isAuthorized } from "../plugins/auth.js";

export default async function runtimeRoutes(app, { walletService, runtimeToken }) {
  const runtimeRateLimit = { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } };

  app.get("/api/v1/wallets/current", {
    ...runtimeRateLimit,
    schema: {
      tags: ["runtime"],
      summary: "Get current wallet identity",
      security: [{ RuntimeTokenAuth: [] }],
      response: {
        200: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, chain: { type: "string" }, address: { type: "string" }, publicKey: { type: "string" } } },
        401: { type: "object", properties: { message: { type: "string" } } },
      },
    },
  }, async (req, reply) => {
    if (!isAuthorized(req, "x-runtime-token", runtimeToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    return walletService.getWalletIdentity();
  });

  app.post("/api/v1/wallets/:walletId/sign-message", {
    ...runtimeRateLimit,
    schema: {
      tags: ["runtime"],
      summary: "Sign message",
      security: [{ RuntimeTokenAuth: [] }],
      params: {
        type: "object",
        properties: { walletId: { type: "string" } },
        required: ["walletId"],
      },
      body: {
        type: "object",
        required: ["message"],
        properties: { message: { type: "string", minLength: 1 } },
      },
      response: {
        200: { type: "object", properties: { signature: { type: "string" } } },
        400: { type: "object", properties: { message: { type: "string" } } },
        401: { type: "object", properties: { message: { type: "string" } } },
      },
    },
  }, async (req, reply) => {
    if (!isAuthorized(req, "x-runtime-token", runtimeToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const { walletId } = parse(walletIdParamSchema, req.params);
    const { message } = parse(signMessageSchema, req.body);
    return walletService.signMessage(walletId, message);
  });

  app.post("/api/v1/wallets/:walletId/transfers/ckb", {
    ...runtimeRateLimit,
    schema: {
      tags: ["runtime"],
      summary: "Transfer CKB",
      security: [{ RuntimeTokenAuth: [] }],
      params: {
        type: "object",
        properties: { walletId: { type: "string" } },
        required: ["walletId"],
      },
      body: {
        type: "object",
        required: ["toAddress", "amountShannon"],
        properties: {
          toAddress: {
            type: "string",
            pattern: "^ck[bt]1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{30,120}$",
            description: "CKB mainnet/testnet address",
          },
          amountShannon: {
            type: "string",
            description: "Transfer amount in shannon (stringified bigint), must be > 0",
          },
        },
      },
      response: {
        200: { type: "object", properties: { txHash: { type: "string" }, toAddress: { type: "string" }, amountShannon: { type: "string" } } },
        400: { type: "object", properties: { message: { type: "string" } } },
        401: { type: "object", properties: { message: { type: "string" } } },
      },
    },
  }, async (req, reply) => {
    if (!isAuthorized(req, "x-runtime-token", runtimeToken)) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const { walletId } = parse(walletIdParamSchema, req.params);
    const payload = parse(transferCkbSchema, req.body);
    return walletService.transferCkb(walletId, payload.toAddress, payload.amountShannon);
  });
}
