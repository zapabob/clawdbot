
/**
 * Ebbinghaus Forgetting Curve Implementation
 * 
 * S = Stability (Strength of memory)
 * R = Retrievability (Probability of recall)
 * 
 * Formula: R = e^(-t / S)
 * Where t is time elapsed since last recall.
 * S is derived from Importance * Repetition.
 */

const DECAY_SCALE_MS = 24 * 60 * 60 * 1000; // 1 Day scale

export type EpisodicMemory = {
  id: string;
  content: string;
  importance: number; // 0.0 to 1.0
  repetition_count: number;
  last_recalled_at: number; // Timestamp ms
  created_at: number; // Timestamp ms
};

/**
 * Calculates current Retrievability (0.0 to 1.0)
 */
export function calculateRetrievability(memory: EpisodicMemory, now: number = Date.now()): number {
  const t = now - memory.last_recalled_at;
  
  // S increases with Importance and Repetition
  // Simple model: S ~ Repetition^1.5 * Importance
  // If Importance is 0, S is small (fast decay)
  const stability = Math.pow(memory.repetition_count, 1.5) * (memory.importance + 0.1) * DECAY_SCALE_MS;
  
  // Avoid division by zero
  if (stability <= 0) return 0;
  
  const retrievability = Math.exp(-t / stability);
  return retrievability;
}

/**
 * Determines if a memory should be "forgotten" (pruned).
 * Threshold can be tuned. e.g., if R < 0.1, it's gone.
 */
export function shouldKeepMemory(memory: EpisodicMemory, threshold: number = 0.1): boolean {
  if (memory.importance >= 0.9) return true; // Keep highly important memories forever?
  return calculateRetrievability(memory) > threshold;
}
