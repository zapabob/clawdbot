/**
 * Ebbinghaus Forgetting Curve and Spaced Repetition Memory System
 *
 * Implements the Ebbinghaus forgetting curve equation:
 * R(t,S) = (1 + factor * t / S) ^ (-decay)
 *
 * Where:
 * - R = retention (0-1)
 * t = time since last review
 * S = stability (memory strength)
 * - decay = decay constant
 * factor = scaling factor
 */

import { EventEmitter } from "events";
import { randomUUID } from "node:crypto";

export interface EbbinghausConfig {
  decayConstant: number;
  stabilityIncrement: number;
  initialStability: number;
  reviewThreshold: number;
}

export interface MemoryItem {
  id: string;
  content: string;
  contentType: "command" | "preference" | "world" | "avatar" | "social" | "general";
  stability: number;
  difficulty: number;
  interval: number;
  repetitions: number;
  lastReview: number;
  nextReview: number;
  retention: number;
  createdAt: number;
  metadata: Record<string, unknown>;
  successCount: number;
  failureCount: number;
}

export interface ReviewResult {
  memoryId: string;
  success: boolean;
  responseTime: number;
  retentionBefore: number;
  retentionAfter: number;
  newStability: number;
  newInterval: number;
}

export interface ScheduleEntry {
  memory: MemoryItem;
  scheduledTime: number;
  priority: number;
  urgency: number;
}

export interface EbbinghausStats {
  totalMemories: number;
  dueForReview: number;
  avgRetention: number;
  avgStability: number;
  totalReviews: number;
  successRate: number;
  pendingSchedule: number;
}

export interface MemorySearchCriteria {
  contentType?: MemoryItem["contentType"][];
  minRetention?: number;
  maxRetention?: number;
  minStability?: number;
  maxStability?: number;
  dueOnly?: boolean;
  limit?: number;
  offset?: number;
}

export class EbbinghausMemory extends EventEmitter {
  private config: EbbinghausConfig;
  private memories: Map<string, MemoryItem> = new Map();
  private reviewSchedule: ScheduleEntry[] = [];
  private stats: EbbinghausStats;
  private readonly SCHEDULE_BATCH_SIZE = 100;
  private readonly DECAY_FACTOR = 0.693;

  constructor(config: Partial<EbbinghausConfig>) {
    super();
    this.config = {
      decayConstant: config.decayConstant ?? 1.25,
      stabilityIncrement: config.stabilityIncrement ?? 1.5,
      initialStability: config.initialStability ?? 1.0,
      reviewThreshold: config.reviewThreshold ?? 0.7,
    };
    this.stats = this.initStats();
  }

  private initStats(): EbbinghausStats {
    return {
      totalMemories: 0,
      dueForReview: 0,
      avgRetention: 1,
      avgStability: this.config.initialStability,
      totalReviews: 0,
      successRate: 0.5,
      pendingSchedule: 0,
    };
  }

  /**
   * Calculate retention using Ebbinghaus forgetting curve
   * R(t,S) = (1 + factor * t / S) ^ (-decay)
   */
  calculateRetention(timeSinceReview: number, stability: number): number {
    if (timeSinceReview < 0) return 1;
    if (stability <= 0) return 0;

    const t = timeSinceReview / (24 * 60 * 60);
    const S = stability;
    const decay = this.config.decayConstant;

    const retention = Math.pow(1 + (this.DECAY_FACTOR * t) / S, -decay);
    return Math.max(0, Math.min(1, retention));
  }

  /**
   * Calculate next review interval using SM-2 inspired algorithm
   */
  calculateNextInterval(
    stability: number,
    difficulty: number,
    success: boolean,
    repetitions: number,
  ): number {
    const easeFactor = 2.5 - 0.15 * difficulty;
    const modifiedEase = Math.max(1.3, easeFactor);

    let newInterval: number;

    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = stability * modifiedEase;
    }

    if (!success) {
      newInterval = 1;
    }

