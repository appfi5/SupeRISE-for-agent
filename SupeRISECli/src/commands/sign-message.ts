/**
 * Sign Message Command
 * 
 * Sign a message using the local sign server.
 */

import { Command } from "commander";
import pc from "picocolors";
import { signMessage } from "@/services/sign-server";

async function signMessageAction(
  message: string,
  options: { json?: boolean }
): Promise<void> {
  try {
    const { signature } = await signMessage(message);

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            message,
            signature,
          },
          null,
          2
        )
      );
    } else {
      console.log(pc.dim("Message:   ") + message);
      console.log(pc.dim("Signature: ") + pc.green(signature));
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
