/**
 * Send Score Report Action - Outputs sustain score review for OpenClaw to capture
 */

import { getLatestScore, initDatabase } from "@/storage/sqlite-store";

export async function sendScoreReportAction(): Promise<void> {
  try {
    await initDatabase();
    const score = getLatestScore();

    let message: string;
    
    if (!score) {
      message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 SUSTAIN SCORE REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No decision scores recorded yet.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    } else {
      message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 SUSTAIN SCORE REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Score ID: ${score.id.substring(0, 8)}...
Action ID: ${score.actionId.substring(0, 8)}...

Metrics:
- Availability: ${(score.score.availability ?? 0).toFixed(2)}
- Cost: ${(score.score.cost ?? 0).toFixed(2)}
- Stability: ${(score.score.stability ?? 0).toFixed(2)}
- Overall: ${(score.score.overall ?? 0).toFixed(2)}

Timestamp: ${score.ts}

Run 'rise sustain score' for full details.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

    console.log(message);
  } catch (error) {
    console.error("Failed to generate score report:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
