/**
 * self-metrics.ts
 * Real metric telemetry for the self-improvement engine.
 * Collects LLM call latency, error rates, and task completion from invocation hooks.
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveOpenClawAgentDir } from "./agent-paths.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LlmCallRecord {
  timestamp: number;
  /** Duration of the LLM call in milliseconds */
  durationMs: number;
  /** Whether the call completed without an API error */
  success: boolean;
  /** Whether the downstream task was judged complete (e.g. tool returned ok) */
  taskCompleted: boolean;
  /** Provider/model string e.g. "openai-codex/gpt-5.2" */
  model: string;
}

export interface AgentMetrics {
  /** Arithmetic mean of recent call durations (ms) */
  avgResponseTimeMs: number;
  /** Fraction of calls that returned an error [0, 1] */
  errorRate: number;
  /** Fraction of calls where the downstream task completed [0, 1] */
  taskCompletionRate: number;
  /** Heap memory usage as a fraction of rss [0, 1] */
  memoryPressure: number;
  /** Number of records used to compute these metrics */
  sampleSize: number;
  /** Unix timestamp of last update */
  lastUpdatedAt: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLLING_WINDOW = 100; // max records kept in-memory and on disk
const METRICS_FILENAME = "metrics.json";

// ---------------------------------------------------------------------------
// MetricsCollector
// ---------------------------------------------------------------------------

export class MetricsCollector {
  private records: LlmCallRecord[] = [];
  private metricsPath: string;

  constructor(agentDir?: string) {
    const dir = agentDir ?? resolveOpenClawAgentDir();
    this.metricsPath = path.join(dir, METRICS_FILENAME);
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Record a single LLM call outcome. Call this from any invocation hook. */
  record(entry: Omit<LlmCallRecord, "timestamp">): void {
    this.records.push({ timestamp: Date.now(), ...entry });
    if (this.records.length > ROLLING_WINDOW) {
      this.records.splice(0, this.records.length - ROLLING_WINDOW);
    }
  }

  /** Compute aggregate metrics from recent records. */
  compute(): AgentMetrics {
    const mem = process.memoryUsage();
    const memoryPressure = mem.heapUsed / (mem.heapTotal || 1);

    if (this.records.length === 0) {
      return {
        avgResponseTimeMs: 0,
        errorRate: 0,
        taskCompletionRate: 1,
        memoryPressure,
        sampleSize: 0,
        lastUpdatedAt: Date.now(),
      };
    }

    const n = this.records.length;
    const totalDuration = this.records.reduce((s, r) => s + r.durationMs, 0);
    const errorCount = this.records.filter((r) => !r.success).length;
    const completedCount = this.records.filter((r) => r.taskCompleted).length;

    return {
      avgResponseTimeMs: totalDuration / n,
      errorRate: errorCount / n,
      taskCompletionRate: completedCount / n,
      memoryPressure,
      sampleSize: n,
      lastUpdatedAt: Date.now(),
    };
  }

  /** Persist the rolling window to disk (fire-and-forget safe). */
  async persist(): Promise<void> {
    try {
      const dir = path.dirname(this.metricsPath);
      await fs.mkdir(dir, { recursive: true, mode: 0o700 });
      const payload = { records: this.records.slice(-ROLLING_WINDOW) };
      await fs.writeFile(this.metricsPath, JSON.stringify(payload, null, 2), {
        mode: 0o600,
      });
    } catch {
      // Non-fatal: metrics collection must never crash the host process
    }
  }

  /** Load persisted records from disk on startup. */
  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.metricsPath, "utf8");
      const parsed = JSON.parse(raw) as { records?: LlmCallRecord[] };
      if (Array.isArray(parsed.records)) {
        this.records = parsed.records.slice(-ROLLING_WINDOW);
      }
    } catch {
      // First run or file missing — start fresh
    }
  }

  getRecords(): Readonly<LlmCallRecord[]> {
    return this.records;
  }
}

// ---------------------------------------------------------------------------
// System-level metrics helpers (no LLM dependency)
// ---------------------------------------------------------------------------

export interface SystemSnapshot {
  /** Free memory as a fraction of total [0, 1] — higher is better */
  freeMemoryRatio: number;
  /** Average CPU load fraction (1-min) — lower is better */
  cpuLoad1m: number;
  /** Available disk fraction at the agent directory — higher is better */
  freeDiskRatio: number;
}

export async function captureSystemSnapshot(agentDir?: string): Promise<SystemSnapshot> {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const cpuLoad1m = os.loadavg()[0] / os.cpus().length;

  let freeDiskRatio = 1;
  try {
    const dir = agentDir ?? resolveOpenClawAgentDir();
    const stat = await fs.statfs(dir);
    freeDiskRatio = stat.bfree / (stat.blocks || 1);
  } catch {
    // statfs may not be available on all platforms — default to 1 (healthy)
  }

  return {
    freeMemoryRatio: freeMem / totalMem,
    cpuLoad1m,
    freeDiskRatio,
  };
}

// ---------------------------------------------------------------------------
// Singleton collector (shared across the process)
// ---------------------------------------------------------------------------

let _shared: MetricsCollector | null = null;

export function getSharedMetricsCollector(): MetricsCollector {
  if (!_shared) {
    _shared = new MetricsCollector();
  }
  return _shared;
}
