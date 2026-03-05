/**
 * Config Action
 * 
 * Manage sustain configuration via CLI
 */

import * as prompts from "@clack/prompts";
import {
  getConfig,
  setConfigValue,
  setConfig,
  resetConfig,
  describeConfig,
  getConfigFilePath,
  type SustainConfig,
  type CronMode,
} from "@/core/sustain/config";

export async function configShowAction(): Promise<void> {
  try {
    console.log(describeConfig());
  } catch (error) {
    console.error("Failed to show config:", error);
    process.exit(1);
  }
}

export async function configGetAction(key: string): Promise<void> {
  try {
    const config = getConfig();
    const value = config[key as keyof SustainConfig];
    
    if (value === undefined) {
      console.error(`Unknown config key: ${key}`);
      console.log("\nAvailable keys:");
      Object.keys(config).forEach(k => console.log(`  - ${k}`));
      process.exit(1);
    }
    
    console.log(value);
  } catch (error) {
    console.error("Failed to get config:", error);
    process.exit(1);
  }
}

export async function configSetAction(key: string, value: string): Promise<void> {
  try {
    const config = getConfig();
    
    if (!(key in config)) {
      console.error(`Unknown config key: ${key}`);
      console.log("\nAvailable keys:");
      Object.keys(config).forEach(k => console.log(`  - ${k}`));
      process.exit(1);
    }
    
    // Type conversion based on key
    let typedValue: any = value;
    
    if (key === "cronMode") {
      if (value !== "dev" && value !== "production") {
        console.error(`Invalid value for cronMode: ${value}`);
        console.log("Valid values: dev, production");
        process.exit(1);
      }
      typedValue = value as CronMode;
    }
    
    setConfigValue(key as keyof SustainConfig, typedValue);
    console.log(`✓ Set ${key} = ${typedValue}`);
    console.log(`\nConfig saved to: ${getConfigFilePath()}`);
  } catch (error) {
    console.error("Failed to set config:", error);
    process.exit(1);
  }
}

export async function configResetAction(options: { confirm?: boolean }): Promise<void> {
  try {
    let shouldReset = options.confirm;
    
    if (!shouldReset) {
      const confirmed = await prompts.confirm({
        message: "Reset all configuration to defaults?",
        initialValue: false,
      });
      
      if (prompts.isCancel(confirmed) || !confirmed) {
        prompts.cancel("Reset cancelled");
        process.exit(0);
      }
      
      shouldReset = true;
    }
    
    if (shouldReset) {
      resetConfig();
      console.log("✓ Configuration reset to defaults");
      console.log("\nCurrent configuration:");
      console.log(describeConfig());
    }
  } catch (error) {
    console.error("Failed to reset config:", error);
    process.exit(1);
  }
}

export async function configEditAction(): Promise<void> {
  try {
    prompts.intro("Edit Sustain Configuration");
    
    const config = getConfig();
    const updates: Partial<SustainConfig> = {};
    
    // Cron mode
    const cronMode = await prompts.select({
      message: "Cron mode:",
      options: [
        { value: "dev", label: "Development (fast: 2min/10min/30min)" },
        { value: "production", label: "Production (normal: 30min/6hr/daily)" },
        { value: "keep", label: `Keep current (${config.cronMode})` },
      ],
      initialValue: "keep",
    });
    
    if (prompts.isCancel(cronMode)) {
      prompts.cancel("Edit cancelled");
      process.exit(0);
    }
    
    if (cronMode !== "keep") {
      updates.cronMode = cronMode as CronMode;
    }
    
    // Platform base URL
    const platformBaseUrl = await prompts.text({
      message: "Platform base URL:",
      placeholder: config.platformBaseUrl,
      initialValue: config.platformBaseUrl,
    });
    
    if (prompts.isCancel(platformBaseUrl)) {
      prompts.cancel("Edit cancelled");
      process.exit(0);
    }
    
    if (platformBaseUrl !== config.platformBaseUrl) {
      updates.platformBaseUrl = platformBaseUrl as string;
    }
    
    // Save updates
    if (Object.keys(updates).length > 0) {
      setConfig(updates);
      prompts.log.success("Configuration updated");
      console.log("\nNew configuration:");
      console.log(describeConfig());
    } else {
      prompts.log.info("No changes made");
    }
    
    prompts.outro("Done");
  } catch (error) {
    prompts.log.error(error instanceof Error ? error.message : String(error));
    prompts.outro("Edit failed");
    process.exit(1);
  }
}
