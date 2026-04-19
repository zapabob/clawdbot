import {
  definePluginEntry,
  type OpenClawPluginApi,
  type ProviderAuthMethodNonInteractiveContext,
} from "openclaw/plugin-sdk/plugin-entry";
import {
  LLAMA_CPP_DEFAULT_API_KEY_ENV_VAR,
  LLAMA_CPP_DEFAULT_BASE_URL,
  LLAMA_CPP_DEFAULT_MODEL_ENV_VAR,
  LLAMA_CPP_MODEL_PLACEHOLDER,
  LLAMA_CPP_PROVIDER_LABEL,
  buildLlamaCppUnknownModelHint,
  buildLlamaCppProvider,
  resolveLlamaCppConfiguredModelId,
} from "./api.js";

const PROVIDER_ID = "llama-cpp";

async function loadProviderSetup() {
  return await import("openclaw/plugin-sdk/provider-setup");
}

export default definePluginEntry({
  id: "llama-cpp",
  name: "llama.cpp Provider",
  description: "Bundled llama.cpp provider plugin",
  register(api: OpenClawPluginApi) {
    api.registerProvider({
      id: PROVIDER_ID,
      label: "llama.cpp",
      docsPath: "/providers/llama-cpp",
      envVars: [LLAMA_CPP_DEFAULT_API_KEY_ENV_VAR, LLAMA_CPP_DEFAULT_MODEL_ENV_VAR],
      auth: [
        {
          id: "custom",
          label: LLAMA_CPP_PROVIDER_LABEL,
          hint: "Local/self-hosted OpenAI-compatible server",
          kind: "custom",
          run: async (ctx) => {
            const providerSetup = await loadProviderSetup();
            return await providerSetup.promptAndConfigureOpenAICompatibleSelfHostedProviderAuth({
              cfg: ctx.config,
              prompter: ctx.prompter,
              providerId: PROVIDER_ID,
              providerLabel: LLAMA_CPP_PROVIDER_LABEL,
              defaultBaseUrl: LLAMA_CPP_DEFAULT_BASE_URL,
              defaultApiKeyEnvVar: LLAMA_CPP_DEFAULT_API_KEY_ENV_VAR,
              modelPlaceholder: LLAMA_CPP_MODEL_PLACEHOLDER,
            });
          },
          runNonInteractive: async (ctx: ProviderAuthMethodNonInteractiveContext) => {
            const providerSetup = await loadProviderSetup();
            const modelId = resolveLlamaCppConfiguredModelId({
              customModelId: ctx.opts.customModelId,
              env: process.env,
            });
            return await providerSetup.configureOpenAICompatibleSelfHostedProviderNonInteractive({
              ctx: modelId
                ? {
                    ...ctx,
                    opts: {
                      ...ctx.opts,
                      customModelId: modelId,
                    },
                  }
                : ctx,
              providerId: PROVIDER_ID,
              providerLabel: LLAMA_CPP_PROVIDER_LABEL,
              defaultBaseUrl: LLAMA_CPP_DEFAULT_BASE_URL,
              defaultApiKeyEnvVar: LLAMA_CPP_DEFAULT_API_KEY_ENV_VAR,
              modelPlaceholder: LLAMA_CPP_MODEL_PLACEHOLDER,
            });
          },
        },
      ],
      discovery: {
        order: "late",
        run: async (ctx) => {
          const providerSetup = await loadProviderSetup();
          return await providerSetup.discoverOpenAICompatibleSelfHostedProvider({
            ctx,
            providerId: PROVIDER_ID,
            buildProvider: buildLlamaCppProvider,
          });
        },
      },
      wizard: {
        setup: {
          choiceId: "llama-cpp",
          choiceLabel: "llama.cpp",
          choiceHint: "Local/self-hosted OpenAI-compatible server",
          groupId: "llama-cpp",
          groupLabel: "llama.cpp",
          groupHint: "Local/self-hosted OpenAI-compatible",
          methodId: "custom",
        },
        modelPicker: {
          label: "llama.cpp (custom)",
          hint: "Enter llama.cpp URL + API key + model",
          methodId: "custom",
        },
      },
      buildUnknownModelHint: buildLlamaCppUnknownModelHint,
    });
  },
});
