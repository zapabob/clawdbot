// AI Tool connection types
export type AIToolType = "codex" | "gemini" | "opencode";

export interface AIToolConfig {
  type: AIToolType;
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  timeoutMs: number;
}

export interface BridgeConfig {
  enabled: boolean;
  defaultTool: AIToolType;
  tools: Record<AIToolType, AIToolConfig>;
  lineChannel: string;
  sessionTimeoutMinutes: number;
  maxMessageLength: number;
}

// Message types
export interface LineMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: Date;
  replyToken?: string;
}

export interface AIMessage {
  id: string;
  content: string;
  tool: AIToolType;
  metadata?: Record<string, unknown>;
}

export interface BridgeMessage {
  lineMessage?: LineMessage;
  aiMessage?: AIMessage;
  direction: "line-to-ai" | "ai-to-line";
  sessionId: string;
}

// Session types
export interface Session {
  id: string;
  lineUserId: string;
  currentTool: AIToolType;
  createdAt: Date;
  lastActivityAt: Date;
  messageHistory: BridgeMessage[];
}

// AI Tool response types
export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Connection status
export interface ConnectionStatus {
  tool: AIToolType;
  connected: boolean;
  lastPingAt?: Date;
  error?: string;
}
