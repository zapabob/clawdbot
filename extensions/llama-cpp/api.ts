export {
  LLAMA_CPP_DEFAULT_API_KEY_ENV_VAR,
  LLAMA_CPP_DEFAULT_BASE_URL,
  LLAMA_CPP_DEFAULT_MODEL_ENV_VAR,
  LLAMA_CPP_MODEL_PLACEHOLDER,
  LLAMA_CPP_PROVIDER_LABEL,
} from "./defaults.js";
export { buildLlamaCppProvider } from "./models.js";

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function resolveLlamaCppConfiguredModelId(params: {
  customModelId?: unknown;
  env?: NodeJS.ProcessEnv;
}): string | undefined {
  return (
    normalizeOptionalString(params.customModelId) ??
    normalizeOptionalString(params.env?.LLAMA_CPP_MODEL)
  );
}

export function buildLlamaCppUnknownModelHint(): string {
  return (
    "llama.cpp requires authentication to be registered as a provider. " +
    'Set LLAMA_CPP_API_KEY (any value works) and optionally LLAMA_CPP_MODEL, or run "openclaw configure". ' +
    "See: https://docs.openclaw.ai/providers/llama-cpp"
  );
}
