import { spawn, execSync } from "child_process";
import { readdirSync, statSync } from "fs";
import { platform } from "os";
import { join, resolve } from "path";
import type { AIResponse, AIToolConfig } from "../types.js";

interface TerminalSession {
  id: string;
  tool: string;
  repoPath: string;
  process?: ReturnType<typeof spawn>;
  output: string[];
  isReady: boolean;
}

const activeSessions = new Map<string, TerminalSession>();

/**
 * Scan for git repositories in common locations
 */
export async function findRepositories(): Promise<{ path: string; name: string }[]> {
  const repos: { path: string; name: string }[] = [];
  const homeDir = process.env.HOME || process.env.USERPROFILE || ".";

  // Common directories to scan
  const scanDirs = [
    homeDir,
    join(homeDir, "Documents"),
    join(homeDir, "Projects"),
    join(homeDir, "workspace"),
    join(homeDir, "dev"),
    join(homeDir, "code"),
    join(homeDir, "github"),
    join(homeDir, "gitlab"),
    process.cwd(),
  ];

  for (const dir of scanDirs) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        try {
          const gitDir = join(fullPath, ".git");
          statSync(gitDir);
          repos.push({
            path: fullPath,
            name: entry,
          });
        } catch {
          // Not a git repo
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  return repos;
}

/**
 * Open a terminal with the specified tool
 */
export async function openTerminalWithTool(
  tool: string,
  repoPath: string,
  sessionId: string,
): Promise<TerminalSession> {
  const isWindows = platform() === "win32";
  const absPath = resolve(repoPath);

  // Kill existing session if any
  const existingSession = activeSessions.get(sessionId);
  if (existingSession?.process) {
    existingSession.process.kill();
    activeSessions.delete(sessionId);
  }

  let command: string;
  let args: string[];
  let shell: string;

  if (isWindows) {
    // Windows - use cmd or PowerShell
    shell = "cmd.exe";

    switch (tool) {
      case "codex":
        // Open new terminal with Codex ready
        args = [
          "/c",
          "start",
          "cmd",
          "/k",
          `cd /d "${absPath}" && echo Codex ready. Type: codex ask "your question"`,
        ];
        break;
      case "gemini":
        args = [
          "/c",
          "start",
          "cmd",
          "/k",
          `cd /d "${absPath}" && echo Gemini ready. Type: gemini ask "your question"`,
        ];
        break;
      case "opencode":
        args = [
          "/c",
          "start",
          "cmd",
          "/k",
          `cd /d "${absPath}" && echo Opencode ready. Type: opencode`,
        ];
        break;
      default:
        args = ["/c", "start", "cmd", "/k", `cd /d "${absPath}" && echo Ready for ${tool}`];
    }
  } else {
    // macOS/Linux
    shell = "/bin/bash";

    let toolCommand: string;
    switch (tool) {
      case "codex":
        toolCommand = `echo "Codex ready. Type: codex ask 'your question'"`;
        break;
      case "gemini":
        toolCommand = `echo "Gemini ready. Type: gemini ask 'your question'"`;
        break;
      case "opencode":
        toolCommand = `echo "Opencode ready. Type: opencode"`;
        break;
      default:
        toolCommand = `echo "Ready for ${tool}"`;
    }

    // Try different terminal emulators
    const terminalCommands = [
      `osascript -e 'tell application "Terminal" to do script "cd '${absPath}' && ${toolCommand}"'`,
      `gnome-terminal -- bash -c "cd '${absPath}' && ${toolCommand}; exec bash"`,
      `konsole --workdir "${absPath}" -e bash -c "${toolCommand}; exec bash"`,
      `xterm -e "cd '${absPath}' && ${toolCommand}; exec bash"`,
    ];

    // Execute the first available terminal
    for (const termCmd of terminalCommands) {
      try {
        execSync(termCmd, { stdio: "ignore" });
        break;
      } catch {
        continue;
      }
    }

    args = ["-c", `cd "${absPath}" && ${toolCommand}`];
  }

  const session: TerminalSession = {
    id: sessionId,
    tool,
    repoPath: absPath,
    output: [],
    isReady: true,
  };

  activeSessions.set(sessionId, session);
  return session;
}

/**
 * Send a command to an existing terminal session
 */
export async function sendToTerminal(sessionId: string, command: string): Promise<AIResponse> {
  const session = activeSessions.get(sessionId);

  if (!session) {
    return {
      success: false,
      error: "Terminal session not found. Open a terminal first with /terminal command.",
    };
  }

  // Build the full command based on the tool
  let fullCommand: string;
  const escapedCommand = command.replace(/"/g, '\\"');

  switch (session.tool) {
    case "codex":
      fullCommand = `codex ask "${escapedCommand}"`;
      break;
    case "gemini":
      fullCommand = `gemini ask "${escapedCommand}"`;
      break;
    case "opencode":
      fullCommand = command; // Opencode is interactive
      break;
    default:
      fullCommand = command;
  }

  try {
    // Execute command in the repository
    const result = execSync(fullCommand, {
      cwd: session.repoPath,
      encoding: "utf-8",
      timeout: 60000,
      env: {
        ...process.env,
        FORCE_COLOR: "1",
      },
    });

    // Store output
    session.output.push(`> ${command}`);
    session.output.push(result);

    // Keep only last 100 lines
    if (session.output.length > 100) {
      session.output = session.output.slice(-100);
    }

    return {
      success: true,
      content: result,
      metadata: {
        repo: session.repoPath,
        tool: session.tool,
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    session.output.push(`> ${command}`);
    session.output.push(`Error: ${errorMsg}`);

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Get active terminal session
 */
export function getTerminalSession(sessionId: string): TerminalSession | undefined {
  return activeSessions.get(sessionId);
}

/**
 * List all active sessions
 */
export function listTerminalSessions(): TerminalSession[] {
  return Array.from(activeSessions.values());
}

/**
 * Close a terminal session
 */
export function closeTerminalSession(sessionId: string): boolean {
  const session = activeSessions.get(sessionId);
  if (session?.process) {
    session.process.kill();
  }
  return activeSessions.delete(sessionId);
}

/**
 * Format repository list for display
 */
export function formatRepoList(repos: { path: string; name: string }[]): string {
  if (repos.length === 0) {
    return "No repositories found.";
  }

  return repos.map((repo, index) => `${index + 1}. ${repo.name}\n   📁 ${repo.path}`).join("\n\n");
}

// Legacy client implementations for backward compatibility
export abstract class AIToolClient {
  protected config: AIToolConfig;

  constructor(config: AIToolConfig) {
    this.config = config;
  }

  abstract sendMessage(message: string, context?: string[]): Promise<AIResponse>;
  abstract checkConnection(): Promise<boolean>;
}

export class CodexClient extends AIToolClient {
  async sendMessage(message: string): Promise<AIResponse> {
    return {
      success: false,
      error: "Use terminal-based interaction. Send /terminal command first.",
    };
  }

  async checkConnection(): Promise<boolean> {
    try {
      execSync("codex --version", { encoding: "utf-8", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

export class GeminiClient extends AIToolClient {
  async sendMessage(message: string): Promise<AIResponse> {
    return {
      success: false,
      error: "Use terminal-based interaction. Send /terminal command first.",
    };
  }

  async checkConnection(): Promise<boolean> {
    try {
      execSync("gemini --version", { encoding: "utf-8", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

export class OpencodeClient extends AIToolClient {
  async sendMessage(message: string): Promise<AIResponse> {
    return {
      success: false,
      error: "Use terminal-based interaction. Send /terminal command first.",
    };
  }

  async checkConnection(): Promise<boolean> {
    try {
      execSync("opencode --version", { encoding: "utf-8", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

export function createAIToolClient(config: AIToolConfig): AIToolClient {
  switch (config.type) {
    case "codex":
      return new CodexClient(config);
    case "gemini":
      return new GeminiClient(config);
    case "opencode":
      return new OpencodeClient(config);
    default:
      throw new Error(`Unknown AI tool type: ${config.type}`);
  }
}
