import type { SessionEntry } from "../../config/sessions.js";
// Session Store Cache - LRU cache for session stores
import { LRUCache } from "../../utils/perf.js";

const SESSION_STORE_CACHE_SIZE = Number(process.env.OPENCLAW_SESSION_CACHE_SIZE) || 50;

// LRU cache for session stores (keyed by store path)
const sessionStoreCache = new LRUCache<string, Record<string, SessionEntry>>(
  SESSION_STORE_CACHE_SIZE,
);

export function getCachedSessionStore(storePath: string): Record<string, SessionEntry> | undefined {
  return sessionStoreCache.get(storePath);
}

export function cacheSessionStore(storePath: string, store: Record<string, SessionEntry>): void {
  sessionStoreCache.set(storePath, store);
}

export function clearSessionStoreCache(): void {
  sessionStoreCache.clear();
}

export function getSessionStoreCacheStats(): { size: number; maxSize: number } {
  return {
    size: sessionStoreCache.size,
    maxSize: SESSION_STORE_CACHE_SIZE,
  };
}
