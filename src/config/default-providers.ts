export interface ProviderConfig {
  id: string;
  name: string;
  type: "primary" | "secondary" | "tertiary" | "additional";
  provider: string;
  model: string;
  endpoint?: string;
  authType: "oauth2" | "api_key" | "cli" | "free";
  capabilities: string[];
  costPer1kTokens: number;
  maxTokens: number;
  latency: number;
  enabled: boolean;
}

export interface DefaultProvidersConfig {
  primary: ProviderConfig;
  secondary: ProviderConfig;
  tertiary: ProviderConfig;
  additional: ProviderConfig[];
}

export const DEFAULT_PROVIDERS: DefaultProvidersConfig = {
  primary: {
    id: "google-gemini-cli",
    name: "Google Gemini CLI (OAuth2) - PRIMARY",
    type: "primary",
    provider: "google",
    model: "gemini-2.0-flash-exp",
    authType: "oauth2",
    capabilities: ["code_generation", "code_analysis", "reasoning", "planning", "multimodal"],
    costPer1kTokens: 0.01,
    maxTokens: 1048576,
    latency: 800,
    enabled: true,
  },

  secondary: {
    id: "openai-codex-gpt-5-2",
    name: "OpenAI Codex GPT-5.2 (OAuth2) - FALLBACK",
    type: "secondary",
    provider: "openai-codex",
    model: "gpt-5.2",
    authType: "oauth2",
    capabilities: ["code_generation", "code_optimization", "code_analysis", "refactoring"],
    costPer1kTokens: 0.05,
    maxTokens: 16384,
    latency: 1500,
    enabled: true,
  },

  tertiary: {
    id: "opencode-free",
    name: "Opencode (Free)",
    type: "tertiary",
    provider: "opencode",
    model: "default",
    authType: "free",
    capabilities: ["code_generation", "code_analysis"],
    costPer1kTokens: 0,
    maxTokens: 4096,
    latency: 2000,
    enabled: true,
  },

  additional: [
    {
      id: "openai-chatgpt-plus",
      name: "OpenAI ChatGPT Plus",
      type: "additional",
      provider: "openai",
      model: "gpt-4o",
      authType: "oauth2",
      capabilities: [
        "code_generation",
        "code_analysis",
        "reasoning",
        "planning",
        "debugging",
        "refactoring",
        "documentation",
      ],
      costPer1kTokens: 0.03,
      maxTokens: 8192,
      latency: 1500,
      enabled: true,
    },
  ],
};

export function getProviderById(id: string): ProviderConfig | undefined {
  if (DEFAULT_PROVIDERS.primary.id === id) return DEFAULT_PROVIDERS.primary;
  if (DEFAULT_PROVIDERS.secondary.id === id) return DEFAULT_PROVIDERS.secondary;
  if (DEFAULT_PROVIDERS.tertiary.id === id) return DEFAULT_PROVIDERS.tertiary;
  return DEFAULT_PROVIDERS.additional.find((p) => p.id === id);
}

export function getAllEnabledProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  if (DEFAULT_PROVIDERS.primary.enabled) providers.push(DEFAULT_PROVIDERS.primary);
  if (DEFAULT_PROVIDERS.secondary.enabled) providers.push(DEFAULT_PROVIDERS.secondary);
  if (DEFAULT_PROVIDERS.tertiary.enabled) providers.push(DEFAULT_PROVIDERS.tertiary);

  providers.push(...DEFAULT_PROVIDERS.additional.filter((p) => p.enabled));

  return providers;
}

export function getDefaultProviderOrder(): ProviderConfig[] {
  return [
    DEFAULT_PROVIDERS.primary,
    DEFAULT_PROVIDERS.secondary,
    DEFAULT_PROVIDERS.tertiary,
    ...DEFAULT_PROVIDERS.additional.filter((p) => p.enabled),
  ];
}

export function createEnvTemplate(): string {
  return `# ============================================
# AI Providers Configuration (Auto-generated)
# ============================================

# Google Gemini CLI (Primary - OAuth2)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_ACCESS_TOKEN=
GOOGLE_REFRESH_TOKEN=
GOOGLE_TOKEN_EXPIRY=

# OpenAI Codex GPT-5.2 (Secondary - OAuth2)
CODEX_CLIENT_ID=your_codex_client_id
CODEX_CLIENT_SECRET=your_codex_client_secret
CODEX_ACCESS_TOKEN=
CODEX_REFRESH_TOKEN=
CODEX_TOKEN_EXPIRY=

# Opencode (Tertiary - Free)
OPENCODE_API_KEY=  # Free tier - no key required

# OpenAI ChatGPT Plus (Additional - OAuth2)
OPENAI_CLIENT_ID=your_openai_client_id
OPENAI_CLIENT_SECRET=your_openai_client_secret
OPENAI_ACCESS_TOKEN=
OPENAI_REFRESH_TOKEN=
OPENAI_TOKEN_EXPIRY=

# Default Provider Selection
DEFAULT_PRIMARY_PROVIDER=google-gemini-cli
DEFAULT_SECONDARY_PROVIDER=openai-codex-gpt-5-2
DEFAULT_TERTIARY_PROVIDER=opencode-free
 `;
}

export function parseEnvForProviders(envContent: string): Record<string, string> {
  const values: Record<string, string> = {};

  const patterns = [
    /^OPENAI_CLIENT_ID=(.+)$/m,
    /^OPENAI_CLIENT_SECRET=(.+)$/m,
    /^OPENAI_ACCESS_TOKEN=(.+)$/m,
    /^OPENAI_REFRESH_TOKEN=(.+)$/m,
    /^GOOGLE_CLIENT_ID=(.+)$/m,
    /^GOOGLE_CLIENT_SECRET=(.+)$/m,
    /^GOOGLE_ACCESS_TOKEN=(.+)$/m,
    /^GOOGLE_REFRESH_TOKEN=(.+)$/m,
    /^OPENCODE_API_KEY=(.+)$/m,
    /^CODEX_CLIENT_ID=(.+)$/m,
    /^CODEX_CLIENT_SECRET=(.+)$/m,
    /^CODEX_ACCESS_TOKEN=(.+)$/m,
    /^CODEX_REFRESH_TOKEN=(.+)$/m,
  ];

  for (const pattern of patterns) {
    const match = envContent.match(pattern);
    if (match) {
      const key = pattern.source.match(/^(\^[A-Z_]+)/)?.[1];
      if (key) {
        values[key] = match[1].trim();
      }
    }
  }

  return values;
}
