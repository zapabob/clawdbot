import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import { AutoAgent } from "./src/agent.js";
import type { AutoAgentConfig } from "./src/types.js";

let agent: AutoAgent | null = null;

const plugin = {
  id: "auto-agent",
  name: "Auto Agent",
  description:
    "Autonomous self-improving, self-repairing agent with Codex/GeminiCLI/Opencode integration for automated code maintenance",
  version: "2026.2.1",

  configSchema: Type.Object({
    enabled: Type.Optional(Type.Boolean({ default: true })),
    aiTools: Type.Optional(
      Type.Array(
        Type.Union([Type.Literal("codex"), Type.Literal("gemini"), Type.Literal("opencode")]),
        {
          default: ["codex", "gemini", "opencode"],
        },
      ),
    ),
    autoImprove: Type.Optional(Type.Boolean({ default: true })),
    autoRepair: Type.Optional(Type.Boolean({ default: true })),
    autoGitCommit: Type.Optional(Type.Boolean({ default: true })),
    checkIntervalMs: Type.Optional(Type.Number({ default: 60000 })),
    maxChangesPerCommit: Type.Optional(Type.Number({ default: 10 })),
  }),

  async register(api: OpenClawPluginApi) {
    console.log("[Auto-Agent] Registering autonomous agent plugin...");

    agent = new AutoAgent({
      enabled: true,
      aiTools: ["codex", "gemini", "opencode"],
      autoImprove: true,
      autoRepair: true,
      autoGitCommit: true,
      checkIntervalMs: 60000,
      maxChangesPerCommit: 10,
    });

    api.registerTool({
      name: "auto_agent_start",
      label: "Start Auto Agent",
      description: "Start the autonomous self-improving, self-repairing agent",
      parameters: Type.Object({
        checkIntervalMs: Type.Optional(
          Type.Number({ description: "Check interval in milliseconds" }),
        ),
        autoImprove: Type.Optional(Type.Boolean({ description: "Enable automatic improvements" })),
        autoRepair: Type.Optional(Type.Boolean({ description: "Enable automatic repairs" })),
        autoGitCommit: Type.Optional(Type.Boolean({ description: "Enable automatic git commits" })),
      }),
      async execute(_id: string, params: Record<string, unknown>) {
        if (agent) {
          agent.stop();
        }

        agent = new AutoAgent({
          enabled: true,
          aiTools: ["codex", "gemini", "opencode"],
          checkIntervalMs: (params.checkIntervalMs as number) || 60000,
          autoImprove: (params.autoImprove as boolean) ?? true,
          autoRepair: (params.autoRepair as boolean) ?? true,
          autoGitCommit: (params.autoGitCommit as boolean) ?? true,
        });

        await agent.start();

        return {
          content: [
            {
              type: "text",
              text: `✅ Auto Agent started!
            
Features enabled:
• AI Tools: Codex, GeminiCLI, Opencode
• Auto Improve: ${params.autoImprove ?? true}
• Auto Repair: ${params.autoRepair ?? true}
• Auto Git Commit: ${params.autoGitCommit ?? true}
• Check Interval: ${(params.checkIntervalMs as number) || 60000}ms`,
            },
          ],
          details: null,
        };
      },
    });

    api.registerTool({
      name: "auto_agent_stop",
      label: "Stop Auto Agent",
      description: "Stop the autonomous agent",
      parameters: Type.Object({}),
      async execute() {
        if (agent) {
          const session = agent.getSession();
          agent.stop();
          agent = null;

          return {
            content: [
              {
                type: "text",
                text: `⏹️ Auto Agent stopped!

Session Summary:
• Started: ${session.startTime}
• Improvements: ${session.improvementsMade}
• Repairs: ${session.repairsMade}
• Commits: ${session.commitsCreated}`,
              },
            ],
            details: session,
          };
        }

        return {
          content: [{ type: "text", text: "⚠️ Auto Agent was not running" }],
          details: null,
        };
      },
    });

    api.registerTool({
      name: "auto_agent_status",
      label: "Check Agent Status",
      description: "Check the current status of the auto agent",
      parameters: Type.Object({}),
      async execute() {
        if (!agent) {
          return {
            content: [{ type: "text", text: "❌ Auto Agent is not running" }],
            details: null,
          };
        }

        const session = agent.getSession();
        return {
          content: [
            {
              type: "text",
              text: `🤖 Auto Agent Status

Running: ✅
Session ID: ${session.id}
Started: ${session.startTime}
Improvements Made: ${session.improvementsMade}
Repairs Made: ${session.repairsMade}
Commits Created: ${session.commitsCreated}`,
            },
          ],
          details: session,
        };
      },
    });

    api.registerTool({
      name: "auto_agent_check",
      label: "Run Manual Check",
      description: "Trigger a manual check immediately",
      parameters: Type.Object({}),
      async execute() {
        if (!agent) {
          return {
            content: [{ type: "text", text: "❌ Start the agent first" }],
            details: null,
          };
        }

        await agent.runManualCheck();
        return {
          content: [{ type: "text", text: "✅ Manual check completed" }],
          details: agent.getSession(),
        };
      },
    });

    api.registerTool({
      name: "auto_agent_analyze",
      label: "Analyze Code",
      description: "Analyze a specific file with AI tools",
      parameters: Type.Object({
        filePath: Type.String({ description: "Path to file to analyze" }),
      }),
      async execute(_id: string, params: { filePath: string }) {
        const { AIToolClient } = await import("./src/ai-tools.js");
        const { GitManager } = await import("./src/git-manager.js");
        const fs = await import("fs");

        if (!fs.existsSync(params.filePath)) {
          return {
            content: [{ type: "text", text: `❌ File not found: ${params.filePath}` }],
            details: null,
            isError: true,
          };
        }

        const code = fs.readFileSync(params.filePath, "utf-8");
        const git = new GitManager();
        const results: string[] = [];

        for (const toolType of ["codex", "gemini", "opencode"] as const) {
          const client = new AIToolClient(toolType);
          const issues = await client.analyzeCode(params.filePath, code);
          results.push(`${toolType}: ${issues.length} issues found`);
        }

        return {
          content: [
            {
              type: "text",
              text: `📊 Analysis Results for ${params.filePath}

${results.join("\n")}

File size: ${code.length} bytes
Lines: ${code.split("\n").length}`,
            },
          ],
          details: null,
        };
      },
    });

    api.registerTool({
      name: "auto_agent_improve",
      label: "Generate Improvements",
      description: "Generate improvement suggestions for a file",
      parameters: Type.Object({
        filePath: Type.String({ description: "Path to file" }),
      }),
      async execute(_id: string, params: { filePath: string }) {
        const { AIToolClient } = await import("./src/ai-tools.js");
        const fs = await import("fs");

        if (!fs.existsSync(params.filePath)) {
          return {
            content: [{ type: "text", text: `❌ File not found: ${params.filePath}` }],
            details: null,
            isError: true,
          };
        }

        const code = fs.readFileSync(params.filePath, "utf-8");
        const suggestions: string[] = [];

        for (const toolType of ["codex", "gemini", "opencode"] as const) {
          const client = new AIToolClient(toolType);
          const improvements = await client.suggestImprovements(params.filePath, code);
          suggestions.push(`\n${toolType.toUpperCase()}:\n`);
          for (const imp of improvements.slice(0, 5)) {
            suggestions.push(`• [${imp.type}] ${imp.description}`);
          }
        }

        return {
          content: [
            {
              type: "text",
              text: `💡 Improvement Suggestions for ${params.filePath}${suggestions.join("\n")}`,
            },
          ],
          details: null,
        };
      },
    });

    api.registerTool({
      name: "auto_agent_git_status",
      label: "Git Status & Auto Commit",
      description: "Check git status and optionally auto-commit changes",
      parameters: Type.Object({
        autoCommit: Type.Optional(
          Type.Boolean({ description: "Auto-commit if there are changes" }),
        ),
      }),
      async execute(_id: string, params: { autoCommit?: boolean }) {
        const { GitManager } = await import("./src/git-manager.js");
        const git = new GitManager();

        const changes = await git.getStatus();
        const branch = await git.getCurrentBranch();

        if (changes.length === 0) {
          return {
            content: [
              { type: "text", text: `📁 Git Status\n\nBranch: ${branch}\n\nNo changes detected` },
            ],
            details: null,
          };
        }

        let commitResult = "";
        if (params.autoCommit) {
          const success = await git.commitWithChanges(changes);
          if (success) {
            await git.push();
            commitResult = "\n✅ Auto-committed and pushed changes";
          }
        }

        const changeList = changes.map((c) => `• ${c.status}: ${c.file}`).join("\n");

        return {
          content: [
            {
              type: "text",
              text: `📁 Git Status\n\nBranch: ${branch}\n\nChanges (${changes.length}):\n${changeList}${commitResult}`,
            },
          ],
          details: { changes, branch },
        };
      },
    });

    api.registerTool({
      name: "auto_agent_git_log",
      label: "View Git Log",
      description: "View recent git commits",
      parameters: Type.Object({
        limit: Type.Optional(
          Type.Number({ description: "Number of commits to show", default: 10 }),
        ),
      }),
      async execute(_id: string, params: { limit?: number }) {
        const { GitManager } = await import("./src/git-manager.js");
        const git = new GitManager();

        const logs = await git.log(params.limit || 10);
        const logsList = logs.map((l) => `• ${l}`).join("\n");

        return {
          content: [
            {
              type: "text",
              text: `📜 Recent Commits\n\n${logsList || "No commits yet"}`,
            },
          ],
          details: null,
        };
      },
    });

    console.log("[Auto-Agent] Plugin registered successfully");
    console.log("[Auto-Agent] Tools:");
    console.log("  - auto_agent_start: Start the autonomous agent");
    console.log("  - auto_agent_stop: Stop the agent");
    console.log("  - auto_agent_status: Check agent status");
    console.log("  - auto_agent_check: Run manual check");
    console.log("  - auto_agent_analyze: Analyze code with AI");
    console.log("  - auto_agent_improve: Generate improvements");
    console.log("  - auto_agent_git_status: Git status & auto-commit");
    console.log("  - auto_agent_git_log: View git log");
  },
};

export default plugin;
