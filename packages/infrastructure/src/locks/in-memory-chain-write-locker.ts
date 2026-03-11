import type { ChainWriteLocker } from "@superise/application";

export class InMemoryChainWriteLocker implements ChainWriteLocker {
  private readonly queues = new Map<string, Promise<unknown>>();

  async execute<T>(chain: "ckb" | "evm", task: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(chain) ?? Promise.resolve();

    let release!: () => void;
    const next = new Promise<void>((resolvePromise) => {
      release = resolvePromise;
    });
    this.queues.set(chain, previous.catch(() => undefined).then(() => next));

    await previous.catch(() => undefined);
    try {
      return await task();
    } finally {
      release();
    }
  }
}
