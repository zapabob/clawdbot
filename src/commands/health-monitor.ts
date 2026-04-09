// Health Monitor - Auto-restart on performance degradation detection
import { LRUCache } from "../utils/perf.js";

export interface HealthMetrics {
  timestamp: number;
  responseTimeMs: number;
  memoryUsageMb: number;
  cpuPercent: number;
  activeSessions: number;
}

export interface HealthThreshold {
  maxResponseTimeMs: number;
  maxMemoryMb: number;
  maxCpuPercent: number;
  minSessions: number;
  restartOnConsecutiveFailures: number;
}

const DEFAULT_THRESHOLDS: HealthThreshold = {
  maxResponseTimeMs: 5000,
  maxMemoryMb: 2048,
  maxCpuPercent: 90,
  minSessions: 0,
  restartOnConsecutiveFailures: 3,
};

// Health history for trend analysis
const HEALTH_HISTORY_SIZE = 20;
const healthHistoryCache = new LRUCache<string, HealthMetrics[]>(HEALTH_HISTORY_SIZE);

// Current health state
let consecutiveFailures = 0;
let isRestartInProgress = false;

// Get health threshold
export function getHealthThreshold(): HealthThreshold {
  return {
    ...DEFAULT_THRESHOLDS,
    maxResponseTimeMs:
      Number(process.env.OPENCLAW_HEALTH_MAX_RESPONSE_MS) || DEFAULT_THRESHOLDS.maxResponseTimeMs,
    maxMemoryMb:
      Number(process.env.OPENCLAW_HEALTH_MAX_MEMORY_MB) || DEFAULT_THRESHOLDS.maxMemoryMb,
    maxCpuPercent:
      Number(process.env.OPENCLAW_HEALTH_MAX_CPU_PERCENT) || DEFAULT_THRESHOLDS.maxCpuPercent,
    restartOnConsecutiveFailures:
      Number(process.env.OPENCLAW_HEALTH_RESTART_THRESHOLD) ||
      DEFAULT_THRESHOLDS.restartOnConsecutiveFailures,
  };
}

// Record health metric
export function recordHealthMetric(key: string, metrics: HealthMetrics): void {
  const history = healthHistoryCache.get(key) || [];
  history.push(metrics);
  if (history.length > HEALTH_HISTORY_SIZE) {
    history.shift();
  }
  healthHistoryCache.set(key, history);
}

// Check health status
export function checkHealthStatus(key: string): {
  healthy: boolean;
  issues: string[];
  shouldRestart: boolean;
} {
  const history = healthHistoryCache.get(key);
  if (!history || history.length === 0) {
    return { healthy: true, issues: [], shouldRestart: false };
  }

  const threshold = getHealthThreshold();
  const issues: string[] = [];
  let failedChecks = 0;

  // Check recent metrics
  for (const metrics of history.slice(-5)) {
    if (metrics.responseTimeMs > threshold.maxResponseTimeMs) {
      issues.push(`High response time: ${metrics.responseTimeMs}ms`);
      failedChecks++;
    }
    if (metrics.memoryUsageMb > threshold.maxMemoryMb) {
      issues.push(`High memory: ${metrics.memoryUsageMb}MB`);
      failedChecks++;
    }
    if (metrics.cpuPercent > threshold.maxCpuPercent) {
      issues.push(`High CPU: ${metrics.cpuPercent}%`);
      failedChecks++;
    }
  }

  consecutiveFailures =
    failedChecks >= threshold.restartOnConsecutiveFailures ? consecutiveFailures + 1 : 0;

  const shouldRestart =
    consecutiveFailures >= threshold.restartOnConsecutiveFailures && !isRestartInProgress;

  return {
    healthy: issues.length === 0,
    issues,
    shouldRestart,
  };
}

// Mark restart as in progress
export function setRestartInProgress(inProgress: boolean): void {
  isRestartInProgress = inProgress;
  if (inProgress) {
    consecutiveFailures = 0;
  }
}

// Check if restart is in progress
export function isHealthCheckRestartInProgress(): boolean {
  return isRestartInProgress;
}

// Reset health state
export function resetHealthState(): void {
  consecutiveFailures = 0;
  isRestartInProgress = false;
  healthHistoryCache.clear();
}

// Get health cache stats
export function getHealthCacheStats(): { size: number; maxSize: number } {
  return {
    size: healthHistoryCache.size,
    maxSize: HEALTH_HISTORY_SIZE,
  };
}
