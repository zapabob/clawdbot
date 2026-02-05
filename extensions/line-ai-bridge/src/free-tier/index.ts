import type { AIToolType } from "../types.js";

export interface FreeTierLimits {
  codex: {
    requestsPerDay: number;
    tokensPerRequest: number;
  };
  gemini: {
    requestsPerDay: number;
    tokensPerMinute: number;
  };
  opencode: {
    requestsPerDay: number;
  };
}

export interface UsageRecord {
  date: string; // YYYY-MM-DD
  tool: AIToolType;
  requestCount: number;
  tokenCount: number;
}

/**
 * Free tier configuration for each AI tool
 * Based on current free tier offerings (as of 2025)
 */
export const FREE_TIER_LIMITS: FreeTierLimits = {
  codex: {
    requestsPerDay: 50, // GitHub Copilot Free: 50 completions/day
    tokensPerRequest: 4000, // Approximate limit per request
  },
  gemini: {
    requestsPerDay: 60, // Gemini API Free: 60 requests/minute effectively limited
    tokensPerMinute: 60000, // 60k tokens/minute
  },
  opencode: {
    requestsPerDay: 100, // Opencode generous free tier
  },
};

/**
 * Tracks usage and enforces free tier limits
 */
export class FreeTierTracker {
  private usage: Map<string, UsageRecord> = new Map();
  private limits: FreeTierLimits;

  constructor(limits: FreeTierLimits = FREE_TIER_LIMITS) {
    this.limits = limits;
    this.loadUsage();
  }

  /**
   * Check if request is allowed for a tool
   */
  canMakeRequest(tool: AIToolType): { allowed: boolean; remaining: number; reason?: string } {
    const today = this.getToday();
    const todayUsage = this.getUsageForDate(tool, today);

    switch (tool) {
      case "codex":
        const codexRemaining = this.limits.codex.requestsPerDay - todayUsage.requestCount;
        if (codexRemaining <= 0) {
          return {
            allowed: false,
            remaining: 0,
            reason: `Codex free tier limit reached: ${this.limits.codex.requestsPerDay} requests/day`,
          };
        }
        return { allowed: true, remaining: codexRemaining };

      case "gemini":
        const geminiRemaining = this.limits.gemini.requestsPerDay - todayUsage.requestCount;
        if (geminiRemaining <= 0) {
          return {
            allowed: false,
            remaining: 0,
            reason: `Gemini free tier limit reached: ${this.limits.gemini.requestsPerDay} requests/day`,
          };
        }
        return { allowed: true, remaining: geminiRemaining };

      case "opencode":
        const opencodeRemaining = this.limits.opencode.requestsPerDay - todayUsage.requestCount;
        if (opencodeRemaining <= 0) {
          return {
            allowed: false,
            remaining: 0,
            reason: `Opencode free tier limit reached: ${this.limits.opencode.requestsPerDay} requests/day`,
          };
        }
        return { allowed: true, remaining: opencodeRemaining };

      default:
        return { allowed: false, remaining: 0, reason: "Unknown tool" };
    }
  }

  /**
   * Record a request
   */
  recordRequest(tool: AIToolType, tokensUsed: number = 0): void {
    const today = this.getToday();
    const key = `${tool}:${today}`;

    let record = this.usage.get(key);
    if (!record) {
      record = {
        date: today,
        tool,
        requestCount: 0,
        tokenCount: 0,
      };
      this.usage.set(key, record);
    }

    record.requestCount++;
    record.tokenCount += tokensUsed;

    this.saveUsage();
    this.cleanupOldRecords();
  }

  /**
   * Get usage for a specific date
   */
  getUsageForDate(tool: AIToolType, date: string): UsageRecord {
    const key = `${tool}:${date}`;
    return (
      this.usage.get(key) || {
        date,
        tool,
        requestCount: 0,
        tokenCount: 0,
      }
    );
  }

