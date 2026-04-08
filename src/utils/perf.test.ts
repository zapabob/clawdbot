import { describe, it, expect } from "vitest";
import { LRUCache, LazyLoader, memoize } from "./perf.js";

describe("LRUCache", () => {
  it("should store and retrieve values", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBe(2);
  });

  it("should evict oldest when full", () => {
    const cache = new LRUCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3); // Should evict 'a'
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
  });

  it("should update existing key", () => {
    const cache = new LRUCache<string, number>(2);
    cache.set("a", 1);
    cache.set("a", 2);
    expect(cache.get("a")).toBe(2);
  });
});

describe("LazyLoader", () => {
  it("should load only when accessed", () => {
    let loaded = false;
    const loader = new LazyLoader(() => {
      loaded = true;
      return 42;
    });
    expect(loaded).toBe(false);
    const value = loader.get();
    expect(loaded).toBe(true);
    expect(value).toBe(42);
  });

  it("should cache after first load", () => {
    let callCount = 0;
    const loader = new LazyLoader(() => {
      callCount++;
      return callCount;
    });
    expect(loader.get()).toBe(1);
    expect(loader.get()).toBe(1);
    expect(callCount).toBe(1);
  });
});

describe("memoize", () => {
  it("should memoize function results", () => {
    let callCount = 0;
    const fn = (x: number) => {
      callCount++;
      return x * 2;
    };
    const cache = new LRUCache<string, unknown>(10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memoized = memoize(fn as any, cache);

    expect(memoized(5)).toBe(10);
    expect(callCount).toBe(1);
    expect(memoized(5)).toBe(10);
    expect(callCount).toBe(1); // Cached
  });
});
