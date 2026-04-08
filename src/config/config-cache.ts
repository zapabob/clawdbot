// Config loading optimization with caching
import { LRUCache, memoize } from "../utils/perf.js";
import type { OpenClawConfig, ConfigFileSnapshot } from "./types.js";
import { readConfigFileSnapshot, loadConfig } from "./config.js";

// Cache for config snapshots (thread-safe)
const CONFIG_SNAPSHOT_CACHE_SIZE = 15;
const configSnapshotCache = new LRUCache<string, ConfigFileSnapshot>(CONFIG_SNAPSHOT_CACHE_SIZE);

// Cache for resolved config (runtime)
const RUNTIME_CONFIG_CACHE_SIZE = 10;
const runtimeConfigCache = new LRUCache<string, OpenClawConfig>(RUNTIME_CONFIG_CACHE_SIZE);

// Generate cache key based on path
function getConfigCacheKey(path: string): string {
  // Use basename as key for simplicity
  return path.split(/[/\\]/).pop() || path;
}

// Memoized config snapshot reader
export const getConfigSnapshotCached = memoize(
  async function getConfigSnapshotCachedFn(
    configPath?: string,
  ): Promise<ConfigFileSnapshot> {
    const key = getConfigCacheKey(configPath || "default");
    const cached = configSnapshotCache.get(key);
    if (cached) {
      return cached;
    }
    const snapshot = await readConfigFileSnapshot(configPath);
    configSnapshotCache.set(key, snapshot);
    return snapshot;
  },
  (configPath?: string) => getConfigCacheKey(configPath || "default"),
);

// Memoized full config loader
export const getConfigCached = memoize(
  async function getConfigCachedFn(): Promise<OpenClawConfig> {
    const key = "runtime-config";
    const cached = runtimeConfigCache.get(key);
    if (cached) {
      return cached;
    }
    const config = await loadConfig();
    runtimeConfigCache.set(key, config);
    return config;
  },
  () => "runtime-config",
);

// Clear all config caches
export function clearConfigCaches(): void {
  configSnapshotCache.clear();
  runtimeConfigCache.clear();
}

// Get cache statistics
export function getConfigCacheStats(): {
  snapshot: { size: number; maxSize: number };
  runtime: { size: number; maxSize: number };
} {
  return {
    snapshot: { size: configSnapshotCache.size, maxSize: CONFIG_SNAPSHOT_CACHE_SIZE },
    runtime: { size: runtimeConfigCache.size, maxSize: RUNTIME_CONFIG_CACHE_SIZE },
  };
}