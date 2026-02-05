// Defaults for agent metadata when upstream does not supply them.
// Model id uses Codex GPT-5.2 as the primary model.
export const DEFAULT_PROVIDER = "openai-codex";
export const DEFAULT_MODEL = "gpt-5.2";
// Context window: GPT-5.2 supports ~400k tokens.
export const DEFAULT_CONTEXT_TOKENS = 400_000;
