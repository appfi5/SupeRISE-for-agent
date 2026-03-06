import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { WalletApiClient } from "@superise/sdk";

const client = new WalletApiClient({
  baseUrl: process.env.WALLET_API_BASE_URL ?? "http://127.0.0.1:3000",
  adminToken: process.env.ADMIN_TOKEN ?? "admin-token",
  runtimeToken: process.env.RUNTIME_TOKEN ?? "runtime-token",
});

const tools = {
  "wallet.current.get": {
    description: "Get current wallet identity",
    inputSchema: { type: "object", properties: {} },
    handler: async () => client.getCurrentWallet(),
  },
  "wallet.list": {
    description: "List available wallets",
    inputSchema: { type: "object", properties: {} },
    handler: async () => client.listWallets(),
  },
  "wallet.ckb.sign_message": {
    description: "Sign a CKB message with wallet",
    inputSchema: {
      type: "object",
      properties: {
        walletId: { type: "string" },
        message: { type: "string" },
      },
      required: ["walletId", "message"],
    },
    handler: async (args) => client.signMessage(args.walletId, { message: args.message }),
  },
  "wallet.ckb.transfer": {
    description: "Transfer CKB to another address",
    inputSchema: {
      type: "object",
      properties: {
        walletId: { type: "string" },
        toAddress: { type: "string" },
        amountShannon: { type: "string" },
      },
      required: ["walletId", "toAddress", "amountShannon"],
    },
    handler: async (args) =>
      client.transferCkb(args.walletId, {
        toAddress: args.toAddress,
        amountShannon: args.amountShannon,
      }),
  },
  "wallet.import_private_key": {
    description: "Import private key wallet",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        privateKey: { type: "string" },
      },
      required: ["name", "privateKey"],
    },
    handler: async (args) => client.importWallet({ name: args.name, privateKey: args.privateKey }),
  },
  "wallet.export_private_key": {
    description: "Export private key from wallet",
    inputSchema: {
      type: "object",
      properties: {
        walletId: { type: "string" },
      },
      required: ["walletId"],
    },
    handler: async (args) => client.exportWalletSecret(args.walletId),
  },
};

const server = new Server(
  { name: "superise-wallet-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools[request.params.name];
  if (!tool) {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  try {
    const result = await tool.handler(request.params.arguments ?? {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: JSON.stringify({ error: error.message }, null, 2) }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("wallet-mcp is running on stdio");
