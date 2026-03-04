/**
 * Sign Message Command
 * 
 * Sign a message using the local sign server.
 */

import { Command } from "commander";
import pc from "picocolors";

async function signMessageAction(
  message: string,
  options: { json?: boolean }
): Promise<void> {
  try {
    // TODO: Implement real sign server integration
    // For now, return mock signature
    const mockSignature = "0x" + "a".repeat(130); // Mock 65-byte signature in hex

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            message,
            signature: mockSignature,
          },
          null,
          2
        )
      );
    } else {
      console.log(pc.dim("Message:   ") + message);
      console.log(pc.dim("Signature: ") + pc.green(mockSignature));
    }
  } catch (error) {
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            error:
              error instanceof Error ? error.message : "Unknown error",
          },
          null,
          2
        )
      );
    } else {
      console.error(
        pc.red("Error: ") +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
    process.exit(1);
  }
}

export function registerSignMessageCommand(program: Command): void {
  program
    .command("sign-message")
    .description("Sign a message using local sign server")
    .argument("<message>", "Message to sign")
    .option("--json", "Output as JSON")
    .action(signMessageAction);
}
