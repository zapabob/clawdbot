import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import type { AIToolType } from "./src/types.js";
import { createAIToolClient, findRepositories, formatRepoList } from "./src/ai-tools/index.js";
import { BridgeRouter, type BridgeConfig } from "./src/bridge/index.js";

let bridge: BridgeRouter | null = null;
let runtime: { log: (msg: string) => void } | null = null;

const plugin = {
  id: "line-ai-bridge",
  name: "LINE AI Bridge",
  description:
    "Bidirectional terminal-based communication between LINE and AI tools (Codex, GeminiCLI, Opencode)",
  version: "2026.2.2",

  configSchema: Type.Object({
    enabled: Type.Optional(Type.Boolean({ default: true })),
    defaultTool: Type.Optional(Type.String({ default: "codex" })),
    sessionTimeoutMinutes: Type.Optional(Type.Number({ default: 30 })),
    maxMessageLength: Type.Optional(Type.Number({ default: 5000 })),
  }),

  register(api: OpenClawPluginApi) {
    runtime = api.runtime;
    if (!runtime) {
      throw new Error("Runtime not available");
    }
    runtime.log("Registering LINE AI Bridge plugin with terminal support...");

    // Initialize bridge with config
    const initBridge = (config: BridgeConfig) => {
      if (bridge) {
        bridge.stop();
      }
      bridge = new BridgeRouter(config);
      bridge.start();
    };

    // Tool: line_bridge_status - Check bridge status
    api.registerTool({
      name: "line_bridge_status",
      label: "LINE Bridge Status",
      description: "Check the status of LINE-AI bridge and terminal sessions",
      parameters: Type.Object({}),
      async execute() {
        const stats = bridge?.getStats();

        return {
          content: [
            {
              type: "text",
              text: `LINE-AI Bridge Status (Terminal Mode):
${
  stats
    ? `Running: ${stats.isRunning ? "✅" : "❌"}
Active Users: ${stats.sessions}
Active Terminals: ${stats.terminals}`
    : "Bridge not initialized"
}

Workflow:
1. User sends /terminal via LINE
2. System scans for repositories
3. User selects a repository
4. Terminal opens with selected AI tool
5. User can execute commands in that terminal`,
            },
          ],
          details: null,
        };
      },
    });

    // Tool: line_bridge_start - Start the bridge
    api.registerTool({
      name: "line_bridge_start",
      label: "Start LINE Bridge",
      description: "Start the bidirectional LINE-AI terminal bridge",
      parameters: Type.Object({
        defaultTool: Type.Optional(
          Type.String({ description: "Default AI tool (codex/gemini/opencode)", default: "codex" }),
        ),
      }),
      async execute(_id: string, params: { defaultTool?: string }) {
        try {
          const config: BridgeConfig = {
            defaultTool: (params.defaultTool as AIToolType) || "codex",
            sessionTimeoutMinutes: 30,
            maxMessageLength: 5000,
            lineSendCallback: async (userId: string, message: string) => {
              runtime?.log(`Sending to LINE user ${userId}: ${message.substring(0, 50)}...`);
            },
          };

          initBridge(config);

          return {
            content: [
              {
                type: "text",
                text: `✅ LINE-AI Bridge started with terminal support!

Default tool: ${params.defaultTool || "codex"}

To use:
1. Send /terminal from LINE
2. Select a repository
3. Start coding with AI assistance!`,
              },
            ],
            details: null,
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Failed to start bridge";
          return {
            content: [{ type: "text", text: `❌ Error: ${errorMsg}` }],
            details: null,
            isError: true,
          };
        }
      },
    });

    // Tool: line_bridge_stop - Stop the bridge
    api.registerTool({
      name: "line_bridge_stop",
      label: "Stop LINE Bridge",
      description: "Stop the LINE-AI terminal bridge",
      parameters: Type.Object({}),
      async execute() {
        if (bridge) {
          bridge.stop();
          return {
            content: [{ type: "text", text: "⏹️ LINE-AI Bridge stopped" }],
            details: null,
          };
        }
        return {
          content: [{ type: "text", text: "⚠️ Bridge was not running" }],
          details: null,
        };
      },
    });

    // Tool: line_bridge_repos - List available repositories
    api.registerTool({
      name: "line_bridge_repos",
      label: "List Repositories",
      description: "Scan and list all available git repositories on this PC",
      parameters: Type.Object({}),
      async execute() {
        try {
          const repos = await findRepositories();
          const repoList = formatRepoList(repos);

          return {
            content: [
              {
                type: "text",
                text:
                  repos.length > 0
                    ? `📁 Found ${repos.length} repositories:\n\n${repoList}`
                    : "❌ No repositories found. Make sure you have git repositories in your home directory or Documents folder.",
              },
            ],
            details: { count: repos.length, repos },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `❌ Error scanning repositories: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
            details: null,
            isError: true,
          };
        }
      },
    });

    // Tool: line_bridge_test_connection - Test AI tool connections
    api.registerTool({
      name: "line_bridge_test_connection",
      label: "Test AI Connections",
      description: "Test connections to Codex, GeminiCLI, and Opencode CLIs",
      parameters: Type.Object({}),
      async execute() {
        const results: string[] = [];

        for (const toolType of ["codex", "gemini", "opencode"] as AIToolType[]) {
          try {
            const config = {
              type: toolType,
              enabled: true,
              timeoutMs: 10000,
            };
            const client = createAIToolClient(config);
            const connected = await client.checkConnection();
            results.push(`${toolType}: ${connected ? "✅ Installed" : "❌ Not installed"}`);
          } catch (error) {
            results.push(
              `${toolType}: ❌ Error - ${error instanceof Error ? error.message : "Unknown"}`,
            );
          }
        }

        return {
          content: [
            {
              type: "text",
              text: `AI CLI Installation Status:\n\n${results.join("\n")}\n\nTo install:\n• Codex: npm install -g @github/codex-cli\n• Gemini: npm install -g @google/gemini-cli\n• Opencode: Follow Opencode installation guide`,
            },
          ],
          details: null,
        };
      },
    });

    // Tool: line_bridge_send - Simulate a LINE message (for testing)
    api.registerTool({
      name: "line_bridge_send",
      label: "Send Test Message",
      description: "Send a test message to the bridge (simulates LINE user)",
      parameters: Type.Object({
        userId: Type.String({ description: "LINE user ID to simulate", default: "test_user" }),
        message: Type.String({ description: "Message to send" }),
      }),
      async execute(_id: string, params: { userId: string; message: string }) {
        if (!bridge || !bridge.isActive()) {
          return {
            content: [
              {
                type: "text",
                text: "❌ Bridge is not running. Start it first with line_bridge_start",
              },
            ],
            details: null,
            isError: true,
          };
        }

        try {
          const lineMessage = {
            id: `manual_${Date.now()}`,
            userId: params.userId,
            text: params.message,
            timestamp: new Date(),
          };

          const result = await bridge.handleLineMessage(lineMessage);

          return {
            content: [
              {
                type: "text",
                text: result.success
                  ? `✅ Message processed\n\nResponse:\n${result.content?.substring(0, 500) || "No content"}`
                  : `❌ Failed: ${result.error}`,
              },
            ],
            details: result.metadata,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
            details: null,
            isError: true,
          };
        }
      },
    });

    // Tool: line_bridge_user_state - Check user state
    api.registerTool({
      name: "line_bridge_user_state",
      label: "Check User State",
      description: "Check the current state of a LINE user in the bridge",
      parameters: Type.Object({
        userId: Type.String({ description: "LINE user ID" }),
      }),
      async execute(_id: string, params: { userId: string }) {
        const state = bridge?.getUserState(params.userId);

        if (!state) {
          return {
            content: [{ type: "text", text: `No active state for user ${params.userId}` }],
            details: null,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `User State for ${params.userId}:
Step: ${state.step}
${state.selectedRepo ? `Repository: ${state.selectedRepo.name}\nPath: ${state.selectedRepo.path}` : "No repository selected"}
${state.selectedTool ? `Tool: ${state.selectedTool}` : ""}
${state.sessionId ? `Session: ${state.sessionId}` : ""}`,
            },
          ],
          details: state,
        };
      },
    });

    if (runtime) {
      runtime.log("LINE AI Bridge plugin with terminal support registered successfully");
      runtime.log(
        "Tools: line_bridge_start, line_bridge_stop, line_bridge_status, line_bridge_repos, line_bridge_test_connection, line_bridge_send, line_bridge_user_state",
      );
      runtime.log(
        "Workflow: User sends /terminal from LINE -> Select repo -> Terminal opens -> Execute commands",
      );
    }
  },
};

export default plugin;
