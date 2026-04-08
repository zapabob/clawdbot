// Model Catalog Cache - Optimized wrapper for loadModelCatalog
import type { OpenClawConfig } from "../../config/config.js";
import { LRUCache, memoize } from "../../utils/perf.js";
import type { ModelCatalogEntry } from "./model-catalog.js";
import { loadModelCatalog } from "./model-catalog.js";

// Cross-session cache for model catalog (survives session resets)
const MODEL_CATALOG_CACHE_SIZE = 5;
const modelCatalogCache = new LRUCache<string, ModelCatalogEntry[]>(MODEL_CATALOG_CACHE_SIZE);

// Cache key based on config hash or timestamp
function getModelCatalogCacheKey(config?: unknown): string {
  const configStr = config ? JSON.stringify(config) : "default";
  let hash = 0;
  for (let i = 0; i < configStr.length; i++) {
    const char = configStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `model-catalog:${hash}`;
}

// Memoized loader with cross-session caching
export const loadModelCatalogCached = memoize(
  async function loadModelCatalogCachedFn(params?: {
    config?: OpenClawConfig;
    useCache?: boolean;
  }): Promise<ModelCatalogEntry[]> {
    const cacheKey = getModelCatalogCacheKey(params?.config);

    // Check cache first
    const cached = modelCatalogCache.get(cacheKey);
    if (cached && params?.useCache !== false) {
      return cached;
    }

    // Load from source
    const result = await loadModelCatalog(params);

    // Cache the result
    modelCatalogCache.set(cacheKey, result);

    return result;
  },
  // Custom key function for memoize
  (params?: { config?: unknown; useCache?: boolean }) => getModelCatalogCacheKey(params?.config),
);

// Clear model catalog cache
export function clearModelCatalogCache(): void {
  modelCatalogCache.clear();
}

// Get model catalog cache stats
export function getModelCatalogCacheStats(): {
  size: number;
  maxSize: number;
} {
  return {
    size: modelCatalogCache.size,
    maxSize: MODEL_CATALOG_CACHE_SIZE,
  };
}
