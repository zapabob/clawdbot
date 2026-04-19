import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LLAMA_CPP_DEFAULT_API_KEY_ENV_VAR,
  LLAMA_CPP_DEFAULT_BASE_URL,
  LLAMA_CPP_PROVIDER_LABEL,
  LLAMA_CPP_MODEL_PLACEHOLDER,
} from "./defaults.js";
import { buildLlamaCppProvider } from "./models.js";
import { createTestPluginApi } from "../../test/helpers/plugins/plugin-api.js";
import plugin from "./index.js";

const promptAndConfigureOpenAICompatibleSelfHostedProviderAuthMock = vi.hoisted(() =>
  vi.fn(async () => ({
    configPatch: {
      models: {
        providers: {
          "llama-cpp": {
            baseUrl: LLAMA_CPP_DEFAULT_BASE_URL,
            api: "openai-completions",
            models: [],
          },
        },
      },
    },
  })),
);
const configureOpenAICompatibleSelfHostedProviderNonInteractiveMock = vi.hoisted(() =>
  vi.fn(async () => ({
    configPatch: {
      models: {
        providers: {
          "llama-cpp": {
            baseUrl: LLAMA_CPP_DEFAULT_BASE_URL,
            api: "openai-completions",
            models: [],
          },
        },
      },
    },
  })),
);
const discoverOpenAICompatibleLocalModelsMock = vi.hoisted(() => vi.fn());
const discoverOpenAICompatibleSelfHostedProviderMock = vi.hoisted(() => vi.fn());

vi.mock("openclaw/plugin-sdk/provider-setup", () => ({
  discoverOpenAICompatibleLocalModels: discoverOpenAICompatibleLocalModelsMock,
  promptAndConfigureOpenAICompatibleSelfHostedProviderAuth:
    promptAndConfigureOpenAICompatibleSelfHostedProviderAuthMock,
  configureOpenAICompatibleSelfHostedProviderNonInteractive:
    configureOpenAICompatibleSelfHostedProviderNonInteractiveMock,
  discoverOpenAICompatibleSelfHostedProvider: discoverOpenAICompatibleSelfHostedProviderMock,
}));

function registerProviderWithPluginConfig(pluginConfig?: Record<string, unknown>) {
  const registerProviderMock = vi.fn();

  plugin.register(
    createTestPluginApi({
      id: "llama-cpp",
      name: "llama.cpp Provider",
      source: "test",
      config: {},
      pluginConfig,
      runtime: {} as never,
      registerProvider: registerProviderMock,
    }),
  );

  expect(registerProviderMock).toHaveBeenCalledTimes(1);
  return registerProviderMock.mock.calls[0]?.[0];
}

function registerProvider() {
  return registerProviderWithPluginConfig({});
}

describe("llama-cpp provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses interactive self-hosted auth with llama.cpp defaults", async () => {
    const provider = registerProvider();

    const result = await provider.auth[0].run({
      config: {},
      env: {},
      agentDir: undefined,
      workspaceDir: undefined,
      prompter: {} as never,
      runtime: {} as never,
      isRemote: false,
      openUrl: vi.fn(async () => undefined),
      oauth: { createVpsAwareHandlers: vi.fn() } as never,
      secretInputMode: undefined,
      opts: {},
      allowSecretRefPrompt: false,
    } as never);

    expect(promptAndConfigureOpenAICompatibleSelfHostedProviderAuthMock).toHaveBeenCalledWith({
      cfg: {},
      prompter: expect.anything(),
      providerId: "llama-cpp",
      providerLabel: LLAMA_CPP_PROVIDER_LABEL,
      defaultBaseUrl: LLAMA_CPP_DEFAULT_BASE_URL,
      defaultApiKeyEnvVar: LLAMA_CPP_DEFAULT_API_KEY_ENV_VAR,
      modelPlaceholder: LLAMA_CPP_MODEL_PLACEHOLDER,
    });
    expect(result).toEqual({
      configPatch: {
        models: {
          providers: {
            "llama-cpp": {
              baseUrl: LLAMA_CPP_DEFAULT_BASE_URL,
              api: "openai-completions",
              models: [],
            },
          },
        },
      },
    });
  });

  it("uses non-interactive self-hosted auth helper with llama.cpp defaults", async () => {
    const provider = registerProvider();
    const context = {
      authChoice: "custom",
      config: {},
      baseConfig: {},
      opts: {},
      runtime: {} as never,
      resolveApiKey: vi.fn(async () => ({ key: "k", source: "env", envVarName: "LLAMA_CPP_API_KEY" })),
      toApiKeyCredential: vi.fn(async () => ({ type: "api_key", data: "k" })),
    };

    const result = await provider.auth[0].runNonInteractive?.(context as never);

    expect(configureOpenAICompatibleSelfHostedProviderNonInteractiveMock).toHaveBeenCalledWith({
      ctx: context,
      providerId: "llama-cpp",
      providerLabel: LLAMA_CPP_PROVIDER_LABEL,
      defaultBaseUrl: LLAMA_CPP_DEFAULT_BASE_URL,
      defaultApiKeyEnvVar: LLAMA_CPP_DEFAULT_API_KEY_ENV_VAR,
      modelPlaceholder: LLAMA_CPP_MODEL_PLACEHOLDER,
    });
    expect(result).toEqual({
      configPatch: {
        models: {
          providers: {
            "llama-cpp": {
              baseUrl: LLAMA_CPP_DEFAULT_BASE_URL,
              api: "openai-completions",
              models: [],
            },
          },
        },
      },
    });
  });

  it("discovers the provider using openai-compatible self-hosted discovery", async () => {
    discoverOpenAICompatibleSelfHostedProviderMock.mockResolvedValue("discover-result");
    const provider = registerProvider();

    const result = await provider.discovery.run({
      config: {},
      agentDir: undefined,
      workspaceDir: undefined,
      env: {},
      resolveProviderApiKey: () => ({ apiKey: "abc", discoveryApiKey: "abc" }),
      resolveProviderAuth: () => ({ apiKey: "abc", mode: "api_key", source: "env" }),
    } as never);

    expect(discoverOpenAICompatibleSelfHostedProviderMock).toHaveBeenCalledWith({
      ctx: expect.objectContaining({
        config: {},
        env: {},
        resolveProviderApiKey: expect.any(Function),
        resolveProviderAuth: expect.any(Function),
      }),
      providerId: "llama-cpp",
      buildProvider: expect.any(Function),
    });
    expect(result).toBe("discover-result");
  });

  it("builds providers from /v1/models with trimmed baseUrl", async () => {
    discoverOpenAICompatibleLocalModelsMock.mockResolvedValue([
      { id: "llama-3.1", input: ["text"], reasoning: false },
    ]);
    const result = await buildLlamaCppProvider({
      baseUrl: "http://127.0.0.1:8080/v1/",
      apiKey: "abc",
    });

    expect(discoverOpenAICompatibleLocalModelsMock).toHaveBeenCalledWith({
      baseUrl: "http://127.0.0.1:8080/v1",
      apiKey: "abc",
      label: "llama.cpp",
    });
    expect(result).toEqual({
      baseUrl: "http://127.0.0.1:8080/v1",
      api: "openai-completions",
      models: [{ id: "llama-3.1", input: ["text"], reasoning: false }],
    });
  });
});
