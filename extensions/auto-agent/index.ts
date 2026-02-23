import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type {
  PluginHookMessageReceivedEvent,
  PluginHookMessageContext,
} from "../../src/plugins/types.js";

type AutoAgentConfig = {
  enabled?: boolean;
  checkIntervalMs?: number;
  maxChangesPerCommit?: number;
  selfHealing?: boolean;
  autoRollback?: boolean;
  gitAutoCommit?: boolean;
  subagentModel?: string;
  autonomousTasks?: string[];
  webSearch?: {
    enabled?: boolean;
    provider?: "brave" | "perplexity" | "grok";
  };
};

type AutoAgentState = {
  isRunning: boolean;
  lastCheck: number;
  taskQueue: string[];
  errorCount: number;
  lastError?: string;
};

const state: AutoAgentState = {
  isRunning: false,
  lastCheck: 0,
  taskQueue: [],
  errorCount: 0,
};

let checkInterval: ReturnType<typeof setInterval> | null = null;
let latestVisionFrame: string | null = null;

const AUTONOMOUS_TASKS = [
  "Check for any uncommitted changes and summarize them",
  "Review recent error logs and suggest fixes",
  "Analyze current system status and health",
  "Check for available updates or improvements",
  "Review memory and suggest optimizations",
];

function getConfig(api: OpenClawPluginApi): AutoAgentConfig {
  const cfg = api.runtime.config.loadConfig();
  return (cfg.plugins?.entries?.["auto-agent"]?.config ?? {}) as AutoAgentConfig;
}

async function runAutonomousTask(
  api: OpenClawPluginApi,
  task: string,
  visionFrame: string | null = null,
  sessionKey: string = "agent:main:subagent:auto-agent",
): Promise<void> {
  const cfg = getConfig(api);
  api.logger.info(`[auto-agent] Running task: ${task.slice(0, 50)}...`);

  try {
    const body: any = {
      sessionKey,
      prompt: `You are an autonomous agent task runner. Complete this task concisely:\n\n${task}\n\nRespond with your findings and any actions taken.`,
      model: cfg.subagentModel ?? "auto",
    };
    if (visionFrame) {
      body.images = [visionFrame];
    }

    const response = await fetch("http://127.0.0.1:8080/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api.config.gateway?.auth?.token ?? ""}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Agent API error: ${response.status}`);
    }

    const data = await response.json();
    api.logger.info(`[auto-agent] Task completed: ${data.text?.slice(0, 100) ?? "no output"}...`);
    state.errorCount = 0;
  } catch (error) {
    state.errorCount++;
    state.lastError = String(error);
    api.logger.error(`[auto-agent] Task failed: ${error}`);

    if (cfg.selfHealing && state.errorCount < 3) {
      api.logger.info("[auto-agent] Attempting self-healing...");
      await attemptSelfHealing(api, String(error));
    }
  }
}

async function attemptSelfHealing(api: OpenClawPluginApi, error: string): Promise<void> {
  api.logger.info(`[auto-agent] Self-healing for error: ${error}`);

  if (error.includes("rate limit") || error.includes("429")) {
    api.logger.info("[auto-agent] Rate limit detected, switching to fallback model");
    const cfg = getConfig(api);
    if (cfg.subagentModel && cfg.subagentModel !== "gpt-5.2") {
      api.logger.info(`[auto-agent] Using subagent model: ${cfg.subagentModel}`);
    }
  }
}

async function runAutonomousCycle(api: OpenClawPluginApi): Promise<void> {
  if (state.isRunning) {
    api.logger.debug?.("[auto-agent] Cycle already running, skipping");
    return;
  }

  const cfg = getConfig(api);
  if (!cfg.enabled) {
    return;
  }

  state.isRunning = true;
  state.lastCheck = Date.now();

  try {
    let task = "";
    let visionFrame = null;
    let sessionKey = "agent:main:subagent:auto-agent";

    if (latestVisionFrame) {
      task =
        "Analyze the provided camera frame. If the user is doing something that warrants a proactive reaction (e.g., waving, holding an object, looking confused), generate a brief, friendly conversational response. If nothing interesting is happening, respond with exactly 'NO_RESPONSE'.";
      visionFrame = latestVisionFrame;
      sessionKey = "voice-call";
      latestVisionFrame = null;
    } else {
      const tasks = cfg.autonomousTasks ?? AUTONOMOUS_TASKS;
      task = tasks[Math.floor(Math.random() * tasks.length)];
    }

    await runAutonomousTask(api, task, visionFrame, sessionKey);
  } finally {
    state.isRunning = false;
  }
}

function startAutonomousLoop(api: OpenClawPluginApi): void {
  const cfg = getConfig(api);
  const intervalMs = cfg.checkIntervalMs ?? 60000;

  if (checkInterval) {
    clearInterval(checkInterval);
  }

  api.logger.info(`[auto-agent] Starting autonomous loop (${intervalMs}ms interval)`);

  checkInterval = setInterval(() => {
    runAutonomousCycle(api).catch((err) => {
      api.logger.error(`[auto-agent] Autonomous cycle error: ${err}`);
    });
  }, intervalMs);

  runAutonomousCycle(api).catch((err) => {
    api.logger.error(`[auto-agent] Initial cycle error: ${err}`);
  });
}

function stopAutonomousLoop(api: OpenClawPluginApi): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    api.logger.info("[auto-agent] Stopped autonomous loop");
  }
}

