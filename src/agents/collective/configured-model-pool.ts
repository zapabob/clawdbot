import { existsSync, readFileSync } from "fs";
import { join } from "path";
import {
  DEFAULT_PROVIDERS,
  getDefaultProviderOrder,
  type ProviderConfig,
  createEnvTemplate,
} from "../../config/default-providers.js";
import { OAuth2Manager, createOAuth2Manager } from "../../infra/oauth2-manager.js";

export interface ConfiguredModel {
  id: string;
  name: string;
  provider: string;
  model: string;
  capabilities: string[];
  maxTokens: number;
  costPer1kTokens: number;
  latency: number;
  isDefault: boolean;
  isAvailable: boolean;
  authStatus: "authenticated" | "unauthenticated" | "not_configured";
}

export interface ModelPoolStatus {
  totalModels: number;
  availableModels: number;
  defaultModel: string;
  models: ConfiguredModel[];
}

export interface QueryResult {
  modelId: string;
  response: string;
  tokens: number;
  latency: number;
  cost: number;
  success: boolean;
  error?: string;
}

export class ConfiguredModelPool {
  private providers: Map<string, ProviderConfig>;
  private oauthManager: OAuth2Manager;
  private envPath: string;

  constructor(envPath: string = ".env") {
    this.envPath = envPath;
    this.oauthManager = createOAuth2Manager(envPath);
    this.providers = new Map();

    for (const provider of getDefaultProviderOrder()) {
      this.providers.set(provider.id, provider);
    }
  }

  initialize(): void {
    if (existsSync(this.envPath)) {
      const content = readFileSync(this.envPath, "utf-8");
      this.updateFromEnv(content);
    }
  }

  private updateFromEnv(envContent: string): void {
    const openaiToken = this.extractValue(envContent, "OPENAI_ACCESS_TOKEN");
    const googleToken = this.extractValue(envContent, "GOOGLE_ACCESS_TOKEN");
    const opencodeToken = this.extractValue(envContent, "OPENCODE_API_KEY");

    const primary = this.providers.get("openai-chatgpt-plus");
    if (primary) {
      primary.enabled = !!openaiToken;
    }

    const secondary = this.providers.get("google-gemini-cli");
    if (secondary) {
      secondary.enabled = !!googleToken;
    }

    const tertiary = this.providers.get("opencode-free");
    if (tertiary) {
      tertiary.enabled = true;
    }
  }

  private extractValue(content: string, key: string): string | undefined {
    const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
    return match?.[1]?.trim();
  }

  getStatus(): ModelPoolStatus {
    const models: ConfiguredModel[] = [];

    for (const provider of this.providers.values()) {
      if (!provider.enabled) continue;

      const authStatus = this.getAuthStatus(provider);

      models.push({
        id: provider.id,
        name: provider.name,
        provider: provider.provider,
        model: provider.model,
        capabilities: provider.capabilities,
        maxTokens: provider.maxTokens,
        costPer1kTokens: provider.costPer1kTokens,
        latency: provider.latency,
        isDefault: provider.type === "primary",
        isAvailable: provider.enabled,
        authStatus,
      });
    }

    return {
      totalModels: this.providers.size,
      availableModels: models.filter((m) => m.isAvailable).length,
      defaultModel: DEFAULT_PROVIDERS.primary.id,
      models,
    };
  }

  private getAuthStatus(
    provider: ProviderConfig,
  ): "authenticated" | "unauthenticated" | "not_configured" {
    if (provider.authType === "free") {
      return "authenticated";
    }

    if (!this.hasClientCredentials(provider)) {
      return "not_configured";
    }

    if (this.oauthManager.isAuthenticated(provider.provider)) {
      return "authenticated";
    }

    return "unauthenticated";
  }

  private hasClientCredentials(provider: ProviderConfig): boolean {
    if (provider.authType === "api_key" || provider.authType === "free") {
      return true;
    }

    const content = existsSync(this.envPath) ? readFileSync(this.envPath, "utf-8") : "";

    const idKey = `${provider.provider.toUpperCase()}_CLIENT_ID`;
    const secretKey = `${provider.provider.toUpperCase()}_CLIENT_SECRET`;

    return (
      this.extractValue(content, idKey) !== undefined &&
      this.extractValue(content, secretKey) !== undefined
    );
  }

