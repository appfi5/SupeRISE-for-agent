import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const walletApiOpenApi = {
  openapi: "3.0.3",
  info: {
    title: "SupeRISE Wallet API",
    version: "0.1.0",
    description: "Wallet service API with admin/runtime token auth",
  },
  paths: {
    "/api/v1/healthz": {
      get: {
        summary: "Health check",
        responses: {
          200: {
            description: "Service healthy",
          },
        },
      },
    },
    "/api/v1/admin/wallets/import": {
      post: {
        summary: "Import wallet",
        security: [{ AdminTokenAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "privateKey"],
                properties: {
                  name: { type: "string", minLength: 1, maxLength: 64 },
                  privateKey: { type: "string", minLength: 64 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Wallet imported" },
          400: { description: "Validation failed" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/admin/wallets/{walletId}/export": {
      post: {
        summary: "Export wallet private key",
        security: [{ AdminTokenAuth: [] }],
        parameters: [
          {
            name: "walletId",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1 },
          },
        ],
        responses: {
          200: { description: "Wallet secret exported" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/admin/wallets": {
      get: {
        summary: "List wallets",
        security: [{ AdminTokenAuth: [] }],
        responses: {
          200: { description: "Wallet list" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/admin/wallets/{walletId}": {
      get: {
        summary: "Get wallet identity",
        security: [{ AdminTokenAuth: [] }],
        parameters: [
          {
            name: "walletId",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1 },
          },
        ],
        responses: {
          200: { description: "Wallet identity" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/wallets/current": {
      get: {
        summary: "Get current wallet identity",
        security: [{ RuntimeTokenAuth: [] }],
        responses: {
          200: { description: "Current wallet identity" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/wallets/{walletId}/sign-message": {
      post: {
        summary: "Sign message",
        security: [{ RuntimeTokenAuth: [] }],
        parameters: [
          {
            name: "walletId",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string", minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Signed message" },
          400: { description: "Validation failed" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/wallets/{walletId}/transfers/ckb": {
      post: {
        summary: "Transfer CKB",
        security: [{ RuntimeTokenAuth: [] }],
        parameters: [
          {
            name: "walletId",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["toAddress", "amountShannon"],
                properties: {
                  toAddress: {
                    type: "string",
                    pattern: "^ck[bt]1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{20,}$",
                    description: "CKB mainnet/testnet address",
                  },
                  amountShannon: {
                    oneOf: [{ type: "string" }, { type: "integer" }],
                    description: "Transfer amount in shannon, must be > 0",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Transfer result" },
          400: { description: "Validation failed" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/openapi.json": {
      get: {
        summary: "OpenAPI schema",
        responses: {
          200: { description: "OpenAPI document" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      AdminTokenAuth: {
        type: "apiKey",
        in: "header",
        name: "x-admin-token",
      },
      RuntimeTokenAuth: {
        type: "apiKey",
        in: "header",
        name: "x-runtime-token",
      },
    },
  },
};

const thisPath = fileURLToPath(import.meta.url);
if (process.argv[1] === thisPath) {
  const outPath = resolve(dirname(thisPath), "..", "openapi.json");
  await writeFile(outPath, `${JSON.stringify(walletApiOpenApi, null, 2)}\n`, "utf8");
}
