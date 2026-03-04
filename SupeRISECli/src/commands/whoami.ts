/**
 * Whoami Command
 * 
 * Display current wallet address and public key from sign server.
 */

import { Command } from "commander";
import { getWallet } from "@/services/sign-server";
import pc from "picocolors";

async function whoamiAction(options: { json?: boolean; full?: boolean }): Promise<void> {
  try {
    const wallet = await getWallet();

    if (!wallet) {
      if (options.json) {
        console.log(JSON.stringify({ error: "No wallet configured" }, null, 2));
      } else {
        console.error(pc.red("Error: No wallet configured"));
      }
      process.exit(1);
    }

    if (options.json) {
      if (options.full) {
        console.log(JSON.stringify(wallet, null, 2));
      } else {
        console.log(
          JSON.stringify(
            {
              address: wallet.address,
              publicKey: wallet.publicKey,
            },
            null,
            2
          )
        );
      }
    } else {
      console.log(pc.dim("Address:    ") + pc.green(wallet.address));
      console.log(pc.dim("Public Key: ") + pc.yellow(wallet.publicKey));
      
      if (options.full) {
        console.log(pc.dim("Type:       ") + wallet.addressType);
      }
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

export function registerWhoamiCommand(program: Command): void {
  program
    .command("whoami")
    .description("Display current wallet address and public key")
    .option("--json", "Output as JSON")
    .option("--full", "Show complete API response")
    .action(whoamiAction);
}
