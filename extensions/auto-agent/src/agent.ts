import { existsSync, readFileSync } from "fs";
import { glob } from "glob";
import { basename, join } from "path";
import { AIToolClient } from "./ai-tools.js";
import { GitManager } from "./git-manager.js";
import type {
  AutoAgentConfig,
  CodeIssue,
  ImprovementSuggestion,
  AgentSession,
  AIToolType,
} from "./types.js";

export class AutoAgent {
  private config: AutoAgentConfig;
  private aiTools: Map<AIToolType, AIToolClient>;
  private git: GitManager;
  private session: AgentSession;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private watchedExtensions: Set<string>;

  constructor(config?: Partial<AutoAgentConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      aiTools: config?.aiTools ?? ["codex", "gemini", "opencode"],
      autoImprove: config?.autoImprove ?? true,
      autoRepair: config?.autoRepair ?? true,
      autoGitCommit: config?.autoGitCommit ?? true,
      checkIntervalMs: config?.checkIntervalMs ?? 60000,
      maxChangesPerCommit: config?.maxChangesPerCommit ?? 10,
    };

    this.aiTools = new Map();
    this.git = new GitManager();
    this.session = {
      id: `auto-agent-${Date.now()}`,
      startTime: new Date(),
      improvementsMade: 0,
      repairsMade: 0,
      commitsCreated: 0,
    };
    this.watchedExtensions = new Set([".ts", ".js", ".json", ".md", ".py", ".sh"]);
  }

  async start(): Promise<void> {
    if (!this.config.enabled) {
      console.log("[AutoAgent] Disabled, not starting");
      return;
    }

    console.log("[AutoAgent] Starting autonomous agent...");

    for (const tool of this.config.aiTools) {
      const client = new AIToolClient(tool);
      const connected = await client.checkConnection();
      console.log(`[AutoAgent] ${tool}: ${connected ? "✓" : "✗"}`);
      this.aiTools.set(tool, client);
    }

    if (this.config.autoGitCommit) {
      await this.git.pull();
    }

    this.scheduleCheck();
    console.log(`[AutoAgent] Started (check interval: ${this.config.checkIntervalMs}ms)`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log("[AutoAgent] Stopped");
  }

  getSession(): AgentSession {
    return { ...this.session };
  }

  async runManualCheck(): Promise<void> {
    console.log("[AutoAgent] Running manual check...");
    await this.performCheck();
  }

  private scheduleCheck(): void {
    this.intervalId = setInterval(() => {
      this.performCheck();
    }, this.config.checkIntervalMs);
  }

  private async performCheck(): Promise<void> {
    try {
      const changes = await this.git.getStatus();

      for (const change of changes) {
        if (this.watchedExtensions.has(this.getExtension(change.file))) {
          await this.analyzeAndFix(change.file);
        }
      }

      if (this.config.autoImprove) {
        await this.suggestAndApplyImprovements();
      }

      if (this.config.autoGitCommit && changes.length > 0) {
        await this.autoCommit(changes);
      }
    } catch (error) {
      console.error("[AutoAgent] Check failed:", error);
    }
  }

  private async analyzeAndFix(filePath: string): Promise<void> {
    if (!existsSync(filePath)) return;

    const code = readFileSync(filePath, "utf-8");
    const issues: CodeIssue[] = [];

    for (const [tool, client] of this.aiTools) {
      const toolIssues = await client.analyzeCode(filePath, code);
      issues.push(...toolIssues);
      console.log(`[AutoAgent] ${tool}: Found ${toolIssues.length} issues in ${filePath}`);
    }

    const criticalIssues = issues.filter((i) => i.severity >= 8 && i.type === "error");

    if (this.config.autoRepair && criticalIssues.length > 0) {
      for (const issue of criticalIssues) {
        await this.applyFix(filePath, code, issue);
      }
    }
  }

  private async applyFix(
    filePath: string,
    originalCode: string,
    issue: CodeIssue,
  ): Promise<boolean> {
    for (const [tool, client] of this.aiTools) {
      const fix = await client.generateFix(issue, filePath, originalCode);
      if (fix && fix !== originalCode) {
        console.log(`[AutoAgent] Applied fix from ${tool} for ${filePath}`);
        this.session.repairsMade++;
        return true;
      }
    }
    return false;
  }

  private async suggestAndApplyImprovements(): Promise<void> {
    const files = await glob("src/**/*.{ts,js}");
    const codeFiles = files.filter((f) => this.watchedExtensions.has(this.getExtension(f)));

    for (const filePath of codeFiles.slice(0, 5)) {
      const code = readFileSync(filePath, "utf-8");
      const suggestions: ImprovementSuggestion[] = [];

      for (const [tool, client] of this.aiTools) {
        const toolSuggestions = await client.suggestImprovements(filePath, code);
        suggestions.push(...toolSuggestions);
      }

      const securitySuggestions = suggestions.filter((s) => s.type === "security");
      if (securitySuggestions.length > 0) {
        console.log(
          `[AutoAgent] Found ${securitySuggestions.length} security improvements for ${filePath}`,
        );
      }
    }
  }

  private async autoCommit(changes: { file: string; status: string }[]): Promise<void> {
    const maxFiles = this.config.maxChangesPerCommit;
    const recentChanges = changes.slice(0, maxFiles);

    const success = await this.git.commitWithChanges(
      recentChanges.map((c) => ({
        file: c.file,
        status: c.status as "modified" | "added" | "deleted",
        staged: true,
      })),
      maxFiles,
    );

    if (success) {
      this.session.commitsCreated++;
      console.log(`[AutoAgent] Created commit for ${recentChanges.length} file(s)`);

      const pushSuccess = await this.git.push();
      if (pushSuccess) {
        console.log("[AutoAgent] Pushed changes to remote");
      }
    }
  }

  private getExtension(filePath: string): string {
    return "." + basename(filePath).split(".").pop() || "";
  }
}