  /**
   * Get today's usage for all tools
   */
  getTodayUsage(): Record<AIToolType, { requests: number; remaining: number }> {
    const today = this.getToday();
    return {
      codex: {
        requests: this.getUsageForDate("codex", today).requestCount,
        remaining: Math.max(
          0,
          this.limits.codex.requestsPerDay - this.getUsageForDate("codex", today).requestCount,
        ),
      },
      gemini: {
        requests: this.getUsageForDate("gemini", today).requestCount,
        remaining: Math.max(
          0,
          this.limits.gemini.requestsPerDay - this.getUsageForDate("gemini", today).requestCount,
        ),
      },
      opencode: {
        requests: this.getUsageForDate("opencode", today).requestCount,
        remaining: Math.max(
          0,
          this.limits.opencode.requestsPerDay -
            this.getUsageForDate("opencode", today).requestCount,
        ),
      },
    };
  }

  /**
   * Get warning message if approaching limit
   */
  getWarningMessage(tool: AIToolType): string | null {
    const today = this.getToday();
    const usage = this.getUsageForDate(tool, today);

    let limit: number;
    switch (tool) {
      case "codex":
        limit = this.limits.codex.requestsPerDay;
        break;
      case "gemini":
        limit = this.limits.gemini.requestsPerDay;
        break;
      case "opencode":
        limit = this.limits.opencode.requestsPerDay;
        break;
      default:
        return null;
    }

    const remaining = limit - usage.requestCount;
    const percentage = (usage.requestCount / limit) * 100;

    if (remaining === 0) {
      return `⚠️ ${tool.toUpperCase()} free tier limit reached! (${limit}/${limit} requests)`;
    } else if (percentage >= 80) {
      return `⚠️ ${tool.toUpperCase()}: ${remaining} requests remaining today (${usage.requestCount}/${limit})`;
    } else if (percentage >= 50) {
      return `ℹ️ ${tool.toUpperCase()}: ${remaining} requests remaining today`;
    }

    return null;
  }

  /**
   * Format usage stats for display
   */
  formatUsageStats(): string {
    const today = this.getToday();
    const usage = this.getTodayUsage();

    return `📊 Today's Free Tier Usage (${today}):

🤖 Codex: ${usage.codex.requests}/${FREE_TIER_LIMITS.codex.requestsPerDay} requests (${usage.codex.remaining} remaining)
🔷 Gemini: ${usage.gemini.requests}/${FREE_TIER_LIMITS.gemini.requestsPerDay} requests (${usage.gemini.remaining} remaining)
💎 Opencode: ${usage.opencode.requests}/${FREE_TIER_LIMITS.opencode.requestsPerDay} requests (${usage.opencode.remaining} remaining)

💡 Tips to save usage:
• Use /status to check remaining quota
• Batch multiple questions in one message
• Use /reset to start fresh when switching topics`;
  }

  /**
   * Reset all usage data
   */
  resetUsage(): void {
    this.usage.clear();
    this.saveUsage();
  }

  /**
   * Get today's date string
   */
  private getToday(): string {
    return new Date().toISOString().split("T")[0];
  }

  /**
   * Load usage from storage (placeholder)
   */
  private loadUsage(): void {
    // In production, this would load from a file or database
    // For now, we start fresh each session
    this.usage.clear();
  }

  /**
   * Save usage to storage (placeholder)
   */
  private saveUsage(): void {
    // In production, this would save to a file or database
  }

  /**
   * Clean up records older than 7 days
   */
  private cleanupOldRecords(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split("T")[0];

    for (const [key, record] of this.usage.entries()) {
      if (record.date < cutoff) {
        this.usage.delete(key);
      }
    }
  }
}

/**
 * Singleton instance
 */
let tracker: FreeTierTracker | null = null;

export function getFreeTierTracker(): FreeTierTracker {
  if (!tracker) {
    tracker = new FreeTierTracker();
  }
  return tracker;
}
