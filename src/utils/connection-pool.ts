// Connection Pool - Manage and reuse connections for providers
import { LRUCache } from "../utils/perf.js";

export interface PooledConnection {
  id: string;
  provider: string;
  createdAt: number;
  lastUsed: number;
  inUse: boolean;
  metadata?: Record<string, unknown>;
}

export interface ConnectionPoolConfig {
  maxConnections: number;
  maxIdleTimeMs: number;
  minConnections: number;
  acquireTimeoutMs: number;
}

const DEFAULT_CONFIG: ConnectionPoolConfig = {
  maxConnections: 20,
  maxIdleTimeMs: 300000, // 5 minutes
  minConnections: 2,
  acquireTimeoutMs: 10000,
};

// Pool storage
const POOL_CACHE_SIZE = 100;
const connectionPools = new LRUCache<string, PooledConnection[]>(POOL_CACHE_SIZE);

// Current config
let config: ConnectionPoolConfig = { ...DEFAULT_CONFIG };

// Update config
export function setConnectionPoolConfig(newConfig: Partial<ConnectionPoolConfig>): void {
  config = { ...config, ...newConfig };
}

export function getConnectionPoolConfig(): ConnectionPoolConfig {
  return { ...config };
}

// Create a new connection
export function createConnection(poolId: string, provider: string, metadata?: Record<string, unknown>): PooledConnection {
  const conn: PooledConnection = {
    id: `${poolId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    provider,
    createdAt: Date.now(),
    lastUsed: Date.now(),
    inUse: false,
    metadata,
  };
  
  let pool = connectionPools.get(poolId) || [];
  pool.push(conn);
  connectionPools.set(poolId, pool);
  
  return conn;
}

// Acquire a connection (mark as in use)
export function acquireConnection(poolId: string): PooledConnection | null {
  const pool = connectionPools.get(poolId);
  if (!pool) {
    return null;
  }
  
  // Find available connection
  for (const conn of pool) {
    if (!conn.inUse && isConnectionHealthy(conn)) {
      conn.inUse = true;
      conn.lastUsed = Date.now();
      return { ...conn }; // Return copy
    }
  }
  
  // Create new if under limit
  if (pool.length < config.maxConnections) {
    return createConnection(poolId, poolId);
  }
  
  return null; // Pool exhausted
}

// Release a connection (mark as available)
export function releaseConnection(poolId: string, connectionId: string): boolean {
  const pool = connectionPools.get(poolId);
  if (!pool) {
    return false;
  }
  
  for (const conn of pool) {
    if (conn.id === connectionId) {
      conn.inUse = false;
      conn.lastUsed = Date.now();
      return true;
    }
  }
  
  return false;
}

// Remove a connection
export function removeConnection(poolId: string, connectionId: string): boolean {
  const pool = connectionPools.get(poolId);
  if (!pool) {
    return false;
  }
  
  const index = pool.findIndex(c => c.id === connectionId);
  if (index >= 0) {
    pool.splice(index, 1);
    connectionPools.set(poolId, pool);
    return true;
  }
  
  return false;
}

// Check if connection is healthy
function isConnectionHealthy(conn: PooledConnection): boolean {
  const now = Date.now();
  const idleTime = now - conn.lastUsed;
  return idleTime < config.maxIdleTimeMs;
}

// Clean up idle connections
export function cleanupIdleConnections(poolId: string): number {
  const pool = connectionPools.get(poolId);
  if (!pool) {
    return 0;
  }
  
  let cleaned = 0;
  const remaining: PooledConnection[] = [];
  
  for (const conn of pool) {
    if (!conn.inUse && !isConnectionHealthy(conn)) {
      cleaned++;
    } else {
      remaining.push(conn);
    }
  }
  
  connectionPools.set(poolId, remaining);
  return cleaned;
}

// Clean up all pools
export function cleanupAllPools(): Map<string, number> {
  const results = new Map<string, number>();
  
  for (const [poolId] of connectionPools.entries()) {
    const cleaned = cleanupIdleConnections(poolId);
    if (cleaned > 0) {
      results.set(poolId, cleaned);
    }
  }
  
  return results;
}

// Get pool stats
export function getPoolStats(poolId: string): { total: number; inUse: number; available: number } | null {
  const pool = connectionPools.get(poolId);
  if (!pool) {
    return null;
  }
  
  const inUse = pool.filter(c => c.inUse).length;
  
  return {
    total: pool.length,
    inUse,
    available: pool.length - inUse,
  };
}

// Get all pool stats
export function getAllPoolStats(): Map<string, { total: number; inUse: number; available: number }> {
  const stats = new Map<string, { total: number; inUse: number; available: number }>();
  
  for (const [poolId, pool] of connectionPools.entries()) {
    const inUse = pool.filter(c => c.inUse).length;
    stats.set(poolId, {
      total: pool.length,
      inUse,
      available: pool.length - inUse,
    });
  }
  
  return stats;
}

// Clear a pool
export function clearPool(poolId: string): void {
  connectionPools.delete(poolId);
}

// Clear all pools
export function clearAllPools(): void {
  connectionPools.clear();
}
