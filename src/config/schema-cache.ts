// Schema Cache - Cache for validation schemas
import { LRUCache } from "../utils/perf.js";

const SCHEMA_CACHE_SIZE = 30;
const schemaCache = new LRUCache<string, unknown>(SCHEMA_CACHE_SIZE);

export function getCachedSchema<T = unknown>(key: string): T | undefined {
  return schemaCache.get(key) as T | undefined;
}

export function cacheSchema<T = unknown>(key: string, schema: T): void {
  schemaCache.set(key, schema as unknown);
}

export function clearSchemaCache(): void {
  schemaCache.clear();
}

export function getSchemaCacheStats(): { size: number; maxSize: number } {
  return { size: schemaCache.size, maxSize: SCHEMA_CACHE_SIZE };
}