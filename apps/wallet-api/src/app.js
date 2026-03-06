import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { ZodError } from "zod";
import healthRoutes from "./routes/health.js";
import adminRoutes from "./routes/admin.js";
import runtimeRoutes from "./routes/runtime.js";

export async function createWalletApiApp({ walletService, adminToken, runtimeToken }) {
  const app = Fastify({ logger: true });

  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "SupeRISE Wallet API",
        version: "0.1.0",
        description: "Wallet service API — admin + runtime token auth",
      },
      components: {
        securitySchemes: {
          AdminTokenAuth: { type: "apiKey", in: "header", name: "x-admin-token" },
          RuntimeTokenAuth: { type: "apiKey", in: "header", name: "x-runtime-token" },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  app.addHook("onError", async (_req, reply, error) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ message: "Validation failed", issues: error.issues });
    }
    app.log.error(error);
    return reply.code(500).send({ message: "Internal server error" });
  });

  await app.register(healthRoutes);
  await app.register(adminRoutes, { walletService, adminToken });
  await app.register(runtimeRoutes, { walletService, runtimeToken });

  return app;
}

