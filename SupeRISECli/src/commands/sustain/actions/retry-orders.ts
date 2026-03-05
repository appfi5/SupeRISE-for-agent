/**
 * Retry Orders Action
 *
 * Retries pending top-up orders where CKB transfer succeeded but
 * platform submission failed. Designed to run as a cron job.
 *
 * - Succeeded → delete record, report success
 * - Failed    → retry_count + 1
 * - Exceeded  → migrate to manual_review_orders, report to user
 */

import { initDatabase } from "@/storage/sqlite-store";
import { retryPendingOrders, getPendingOrders, getManualReviewOrders } from "@/services/pending-orders";
import { sendSystemEvent } from "@/services/openclaw-cli";
import type { RetryResult } from "@/services/pending-orders";
import type { ManualReviewOrder, PendingOrder } from "@/services/pending-orders";

export async function retryOrdersAction(options: { notify?: boolean; json?: boolean }): Promise<void> {
  try {
    await initDatabase();

    const pending = getPendingOrders();
    if (pending.length === 0) {
      if (options.json) {
        console.log(JSON.stringify({ message: "No pending orders to retry" }));
      } else {
        console.log("No pending orders to retry.");
      }
      return;
    }

    const result = await retryPendingOrders();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printResult(result);
    }

    if (options.notify && (result.succeeded.length > 0 || result.escalated.length > 0)) {
      const report = buildReport(result);
      const sent = await sendSystemEvent(report);
      if (!sent) {
        console.error("⚠️  Failed to send report to OpenClaw session");
      }
    }
  } catch (error) {
    console.error("Retry orders failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function printResult(result: RetryResult): void {
  console.log(`Retried: ${result.retried}`);
  if (result.succeeded.length > 0) {
    console.log(`✅ Succeeded: ${result.succeeded.length}`);
    for (const o of result.succeeded) {
      console.log(`   orderId=${o.orderId} txHash=${o.txHash}`);
    }
  }
  if (result.failed > 0) {
    console.log(`⏳ Still failing: ${result.failed}`);
  }
  if (result.escalated.length > 0) {
    console.log(`🚨 Escalated to manual review: ${result.escalated.length}`);
    for (const o of result.escalated) {
      printManualReview(o);
    }
  }
}

function buildReport(result: RetryResult): string {
  const lines: string[] = [`[Order Retry] ${new Date().toISOString()}`];

  for (const o of result.succeeded) {
    lines.push(`✅ Order ${o.orderId} submitted successfully (txHash: ${o.txHash})`);
  }

  for (const o of result.escalated) {
    lines.push(
      `🚨 MANUAL REVIEW NEEDED`,
      `   orderId: ${o.orderId}`,
      `   txHash: ${o.txHash}`,
      `   from: ${o.fromAddress}`,
      `   to: ${o.toAddress}`,
      `   amount: ${o.amountCKB} CKB`,
      `   platform: ${o.platformBaseUrl}`,
      `   retries: ${o.retryCount}`,
      `   error: ${o.lastError}`,
    );
  }

  return lines.join("\n");
}

function printManualReview(o: ManualReviewOrder): void {
  console.log(`   orderId     : ${o.orderId}`);
  console.log(`   txHash      : ${o.txHash}`);
  console.log(`   from        : ${o.fromAddress}`);
  console.log(`   to          : ${o.toAddress}`);
  console.log(`   amount      : ${o.amountCKB} CKB`);
  console.log(`   platform    : ${o.platformBaseUrl}`);
  console.log(`   retries     : ${o.retryCount}`);
  console.log(`   lastError   : ${o.lastError}`);
}
