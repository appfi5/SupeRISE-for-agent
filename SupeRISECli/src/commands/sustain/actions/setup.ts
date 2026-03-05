/**
 * Setup Action
 */

import * as prompts from "@clack/prompts";
import { getAuthService } from "@/services/platform-auth";
import { registerSustainCronJobs } from "@/services/openclaw-cli";
import { loadLocalPolicy, updateLocalPolicy } from "@/core/sustain/engine";
import { initDatabase, kvGet, kvSet } from "@/storage/sqlite-store";

export async function setupAction(options: Record<string, any> = {}): Promise<void> {
  try {
    prompts.intro("Sustain Setup");

    // Initialize database first
    const spinner = prompts.spinner();
    spinner.start("Initializing database...");
    await initDatabase();
    spinner.stop("Database initialized");

    // Check if already setup
    const setupComplete = kvGet<boolean>("setup_complete");
    const setupVersion = kvGet<string>("setup_version");
    const currentVersion = "1.0.0";

    if (setupComplete && setupVersion === currentVersion) {
      prompts.log.warn("Sustain is already set up. Re-running setup...");
      const shouldContinue = await prompts.confirm({
        message: "Do you want to reconfigure?",
        initialValue: false,
      });
      if (prompts.isCancel(shouldContinue) || !shouldContinue) {
        prompts.outro("Setup cancelled");
        process.exit(0);
      }
    }

    spinner.start("Initializing authentication...");

    const auth = getAuthService();

    try {
      // Ensure we have a valid token (this will trigger login if needed)
      await auth.ensureToken();
      spinner.stop("Authentication initialized");
    } catch (error) {
      spinner.stop("Authentication failed");
      prompts.log.error(
        "Authentication failed. Please check your configuration.\n" +
        "Error: " + (error instanceof Error ? error.message : String(error))
      );
      prompts.outro("Setup failed");
      process.exit(1);
    }

    // Initialize traffic stats tracking
    spinner.start("Initializing traffic statistics...");
    const trafficStatsInitialized = kvGet<boolean>("traffic_stats_initialized");
    if (!trafficStatsInitialized) {
      kvSet("traffic_stats_initialized", true);
      kvSet("traffic_stats_start_time", new Date().toISOString());
      kvSet("traffic_stats_total_observations", 0);
      spinner.stop("Traffic statistics initialized");
    } else {
      spinner.stop("Traffic statistics already initialized");
    }

    // Initialize self-supervision feedback loop
    spinner.start("Initializing self-supervision feedback...");
    const feedbackInitialized = kvGet<boolean>("feedback_initialized");
    if (!feedbackInitialized) {
      kvSet("feedback_initialized", true);
      kvSet("feedback_last_review", new Date().toISOString());
      kvSet("feedback_review_count", 0);
      spinner.stop("Self-supervision feedback initialized");
    } else {
      spinner.stop("Self-supervision feedback already initialized");
    }

    const policy = loadLocalPolicy();
    prompts.log.info(`Current policy: ${policy.strategy} strategy`);
    prompts.log.info(`Thresholds: critical=${policy.thresholds.critical}, low=${policy.thresholds.low}`);
    prompts.log.info(`Auto top-up: ${policy.autoTopUpEnabled ? "enabled" : "disabled"}`);

    const shouldConfigurePolicy = await prompts.confirm({
      message: "Configure policy settings?",
      initialValue: false,
    });

    if (prompts.isCancel(shouldConfigurePolicy)) {
      prompts.cancel("Setup cancelled");
      process.exit(0);
    }

    if (shouldConfigurePolicy) {
      const strategy = await prompts.select({
        message: "Select strategy:",
        options: [
          { value: "availability", label: "Availability (prioritize uptime)" },
          { value: "balanced", label: "Balanced (default)" },
          { value: "cost", label: "Cost (minimize spending)" },
        ],
      });

      if (prompts.isCancel(strategy)) {
        prompts.cancel("Setup cancelled");
        process.exit(0);
      }

      updateLocalPolicy({ strategy: strategy as any });
      prompts.log.success(`Policy updated to ${strategy} strategy`);
    }

    // Register OpenClaw cron jobs (optional, only if OpenClaw is available)
    spinner.start("Registering OpenClaw cron jobs (optional)...");
    try {
      await registerSustainCronJobs();
      spinner.stop("Cron jobs registered");
      prompts.log.success("✓ Cron jobs registered (OpenClaw integration enabled)");
    } catch (error) {
      spinner.stop("Cron job registration skipped");
      prompts.log.info("ℹ OpenClaw not available - cron jobs skipped (you can use sustain commands directly)");
    }

    // Mark setup as complete
    kvSet("setup_complete", true);
    kvSet("setup_version", currentVersion);
    kvSet("setup_timestamp", new Date().toISOString());

    prompts.log.success("\n✓ Database initialized");
    prompts.log.success("✓ Authentication configured");
    prompts.log.success("✓ Traffic statistics enabled");
    prompts.log.success("✓ Self-supervision feedback enabled");
    prompts.log.success("✓ Policy configured");

    prompts.outro("Setup complete! Run 'rise sustain health-check' to verify.");
  } catch (error) {
    prompts.log.error(error instanceof Error ? error.message : String(error));
    prompts.outro("Setup failed");
    process.exit(1);
  }
}
