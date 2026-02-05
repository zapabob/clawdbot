/**
 * VRChat Memory Plugin
 *
 * Plugin entry point for VRChat control with GRPO optimization,
 * Ebbinghaus forgetting curve memory, and episodic memory.
 */

import { Type } from "@sinclair/typebox";
import { VRChatAgent, VRChatAgentConfig } from "./src/vrchat-agent.js";

const plugin = {
  id: "vrchat-memory",
  name: "VRChat Memory",
  description:
    "VRChat control with GRPO optimization, Ebbinghaus forgetting curve memory, and episodic memory for intelligent session management",
  version: "2026.2.2",

  configSchema: Type.Object({
    grpo: Type.Optional(
      Type.Object({
        groupSize: Type.Optional(Type.Number({ default: 8 })),
        learningRate: Type.Optional(Type.Number({ default: 0.001 })),
        clipRatio: Type.Optional(Type.Number({ default: 0.2 })),
        referenceKLWeight: Type.Optional(Type.Number({ default: 0.03 })),
        updateInterval: Type.Optional(Type.Number({ default: 100 })),
      }),
    ),
    ebbinghaus: Type.Optional(
      Type.Object({
        decayConstant: Type.Optional(Type.Number({ default: 1.25 })),
        stabilityIncrement: Type.Optional(Type.Number({ default: 1.5 })),
        initialStability: Type.Optional(Type.Number({ default: 1.0 })),
        reviewThreshold: Type.Optional(Type.Number({ default: 0.7 })),
      }),
    ),
    episodic: Type.Optional(
      Type.Object({
        maxSessionLength: Type.Optional(Type.Number({ default: 180 })),
        maxEpisodes: Type.Optional(Type.Number({ default: 1000 })),
        importanceThreshold: Type.Optional(Type.Number({ default: 0.6 })),
      }),
    ),
    modeDefault: Type.Optional(Type.String({ default: "CLI", enum: ["LINE", "CLI", "GUI"] })),
    enableHumanInLoop: Type.Optional(Type.Boolean({ default: true })),
    memoryBackend: Type.Optional(Type.String({ default: "builtin", enum: ["builtin", "qmd"] })),
  }),

  register(
    api: {
      registerTool: (tool: unknown) => void;
      runtime: { log: (msg: string) => void };
      config?: Record<string, unknown>;
      agentId?: string;
    },
    config?: VRChatAgentConfig,
  ) {
    api.runtime.log("Registering VRChat Memory plugin...");

    const agent = new VRChatAgent(config, api.config, api.agentId);

    agent.on("initialized", () => {
      api.runtime.log("VRChat Memory agent initialized");
    });

    agent.on("policyOptimized", (data) => {
      api.runtime.log(`Policy updated: ${data.stats?.policyUpdateCount ?? 0} updates`);
    });

    agent.on("sessionEnded", ({ session }) => {
      api.runtime.log(`Session ended: ${session?.id ?? "unknown"}`);
    });

    agent.on("modeChanged", (result) => {
      api.runtime.log(`Mode changed: ${result.fromMode} -> ${result.toMode}`);
    });

    agent.on("confirmationRequired", ({ action }) => {
      api.runtime.log(`Confirmation required: ${JSON.stringify(action)}`);
    });

    api.registerTool({
      name: "vrchat_memory_initialize",
      description: "Initialize VRChat memory agent with GRPO and Ebbinghaus forgetting curve",
      parameters: Type.Object({}),
      async execute() {
        if (agent.getState().isInitialized) {
          return {
            content: [{ type: "text", text: "VRChat Memory agent is already initialized" }],
          };
        }

        agent.initialize();
        const state = agent.getState();

        return {
          content: [
            {
              type: "text",
              text: `VRChat Memory agent initialized:
- Mode: ${state.currentMode}
- Policy Ready: ${state.policyReady}
- Memory Ready: ${state.memoryReady}`,
            },
          ],
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_status",
      description: "Get VRChat Memory agent status and metrics",
      parameters: Type.Object({}),
      execute() {
        const state = agent.getState();
        const metrics = agent.getMetrics();
        const grpoStats = agent.getGRPOStats();
        const memoryStats = agent.getMemoryStats();
        const episodicStats = agent.getEpisodicStats();

        return {
          content: [
            {
              type: "text",
              text: `VRChat Memory Status:
State:
  - Initialized: ${state.isInitialized}
  - Running: ${state.isRunning}
  - Current Mode: ${state.currentMode}

Performance Metrics:
  - Total Actions: ${metrics.totalActions}
  - Success Rate: ${(metrics.successRate * 100).toFixed(1)}%
  - Avg Response Time: ${metrics.avgResponseTime.toFixed(0)}ms

GRPO Optimization:
  - Total Samples: ${grpoStats.totalSamples}
  - Total Groups: ${grpoStats.totalGroups}
  - Policy Updates: ${grpoStats.policyUpdateCount}
  - Avg Reward: ${grpoStats.avgReward.toFixed(3)}
  - KL Divergence: ${grpoStats.klDivergence.toFixed(4)}

Ebbinghaus Memory:
  - Total Memories: ${memoryStats.totalMemories}
  - Due for Review: ${memoryStats.dueForReview}
  - Avg Retention: ${(memoryStats.avgRetention * 100).toFixed(1)}%
  - Avg Stability: ${memoryStats.avgStability.toFixed(2)}
  - Success Rate: ${(memoryStats.successRate * 100).toFixed(1)}%

Episodic Memory:
  - Total Sessions: ${episodicStats.totalSessions}
  - Active Sessions: ${episodicStats.activeSessions}
  - Total Episodes: ${episodicStats.totalEpisodes}
  - Avg Session Duration: ${(episodicStats.avgSessionDuration / 60000).toFixed(1)}min`,
            },
          ],
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_execute",
      description: "Execute a VRChat action with GRPO optimization",
      parameters: Type.Object({
        type: Type.String({
          description:
            "Action type: set_avatar_parameter, send_chat_message, teleport_to_world, change_avatar, set_camera_parameter, send_input_command",
        }),
        target: Type.Optional(
          Type.String({ description: "Target (parameter name, world ID, etc.)" }),
        ),
        value: Type.Optional(
          Type.Union([Type.String(), Type.Number(), Type.Boolean()], {
            description: "Value to set",
          }),
        ),
        parameters: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      }),
      async execute(
        _id: string,
        params: {
          type: string;
          target?: string;
          value?: string | number | boolean;
          parameters?: Record<string, unknown>;
        },
      ) {
        const result = await agent.executeAction({
          type: params.type as Parameters<typeof agent.executeAction>[0]["type"],
          target: params.target,
          value: params.value,
          parameters: params.parameters,
        });

        return {
          content: [
            {
              type: "text",
              text: `Action ${result.success ? "completed" : "failed"}:
- Type: ${result.action.type}
- Target: ${result.action.target ?? "N/A"}
- Response Time: ${result.responseTime}ms
- Outcome: ${result.outcome}`,
            },
          ],
          isError: !result.success,
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_process_command",
      description: "Process a natural language command and execute VRChat action",
      parameters: Type.Object({
        command: Type.String({ description: "Natural language command" }),
        source: Type.Optional(
          Type.String({ description: "Command source: line, cli, gui", default: "cli" }),
        ),
        userId: Type.Optional(Type.String({ description: "User ID for LINE commands" })),
      }),
      async execute(_id: string, params: { command: string; source?: string; userId?: string }) {
        const context = {
          source: (params.source ?? "cli") as "line" | "cli" | "gui",
          userId: params.userId,
          timestamp: Date.now(),
          isInteractive: true,
          requiresConfirmation: false,
        };

        const { action, result } = await agent.processCommand(params.command, context);

        let response = `Command processed:
- Intent: ${action.type}
- Mode: ${agent.getCurrentMode()}`;

        if (result) {
          response += `
- Result: ${result.success ? "Success" : "Failed"}
- Response Time: ${result.responseTime}ms
- Outcome: ${result.outcome}`;
        }

        return {
          content: [{ type: "text", text: response }],
          isError: result ? !result.success : false,
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_set_mode",
      description: "Set the control mode (LINE, CLI, GUI)",
      parameters: Type.Object({
        mode: Type.String({ description: "Control mode", enum: ["LINE", "CLI", "GUI"] }),
        reason: Type.Optional(Type.String({ description: "Reason for mode change" })),
      }),
      execute(_id: string, params: { mode: "LINE" | "CLI" | "GUI"; reason?: string }) {
        agent.setMode(params.mode, params.reason ?? "Manual mode change");

        return {
          content: [
            {
              type: "text",
              text: `Mode changed to ${params.mode}`,
            },
          ],
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_get_reviews",
      description: "Get memories due for review based on Ebbinghaus forgetting curve",
      parameters: Type.Object({
        limit: Type.Optional(Type.Number({ description: "Max reviews to return", default: 10 })),
      }),
      execute(_id: string, params: { limit?: number }) {
        const dueReviews = agent.getDueReviews(params.limit ?? 10);

        if (dueReviews.length === 0) {
          return {
            content: [{ type: "text", text: "No memories due for review" }],
          };
        }

        const reviewList = dueReviews
          .map(
            (m, i) =>
              `${i + 1}. [${m.contentType}] ${m.content.substring(0, 50)}${m.content.length > 50 ? "..." : ""}
   Retention: ${(m.retention * 100).toFixed(1)}%, Stability: ${m.stability.toFixed(2)}`,
          )
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Memories Due for Review (${dueReviews.length}):
${reviewList}`,
            },
          ],
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_get_session",
      description: "Get current or specific session summary",
      parameters: Type.Object({
        sessionId: Type.Optional(Type.String({ description: "Session ID (default: current)" })),
      }),
      execute(_id: string, params: { sessionId?: string }) {
        const summary = agent.getSessionSummary(params.sessionId);

        if (!summary) {
          return {
            content: [{ type: "text", text: "No session found" }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Session Summary:
- Session ID: ${summary.sessionId}
- Duration: ${(summary.duration / 60000).toFixed(1)}min
- Episodes: ${summary.episodeCount}
- Avg Importance: ${summary.avgImportance.toFixed(2)}
- World Visits: ${summary.worldVisits.length}
- Commands Executed: ${summary.commandsExecuted}
- Success Rate: ${(summary.successRate * 100).toFixed(1)}%
- Key Moments: ${summary.keyMoments.length}
- Recommendations: ${summary.recommendations.length}`,
            },
          ],
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_get_upcoming",
      description: "Get upcoming scheduled reviews",
      parameters: Type.Object({
        limit: Type.Optional(Type.Number({ description: "Max entries to return", default: 10 })),
      }),
      execute(_id: string, params: { limit?: number }) {
        const upcoming = agent.getUpcomingReviews(params.limit ?? 10);

        if (upcoming.length === 0) {
          return {
            content: [{ type: "text", text: "No upcoming reviews scheduled" }],
          };
        }

        const list = upcoming
          .map(
            (e, i) =>
              `${i + 1}. [${e.memory.contentType}] ${e.memory.content.substring(0, 40)}
   Scheduled: ${new Date(e.scheduledTime).toLocaleString()}, Urgency: ${e.urgency.toFixed(2)}`,
          )
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Upcoming Reviews (${upcoming.length}):
${list}`,
            },
          ],
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_start_session",
      description: "Start a new VRChat session",
      parameters: Type.Object({}),
      execute() {
        agent.startSession();
        const session = agent.getCurrentSession();

        return {
          content: [
            {
              type: "text",
              text: `Session started:
- Session ID: ${session?.id ?? "unknown"}
- Mode: ${agent.getCurrentMode()}`,
            },
          ],
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_end_session",
      description: "End the current VRChat session",
      parameters: Type.Object({}),
      execute() {
        agent.endSession();

        return {
          content: [{ type: "text", text: "Session ended" }],
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_get_policy",
      description: "Get current GRPO policy parameters",
      parameters: Type.Object({}),
      execute() {
        const stats = agent.getGRPOStats();

        return {
          content: [
            {
              type: "text",
              text: `GRPO Policy Stats:
- Total Samples: ${stats.totalSamples}
- Total Groups: ${stats.totalGroups}
- Policy Updates: ${stats.policyUpdateCount}
- Avg Reward: ${stats.avgReward.toFixed(4)}
- Avg Advantage: ${stats.avgAdvantage.toFixed(4)}
- KL Divergence: ${stats.klDivergence.toFixed(4)}
- Clip Fraction: ${(stats.clipFraction * 100).toFixed(1)}%
- Recent Rewards: ${stats.recentRewards.slice(-10).join(", ")}`,
            },
          ],
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_search_upstream",
      description: "Search memories using OpenClaw's upstream memory backend (QMD or builtin)",
      parameters: Type.Object({
        query: Type.String({ description: "Search query" }),
        limit: Type.Optional(Type.Number({ description: "Max results", default: 5 })),
      }),
      async execute(_id: string, params: { query: string; limit?: number }) {
        const results = await agent.searchUpstreamMemory(params.query, params.limit);

        if (results.length === 0) {
          return {
            content: [{ type: "text", text: "No memories found in upstream storage" }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Found ${results.length} memories:\n${results.map((r, i) => `${i + 1}. ${r}`).join("\n")}`,
            },
          ],
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_upstream_status",
      description: "Get status of OpenClaw upstream memory backend",
      parameters: Type.Object({}),
      async execute() {
        const status = await agent.getUpstreamMemoryStatus();

        if (!status) {
          return {
            content: [{ type: "text", text: "Upstream memory bridge not configured" }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Upstream Memory Status:
- Initialized: ${status.initialized}
- Backend: ${status.backend}`,
            },
          ],
        };
      },
    });

    api.registerTool({
      name: "vrchat_memory_clear",
      description: "Clear all VRChat memory data",
      parameters: Type.Object({}),
      execute() {
        agent.clear();

        return {
          content: [{ type: "text", text: "VRChat Memory cleared" }],
        };
      },
    });

    api.runtime.log("VRChat Memory plugin registered successfully");
    api.runtime.log(
      "Features: GRPO optimization, Ebbinghaus memory, Episodic memory, Mode switching, Upstream memory bridge",
    );
  },
};

export default plugin;
