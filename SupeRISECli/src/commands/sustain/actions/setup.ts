/**
 * Setup Action
 */

import * as prompts from "@clack/prompts";
import { getAuthService } from "@/services/platform-auth";
import { registerSustainCronJobs } from "@/services/openclaw-cli";
import { initDatabase, kvGet, kvSet } from "@/storage/sqlite-store";

export async function setupAction(): Promise<void> {
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
    prompts.log.success("✓ Primitive sustain commands ready");

    prompts.outro("Setup complete! Run 'rise sustain health-check' and 'rise sustain forecast' to verify.");
  } catch (error) {
    prompts.log.error(error instanceof Error ? error.message : String(error));
    prompts.outro("Setup failed");
    process.exit(1);
  }
}
