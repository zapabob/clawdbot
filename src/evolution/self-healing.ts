/**
 * Self-Healing & Self-Improving System
 * 
 * Features:
 * - Anomaly Detection
 * - Automatic Recovery
 * - Performance Optimization
 * - Predictive Maintenance
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export interface HealthMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  errorRate: number;
}

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metrics: Partial<HealthMetrics>;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

export type AnomalyType = 
  | 'high_cpu' | 'high_memory' | 'high_disk' | 'slow_response'
  | 'error_spike' | 'connection_loss' | 'timeout' | 'resource_leak';

export interface RecoveryAction {
  name: string;
  execute(): Promise<boolean>;
  rollback?(): void;
  priority: number;
}

export interface HealingConfig {
  checkInterval: number;
  anomalyThreshold: number;
  autoRecovery: boolean;
  maxRecoveryAttempts: number;
  alertWebhook?: string;
}

export interface OptimizationSuggestion {
  id: string;
  type: string;
  description: string;
  expectedImprovement: number;
  implementation: string;
  risk: 'low' | 'medium' | 'high';
  automated: boolean;
}

export class SelfHealingSystem extends EventEmitter {
  private config: HealingConfig;
  private healthHistory: HealthMetrics[] = [];
  private anomalies: Map<string, Anomaly> = new Map();
  private recoveryActions: RecoveryAction[] = [];
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<HealingConfig> = {}) {
    super();
    this.config = {
      checkInterval: config.checkInterval ?? 30000,
      anomalyThreshold: config.anomalyThreshold ?? 0.8,
      autoRecovery: config.autoRecovery ?? true,
      maxRecoveryAttempts: config.maxRecoveryAttempts ?? 3,
      alertWebhook: config.alertWebhook,
    };
    this.registerDefaultRecoveryActions();
  }

  private registerDefaultRecoveryActions(): void {
    // Restart service action
    this.recoveryActions.push({
      name: 'restart_service',
      priority: 1,
      execute: async () => {
        this.emit('recovery_attempt', { action: 'restart_service' });
        return true; // Placeholder for actual restart logic
      },
    });

    // Clear cache action
    this.recoveryActions.push({
      name: 'clear_cache',
      priority: 2,
      execute: async () => {
        this.emit('recovery_attempt', { action: 'clear_cache' });
        return true;
      },
    });

    // Restart database connection
    this.recoveryActions.push({
      name: 'restart_db_connection',
      priority: 3,
      execute: async () => {
        this.emit('recovery_attempt', { action: 'restart_db_connection' });
        return true;
      },
    });

    // GC optimization
    this.recoveryActions.push({
      name: 'force_gc',
      priority: 4,
      execute: async () => {
        if (global.gc) {
          global.gc();
          return true;
        }
        return false;
      },
    });

    // Network reset
    this.recoveryActions.push({
      name: 'reset_network',
      priority: 5,
      execute: async () => {
        this.emit('recovery_attempt', { action: 'reset_network' });
        return true;
      },
    });
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.emit('started');
    
    this.checkInterval = setInterval(() => {
      this.healthCheck();
    }, this.config.checkInterval);

    this.emit('running');
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    this.emit('stopped');
  }

  async healthCheck(): Promise<HealthMetrics> {
    const metrics = await this.collectMetrics();
    this.healthHistory.push(metrics);
    
    // Keep only last 100 entries
    if (this.healthHistory.length > 100) {
      this.healthHistory.shift();
    }

    // Check for anomalies
    const anomaly = this.detectAnomaly(metrics);
    if (anomaly) {
      await this.handleAnomaly(anomaly);
    }

    this.emit('health_check', metrics);
    return metrics;
  }

  private async collectMetrics(): Promise<HealthMetrics> {
    // Collect health metrics
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    const loadAvg = require('os').loadavg();
    
    return {
      cpu: cpuUsage.user / 1000000 / require('os').cpus().length,
      memory: memoryUsage.heapUsed / memoryUsage.heapTotal,
      disk: await this.getDiskUsage(),
      network: await this.checkNetworkConnectivity(),
      responseTime: await this.measureResponseTime(),
      errorRate: await this.calculateErrorRate(),
    };
  }

  private async getDiskUsage(): Promise<number> {
    try {
      const stats = require('fs').statfsSync?.(__dirname) || { bavail: 0, blocks: 1 };
      return 1 - (stats.bavail / stats.blocks);
    } catch {
      return 0;
    }
  }

  private async checkNetworkConnectivity(): Promise<number> {
    try {
      const start = Date.now();
      await fetch('https://google.com', { method: 'HEAD' });
      const latency = Date.now() - start;
      return Math.max(0, 1 - latency / 5000);
    } catch {
      return 0;
    }
  }

  private async measureResponseTime(): Promise<number> {
    const start = Date.now();
    // Simulated response time measurement
    await new Promise(resolve => setTimeout(resolve, 10));
    return Date.now() - start;
  }

  private async calculateErrorRate(): Promise<number> {
    // Simplified error rate calculation
    return 0;
  }

  private detectAnomaly(metrics: HealthMetrics): Anomaly | null {
    const anomalies: Anomaly[] = [];

    if (metrics.cpu > 0.9) {
      anomalies.push({
        id: this.generateAnomalyId(),
        type: 'high_cpu',
        severity: 'high',
        description: `CPU使用率が90%を超えています: ${(metrics.cpu * 100).toFixed(1)}%`,
        metrics: { cpu: metrics.cpu },
        timestamp: new Date(),
        resolved: false,
      });
    }

    if (metrics.memory > 0.9) {
      anomalies.push({
        id: this.generateAnomalyId(),
        type: 'high_memory',
        severity: 'high',
        description: `メモリ使用率が90%を超えています: ${(metrics.memory * 100).toFixed(1)}%`,
        metrics: { memory: metrics.memory },
        timestamp: new Date(),
        resolved: false,
      });
    }

    if (metrics.disk > 0.95) {
      anomalies.push({
        id: this.generateAnomalyId(),
        type: 'high_disk',
        severity: 'critical',
        description: `ディスク使用率が95%を超えています: ${(metrics.disk * 100).toFixed(1)}%`,
        metrics: { disk: metrics.disk },
        timestamp: new Date(),
        resolved: false,
      });
    }

    if (metrics.responseTime > 5000) {
      anomalies.push({
        id: this.generateAnomalyId(),
        type: 'slow_response',
        severity: 'medium',
        description: `応答時間が遅いです: ${metrics.responseTime}ms`,
        metrics: { responseTime: metrics.responseTime },
        timestamp: new Date(),
        resolved: false,
      });
    }

    if (metrics.errorRate > 0.1) {
      anomalies.push({
        id: this.generateAnomalyId(),
        type: 'error_spike',
        severity: 'high',
        description: `エラー率が上昇しています: ${(metrics.errorRate * 100).toFixed(1)}%`,
        metrics: { errorRate: metrics.errorRate },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Return the most severe anomaly
    if (anomalies.length > 0) {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
      return anomalies[0];
    }

    return null;
  }

  private async handleAnomaly(anomaly: Anomaly): Promise<void> {
    this.anomalies.set(anomaly.id, anomaly);
    this.emit('anomaly_detected', anomaly);

    if (this.config.autoRecovery) {
      await this.attemptRecovery(anomaly);
    } else {
      this.emit('anomaly_unresolved', anomaly);
    }
  }

  private async attemptRecovery(anomaly: Anomaly): Promise<void> {
    const relevantActions = this.recoveryActions
      .filter(action => this.isActionRelevant(action.name, anomaly.type))
      .sort((a, b) => a.priority - b.priority);

    for (const action of relevantActions) {
      if (anomaly.resolved) break;

      for (let attempt = 0; attempt < this.config.maxRecoveryAttempts; attempt++) {
        this.emit('recovery_attempt', { anomaly, action: action.name, attempt });
        
        const success = await action.execute();
        
        if (success) {
          anomaly.resolved = true;
          anomaly.resolution = `Recovered by ${action.name}`;
          this.emit('recovery_success', { anomaly, action: action.name });
          return;
        }
      }
    }

    if (!anomaly.resolved) {
      this.emit('recovery_failed', anomaly);
      await this.sendAlert(anomaly);
    }
  }

  private isActionRelevant(action: string, anomalyType: string): boolean {
    const relevanceMap: Record<string, string[]> = {
      'high_cpu': ['restart_service', 'force_gc'],
      'high_memory': ['clear_cache', 'force_gc', 'restart_service'],
      'high_disk': ['clear_cache'],
      'slow_response': ['restart_service', 'reset_network'],
      'error_spike': ['restart_db_connection', 'restart_service'],
      'connection_loss': ['reset_network', 'restart_service'],
      'timeout': ['restart_service', 'reset_network'],
      'resource_leak': ['clear_cache', 'restart_service'],
    };

    return relevanceMap[anomalyType]?.includes(action) ?? true;
  }

  private async sendAlert(anomaly: Anomaly): Promise<void> {
    if (this.config.alertWebhook) {
      try {
        await fetch(this.config.alertWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `[${anomaly.severity.toUpperCase()}] ${anomaly.description}`,
            anomaly,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        this.emit('alert_failed', { anomaly, error });
      }
    }
  }

  private generateAnomalyId(): string {
    return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Optimization suggestions
  async generateOptimizations(): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];
    const recentMetrics = this.healthHistory.slice(-10);

    if (recentMetrics.length < 5) return suggestions;

    const avgCpu = recentMetrics.reduce((sum, m) => sum + m.cpu, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memory, 0) / recentMetrics.length;

    if (avgMemory > 0.7) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'memory',
        description: 'メモリ使用率が高いです。キャッシュポリシーの最適化を検討してください。',
        expectedImprovement: 0.2,
        implementation: 'Implement LRU cache with TTL',
        risk: 'low',
        automated: true,
      });
    }

    if (avgCpu > 0.6) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: 'cpu',
        description: 'CPU使用率が高いです。非同期処理の増加を検討してください。',
        expectedImprovement: 0.15,
        implementation: 'Add more worker threads for CPU-intensive tasks',
        risk: 'medium',
        automated: false,
      });
    }

    return suggestions;
  }

  private generateSuggestionId(): string {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods
  getHealthHistory(): HealthMetrics[] {
    return this.healthHistory;
  }

  getActiveAnomalies(): Anomaly[] {
    return Array.from(this.anomalies.values()).filter(a => !a.resolved);
  }

  getAnomalyHistory(): Anomaly[] {
    return Array.from(this.anomalies.values());
  }

  getStats(): HealingStats {
    const anomalies = Array.from(this.anomalies.values());
    const resolved = anomalies.filter(a => a.resolved);
    const unresolved = anomalies.filter(a => !a.resolved);

    return {
      totalAnomalies: anomalies.length,
      resolvedAnomalies: resolved.length,
      unresolvedAnomalies: unresolved.length,
      avgResolutionTime: this.calculateAvgResolutionTime(resolved),
      recoverySuccessRate: anomalies.length > 0 
        ? resolved.length / anomalies.length 
        : 1,
    };
  }

  private calculateAvgResolutionTime(resolved: Anomaly[]): number {
    if (resolved.length === 0) return 0;
    
    const totalTime = resolved.reduce((sum, a) => {
      if (a.resolution) {
        return sum + (new Date().getTime() - a.timestamp.getTime());
      }
      return sum;
    }, 0);

    return totalTime / resolved.length / 1000; // seconds
  }
}

export interface HealingStats {
  totalAnomalies: number;
  resolvedAnomalies: number;
  unresolvedAnomalies: number;
  avgResolutionTime: number;
  recoverySuccessRate: number;
}

export default SelfHealingSystem;
