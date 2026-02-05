interface ToolResult {
  content: string | Array<Record<string, unknown>>;
  status?: "success" | "error" | "abort";
  error?: string;
}

const SENSITIVE_OUTPUT_PATTERNS = [
  /"((api|access|channel|auth|secret|token|key)[_-]?(token|key|secret|id)?["']?\s*[:=]\s*["']?)([a-zA-Z0-9_\-\.]+)/gi,
  /Bearer\s+([a-zA-Z0-9\-\._~\+\/]+=*)/gi,
];

const BLOCKED_KEYWORDS = [
  "LINE_CHANNEL_ACCESS_TOKEN",
  "LINE_CHANNEL_SECRET",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "OPENCODE_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "DISCORD_BOT_TOKEN",
  "SLACK_BOT_TOKEN",
  "TELEGRAM_BOT_TOKEN",
  "VRCHAT_PASSWORD",
  "JWT_SECRET",
  "ENCRYPTION_KEY",
  "DATABASE_URL",
];

function redactSensitivePattern(text: string): string {
  let result = text;

  for (const pattern of SENSITIVE_OUTPUT_PATTERNS) {
    result = result.replace(pattern, "$1[REDACTED]");
  }

  return result;
}

function redactBlockedKeywords(text: string): string {
  let result = text;

  for (const keyword of BLOCKED_KEYWORDS) {
    const patterns = [
      new RegExp(`${keyword}=[^\\s"']+`, "gi"),
      new RegExp(`${keyword}["']?\\s*[:=]\\s*["']?[^\\s"']+`, "gi"),
    ];

    for (const pattern of patterns) {
      result = result.replace(pattern, `${keyword}=[REDACTED]`);
    }
  }

  return result;
}

function redactEnvVarsFromText(text: string): string {
  const blockedPatterns = [
    /^LINE_/,
    /^OPENAI_/,
    /^GEMINI_/,
    /^OPENCODE_/,
    /^TWILIO_/,
    /^DISCORD_/,
    /^SLACK_/,
    /^TELEGRAM_/,
    /^VRCHAT_/,
    /^GOOGLE_/,
    /^GITHUB_/,
    /^AWS_/,
    /^DATABASE_URL/,
    /^REDIS_URL/,
    /^ENCRYPTION_KEY/,
    /^JWT_SECRET/,
    /^SESSION_SECRET/,
    /^SMTP_PASSWORD/,
  ];

  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;

    const isBlocked = blockedPatterns.some((pattern) => pattern.test(key));
    if (isBlocked) {
      const patterns = [
        new RegExp(`${key}=[^\\s"']+`, "gi"),
        new RegExp(`${key}["']?\\s*[:=]\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "gi"),
      ];

      for (const pattern of patterns) {
        text = text.replace(pattern, `${key}=[REDACTED]`);
      }
    }
  }

  return text;
}

export function guardToolResult(result: ToolResult): ToolResult {
  if (typeof result.content === "string") {
    const redacted = redactSensitivePattern(redactBlockedKeywords(redactEnvVarsFromText(result.content)));

    return {
      ...result,
      content: redacted,
    };
  }

  if (Array.isArray(result.content)) {
    return {
      ...result,
      content: result.content.map((item: Record<string, unknown>) => {
        if (typeof item === "object" && item !== null && "text" in item) {
          const text = String(item.text);
          return {
            ...item,
            text: redactSensitivePattern(redactBlockedKeywords(redactEnvVarsFromText(text))),
          };
        }
        return item;
      }),
    };
  }

  return result;
}

export function guardAllToolResults(results: ToolResult[]): ToolResult[] {
  return results.map(guardToolResult);
}

export function createOutputGuard() {
  return {
    guard: guardToolResult,
    guardAll: guardAllToolResults,
    redact: redactSensitivePattern,
    redactKeywords: redactBlockedKeywords,
    redactEnvVars: redactEnvVarsFromText,
  };
}
