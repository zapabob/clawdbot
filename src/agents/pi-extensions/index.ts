import { createEnvVarGuard, guardEnvValue, redactEnvVars, filterEnvVarsForAgent, isSensitiveEnvKey, isBlockedEnvKey } from "./env-var-guard.js";
import { createOutputGuard, guardToolResult, guardAllToolResults } from "./tool-output-guard.js";
import { createContextGuard, sanitizePromptForAgent, detectPromptInjection } from "./context-guard.js";

export function createSecurityGuard() {
  const env = createEnvVarGuard();
  const output = createOutputGuard();
  const context = createContextGuard();

  return {
    env,
    output,
    context,
    sanitizeAll: (context: { messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>; env: Record<string, string> }) => {
      return context;
    },
  };
}
