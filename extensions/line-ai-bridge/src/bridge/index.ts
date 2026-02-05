import type { LineMessage, AIMessage, BridgeMessage, AIToolType, AIResponse } from "../types.js";
import {
  findRepositories,
  openTerminalWithTool,
  sendToTerminal,
  getTerminalSession,
  listTerminalSessions,
  closeTerminalSession,
  formatRepoList,
} from "../ai-tools/index.js";
import { getFreeTierTracker } from "../free-tier/index.js";
import { SessionManager } from "../session/index.js";

export interface BridgeConfig {
  defaultTool: AIToolType;
  sessionTimeoutMinutes: number;
  maxMessageLength: number;
  lineSendCallback: (userId: string, message: string) => Promise<void>;
}

interface UserState {
  step: "idle" | "selecting_repo" | "ready";
  selectedRepo?: { path: string; name: string };
  selectedTool?: AIToolType;
  availableRepos?: { path: string; name: string }[];
  sessionId?: string;
}

const userStates = new Map<string, UserState>();

/**
 * Bridge router for bidirectional LINE-AI communication with terminal support
 */
export class BridgeRouter {
  private sessionManager: SessionManager;
  private config: BridgeConfig;
  private isRunning = false;

  constructor(config: BridgeConfig) {
    this.config = config;
    this.sessionManager = new SessionManager(config.sessionTimeoutMinutes);
  }

  /**
   * Start the bridge
   */
  start(): void {
    this.isRunning = true;
    console.log("[LINE-AI Bridge] Started with terminal support");
  }

  /**
   * Stop the bridge
   */
  stop(): void {
    this.isRunning = false;
    // Close all terminal sessions
    for (const session of listTerminalSessions()) {
      closeTerminalSession(session.id);
    }
    console.log("[LINE-AI Bridge] Stopped");
  }

