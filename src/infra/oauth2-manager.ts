import { exec, execSync } from "child_process";
import { promisify } from "util";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  provider: string;
}

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
  scope: string;
}

export interface OAuth2State {
  codeVerifier: string;
  provider: string;
  redirectUri: string;
  timestamp: Date;
}

export interface OAuth2Result {
  success: boolean;
  tokens?: OAuth2Tokens;
  error?: string;
}

export interface OAuth2Provider {
  name: string;
  config: OAuth2Config;
  getAuthUrl: (state: string, codeVerifier?: string) => string;
  exchangeCode: (code: string, codeVerifier?: string) => Promise<OAuth2Result>;
  refreshToken: (refreshToken: string) => Promise<OAuth2Result>;
}

const PROVIDERS: Record<string, OAuth2Provider> = {
  openai: {
    name: "OpenAI",
    config: {
      clientId: "",
      clientSecret: "",
      redirectUri: "http://localhost:3000/oauth/callback/openai",
      scopes: ["openai", "organizations.read"],
      authUrl: "https://platform.openai.com/oauth/authorize",
      tokenUrl: "https://platform.openai.com/oauth/token",
      provider: "openai",
    },
    getAuthUrl(state: string, codeVerifier?: string): string {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        response_type: "code",
        scope: this.config.scopes.join(" "),
        state,
      });
      return `${this.config.authUrl}?${params.toString()}`;
    },
    async exchangeCode(code: string, codeVerifier?: string): Promise<OAuth2Result> {
      try {
        const response = await fetch(this.config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            code,
            redirect_uri: this.config.redirectUri,
            grant_type: "authorization_code",
          }),
        });

        const data = await response.json();

        if (data.error) {
          return { success: false, error: data.error_description || data.error };
        }

        return {
          success: true,
          tokens: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
            tokenType: data.token_type || "Bearer",
            scope: data.scope || "",
          },
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
    async refreshToken(refreshToken: string): Promise<OAuth2Result> {
      try {
        const response = await fetch(this.config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });

        const data = await response.json();

        if (data.error) {
          return { success: false, error: data.error_description || data.error };
        }

        return {
          success: true,
          tokens: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || refreshToken,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
            tokenType: data.token_type || "Bearer",
            scope: data.scope || "",
          },
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
  },

  google: {
    name: "Google",
    config: {
      clientId: "",
      clientSecret: "",
      redirectUri: "http://localhost:3000/oauth/callback/google",
      scopes: [
        "https://www.googleapis.com/auth/generative-language",
        "https://www.googleapis.com/auth/cloud-platform",
      ],
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      provider: "google",
    },
    getAuthUrl(state: string, codeVerifier?: string): string {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        response_type: "code",
        scope: this.config.scopes.join(" "),
        state,
        access_type: "offline",
        prompt: "consent",
      });
      return `${this.config.authUrl}?${params.toString()}`;
    },
    async exchangeCode(code: string): Promise<OAuth2Result> {
      try {
        const response = await fetch(this.config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            code,
            redirect_uri: this.config.redirectUri,
            grant_type: "authorization_code",
          }),
        });

        const data = await response.json();

        if (data.error) {
          return { success: false, error: data.error_description || data.error };
        }

        return {
          success: true,
          tokens: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
            tokenType: "Bearer",
            scope: data.scope || "",
          },
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
    async refreshToken(refreshToken: string): Promise<OAuth2Result> {
      try {
        const response = await fetch(this.config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });

        const data = await response.json();

        if (data.error) {
          return { success: false, error: data.error_description || data.error };
        }

        return {
          success: true,
          tokens: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || refreshToken,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
            tokenType: "Bearer",
            scope: data.scope || "",
          },
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
  },
};

export class OAuth2Manager {
  private tokenStore: Map<string, OAuth2Tokens>;
  private stateStore: Map<string, OAuth2State>;
  private envPath: string;

  constructor(envPath: string = ".env") {
    this.tokenStore = new Map();
    this.stateStore = new Map();
    this.envPath = envPath;
    this.loadTokensFromEnv();
  }

  private loadTokensFromEnv(): void {
    if (!existsSync(this.envPath)) {
      return;
    }

    const content = readFileSync(this.envPath, "utf-8");
    const lines = content.split("\n");

    const tokenPatterns: Record<string, string[]> = {
      openai: ["OPENAI_ACCESS_TOKEN", "OPENAI_REFRESH_TOKEN"],
      google: ["GOOGLE_ACCESS_TOKEN", "GOOGLE_REFRESH_TOKEN"],
    };

    for (const [provider, patterns] of Object.entries(tokenPatterns)) {
      const accessToken = this.extractEnvValue(lines, patterns[0]);
      const refreshToken = this.extractEnvValue(lines, patterns[1]);

      if (accessToken) {
        this.tokenStore.set(`${provider}_access`, {
          accessToken,
          refreshToken: refreshToken || "",
          expiresAt: new Date(Date.now() + 3600000),
          tokenType: "Bearer",
          scope: "",
        });
      }
    }
  }

