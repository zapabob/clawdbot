// Provider Response Cache - Hash-based caching for AI model responses
import { LRUCache } from "../../utils/perf.js";
import crypto from "node:crypto";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

const PROVIDER_CACHE_SIZE = 100;
const providerCache = new LRUCache<string, CacheEntry<unknown>>(PROVIDER_CACHE_SIZE);

// Generate hash key from request parameters
export function generateCacheKey(
  provider: string,
  model: string,
  messages: unknown,
  options?: unknown,
): string {
  const payload = JSON.stringify({ provider, model, messages, options });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

// Get cached response
export function getCachedResponse<T>(key: string): T | undefined {
  const entry = providerCache.get(key);
  if (!entry) return undefined;
  
  // Check TTL
  if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
    providerCache.delete(key);
    return undefined;
  }
  
  return entry.data as T;
}

// Set cached response
export function setCachedResponse<T>(
  key: string,
  data: T,
  ttlMs?: number,
): void {
  providerCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

// Clear provider cache
export function clearProviderCache(): void {
  providerCache.clear();
}

// Get cache stats
export function getProviderCacheStats(): { size: number; maxSize: number } {
  return { size: providerCache.size, maxSize: PROVIDER_CACHE_SIZE };
}