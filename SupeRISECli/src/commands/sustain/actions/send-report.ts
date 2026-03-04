/**
 * Send Report Action - Outputs sustain status report for OpenClaw to capture
 */

import { healthCheck, forecast } from "@/core/sustain/engine";

export async function sendReportAction(): Promise<void> {
  try {
    // Get health check and forecast data
    const health = await healthCheck();
    const forecastResult = await forecast();

    // Format message - OpenClaw will capture this output from cron job
    const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUSTAIN REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Health Status: ${health.status.toUpperCase()}
Balance: ${health.balance}
User: ${health.userName}

Burn Rate: ${forecastResult.burnRate.toFixed(2)} units/min
ETA Critical: ${forecastResult.etaCritical || "N/A"}
ETA Zero: ${forecastResult.etaZero || "N/A"}
Confidence: ${forecastResult.confidence}%

Run 'rise sustain health-check' for full details.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    console.log(message);
  } catch (error) {
    console.error("Failed to generate report:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
