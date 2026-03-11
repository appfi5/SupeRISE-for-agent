export const MCP_TOOL_NAMES = [
  "wallet.current",
  "wallet.operation_status",
  "nervos.address",
  "nervos.balance.ckb",
  "nervos.sign_message",
  "nervos.transfer.ckb",
  "ethereum.address",
  "ethereum.balance.eth",
  "ethereum.balance.usdt",
  "ethereum.sign_message",
  "ethereum.transfer.eth",
  "ethereum.transfer.usdt",
] as const;

export type McpToolName = (typeof MCP_TOOL_NAMES)[number];
