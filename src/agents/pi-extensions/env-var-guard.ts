export interface EnvVarGuardConfig {
  blockedPatterns: RegExp[];
  sensitivePatterns: RegExp[];
  maxExposureLength: number;
  auditLog: boolean;
  throwOnViolation: boolean;
}

export interface GuardResult {
  passed: boolean;
  redactedValue: string;
  violation: string | null;
}

const SENSITIVE_KEY_PATTERNS = [
  /TOKEN$/i,
  /SECRET$/i,
  /KEY$/i,
  /PASSWORD$/i,
  /CREDENTIAL/i,
  /AUTH/i,
  /PRIVATE/i,
  /API_KEY/i,
  /ACCESS_TOKEN/i,
  /CHANNEL_SECRET/i,
];

const BLOCKED_KEY_PATTERNS = [
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

const SENSITIVE_VALUE_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,
  /AIza[0-9A-Za-z\-_]{35}/,
  /xoxb-[0-9A-Za-z-]{21,}/,
  /AC[a-fA-F0-9]{32}/,
  /[A-Za-z0-9+/]{40,}={0,2}/,
];

const DEFAULT_CONFIG: EnvVarGuardConfig = {
  blockedPatterns: BLOCKED_KEY_PATTERNS,
  sensitivePatterns: SENSITIVE_KEY_PATTERNS,
  maxExposureLength: 4,
  auditLog: true,
  throwOnViolation: false,
};

export function isSensitiveEnvKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function isBlockedEnvKey(key: string): boolean {
  return BLOCKED_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function containsSensitiveValue(value: string): boolean {
  return SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

export function guardEnvValue(key: string, value: string, config = DEFAULT_CONFIG): GuardResult {
  if (!value || typeof value !== "string") {
    return { passed: true, redactedValue: "", violation: null };
  }

  if (isBlockedEnvKey(key)) {
    return {
      passed: config.throwOnViolation ? false : true,
      redactedValue: "[REDACTED]",
      violation: `Blocked environment variable access: ${key}`,
    };
  }

  if (isSensitiveEnvKey(key) || containsSensitiveValue(value)) {
    const redacted = value.slice(0, config.maxExposureLength) + "*".repeat(Math.max(0, value.length - config.maxExposureLength));
    return {
      passed: true,
      redactedValue: redacted,
      violation: `Sensitive environment variable detected: ${key}`,
    };
  }

  return { passed: true, redactedValue: value, violation: null };
}

export function redactEnvVars(env: Record<string, string | undefined>, config = DEFAULT_CONFIG): Record<string, string> {
  const redacted: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined || value === null) continue;

    const result = guardEnvValue(key, value, config);
    redacted[key] = result.redactedValue;
  }

  return redacted;
}

export function filterEnvVarsForAgent(env: Record<string, string | undefined>): Record<string, string> {
  const allowedKeys = [
    "NODE_ENV",
    "CLAWDBOT_GATEWAY_PORT",
    "LOG_LEVEL",
    "ENABLE_AUTO_IMPROVE",
    "ENABLE_AUTO_REPAIR",
    "CLAWDBOT_LOG_DIR",
  ];

  const filtered: Record<string, string> = {};

  for (const key of allowedKeys) {
    if (env[key] !== undefined) {
      filtered[key] = env[key]!;
    }
  }

  return filtered;
}

export function createEnvVarGuard(config: Partial<EnvVarGuardConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    guard: (key: string, value: string) => guardEnvValue(key, value, mergedConfig),
    redact: (env: Record<string, string | undefined>) => redactEnvVars(env, mergedConfig),
    filter: filterEnvVarsForAgent,
    isBlocked: isBlockedEnvKey,
    isSensitive: isSensitiveEnvKey,
    config: mergedConfig,
  };
}
