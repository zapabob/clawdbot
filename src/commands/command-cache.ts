// Command Handler Cache - Cache for command execution results
import { LRUCache } from "../utils/perf.js";

const COMMAND_CACHE_SIZE = 50;

interface CommandResult {
  result: unknown;
  timestamp: number;
  ttl?: number;
}

const commandCache = new LRUCache<string, CommandResult>(COMMAND_CACHE_SIZE);

export function getCachedCommandResult(key: string): unknown | undefined {
  const entry = commandCache.get(key);
  if (!entry) return undefined;
  
  if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
    commandCache.delete(key);
    return undefined;
  }
  
  return entry.result;
}

export function setCachedCommandResult(
  key: string,
  result: unknown,
  ttlMs?: number,
): void {
  commandCache.set(key, { result, timestamp: Date.now(), ttl: ttlMs });
}

export function generateCommandCacheKey(
  command: string,
  args: unknown[],
): string {
  return `cmd:${command}:${JSON.stringify(args).slice(0, 100)}`;
}

export function clearCommandCache(): void {
  commandCache.clear();
}

export function getCommandCacheStats(): { size: number; maxSize: number } {
  return { size: commandCache.size, maxSize: COMMAND_CACHE_SIZE };
}