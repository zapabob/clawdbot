// Auto-Compaction - Automatic conversation summarization to reduce context size
import { LRUCache } from "../utils/perf.js";

export interface CompactionConfig {
  maxMessages: number;
  summaryThreshold: number;
  preserveSystemMessages: boolean;
  preserveToolResults: boolean;
}

const DEFAULT_CONFIG: CompactionConfig = {
  maxMessages: 50,
  summaryThreshold: 30,
  preserveSystemMessages: true,
  preserveToolResults: true,
};

export interface MessageSummary {
  id: string;
  originalCount: number;
  summary: string;
  keyPoints: string[];
  timestamp: number;
}

// Compaction history cache
const COMPACTION_HISTORY_SIZE = 20;
const compactionHistoryCache = new LRUCache<string, MessageSummary>(COMPACTION_HISTORY_SIZE);

// Current config
let config: CompactionConfig = { ...DEFAULT_CONFIG };

// Update config
export function setCompactionConfig(newConfig: Partial<CompactionConfig>): void {
  config = { ...config, ...newConfig };
}

// Get current config
export function getCompactionConfig(): CompactionConfig {
  return { ...config };
}

// Check if compaction is needed
export function shouldCompact(messageCount: number): boolean {
  return messageCount > config.maxMessages;
}

// Generate a simple summary (placeholder - would integrate with actual LLM summarization)
export function generateSummary(sessionKey: string, messages: unknown[]): MessageSummary {
  const keyPoints: string[] = [];
  let summaryText = "";

  // Extract key information from messages
  // This is a simplified placeholder - real implementation would use an LLM
  if (messages.length > 0) {
    const firstMsg = messages[0] as { role?: string; content?: string };
    const lastMsg = messages[messages.length - 1] as { role?: string; content?: string };

    summaryText = `Conversation with ${messages.length} messages. `;
    summaryText += `Started with: ${String(firstMsg?.content || "").slice(0, 50)}... `;
    summaryText += `Last: ${String(lastMsg?.content || "").slice(0, 50)}...`;

    keyPoints.push(`${messages.length} messages total`);
    keyPoints.push(`Last activity: ${new Date().toISOString()}`);
  }

  const summary: MessageSummary = {
    id: `summary-${Date.now()}`,
    originalCount: messages.length,
    summary: summaryText,
    keyPoints,
    timestamp: Date.now(),
  };

  // Cache the summary
  compactionHistoryCache.set(sessionKey, summary);

  return summary;
}

// Compact messages by keeping recent and summarizing old
export function compactMessages(
  sessionKey: string,
  messages: unknown[],
  summarizeFn?: (msgs: unknown[]) => MessageSummary,
): { compacted: unknown[]; summary: MessageSummary | null } {
  if (!shouldCompact(messages.length)) {
    return { compacted: messages, summary: null };
  }

  // Keep recent messages
  const keepCount = Math.min(config.maxMessages / 2, messages.length);
  const recentMessages = messages.slice(-keepCount);

  // Summarize old messages
  const oldMessages = messages.slice(0, -keepCount);
  let summary: MessageSummary;

  if (summarizeFn) {
    summary = summarizeFn(oldMessages);
  } else {
    summary = generateSummary(sessionKey, oldMessages);
  }

  // Build compacted message list
  const compacted: unknown[] = [];

  // Add system message placeholder if needed
  if (config.preserveSystemMessages) {
    const hasSystem = recentMessages.some((m) => (m as { role?: string }).role === "system");
    if (!hasSystem) {
      compacted.push({
        role: "system",
        content: `[Conversation summarized: ${summary.originalCount} messages condensed to ${summary.keyPoints.length} key points]`,
      });
    }
  }

  // Add summary as first user message
  compacted.push({
    role: "user",
    content: `[Earlier conversation summary: ${summary.summary}]`,
  });

  // Add key points
  for (const point of summary.keyPoints.slice(0, 5)) {
    compacted.push({
      role: "system",
      content: `• ${point}`,
    });
  }

  // Add recent messages
  compacted.push(...recentMessages);

  return { compacted, summary };
}

// Get compaction history
export function getCompactionHistory(sessionKey: string): MessageSummary | undefined {
  return compactionHistoryCache.get(sessionKey);
}

// Clear compaction history
export function clearCompactionHistory(): void {
  compactionHistoryCache.clear();
}

// Get cache stats
export function getCompactionStats(): { size: number; maxSize: number } {
  return {
    size: compactionHistoryCache.size,
    maxSize: COMPACTION_HISTORY_SIZE,
  };
}
