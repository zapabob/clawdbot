// Streaming Optimizer - Batch streaming writes for reduced overhead
import { LRUCache } from "../utils/perf.js";

export interface StreamBatchConfig {
  minBatchSize: number;
  maxBatchSize: number;
  flushIntervalMs: number;
  maxPendingBytes: number;
}

const DEFAULT_CONFIG: StreamBatchConfig = {
  minBatchSize: 3,
  maxBatchSize: 10,
  flushIntervalMs: 50,
  maxPendingBytes: 4096,
};

export interface StreamChunk {
  data: string;
  timestamp: number;
  size: number;
}

export interface StreamBatch {
  chunks: string[];
  totalSize: number;
  createdAt: number;
}

// Active stream batches
const BATCH_CACHE_SIZE = 50;
const batchCache = new LRUCache<string, StreamBatch>(BATCH_CACHE_SIZE);

let config: StreamBatchConfig = { ...DEFAULT_CONFIG };
let flushInterval: ReturnType<typeof setInterval> | null = null;

// Update config
export function setStreamBatchConfig(newConfig: Partial<StreamBatchConfig>): void {
  config = { ...config, ...newConfig };
}

export function getStreamBatchConfig(): StreamBatchConfig {
  return { ...config };
}

// Add chunk to batch
export function addToStreamBatch(streamId: string, data: string): StreamBatch | null {
  const size = Buffer.byteLength(data, "utf-8");
  const _chunk: StreamChunk = { data, timestamp: Date.now(), size };

  let batch = batchCache.get(streamId);

  if (!batch) {
    batch = { chunks: [], totalSize: 0, createdAt: Date.now() };
  }

  batch.chunks.push(data);
  batch.totalSize += size;
  batchCache.set(streamId, batch);

  // Check if we should flush
  if (batch.chunks.length >= config.minBatchSize || batch.totalSize >= config.maxPendingBytes) {
    return flushStreamBatch(streamId);
  }

  return null; // Not ready yet
}

// Flush a specific batch
export function flushStreamBatch(streamId: string): StreamBatch | null {
  const batch = batchCache.get(streamId);
  if (!batch) {
    return null;
  }
  if (batch.chunks.length === 0) {
    return null;
  }

  const flushedBatch: StreamBatch = {
    chunks: [...batch.chunks],
    totalSize: batch.totalSize,
    createdAt: batch.createdAt,
  };

  // Reset batch
  batch.chunks = [];
  batch.totalSize = 0;
  batchCache.set(streamId, batch);

  return flushedBatch;
}

// Flush all pending batches
export function flushAllBatches(): Map<string, StreamBatch> {
  const results = new Map<string, StreamBatch>();

  for (const [streamId, batch] of batchCache.entries()) {
    if (batch.chunks.length > 0) {
      results.set(streamId, flushStreamBatch(streamId)!);
    }
  }

  return results;
}

// Get pending batch info
export function getPendingBatchInfo(
  streamId: string,
): { chunkCount: number; totalBytes: number } | null {
  const batch = batchCache.get(streamId);
  if (!batch) {
    return null;
  }

  return {
    chunkCount: batch.chunks.length,
    totalBytes: batch.totalSize,
  };
}

// Clear a stream batch
export function clearStreamBatch(streamId: string): void {
  batchCache.delete(streamId);
}

// Clear all batches
export function clearAllBatches(): void {
  batchCache.clear();
}

// Start background flush timer
export function startBatchFlushTimer(): void {
  if (flushInterval) {
    return;
  }

  flushInterval = setInterval(() => {
    flushAllBatches();
  }, config.flushIntervalMs);
}

// Stop background flush timer
export function stopBatchFlushTimer(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}

// Get batch cache stats
export function getBatchStats(): { activeStreams: number; maxStreams: number } {
  return {
    activeStreams: batchCache.size,
    maxStreams: BATCH_CACHE_SIZE,
  };
}
