// Zombie Prevention - Monitor and clean up zombie/stuck processes
import { LRUCache } from "../utils/perf.js";

export interface ProcessInfo {
  pid: number;
  command: string;
  startedAt: number;
  lastHeartbeat: number;
  stuckCount: number;
}

export interface ZombiePreventionConfig {
  heartbeatTimeoutMs: number;
  maxStuckCount: number;
  checkIntervalMs: number;
  killOnStuck: boolean;
}

const DEFAULT_CONFIG: ZombiePreventionConfig = {
  heartbeatTimeoutMs: 60000, // 1 minute without heartbeat = stuck
  maxStuckCount: 3, // Kill after 3 consecutive stuck detections
  checkIntervalMs: 30000, // Check every 30 seconds
  killOnStuck: true,
};

// Active process tracking
const PROCESS_CACHE_SIZE = 100;
const processCache = new LRUCache<number, ProcessInfo>(PROCESS_CACHE_SIZE);

let config: ZombiePreventionConfig = { ...DEFAULT_CONFIG };
let checkInterval: ReturnType<typeof setInterval> | null = null;

// Update config
export function setZombiePreventionConfig(newConfig: Partial<ZombiePreventionConfig>): void {
  config = { ...config, ...newConfig };
}

// Get current config
export function getZombiePreventionConfig(): ZombiePreventionConfig {
  return { ...config };
}

// Register a process
export function registerProcess(pid: number, command: string): void {
  processCache.set(pid, {
    pid,
    command,
    startedAt: Date.now(),
    lastHeartbeat: Date.now(),
    stuckCount: 0,
  });
}

// Update heartbeat for a process
export function heartbeatProcess(pid: number): void {
  const processInfo = processCache.get(pid);
  if (processInfo) {
    processInfo.lastHeartbeat = Date.now();
    processInfo.stuckCount = 0;
    processCache.set(pid, processInfo);
  }
}

// Unregister a process (normal exit)
export function unregisterProcess(pid: number): void {
  processCache.delete(pid);
}

// Get stuck processes
export function getStuckProcesses(): ProcessInfo[] {
  const now = Date.now();
  const stuck: ProcessInfo[] = [];
  
  for (const [pid, info] of processCache.entries()) {
    const timeSinceHeartbeat = now - info.lastHeartbeat;
    if (timeSinceHeartbeat > config.heartbeatTimeoutMs) {
      info.stuckCount += 1;
      processCache.set(pid, info);
      
      if (info.stuckCount >= config.maxStuckCount) {
        stuck.push(info);
      }
    }
  }
  
  return stuck;
}

// Check all processes and optionally kill stuck ones
export function checkAndCleanProcesses(): {
  stuck: ProcessInfo[];
  killed: number[];
} {
  const stuck = getStuckProcesses();
  const killed: number[] = [];
  
  if (config.killOnStuck && stuck.length > 0) {
    for (const processInfo of stuck) {
      try {
        process.kill(processInfo.pid, "SIGKILL");
        killed.push(processInfo.pid);
        processCache.delete(processInfo.pid);
      } catch (err) {
        console.warn(
          `[zombie-prevention] Failed to kill stuck process ${processInfo.pid}:`,
          err,
        );
      }
    }
  }
  
  return { stuck, killed };
}

// Start the zombie prevention monitor
export function startZombiePreventionMonitor(): void {
  if (checkInterval) {
    return;
  }
  
  checkInterval = setInterval(() => {
    const result = checkAndCleanProcesses();
    if (result.killed.length > 0) {
      console.log(`[zombie-prevention] Killed ${result.killed.length} stuck processes`);
    }
  }, config.checkIntervalMs);
}

// Stop the zombie prevention monitor
export function stopZombiePreventionMonitor(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

// Get process count
export function getProcessCount(): number {
  return processCache.size;
}

// Get all tracked processes
export function getAllProcesses(): ProcessInfo[] {
  return Array.from(processCache.values());
}

// Clear all tracked processes
export function clearAllProcesses(): void {
  processCache.clear();
}

// Get cache stats
export function getZombiePreventionStats(): { size: number; maxSize: number } {
  return {
    size: processCache.size,
    maxSize: PROCESS_CACHE_SIZE,
  };
}
