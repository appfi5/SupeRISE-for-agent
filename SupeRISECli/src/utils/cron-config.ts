/**
 * Cron Configuration for Sustain
 * 
 * Re-exports from the main config system for backward compatibility.
 * Use @/core/sustain/config directly for new code.
 */

export { getCronSchedule, type CronMode } from "@/core/sustain/config";

export type CronSchedule = {
  tick: string;
  report: string;
  scoreReview: string;
};
