import { Inject, Injectable } from "@nestjs/common";
import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  apiFailure,
  apiSuccess,
} from "@superise/app-contracts";
import { toContractError } from "@superise/application";
import { TOKENS } from "../../tokens";
import { WalletToolRegistryService } from "../wallet-tools/wallet-tool-registry.service";

@Injectable()
export class McpServerFactory {
  constructor(
    private readonly walletToolRegistry: WalletToolRegistryService,
  ) {}

  async handle(request: Request, response: Response, body: unknown): Promise<void> {
    const server = this.createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, body);
    } finally {
      response.on("close", () => {
        void transport.close();
        void server.close();
      });
    }
  }

  private createServer(): McpServer {
    const server = new McpServer({
      name: "superise-agent-wallet",
      version: "0.2.0",
    });
    const registerTool = server.registerTool.bind(server) as (...args: any[]) => unknown;

    for (const definition of this.walletToolRegistry.listDefinitions()) {
      registerTool(
        definition.name,
        {
          title: definition.title,
          description: definition.description,
          inputSchema: definition.inputShape,
          outputSchema: definition.outputSchema,
          annotations: definition.annotations,
        },
        async (args: any) =>
          this.wrap(() =>
            this.walletToolRegistry.call(definition.name, args, {
              actorRole: "AGENT",
            }),
          ),
      );
    }

    return server;
  }

  private async wrap<T>(task: () => Promise<T>) {
    try {
      const payload = apiSuccess(await task());
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
        structuredContent: payload as Record<string, unknown>,
      };
    } catch (error) {
      const payload = apiFailure(toContractError(error));
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
        structuredContent: payload as Record<string, unknown>,
      };
    }
  }
}