    return Math.min(newInterval, 365);
  }

  /**
   * Update stability after a review
   */
  updateStability(
    currentStability: number,
    difficulty: number,
    success: boolean,
    responseTime: number,
  ): number {
    const timeBonus = Math.max(0, (5000 - responseTime) / 5000) * 0.1;
    const difficultyPenalty = difficulty * 0.1;

    let newStability = currentStability;

    if (success) {
      newStability *= this.config.stabilityIncrement;
      newStability += timeBonus;
    } else {
      newStability *= 0.8;
      newStability = Math.max(this.config.initialStability, newStability - difficultyPenalty);
    }

    return newStability;
  }

  addMemory(
    content: string,
    contentType: MemoryItem["contentType"],
    metadata: Record<string, unknown> = {},
  ): MemoryItem {
    const id = randomUUID();
    const difficulty = this.estimateDifficulty(content, contentType);

    const memory: MemoryItem = {
      id,
      content,
      contentType,
      stability: this.config.initialStability,
      difficulty,
      interval: 1,
      repetitions: 0,
      lastReview: Date.now(),
      nextReview: Date.now() + 24 * 60 * 60 * 1000,
      retention: 1,
      createdAt: Date.now(),
      metadata,
      successCount: 0,
      failureCount: 0,
    };

    this.memories.set(id, memory);
    this.updateSchedule(memory);
    this.updateStats();

    this.emit("memoryAdded", { memory });
    return memory;
  }

  private estimateDifficulty(content: string, contentType: MemoryItem["contentType"]): number {
    let difficulty = 0.5;

    difficulty += content.length / 100;
    difficulty += content.split(" ").length / 20;

    const complexPatterns = /\d{3,}|[A-Z]{3,}|special|config|parameter/i;
    if (complexPatterns.test(content)) {
      difficulty += 0.2;
    }

    switch (contentType) {
      case "command":
        difficulty += 0.1;
        break;
      case "avatar":
        difficulty += 0.15;
        break;
      case "world":
        difficulty += 0.2;
        break;
      case "social":
        difficulty -= 0.1;
        break;
    }

    return Math.max(0.1, Math.min(1, difficulty));
  }

  review(memoryId: string, success: boolean, responseTime: number = 1000): ReviewResult | null {
    const memory = this.memories.get(memoryId);
    if (!memory) return null;

    const retentionBefore = memory.retention;
    const timeSinceReview = Date.now() - memory.lastReview;
    memory.retention = this.calculateRetention(timeSinceReview, memory.stability);

    const retentionAfter = success
      ? Math.min(1, memory.retention + 0.1)
      : Math.max(0, memory.retention - 0.2);

    memory.stability = this.updateStability(
      memory.stability,
      memory.difficulty,
      success,
      responseTime,
    );

    memory.interval = this.calculateNextInterval(
      memory.stability,
      memory.difficulty,
      success,
      memory.repetitions,
    );

    if (success) {
      memory.successCount++;
      memory.repetitions++;
    } else {
      memory.failureCount++;
      memory.repetitions = 0;
    }

    memory.lastReview = Date.now();
    memory.nextReview = Date.now() + memory.interval * 24 * 60 * 60 * 1000;

    this.updateSchedule(memory);
    this.updateStats();
    this.stats.totalReviews++;

    const result: ReviewResult = {
      memoryId,
      success,
      responseTime,
      retentionBefore,
      retentionAfter,
      newStability: memory.stability,
      newInterval: memory.interval,
    };

    this.emit("memoryReviewed", { memory, result });
    return result;
  }

  private updateSchedule(memory: MemoryItem): void {
    this.reviewSchedule = this.reviewSchedule.filter((e) => e.memory.id !== memory.id);

    const urgency = this.calculateUrgency(memory);
    const priority = this.calculatePriority(memory);

    this.reviewSchedule.push({
      memory,
      scheduledTime: memory.nextReview,
      priority,
      urgency,
    });

    this.reviewSchedule.sort((a, b) => {
      if (Math.abs(a.scheduledTime - b.scheduledTime) < 60000) {
        return b.urgency - a.urgency;
      }
      return a.scheduledTime - b.scheduledTime;
    });

    this.stats.pendingSchedule = this.reviewSchedule.length;
  }

  private calculateUrgency(memory: MemoryItem): number {
    const timeUntilReview = memory.nextReview - Date.now();
    const retention = this.calculateRetention(Date.now() - memory.lastReview, memory.stability);

    let urgency = 0;
    if (timeUntilReview < 0) {
      urgency = 1 + Math.abs(timeUntilReview) / (24 * 60 * 60 * 1000);
    } else {
      urgency = 0.5;
    }

    urgency *= 1 - retention;

    switch (memory.contentType) {
      case "command":
        urgency *= 1.2;
        break;
      case "avatar":
        urgency *= 1.1;
        break;
      case "social":
        urgency *= 0.8;
        break;
    }

    return urgency;
  }

  private calculatePriority(memory: MemoryItem): number {
    let priority = memory.stability;

    priority += memory.successCount * 0.1;
    priority -= memory.failureCount * 0.15;

    priority *= 1 - memory.difficulty * 0.5;

    return priority;
  }

  getDueReviews(limit: number = 10): MemoryItem[] {
    const now = Date.now();
    const due = this.reviewSchedule
      .filter((e) => e.memory.nextReview <= now)
      .slice(0, limit)
      .map((e) => e.memory);

    return due;
  }

  getUpcomingReviews(limit: number = 10): ScheduleEntry[] {
    return this.reviewSchedule.filter((e) => e.memory.nextReview > Date.now()).slice(0, limit);
  }

  search(criteria: MemorySearchCriteria): MemoryItem[] {
    const results: MemoryItem[] = [];

    for (const memory of this.memories.values()) {
      if (criteria.contentType && !criteria.contentType.includes(memory.contentType)) {
        continue;
      }

      if (criteria.minRetention !== undefined && memory.retention < criteria.minRetention) {
        continue;
      }

      if (criteria.maxRetention !== undefined && memory.retention > criteria.maxRetention) {
        continue;
      }

      if (criteria.minStability !== undefined && memory.stability < criteria.minStability) {
        continue;
      }

      if (criteria.maxStability !== undefined && memory.stability > criteria.maxStability) {
        continue;
      }

      if (criteria.dueOnly && memory.nextReview > Date.now()) {
        continue;
      }

      results.push(memory);
    }

    results.sort((a, b) => b.retention - a.retention);

    const offset = criteria.offset ?? 0;
    const limit = criteria.limit ?? results.length;

    return results.slice(offset, offset + limit);
  }

  getMemory(id: string): MemoryItem | undefined {
    return this.memories.get(id);
  }

  updateMemory(id: string, updates: Partial<MemoryItem>): MemoryItem | null {
    const memory = this.memories.get(id);
    if (!memory) return null;

    Object.assign(memory, updates);
    this.updateSchedule(memory);
    this.updateStats();

    return memory;
  }

  removeMemory(id: string): boolean {
    const memory = this.memories.get(id);
    if (!memory) return false;

    this.memories.delete(id);
    this.reviewSchedule = this.reviewSchedule.filter((e) => e.memory.id !== id);
    this.updateStats();

    this.emit("memoryRemoved", { id });
    return true;
  }

  private updateStats(): void {
    const memories = Array.from(this.memories.values());

    this.stats.totalMemories = memories.length;
    this.stats.dueForReview = memories.filter((m) => m.nextReview <= Date.now()).length;
    this.stats.avgRetention =
      memories.length > 0 ? memories.reduce((sum, m) => sum + m.retention, 0) / memories.length : 1;
    this.stats.avgStability =
      memories.length > 0
        ? memories.reduce((sum, m) => sum + m.stability, 0) / memories.length
        : this.config.initialStability;

    const reviewed = memories.filter((m) => m.successCount + m.failureCount > 0);
    this.stats.successRate =
      reviewed.length > 0
        ? reviewed.reduce((sum, m) => sum + m.successCount, 0) /
          reviewed.reduce((sum, m) => sum + m.successCount + m.failureCount, 0)
        : 0.5;

    this.stats.pendingSchedule = this.reviewSchedule.length;
  }

  getStats(): EbbinghausStats {
    return { ...this.stats };
  }

  getAllMemories(): MemoryItem[] {
    return Array.from(this.memories.values());
  }

  clear(): void {
    this.memories.clear();
    this.reviewSchedule = [];
    this.stats = this.initStats();
    this.emit("memoryCleared");
  }

  serialize(): string {
    return JSON.stringify({
      memories: Array.from(this.memories.entries()),
      schedule: this.reviewSchedule.map((e) => ({
        ...e,
        memory: e.memory.id,
      })),
      config: this.config,
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.memories = new Map(parsed.memories);
    this.config = { ...this.config, ...parsed.config };
    this.updateStats();
  }
}

export default EbbinghausMemory;
