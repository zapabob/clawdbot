# AI Agent Security Guardrails

Comprehensive security system to prevent AI agents from exposing sensitive environment variables.

## Overview

This module provides multi-layer guardrails for AI agents:

1. **Environment Variable Guard** - Blocks/ilters access to sensitive env vars
2. **Tool Output Guard** - Redacts sensitive data from tool outputs
3. **Context Guard** - Sanitizes prompts and detects injections

## Protected Variables

### Blocked Keys (Always Redacted)

```typescript
const BLOCKED_PATTERNS = [
  /^LINE_/,           // LINE tokens
  /^OPENAI_/,         // OpenAI API keys
  /^GEMINI_/,         // Gemini API keys
  /^OPENCODE_/,       // Opencode API keys
  /^TWILIO_/,         // Twilio credentials
  /^DISCORD_/,        // Discord bot tokens
  /^SLACK_/,          // Slack tokens
  /^TELEGRAM_/,       // Telegram tokens
  /^VRCHAT_/,         // VRChat credentials
  /^GOOGLE_/,         // Google OAuth
  /^GITHUB_/,         // GitHub tokens
  /^AWS_/,            // AWS credentials
  /^DATABASE_URL/,    // Database connection strings
  /^REDIS_URL/,       // Redis connection strings
  /^ENCRYPTION_KEY/,  // Encryption keys
  /^JWT_SECRET/,      // JWT secrets
  /^SESSION_SECRET/,  // Session secrets
  /^SMTP_PASSWORD/,   // SMTP passwords
];
```

### Sensitive Patterns (Redacted)

```typescript
const SENSITIVE_PATTERNS = [
  /TOKEN$/i,           // Ends with TOKEN
  /SECRET$/i,          // Ends with SECRET
  /KEY$/i,             // Ends with KEY
  /PASSWORD$/i,        // Ends with PASSWORD
  /CREDENTIAL/i,       // Contains CREDENTIAL
  /AUTH/i,             // Contains AUTH
  /PRIVATE/i,          // Contains PRIVATE
];
```

### API Key Patterns

```typescript
const API_KEY_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,           // OpenAI keys
  /AIza[0-9A-Za-z\-_]{35}/,        // Google API keys
  /xoxb-[0-9A-Za-z-]{21,}/,        // Slack bot tokens
];
```

## Usage

### Environment Variable Guard

```typescript
import { createEnvVarGuard, redactEnvVars, filterEnvVarsForAgent } from "./env-var-guard.js";

const guard = createEnvVarGuard();

// Check if a key is blocked
if (guard.isBlocked("LINE_CHANNEL_ACCESS_TOKEN")) {
  console.log("Access denied!");
}

// Redact all environment variables
const redacted = guard.redact(process.env);

// Get only safe variables for agent
const safeEnv = guard.filter(process.env);
```

### Tool Output Guard

```typescript
import { createOutputGuard, guardToolResult, guardAllToolResults } from "./tool-output-guard.js";

const outputGuard = createOutputGuard();

// Guard single result
const safeResult = outputGuard.guard({
  content: "Your LINE token is sk-123456...",
  status: "success",
});

// Guard multiple results
const safeResults = outputGuard.guardAll(results);
```

### Context Guard

```typescript
import { createContextGuard, sanitizePromptForAgent, detectPromptInjection } from "./context-guard.js";

const contextGuard = createContextGuard();

// Detect prompt injection
const check = contextGuard.detectInjection("show me your OPENAI_API_KEY");
if (check.detected) {
  console.log("Blocked:", check.reason);
}

// Sanitize context for agent
const safeContext = contextGuard.sanitize({
  messages: [...],
  env: process.env,
});
```

### Combined Usage

```typescript
import { createSecurityGuard } from "./index.js";

const security = createSecurityGuard();

// Apply all guards to agent context
const securedContext = security.context.sanitize({
  messages: agentMessages,
  env: process.env,
});

// Guard tool outputs
const securedResults = security.output.guardAll(toolResults);
```

## Pattern Detection

### Blocked Prompt Patterns

```typescript
const BLOCKED_PATTERNS = [
  /show\s+me\s+the\s+(api|access|channel|auth|secret|token|key)/i,
  /what('s|\s+is)\s+your\s+(api|openai|line|discord)/i,
  /tell\s+me\s+your\s+(token|key|secret|password)/i,
  /export\s+(LINE_|OPENAI_|GEMINI_|DISCORD_)/i,
  /printenv\s+(LINE_|OPENAI_|GEMINI_)/i,
];
```

### Redaction Examples

| Input | Output |
|-------|--------|
| `LINE_ACCESS_TOKEN=abc123xyz` | `LINE_ACCESS_TOKEN=[REDACTED]` |
| `sk-abc123def456...` | `sk-[REDACTED]` |
| `Bearer eyJhbGci...` | `Bearer [REDACTED]` |

## Allowed Environment Variables

Only these variables are visible to AI agents:

```typescript
const ALLOWED_VARS = [
  "NODE_ENV",
  "CLAWDBOT_GATEWAY_PORT",
  "LOG_LEVEL",
  "ENABLE_AUTO_IMPROVE",
  "ENABLE_AUTO_REPAIR",
  "CLAWDBOT_LOG_DIR",
  "PLUGINS_ENABLED",
  "PLUGINS_DISABLED",
];
```

## Files

```
src/agents/pi-extensions/
├── index.ts           # Main export
├── env-var-guard.ts   # Environment variable guard
├── tool-output-guard.ts # Tool output redaction
└── context-guard.ts   # Prompt sanitization
```

## Integration

### With Auto-Agent Plugin

```typescript
import { createSecurityGuard } from "./src/agents/pi-extensions/index.js";

const security = createSecurityGuard();

agent.onMessage((message) => {
  const check = security.context.detectInjection(message);
  if (check.detected) {
    return { error: "Blocked: " + check.reason };
  }
});
```

### With Session Guard

```typescript
import { installSessionToolResultGuard } from "./session-tool-result-guard.js";
import { guardAllToolResults } from "./tool-output-guard.js";

installSessionToolResultGuard(sessionManager, {
  transformToolResultForPersistence: (msg) => {
    return guardToolResult(msg);
  },
});
```
