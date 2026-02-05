export interface AutoAgentConfig {
  enabled: boolean;
  aiTools: AIToolType[];
  autoImprove: boolean;
  autoRepair: boolean;
  autoGitCommit: boolean;
  checkIntervalMs: number;
  maxChangesPerCommit: number;
}

export type AIToolType = "codex" | "gemini" | "opencode";

export interface CodeIssue {
  file: string;
  line?: number;
  type: "error" | "warning" | "improvement";
  message: string;
  severity: number;
}

export interface ImprovementSuggestion {
  file: string;
  type: "performance" | "readability" | "security" | "maintainability";
  description: string;
  suggestedCode?: string;
}

export interface GitChange {
  file: string;
  status: "modified" | "added" | "deleted";
  staged: boolean;
}

export interface AgentSession {
  id: string;
  startTime: Date;
  improvementsMade: number;
  repairsMade: number;
  commitsCreated: number;
}
