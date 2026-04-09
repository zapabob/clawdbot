// Config I/O Performance Optimizations
import { LRUCache, memoize } from "../utils/perf.js";
import type { ConfigFileSnapshot } from "./types.js";

// Cache for config file snapshots
const CONFIG_CACHE_SIZE = 20;
const configSnapshotCache = new LRUCache<string, ConfigFileSnapshot>(CONFIG_CACHE_SIZE);

// Cache key generator
function getConfigCacheKey(path: string, hash?: string): string {
  return hash ? `config:${path}:${hash}` : `config:${path}`;
}

// Memoized config read - reduces repeated file I/O
export const memoizedReadConfig = memoize(async function readConfigCached(
  path: string,
): Promise<ConfigFileSnapshot> {
  const key = getConfigCacheKey(path);
  const cached = configSnapshotCache.get(key);
  if (cached) {
    return cached;
  }
  // Original logic would be called here
  // For now, just return a placeholder - actual implementation would call the original
  throw new Error("Not implemented - integrate with actual config reading");
}, (path: string) => getConfigCacheKey(path));

// Clear config cache
export function clearConfigCache(): void {
  configSnapshotCache.clear();
}

// Get cache stats
export function getConfigCacheStats(): { size: number; maxSize: number } {
  return {
    size: configSnapshotCache.size,
    maxSize: CONFIG_CACHE_SIZE,
  };
}
