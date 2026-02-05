import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import type { AIToolType } from "./src/types.js";
import { createAIToolClient, findRepositories, formatRepoList } from "./src/ai-tools/index.js";
import { BridgeRouter, type BridgeConfig } from "./src/bridge/index.js";
import { getFreeTierTracker } from "./src/free-tier/index.js";

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
    const log = (msg: string) => console.log(`[LINE-AI-Bridge] ${msg}`);
    log("Registering LINE AI Bridge plugin with terminal support...");

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
              console.log(
                `[LINE-AI-Bridge] Sending to LINE user ${userId}: ${message.substring(0, 50)}...`,
              );
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
3. Start coding with AI assistance!

💡 Free Tier Limits:
• Codex: 50 requests/day
• Gemini: 60 requests/day  
• Opencode: 100 requests/day`,
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
              text: `AI CLI Installation Status:\n\n${results.join("\n")}\n\nTo install:
• Codex: npm install -g @github/codex-cli
• Gemini: npm install -g @google/gemini-cli
• Opencode: Follow Opencode installation guide`,
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

    // Tool: line_bridge_usage - Check free tier usage
    api.registerTool({
      name: "line_bridge_usage",
      label: "Check Free Tier Usage",
      description: "Check today's free tier usage for all AI tools",
      parameters: Type.Object({}),
      async execute() {
        const tracker = getFreeTierTracker();
        const usageStats = tracker.formatUsageStats();

        return {
          content: [
            {
              type: "text",
              text: usageStats,
            },
          ],
          details: tracker.getTodayUsage(),
        };
      },
    });

    // Tool: line_bridge_reset_usage - Reset usage tracking
    api.registerTool({
      name: "line_bridge_reset_usage",
      label: "Reset Usage Tracking",
      description: "Reset all free tier usage tracking (for testing)",
      parameters: Type.Object({}),
      async execute() {
        const tracker = getFreeTierTracker();
        tracker.resetUsage();

        return {
          content: [
            {
              type: "text",
              text: "✅ Free tier usage tracking has been reset. All counters are now at zero.",
            },
          ],
          details: null,
        };
      },
    });

    // Tool: line_bridge_config_status - Check LINE configuration
    api.registerTool({
      name: "line_bridge_config_status",
      label: "Check LINE Configuration",
      description: "Check if LINE API credentials are properly configured",
      parameters: Type.Object({}),
      async execute() {
        const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        const channelSecret = process.env.LINE_CHANNEL_SECRET;
        const webhookPort = process.env.WEBHOOK_PORT || "3000";

        const configured = Boolean(channelAccessToken);
        const hasSecret = Boolean(channelSecret);

        return {
          content: [
            {
              type: "text",
              text: `LINE Configuration Status:

🔧 API Credentials:
${configured ? "✅" : "❌"} Channel Access Token: ${configured ? "Configured" : "NOT SET"}
${hasSecret ? "✅" : "❌"} Channel Secret: ${hasSecret ? "Configured" : "NOT SET"}

🌐 Webhook Settings:
• Webhook Port: ${webhookPort}
• Webhook URL: https://your-domain.com/webhook/line
• Health Check: http://localhost:${webhookPort}/health

${configured ? "✅ Ready to receive messages!" : "❌ Cannot send messages without Channel Access Token"}

To configure LINE:
1. Create a LINE Messaging API channel at https://developers.line.me/
2. Get Channel Access Token and Channel Secret
3. Set environment variables:
   export LINE_CHANNEL_ACCESS_TOKEN=your-token
   export LINE_CHANNEL_SECRET=your-secret
4. Restart the bridge`,
            },
          ],
          details: {
            hasAccessToken: configured,
            hasSecret,
            webhookPort,
          },
        };
      },
    });

    // Tool: line_bridge_send_message - Send message to LINE user
    api.registerTool({
      name: "line_bridge_send_message",
      label: "Send LINE Message",
      description: "Send a test message to a LINE user (requires LINE_CHANNEL_ACCESS_TOKEN)",
      parameters: Type.Object({
        userId: Type.String({ description: "LINE user ID to send message to" }),
        message: Type.String({ description: "Message text to send" }),
      }),
      async execute(_id: string, params: { userId: string; message: string }) {
        const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

        if (!channelAccessToken) {
          return {
            content: [
              {
                type: "text",
                text: "❌ LINE_CHANNEL_ACCESS_TOKEN not configured. Set it in environment variables first.",
              },
            ],
            details: null,
            isError: true,
          };
        }

        try {
          const response = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${channelAccessToken}`,
            },
            body: JSON.stringify({
              to: params.userId,
              messages: [
                {
                  type: "text",
                  text: params.message,
                },
              ],
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            return {
              content: [
                {
                  type: "text",
                  text: `❌ LINE API error: ${error}`,
                },
              ],
              details: null,
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `✅ Message sent successfully to ${params.userId}`,
              },
            ],
            details: { userId: params.userId },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `❌ Error sending message: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
            details: null,
            isError: true,
          };
        }
      },
    });

    // Tool: line_bridge_webhook_url - Get webhook URL for LINE configuration
    api.registerTool({
      name: "line_bridge_webhook_url",
      label: "Get Webhook URL",
      description: "Generate the webhook URL to configure in LINE Developers Console",
      parameters: Type.Object({
        host: Type.Optional(
          Type.String({
            description: "Your server hostname (e.g., myapp.example.com)",
            default: "localhost",
          }),
        ),
        port: Type.Optional(Type.Number({ description: "Webhook server port", default: 3000 })),
      }),
      async execute(_id: string, params: { host?: string; port?: number }) {
        const host = params.host || "localhost";
        const port = params.port || 3000;
        const protocol = host === "localhost" ? "http" : "https";

        const webhookUrl = `${protocol}://${host}:${port}/webhook/line`;

        return {
          content: [
            {
              type: "text",
              text: `LINE Webhook Configuration:

🔗 Webhook URL:
${webhookUrl}

📋 Setup Steps:
1. Go to LINE Developers Console: https://developers.line.me/console/
2. Select your Messaging API channel
3. Go to "Messaging API settings"
4. Scroll to "Webhook settings"
5. Enable webhook
6. Enter the URL above
7. Save settings

✅ Once configured, LINE will send messages to this URL

💡 Note: For production, use HTTPS with a valid SSL certificate.
   You can use ngrok for testing: ngrok http ${port}`,
            },
          ],
          details: {
            webhookUrl,
            host,
            port,
            protocol,
          },
        };
      },
    });

    if (runtime) {
      console.log("[LINE-AI-Bridge] Plugin registered successfully");
      console.log(
        "[LINE-AI-Bridge] Tools: line_bridge_start, line_bridge_stop, line_bridge_status, line_bridge_repos, line_bridge_test_connection, line_bridge_send, line_bridge_user_state, line_bridge_usage, line_bridge_reset_usage, line_bridge_config_status, line_bridge_send_message, line_bridge_webhook_url",
      );
      console.log(
        "[LINE-AI-Bridge] Workflow: User sends /terminal from LINE -> Select repo -> Terminal opens -> Execute commands",
      );
      console.log(
        "[LINE-AI-Bridge] Free Tier: Codex (50/day), Gemini (60/day), Opencode (100/day)",
      );
      console.log(
        "[LINE-AI-Bridge] IMPORTANT: Set LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET environment variables!",
      );
    }
  },
};

export default plugin;
