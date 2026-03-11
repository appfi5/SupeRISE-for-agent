import { Module } from "@nestjs/common";
import { TOKENS } from "../tokens";
import { WalletToolsModule } from "./wallet-tools.module";
import { McpServerFactory } from "./mcp/mcp-server.factory";

@Module({
  imports: [WalletToolsModule],
  providers: [
    {
      provide: TOKENS.MCP_SERVER_FACTORY,
      useClass: McpServerFactory,
    },
  ],
  exports: [TOKENS.MCP_SERVER_FACTORY],
})
export class McpModule {}
