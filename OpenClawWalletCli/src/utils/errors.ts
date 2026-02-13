import pc from "picocolors";

export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function reportError(err: unknown): void {
  const message = toErrorMessage(err);
  console.error(pc.red(message));
}
