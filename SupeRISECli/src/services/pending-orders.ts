/**
 * Pending Orders Service
 *
 * Handles the case where CKB transfer succeeded but platform order submission failed.
 *
 * Two tables:
 *   pending_orders       — orders awaiting automatic retry
 *   manual_review_orders — orders that exhausted retries, need human intervention
 *
 * Lifecycle:
 *   1. Transfer OK, submit-tx-hash fails → savePendingOrder()
 *   2. Cron job calls retryPendingOrders()
 *   3. Retry succeeds → delete from pending_orders, return in succeeded list
 *   4. Retry fails   → retry_count + 1
 *   5. retry_count >= MAX_RETRIES → move to manual_review_orders, return in escalated list
 */

import { getDb } from "@/storage/sqlite-store";
import { getAuthService } from "@/services/platform-auth";
import { getConfigValue } from "@/core/sustain/config";
import type { PlatformResponse, SubmitTxHashRequest } from "@/services/platform-types";

const MAX_RETRIES = 5;

export type PendingOrder = {
  id: string;
  orderId: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amountCKB: number;
  platformBaseUrl: string;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  lastError: string | null;
};

export type ManualReviewOrder = PendingOrder & { escalatedAt: string };

// ===== Write =====

export function savePendingOrder(order: {
  orderId: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amountCKB: number;
}): void {
  const db = getDb();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const platformBaseUrl = getConfigValue("platformBaseUrl");

  db.prepare(`
    INSERT INTO pending_orders (id, order_id, tx_hash, from_address, to_address, amount_ckb, platform_base_url, created_at, updated_at, retry_count, last_error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
  `).run(id, order.orderId, order.txHash, order.fromAddress, order.toAddress, order.amountCKB, platformBaseUrl, now, now);
}

// ===== Read =====

export function getPendingOrders(): PendingOrder[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM pending_orders ORDER BY created_at ASC").all() as any[];
  return rows.map(rowToPending);
}

export function getManualReviewOrders(): ManualReviewOrder[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM manual_review_orders ORDER BY escalated_at DESC").all() as any[];
  return rows.map(rowToManualReview);
}

// ===== Retry =====

export type RetryResult = {
  retried: number;
  succeeded: PendingOrder[];
  failed: number;
  escalated: ManualReviewOrder[];
};

export async function retryPendingOrders(): Promise<RetryResult> {
  const db = getDb();
  const orders = getPendingOrders();

  let retried = 0;
  let failed = 0;
  const succeeded: PendingOrder[] = [];
  const escalated: ManualReviewOrder[] = [];

  for (const order of orders) {
    retried++;
    const result = await submitTxHashToMarket(order);
    const now = new Date().toISOString();

    if (result.success) {
      db.prepare("DELETE FROM pending_orders WHERE id = ?").run(order.id);
      succeeded.push(order);
    } else {
      failed++;
      const newRetryCount = order.retryCount + 1;

      if (newRetryCount >= MAX_RETRIES) {
        // Migrate to manual_review_orders
        db.prepare(`
          INSERT INTO manual_review_orders (id, order_id, tx_hash, from_address, to_address, amount_ckb, platform_base_url, created_at, escalated_at, retry_count, last_error)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(order.id, order.orderId, order.txHash, order.fromAddress, order.toAddress, order.amountCKB, order.platformBaseUrl, order.createdAt, now, newRetryCount, result.error ?? null);
        db.prepare("DELETE FROM pending_orders WHERE id = ?").run(order.id);
        escalated.push({ ...order, retryCount: newRetryCount, lastError: result.error ?? null, escalatedAt: now });
      } else {
        db.prepare(
          "UPDATE pending_orders SET retry_count = ?, updated_at = ?, last_error = ? WHERE id = ?"
        ).run(newRetryCount, now, result.error ?? null, order.id);
      }
    }
  }

  return { retried, succeeded, failed, escalated };
}

// ===== Internal =====

async function submitTxHashToMarket(
  order: PendingOrder
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getAuthService();
    const token = await auth.ensureToken();

    const req: SubmitTxHashRequest = {
      orderId: order.orderId,
      txHash: order.txHash,
    };

    const response = await fetch(
      `${order.platformBaseUrl}/api/v1/order/submit-tx-hash`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(req),
      }
    );

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data: PlatformResponse<boolean> = await response.json();
    if (!data.success) {
      return { success: false, error: data.message || "Platform rejected submission" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function rowToPending(row: any): PendingOrder {
  return {
    id: row.id,
    orderId: row.order_id,
    txHash: row.tx_hash,
    fromAddress: row.from_address,
    toAddress: row.to_address,
    amountCKB: row.amount_ckb,
    platformBaseUrl: row.platform_base_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    retryCount: row.retry_count,
    lastError: row.last_error,
  };
}

function rowToManualReview(row: any): ManualReviewOrder {
  return {
    id: row.id,
    orderId: row.order_id,
    txHash: row.tx_hash,
    fromAddress: row.from_address,
    toAddress: row.to_address,
    amountCKB: row.amount_ckb,
    platformBaseUrl: row.platform_base_url,
    createdAt: row.created_at,
    updatedAt: row.escalated_at,
    escalatedAt: row.escalated_at,
    retryCount: row.retry_count,
    lastError: row.last_error,
  };
}
