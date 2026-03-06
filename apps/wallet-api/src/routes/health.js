/**
 * Health & meta routes.
 */
export default async function healthRoutes(app) {
  app.get("/api/v1/healthz", {
    schema: {
      tags: ["system"],
      summary: "Health check",
      response: {
        200: {
          type: "object",
          properties: { status: { type: "string" } },
        },
      },
    },
  }, async () => ({ status: "ok" }));
}
