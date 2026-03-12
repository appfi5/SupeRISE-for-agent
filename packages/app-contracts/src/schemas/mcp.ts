export const MCP_TOOL_NAMES = [
  "wallet.current",
  "wallet.operation_status",
  "nervos.address",
  "nervos.balance.ckb",
  "nervos.sign_message",
  "nervos.transfer.ckb",
  "nervos.tx_status",
  "ethereum.address",
  "ethereum.balance.eth",
  "ethereum.balance.usdt",
  "ethereum.balance.usdc",
  "ethereum.sign_message",
  "ethereum.transfer.eth",
  "ethereum.transfer.usdt",
  "ethereum.transfer.usdc",
  "ethereum.tx_status",
] as const;

export type McpToolName = (typeof MCP_TOOL_NAMES)[number];
