/**
 * Top-up Action - Handles complete top-up business logic
 * 
 * This command orchestrates the full top-up flow:
 * 1. Execute top-up via market client (which handles: create order → transfer CKB → submit tx)
 * 2. Output result
 *
 * Budget: amount clamped to [1000, 20000] CKB.
 */

import { getMarketClient } from "@/services/superise-market";
import { initDatabase } from "@/storage/sqlite-store";
import { validateTopUpAmount } from "@/core/sustain/config";

export async function topUpAction(
  amount: number,
  options: { dryRun?: boolean; json?: boolean } = {}
): Promise<void> {
  try {
    validateTopUpAmount(amount);

    await initDatabase();
    
    const dryRun = options.dryRun || false;
    
    const client = getMarketClient();
    const result = await client.topUp(amount, dryRun);
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      if (!result.success) process.exit(1);
    } else if (!result.success) {
      console.error(`\n❌ Top-up failed: ${result.error}\n`);
      console.error(`  Amount:     ${result.amountCKB} CKB`);
      if (result.orderId)   console.error(`  Order ID:   ${result.orderId}`);
      if (result.toAddress)  console.error(`  To Address: ${result.toAddress}`);
      if (result.txHash)     console.error(`  TX Hash:    ${result.txHash}`);
      if (result.orderId && result.txHash) {
        console.error(`\n  ℹ️  Transfer succeeded but platform submission failed.`);
        console.error(`     Order saved for automatic retry (rise sustain retry-orders).`);
      } else if (result.orderId && !result.txHash) {
        console.error(`\n  ℹ️  Order created but CKB transfer failed. No funds were sent.`);
      } else {
        console.error(`\n  ℹ️  Order creation failed. No funds were sent.`);
      }
      process.exit(1);
    } else {
      console.log("\n✅ Top-up Successful\n");
      console.log(`  Amount:          ${result.amountCKB} CKB`);
      if (result.orderId)        console.log(`  Order ID:        ${result.orderId}`);
      if (result.toAddress)      console.log(`  To Address:      ${result.toAddress}`);
      if (result.txHash)         console.log(`  Transaction:     ${result.txHash}`);
      if (result.exchangeAmount) console.log(`  Exchange Amount: $${result.exchangeAmount}`);
      if (result.newBalance !== undefined) console.log(`  New Balance:     ${result.newBalance}`);
      if (dryRun) {
        console.log("\n  ⚠️  This was a dry-run. No actual transfer was made.");
      }
    }
  } catch (error) {
    console.error("Top-up failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
