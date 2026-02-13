import { cancel, isCancel, select, text, password } from "@clack/prompts";
import pc from "picocolors";

export async function promptText(message: string, placeholder?: string): Promise<string> {
  const result = await text({ message, placeholder });
  if (isCancel(result)) {
    cancel(pc.yellow("Operation cancelled."));
    process.exit(0);
  }
  return String(result).trim();
}

export async function promptSecret(message: string): Promise<string> {
  const result = await password({ message });
  if (isCancel(result)) {
    cancel(pc.yellow("Operation cancelled."));
    process.exit(0);
  }
  return String(result).trim();
}

export async function promptSelect<T extends string>(
  message: string,
  options: { label?: string; value: T; hint?: string; disabled?: boolean }[],
): Promise<T> {
  const result = await select({
    message,
    options: options as unknown as Parameters<typeof select>[0]["options"],
  });
  if (isCancel(result)) {
    cancel(pc.yellow("Operation cancelled."));
    process.exit(0);
  }
  return result as T;
}