  async query(prompt: string, preferredProvider?: string): Promise<QueryResult[]> {
    const results: QueryResult[] = [];

    const order = preferredProvider
      ? await this.getProviderOrder(preferredProvider)
      : getDefaultProviderOrder();

    for (const provider of order) {
      if (!provider.enabled) continue;

      const authStatus = this.getAuthStatus(provider);
      if (authStatus !== "authenticated") {
        results.push({
          modelId: provider.id,
          response: "",
          tokens: 0,
          latency: 0,
          cost: 0,
          success: false,
          error: `Not authenticated: ${authStatus}`,
        });
        continue;
      }

      const result = await this.callModel(provider, prompt);
      results.push(result);
    }

    return results;
  }

  private async getProviderOrder(preferred: string): Promise<ProviderConfig[]> {
    const preferredProvider = this.providers.get(preferred);
    if (!preferredProvider) {
      return getDefaultProviderOrder();
    }

    const order: ProviderConfig[] = [preferredProvider];
    for (const provider of getDefaultProviderOrder()) {
      if (provider.id !== preferred) {
        order.push(provider);
      }
    }
    return order;
  }

  private async callModel(provider: ProviderConfig, prompt: string): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      let response: string;

      switch (provider.provider) {
        case "openai": {
          response = await this.callOpenAI(provider, prompt);
          break;
        }
        case "google": {
          response = await this.callGoogle(provider, prompt);
          break;
        }
        case "opencode": {
          response = await this.callOpencode(prompt);
          break;
        }
        case "codex": {
          response = await this.callCodex(prompt);
          break;
        }
        default: {
          response = `[${provider.name}] ${prompt.slice(0, 100)}...`;
        }
      }

      const tokens = this.estimateTokens(prompt + response);
      const cost = (tokens / 1000) * provider.costPer1kTokens;

      return {
        modelId: provider.id,
        response,
        tokens,
        latency: Date.now() - startTime,
        cost,
        success: true,
      };
    } catch (error) {
      return {
        modelId: provider.id,
        response: "",
        tokens: 0,
        latency: Date.now() - startTime,
        cost: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async callOpenAI(provider: ProviderConfig, prompt: string): Promise<string> {
    const token = await this.oauthManager.ensureValidToken("openai");

    if (!token) {
      throw new Error("OpenAI not authenticated");
    }

    const endpoint = provider.endpoint || "https://api.openai.com/v1/chat/completions";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: provider.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  private async callGoogle(provider: ProviderConfig, prompt: string): Promise<string> {
    const token = await this.oauthManager.ensureValidToken("google");

    if (!token) {
      throw new Error("Google not authenticated");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  private async callOpencode(_prompt: string): Promise<string> {
    return `[Opencode] Free tier - response simulated`;
  }

  private async callCodex(_prompt: string): Promise<string> {
    return `[Codex GPT-5.2] Response simulated`;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  getDefaultProvider(): ProviderConfig | undefined {
    return this.providers.get(DEFAULT_PROVIDERS.primary.id);
  }

  getProvider(id: string): ProviderConfig | undefined {
    return this.providers.get(id);
  }

  getAllProviders(): ProviderConfig[] {
    return Array.from(this.providers.values());
  }

  async authenticate(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    const authUrl = this.oauthManager.getAuthUrl(provider.provider);

    console.log(`Authentication URL for ${provider.name}:`);
    console.log(authUrl);
    console.log("\nVisit this URL to authenticate, then run the callback.");

    return true;
  }

  configureClient(providerId: string, clientId: string, clientSecret: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    this.oauthManager.configureProvider(provider.provider, {
      clientId,
      clientSecret,
    });

    return true;
  }

  exportEnvTemplate(): string {
    return createEnvTemplate();
  }
}

export function createConfiguredModelPool(envPath: string = ".env"): ConfiguredModelPool {
  const pool = new ConfiguredModelPool(envPath);
  pool.initialize();
  return pool;
}