  /**
   * Check if bridge is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Handle incoming LINE message - route to AI
   */
  async handleLineMessage(lineMessage: LineMessage): Promise<AIResponse> {
    if (!this.isRunning) {
      return {
        success: false,
        error: "Bridge is not running",
      };
    }

    const userId = lineMessage.userId;
    const text = lineMessage.text.trim();
    let userState = userStates.get(userId) || { step: "idle" };

    try {
      // Handle special commands
      if (text === "/help") {
        const helpText = this.getHelpText();
        await this.config.lineSendCallback(userId, helpText);
        return { success: true, content: helpText };
      }

      if (text === "/reset") {
        // Close terminal session if exists
        const session = getTerminalSession(`terminal_${userId}`);
        if (session) {
          closeTerminalSession(session.id);
        }
        userStates.delete(userId);
        await this.config.lineSendCallback(
          userId,
          "🔄 Session reset. Send any message to start again.",
        );
        return { success: true, content: "Session reset" };
      }

      if (text === "/terminal" || text === "/start") {
        // Start repository selection flow
        await this.config.lineSendCallback(userId, "🔍 Scanning for repositories...");
        const repos = await findRepositories();

        userState = {
          step: "selecting_repo",
          availableRepos: repos,
        };
        userStates.set(userId, userState);

        if (repos.length === 0) {
          await this.config.lineSendCallback(
            userId,
            "❌ No repositories found. Make sure you have git repositories in your home directory or Documents folder.",
          );
          userState.step = "idle";
          return { success: false, error: "No repositories found" };
        }

        const repoList = formatRepoList(repos);
        await this.config.lineSendCallback(
          userId,
          `📁 Found ${repos.length} repositories:\n\n${repoList}\n\nReply with the number (1-${repos.length}) to select a repository:`,
        );
        return { success: true, content: "Repository selection started" };
      }

      if (text === "/repos") {
        // Show repositories again
        const repos = await findRepositories();
        const repoList = formatRepoList(repos);
        await this.config.lineSendCallback(userId, `📁 Available repositories:\n\n${repoList}`);
        return { success: true, content: repoList };
      }

      if (text === "/status") {
        const sessions = listTerminalSessions();
        const userSession = sessions.find((s) => s.id === `terminal_${userId}`);

        let statusText = `📊 Status:\n`;
        statusText += `Bridge: ${this.isRunning ? "✅ Running" : "❌ Stopped"}\n`;
        statusText += `Active terminals: ${sessions.length}\n`;

        if (userState.selectedRepo) {
          statusText += `\nYour session:\n`;
          statusText += `📁 Repo: ${userState.selectedRepo.name}\n`;
          statusText += `🔧 Tool: ${userState.selectedTool || this.config.defaultTool}\n`;
          statusText += `💻 Terminal: ${userSession ? "✅ Open" : "❌ Closed"}\n`;
        }

        await this.config.lineSendCallback(userId, statusText);
        return { success: true, content: statusText };
      }

      if (text === "/usage") {
        const tracker = getFreeTierTracker();
        const usageStats = tracker.formatUsageStats();
        await this.config.lineSendCallback(userId, usageStats);
        return { success: true, content: usageStats };
      }

      // Handle repository selection
      if (userState.step === "selecting_repo" && userState.availableRepos) {
        const selection = parseInt(text, 10);

        if (isNaN(selection) || selection < 1 || selection > userState.availableRepos.length) {
          await this.config.lineSendCallback(
            userId,
            `❌ Invalid selection. Please reply with a number between 1 and ${userState.availableRepos.length}`,
          );
          return { success: false, error: "Invalid selection" };
        }

        const selectedRepo = userState.availableRepos[selection - 1];
        userState.selectedRepo = selectedRepo;
        userState.step = "ready";
        userState.selectedTool = this.config.defaultTool;

        // Open terminal with the default tool
        const sessionId = `terminal_${userId}`;
        userState.sessionId = sessionId;

        await this.config.lineSendCallback(
          userId,
          `✅ Selected: ${selectedRepo.name}\n📁 ${selectedRepo.path}\n\n🔧 Opening terminal with ${this.config.defaultTool}...`,
        );

        await openTerminalWithTool(this.config.defaultTool, selectedRepo.path, sessionId);

        await this.config.lineSendCallback(
          userId,
          `💻 Terminal opened!\n\nYou can now:\n` +
            `• Send any message to run as a command\n` +
            `• Use /codex, /gemini, or /opencode to switch tools\n` +
            `• Use /reset to start over`,
        );

        userStates.set(userId, userState);
        return { success: true, content: "Terminal opened" };
      }

      // Handle tool switching
      if (userState.step === "ready") {
        const toolSwitch = this.detectToolSwitch(text);
        if (toolSwitch && userState.selectedRepo) {
          userState.selectedTool = toolSwitch;
          const sessionId = `terminal_${userId}`;

          await this.config.lineSendCallback(
            userId,
            `🔄 Switching to ${toolSwitch.toUpperCase()}...`,
          );

          await openTerminalWithTool(toolSwitch, userState.selectedRepo.path, sessionId);

          await this.config.lineSendCallback(
            userId,
            `✅ Now using ${toolSwitch.toUpperCase()} in ${userState.selectedRepo.name}`,
          );

          userStates.set(userId, userState);
          return { success: true, content: `Switched to ${toolSwitch}` };
        }

        // Execute command in terminal
        if (userState.sessionId) {
          // Check free tier limits before executing
          const currentTool = userState.selectedTool || this.config.defaultTool;
          const tracker = getFreeTierTracker();
          const limitCheck = tracker.canMakeRequest(currentTool);

          if (!limitCheck.allowed) {
            await this.config.lineSendCallback(
              userId,
              `❌ ${limitCheck.reason}\n\nTry:\n• Switch to another tool with /codex, /gemini, or /opencode\n• Wait until tomorrow for the quota to reset\n• Check usage with /usage`,
            );
            return { success: false, error: limitCheck.reason };
          }

          // Show warning if approaching limit
          const warning = tracker.getWarningMessage(currentTool);
          if (warning) {
            await this.config.lineSendCallback(userId, warning);
          }

          // Check if terminal session exists
          const session = getTerminalSession(userState.sessionId);
          if (!session) {
            // Terminal was closed, reopen it
            if (userState.selectedRepo && userState.selectedTool) {
              await this.config.lineSendCallback(userId, `💻 Reopening terminal...`);
              await openTerminalWithTool(
                userState.selectedTool,
                userState.selectedRepo.path,
                userState.sessionId,
              );
            }
          }

          // Send command to terminal
          const result = await sendToTerminal(userState.sessionId, text);

          // Record the request (for tracking AI tool usage)
          if (result.success) {
            tracker.recordRequest(currentTool);
          }

          if (result.success && result.content) {
            // Truncate if too long
            const responseText = this.truncateMessage(result.content);
            await this.config.lineSendCallback(userId, responseText);
            return result;
          } else {
            await this.config.lineSendCallback(
              userId,
              `❌ Error: ${result.error || "Unknown error"}`,
            );
            return result;
          }
        }
      }

      // Default: ask user to start
      await this.config.lineSendCallback(
        userId,
        `👋 Welcome! Send /terminal or /start to begin and select a repository.`,
      );
      return { success: true, content: "Welcome message sent" };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Bridge error";
      await this.config.lineSendCallback(userId, `❌ ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Get bridge statistics
   */
  getStats(): { isRunning: boolean; sessions: number; terminals: number } {
    const terminals = listTerminalSessions();
    return {
      isRunning: this.isRunning,
      sessions: userStates.size,
      terminals: terminals.length,
    };
  }

  /**
   * Get user state
   */
  getUserState(userId: string): UserState | undefined {
    return userStates.get(userId);
  }

  /**
   * Detect tool switch command in message
   */
  private detectToolSwitch(text: string): AIToolType | null {
    const trimmed = text.trim().toLowerCase();
    if (trimmed === "/codex" || trimmed === "/gpt") {
      return "codex";
    }
    if (trimmed === "/gemini" || trimmed === "/google") {
      return "gemini";
    }
    if (trimmed === "/opencode" || trimmed === "/code") {
      return "opencode";
    }
    return null;
  }

  /**
   * Truncate message if needed
   */
  private truncateMessage(message: string): string {
    if (message.length <= this.config.maxMessageLength) {
      return message;
    }
    return message.substring(0, this.config.maxMessageLength - 3) + "...";
  }

  /**
   * Get help text
   */
  private getHelpText(): string {
    const tracker = getFreeTierTracker();
    const quickUsage = tracker.getTodayUsage();

    return `🤖 LINE AI Bridge - ⭐ Codex Central

Getting Started:
/terminal or /start - Select a repository and open terminal
/repos - List all available repositories
/status - Check your session status
/usage - Check free tier usage
/reset - Reset and start over

Commands (after selecting repo):
⭐ /codex or /gpt - Use Codex (${quickUsage.codex.remaining} left today) - DEFAULT
  /gemini or /google - Use Gemini (${quickUsage.gemini.remaining} left today) - Alternative
  /opencode or /code - Use Opencode (${quickUsage.opencode.remaining} left today) - Fallback

Any other message will be executed as Codex command in the terminal!

💡 Codex is your primary AI assistant. Switch when quota exhausted.

Current status: ${this.isRunning ? "✅ Active" : "❌ Stopped"}`;
  }
}
