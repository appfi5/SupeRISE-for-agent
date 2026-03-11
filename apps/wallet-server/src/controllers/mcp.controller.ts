import { Body, Controller, Delete, Get, Inject, Post, Req, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Request, Response } from "express";
import type { McpServerFactory } from "../modules/mcp/mcp-server.factory";
import { TOKENS } from "../tokens";
import { apiFailure } from "@superise/app-contracts";

@ApiExcludeController()
@Controller()
export class McpController {
  constructor(
    @Inject(TOKENS.MCP_SERVER_FACTORY)
    private readonly mcpServerFactory: McpServerFactory,
  ) {}

  @Post("mcp")
  async handlePost(
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: unknown,
  ): Promise<void> {
    await this.mcpServerFactory.handle(request, response, body);
  }

  @Get("mcp")
  handleGet(@Res() response: Response): void {
    response.status(405).json(
      apiFailure({
        code: "VALIDATION_ERROR",
        message: "Method not allowed.",
      }),
    );
  }

  @Delete("mcp")
  handleDelete(@Res() response: Response): void {
    response.status(405).json(
      apiFailure({
        code: "VALIDATION_ERROR",
        message: "Method not allowed.",
      }),
    );
  }
}
