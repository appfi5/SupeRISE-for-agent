import type { AssetLimitLocker } from "@superise/application";

export class InMemoryAssetLimitLocker implements AssetLimitLocker {
  private readonly queues = new Map<string, Promise<unknown>>();

  async execute<T>(key: string, task: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(key) ?? Promise.resolve();

    let release!: () => void;
    const next = new Promise<void>((resolvePromise) => {
      release = resolvePromise;
    });
    this.queues.set(key, previous.catch(() => undefined).then(() => next));

    await previous.catch(() => undefined);
    try {
      return await task();
    } finally {
      release();
    }
  }
}
