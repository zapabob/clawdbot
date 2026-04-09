// Performance Optimization Utilities
// Cache + Lazy Load + Parallel Processing

import { EventEmitter } from "node:events";

// === LRU Cache ===
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  constructor(private maxSize: number = 100) {}

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value === undefined) {
      return undefined;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.delete(key);
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }

  values(): IterableIterator<V> {
    return this.cache.values();
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  get capacity(): number {
    return this.maxSize;
  }
}

// === Lazy Loader ===
export class LazyLoader<T> {
  private loader: (() => T) | null = null;
  private instance: T | null = null;
  private loading = false;

  constructor(private loadFn: () => T) {
    this.loader = loadFn;
  }

  get(): T {
    if (this.instance === null && !this.loading && this.loader) {
      this.loading = true;
      this.instance = this.loader();
      this.loader = null;
      this.loading = false;
    }
    return this.instance as T;
  }

  reset(): void {
    this.instance = null;
    this.loading = false;
  }
}

// === Async Parallel Runner ===
export async function parallel<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = 4,
): Promise<T[]> {
  const results: T[] = [];
  const running: Promise<unknown>[] = [];

  for (const task of tasks) {
    const p = (async () => {
      const r = await task();
      results.push(r);
    })();
    running.push(p);

    if (running.length >= concurrency) {
      // Wait for any to complete
      await Promise.race(running);
    }
  }

  await Promise.all(running);
  return results;
}

// === Debouncer ===
export class Debouncer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(private delayMs: number = 100) {}

  debounce<T extends (...args: unknown[]) => unknown>(fn: T): T {
    return ((...args: unknown[]) => {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => fn(...args), this.delayMs);
    }) as T;
  }
}

// === Memoize ===
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  cache: LRUCache<string, TResult>,
): (...args: TArgs) => TResult;
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  keyFn: (...args: TArgs) => string,
): (...args: TArgs) => TResult;
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  cacheOrKeyFn: LRUCache<string, TResult> | ((...args: TArgs) => string),
): (...args: TArgs) => TResult {
  const cache =
    typeof cacheOrKeyFn === "function" ? new LRUCache<string, TResult>(100) : cacheOrKeyFn;
  const keyFn =
    typeof cacheOrKeyFn === "function" ? cacheOrKeyFn : (...args: TArgs) => JSON.stringify(args);

  return (...args: TArgs): TResult => {
    const key = keyFn(...args);
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// === Event Emitter with Throttle ===
export class ThrottledEmitter extends EventEmitter {
  private throttleTimers = new Map<string, ReturnType<typeof setTimeout>>();

  throttleEmit(event: string, ...args: unknown[]): void {
    const key = event;
    if (this.throttleTimers.has(key)) {
      return;
    }

    this.emit(event, ...args);
    this.throttleTimers.set(
      key,
      setTimeout(() => this.throttleTimers.delete(key), 100),
    );
  }
}