  private extractEnvValue(lines: string[], key: string): string | undefined {
    for (const line of lines) {
      const match = line.match(new RegExp(`^${key}=(.+)`));
      if (match) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  saveTokenToEnv(provider: string, tokens: OAuth2Tokens): void {
    if (!existsSync(this.envPath)) {
      writeFileSync(this.envPath, "", "utf-8");
    }

    const content = readFileSync(this.envPath, "utf-8");
    const lines = content.split("\n");
    const updatedLines: string[] = [];

    const tokenMappings: Record<string, [string, string]> = {
      openai: ["OPENAI_ACCESS_TOKEN", "OPENAI_REFRESH_TOKEN"],
      google: ["GOOGLE_ACCESS_TOKEN", "GOOGLE_REFRESH_TOKEN"],
    };

    const [accessKey, refreshKey] = tokenMappings[provider] || [];

    for (const line of lines) {
      if (accessKey && line.startsWith(`${accessKey}=`)) {
        updatedLines.push(`${accessKey}=${tokens.accessToken}`);
      } else if (refreshKey && line.startsWith(`${refreshKey}=`)) {
        updatedLines.push(`${refreshKey}=${tokens.refreshToken}`);
      } else {
        updatedLines.push(line);
      }
    }

    if (accessKey && !updatedLines.find((l) => l.startsWith(`${accessKey}=`))) {
      updatedLines.push(`${accessKey}=${tokens.accessToken}`);
    }
    if (
      refreshKey &&
      tokens.refreshToken &&
      !updatedLines.find((l) => l.startsWith(`${refreshKey}=`))
    ) {
      updatedLines.push(`${refreshKey}=${tokens.refreshToken}`);
    }

    writeFileSync(this.envPath, updatedLines.join("\n"), "utf-8");
  }

  getProvider(name: string): OAuth2Provider | undefined {
    return PROVIDERS[name] || PROVIDERS[name.toLowerCase()];
  }

  configureProvider(name: string, config: Partial<OAuth2Config>): boolean {
    const provider = this.getProvider(name);
    if (!provider) {
      return false;
    }

    provider.config = { ...provider.config, ...config };
    return true;
  }

  getAuthUrl(provider: string, redirectUri?: string): string | null {
    const prov = this.getProvider(provider);
    if (!prov) {
      return null;
    }

    const state = randomUUID();
    const stateData: OAuth2State = {
      codeVerifier: "",
      provider,
      redirectUri: redirectUri || prov.config.redirectUri,
      timestamp: new Date(),
    };

    this.stateStore.set(state, stateData);

    if (redirectUri) {
      prov.config.redirectUri = redirectUri;
    }

    return prov.getAuthUrl(state);
  }

  async handleCallback(provider: string, code: string, state: string): Promise<OAuth2Result> {
    const stateData = this.stateStore.get(state);

    if (!stateData || stateData.provider !== provider) {
      return { success: false, error: "Invalid state parameter" };
    }

    this.stateStore.delete(state);

    const prov = this.getProvider(provider);
    if (!prov) {
      return { success: false, error: "Unknown provider" };
    }

    const result = await prov.exchangeCode(code);

    if (result.success && result.tokens) {
      this.tokenStore.set(`${provider}_access`, result.tokens);
      this.saveTokenToEnv(provider, result.tokens);
    }

    return result;
  }

  async refreshAccessToken(provider: string): Promise<OAuth2Result> {
    const prov = this.getProvider(provider);
    if (!prov) {
      return { success: false, error: "Unknown provider" };
    }

    const tokens = this.tokenStore.get(`${provider}_access`);
    if (!tokens?.refreshToken) {
      return { success: false, error: "No refresh token available" };
    }

    const result = await prov.refreshToken(tokens.refreshToken);

    if (result.success && result.tokens) {
      this.tokenStore.set(`${provider}_access`, result.tokens);
      this.saveTokenToEnv(provider, result.tokens);
    }

    return result;
  }

  getAccessToken(provider: string): string | undefined {
    return this.tokenStore.get(`${provider}_access`)?.accessToken;
  }

  isAuthenticated(provider: string): boolean {
    const tokens = this.tokenStore.get(`${provider}_access`);
    if (!tokens) {
      return false;
    }
    return tokens.expiresAt.getTime() > Date.now();
  }

  getTokenExpiry(provider: string): Date | undefined {
    return this.tokenStore.get(`${provider}_access`)?.expiresAt;
  }

  async ensureValidToken(provider: string): Promise<string | null> {
    const tokens = this.tokenStore.get(`${provider}_access`);

    if (!tokens) {
      return null;
    }

    const expiresIn = tokens.expiresAt.getTime() - Date.now();

    if (expiresIn < 300000) {
      const result = await this.refreshAccessToken(provider);
      if (result.success && result.tokens) {
        return result.tokens.accessToken;
      }
    }

    return tokens.accessToken || null;
  }

  clearTokens(provider?: string): void {
    if (provider) {
      this.tokenStore.delete(`${provider}_access`);
    } else {
      this.tokenStore.clear();
    }
  }
}

export function createOAuth2Manager(envPath: string = ".env"): OAuth2Manager {
  return new OAuth2Manager(envPath);
}
