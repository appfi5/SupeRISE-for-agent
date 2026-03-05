/**
 * MCP Server Action
 */

import { startMcpServer } from "@/mcp-server/index";

export async function mcpServerAction(): Promise<void> {
  try {
    await startMcpServer();
  } catch (error) {
    console.error("MCP server failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
