// Model Response Cache - Caches LLM responses
import { LRUCache } from "../utils/perf.js";

export interface ModelRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

export interface ModelResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const MODEL_CACHE_MAX_SIZE = Number(process.env.OPENCLAW_MODEL_CACHE_SIZE) || 200;

export const modelResponseCache = new LRUCache<string, ModelResponse>(MODEL_CACHE_MAX_SIZE);

function hashRequest(req: ModelRequest): string {
  const data = JSON.stringify({
    model: req.model,
    messages: req.messages,
    temperature: req.temperature,
    maxTokens: req.maxTokens,
  });
  // Simple hash - in production use crypto
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `model:${hash}`;
}

export function getCachedResponse(req: ModelRequest): ModelResponse | undefined {
  return modelResponseCache.get(hashRequest(req));
}

export function cacheResponse(req: ModelRequest, res: ModelResponse): void {
  modelResponseCache.set(hashRequest(req), res);
}

export function clearModelCache(): void {
  modelResponseCache.clear();
}

// Get cache stats for monitoring
export function getCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: number;
} {
  return {
    size: modelResponseCache.size,
    maxSize: MODEL_CACHE_MAX_SIZE,
    hitRate: 0, // Would need tracking
  };
}