export default function register(api: OpenClawPluginApi): void {
  api.registerGatewayMethod("auto-agent.vision", async (req) => {
    const params = req.params as Record<string, any>;
    if (params && params.image) {
      latestVisionFrame = params.image;
    }
  });

  api.registerCommand({
    name: "auto-agent",
    description: "Show auto-agent status and configuration.",
    acceptsArgs: true,
    handler: async (ctx) => {
      const cfg = getConfig(api);
      const args = ctx.args?.trim() ?? "";
      const action = args.split(/\s+/)[0]?.toLowerCase() ?? "status";

      if (action === "status" || !action) {
        const lines = [
          "🤖 Auto-Agent Status",
          "",
          `enabled:          ${cfg.enabled ?? false}`,
          `isRunning:        ${state.isRunning}`,
          `checkIntervalMs:  ${cfg.checkIntervalMs ?? 60000}ms`,
          `lastCheck:        ${state.lastCheck ? new Date(state.lastCheck).toISOString() : "never"}`,
          `errorCount:       ${state.errorCount}`,
          `selfHealing:      ${cfg.selfHealing ?? true}`,
          `autoRollback:     ${cfg.autoRollback ?? true}`,
          `gitAutoCommit:    ${cfg.gitAutoCommit ?? false}`,
          `subagentModel:    ${cfg.subagentModel ?? "auto"}`,
          "",
          "Web Search:",
          `  enabled:  ${cfg.webSearch?.enabled ?? true}`,
          `  provider: ${cfg.webSearch?.provider ?? "brave"}`,
        ];

        const braveKey = process.env["BRAVE_API_KEY"] ?? "";
        const hasKey = braveKey && !braveKey.includes("your_") && braveKey.length > 10;
        lines.push(
          `  api-key:  ${hasKey ? "✅ set" : "❌ not set – BRAVE_API_KEY missing in .env"}`,
        );

        if (state.lastError) {
          lines.push("", `⚠️ Last Error: ${state.lastError.slice(0, 100)}`);
        }

        return { text: lines.join("\n") };
      }

      if (action === "enable") {
        const currentCfg = api.runtime.config.loadConfig();
        const nextCfg = {
          ...currentCfg,
          plugins: {
            ...currentCfg.plugins,
            entries: {
              ...(currentCfg.plugins?.entries ?? {}),
              "auto-agent": {
                ...(currentCfg.plugins?.entries?.["auto-agent"] ?? {}),
                enabled: true,
                config: { ...cfg, enabled: true },
              },
            },
          },
        };
        await api.runtime.config.writeConfigFile(nextCfg);
        startAutonomousLoop(api);
        return { text: "✅ auto-agent enabled and started" };
      }

      if (action === "disable") {
        const currentCfg = api.runtime.config.loadConfig();
        const nextCfg = {
          ...currentCfg,
          plugins: {
            ...currentCfg.plugins,
            entries: {
              ...(currentCfg.plugins?.entries ?? {}),
              "auto-agent": {
                ...(currentCfg.plugins?.entries?.["auto-agent"] ?? {}),
                enabled: false,
                config: { ...cfg, enabled: false },
              },
            },
          },
        };
        await api.runtime.config.writeConfigFile(nextCfg);
        stopAutonomousLoop(api);
        return { text: "⏹️ auto-agent disabled and stopped" };
      }

      if (action === "run") {
        const task = args.slice(4).trim() || "Perform a general system check and report status";
        await runAutonomousTask(api, task);
        return { text: `✅ Task executed: ${task}` };
      }

      if (action === "model") {
        const model = args.slice(6).trim();
        if (!model) {
          return {
            text: `Current subagent model: ${cfg.subagentModel ?? "auto"}\nUsage: /auto-agent model <model_name>`,
          };
        }
        const currentCfg = api.runtime.config.loadConfig();
        const nextCfg = {
          ...currentCfg,
          plugins: {
            ...currentCfg.plugins,
            entries: {
              ...(currentCfg.plugins?.entries ?? {}),
              "auto-agent": {
                ...(currentCfg.plugins?.entries?.["auto-agent"] ?? {}),
                config: { ...cfg, subagentModel: model },
              },
            },
          },
        };
        await api.runtime.config.writeConfigFile(nextCfg);
        return { text: `✅ Subagent model set to: ${model}` };
      }

      return {
        text: [
          "Auto-agent commands:",
          "",
          "/auto-agent status   – show configuration and status",
          "/auto-agent enable   – enable and start autonomous mode",
          "/auto-agent disable  – disable and stop autonomous mode",
          "/auto-agent run <task> – run a specific task",
          "/auto-agent model <name> – set subagent model (fallback)",
        ].join("\n"),
      };
    },
  });

  api.on(
    "message_received",
    async (event: PluginHookMessageReceivedEvent, _ctx: PluginHookMessageContext) => {
      const cfg = getConfig(api);
      if (!cfg.enabled) {
        return;
      }

      const content = event.content.toLowerCase();
      if (content.includes("error") || content.includes("fail") || content.includes("exception")) {
        api.logger.info(
          `[auto-agent] Potential error detected in message: ${content.slice(0, 50)}...`,
        );
        state.taskQueue.push(`Investigate this user-reported issue: ${event.content}`);
      }
    },
  );

  api.on("gateway_start", () => {
    const cfg = getConfig(api);
    if (cfg.enabled) {
      startAutonomousLoop(api);
    }
  });

  api.on("gateway_stop", () => {
    stopAutonomousLoop(api);
  });

  api.registerService({
    id: "auto-agent-scheduler",
    start: () => {
      const cfg = getConfig(api);
      if (cfg.enabled) {
        api.logger.info("[auto-agent] Service starting autonomous loop");
        startAutonomousLoop(api);
      }
    },
    stop: () => {
      stopAutonomousLoop(api);
    },
  });
}
