export interface AgentContext {
  messages: Array<{
    role: "user" | "assistant" | "toolResult" | "toolCall";
    content: string | Array<Record<string, unknown>>;
  }>;
  env: Record<string, string>;
}

const BLOCKED_PROMPT_PATTERNS = [
  /show\s+me\s+the\s+(api|access|channel|auth|secret|token|key)/i,
  /what('s|\s+is)\s+your\s+(api|openai|line|discord)/i,
  /tell\s+me\s+your\s+(token|key|secret|password)/i,
  /export\s+(LINE_|OPENAI_|GEMINI_|DISCORD_)/i,
  /printenv\s+(LINE_|OPENAI_|GEMINI_)/i,
  /process\.env\.(LINE_|OPENAI_|GEMINI_)/i,
  /env\.(LINE_|OPENAI_|GEMINI_)/i,
];

const SANITIZE_PROMPT_PATTERNS = [
  /\$?(LINE_|OPENAI_|GEMINI_|DISCORD_|SLACK_)[A-Z_]+(\s*[:=]\s*)[\w\-]+/gi,
  /Bearer\s+[a-zA-Z0-9\-\._~\+\/]+=*/gi,
  /sk-[a-zA-Z0-9]{20,}/gi,
  /AIza[0-9A-Za-z\-_]{35}/gi,
];

export function sanitizePromptForAgent(context: AgentContext): AgentContext {
  const sanitizedMessages = context.messages.map((message) => {
    if (typeof message.content === "string") {
      let sanitized = message.content;

      for (const pattern of SANITIZE_PROMPT_PATTERNS) {
        sanitized = sanitized.replace(pattern, "$1[REDACTED]");
      }

      return {
        ...message,
        content: sanitized,
      };
    }

    return message;
  });

  const filteredEnv = filterEnvForAgent(context.env);

  return {
    ...context,
    messages: sanitizedMessages,
    env: filteredEnv,
  };
}

function filterEnvForAgent(env: Record<string, string>): Record<string, string> {
  const allowedKeys = [
    "NODE_ENV",
    "CLAWDBOT_GATEWAY_PORT",
    "LOG_LEVEL",
    "ENABLE_AUTO_IMPROVE",
    "ENABLE_AUTO_REPAIR",
    "CLAWDBOT_LOG_DIR",
    "PLUGINS_ENABLED",
    "PLUGINS_DISABLED",
  ];

  const filtered: Record<string, string> = {};

  for (const key of allowedKeys) {
    if (env[key] !== undefined) {
      filtered[key] = env[key];
    }
  }

  return filtered;
}

export function detectPromptInjection(text: string): { detected: boolean; reason: string | null } {
  for (const pattern of BLOCKED_PROMPT_PATTERNS) {
    if (pattern.test(text)) {
      return {
        detected: true,
        reason: `Blocked prompt pattern detected: ${pattern.source.substring(0, 50)}...`,
      };
    }
  }

  return { detected: false, reason: null };
}

export function createContextGuard() {
  return {
    sanitize: sanitizePromptForAgent,
    filterEnv: filterEnvForAgent,
    detectInjection: detectPromptInjection,
  };
}
