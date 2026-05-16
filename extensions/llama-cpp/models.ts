import type { OpenClawConfig } from "openclaw/plugin-sdk/config-runtime";
import {
  SELF_HOSTED_DEFAULT_CONTEXT_WINDOW,
  SELF_HOSTED_DEFAULT_COST,
  SELF_HOSTED_DEFAULT_MAX_TOKENS,
  discoverOpenAICompatibleLocalModels,
} from "openclaw/plugin-sdk/provider-setup";
import { LLAMA_CPP_DEFAULT_BASE_URL, LLAMA_CPP_PROVIDER_LABEL } from "./defaults.js";

type ModelsConfig = NonNullable<OpenClawConfig["models"]>;
type ProviderConfig = NonNullable<ModelsConfig["providers"]>[string];

export async function buildLlamaCppProvider(params?: {
  baseUrl?: string;
  apiKey?: string;
  modelId?: string;
}): Promise<ProviderConfig> {
  const baseUrl = (params?.baseUrl?.trim() || LLAMA_CPP_DEFAULT_BASE_URL).replace(/\/+$/, "");
  const configuredModelId = params?.modelId?.trim();
  const models = configuredModelId
    ? [
        {
          id: configuredModelId,
          name: configuredModelId,
          reasoning: false,
          input: ["text" as const],
          cost: SELF_HOSTED_DEFAULT_COST,
          contextWindow: SELF_HOSTED_DEFAULT_CONTEXT_WINDOW,
          maxTokens: SELF_HOSTED_DEFAULT_MAX_TOKENS,
        },
      ]
    : await discoverOpenAICompatibleLocalModels({
        baseUrl,
        apiKey: params?.apiKey,
        label: LLAMA_CPP_PROVIDER_LABEL,
      });
  return {
    baseUrl,
    api: "openai-completions",
    models,
  };
}
