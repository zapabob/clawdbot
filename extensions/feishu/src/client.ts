import { createRequire } from "node:module";
import type * as Lark from "@larksuiteoapi/node-sdk";
import type { HttpsProxyAgent } from "https-proxy-agent";
import type { FeishuConfig, FeishuDomain, ResolvedFeishuAccount } from "./types.js";

type FeishuClientSdk = Pick<
  typeof Lark,
  | "AppType"
  | "Client"
  | "defaultHttpInstance"
  | "Domain"
  | "EventDispatcher"
  | "LoggerLevel"
  | "WSClient"
>;

type HttpsProxyAgentCtor = typeof import("https-proxy-agent").HttpsProxyAgent;
type FeishuClientInstance = InstanceType<FeishuClientSdk["Client"]>;
type FeishuWSClientInstance = InstanceType<FeishuClientSdk["WSClient"]>;
type FeishuEventDispatcherInstance = InstanceType<FeishuClientSdk["EventDispatcher"]>;
type LarkHttpInstance = import("@larksuiteoapi/node-sdk").HttpInstance;
type LarkHttpRequestOptions<D> = import("@larksuiteoapi/node-sdk").HttpRequestOptions<D>;

const require = createRequire(import.meta.url);

let defaultFeishuClientSdk: FeishuClientSdk | null = null;
let defaultHttpsProxyAgentCtor: HttpsProxyAgentCtor | null = null;
let feishuClientSdk: FeishuClientSdk | null = null;
let httpsProxyAgentCtor: HttpsProxyAgentCtor | null = null;

function loadDefaultFeishuClientSdk(): FeishuClientSdk {
  if (!defaultFeishuClientSdk) {
    const larkRuntime = require("@larksuiteoapi/node-sdk") as typeof import("@larksuiteoapi/node-sdk");
    defaultFeishuClientSdk = {
      AppType: larkRuntime.AppType,
      Client: larkRuntime.Client,
      defaultHttpInstance: larkRuntime.defaultHttpInstance,
      Domain: larkRuntime.Domain,
      EventDispatcher: larkRuntime.EventDispatcher,
      LoggerLevel: larkRuntime.LoggerLevel,
      WSClient: larkRuntime.WSClient,
    };
  }
  return defaultFeishuClientSdk;
}

function resolveFeishuClientSdk(): FeishuClientSdk {
  if (!feishuClientSdk) {
    feishuClientSdk = loadDefaultFeishuClientSdk();
  }
  return feishuClientSdk;
}

function loadDefaultHttpsProxyAgentCtor(): HttpsProxyAgentCtor {
  if (!defaultHttpsProxyAgentCtor) {
    defaultHttpsProxyAgentCtor = (
      require("https-proxy-agent") as typeof import("https-proxy-agent")
    ).HttpsProxyAgent;
  }
  return defaultHttpsProxyAgentCtor;
}

function resolveHttpsProxyAgentCtor(): HttpsProxyAgentCtor {
  if (!httpsProxyAgentCtor) {
    httpsProxyAgentCtor = loadDefaultHttpsProxyAgentCtor();
  }
  return httpsProxyAgentCtor;
}

/** Default HTTP timeout for Feishu API requests (30 seconds). */
export const FEISHU_HTTP_TIMEOUT_MS = 30_000;
export const FEISHU_HTTP_TIMEOUT_MAX_MS = 300_000;
export const FEISHU_HTTP_TIMEOUT_ENV_VAR = "OPENCLAW_FEISHU_HTTP_TIMEOUT_MS";

type FeishuHttpInstanceLike = Pick<
  FeishuClientSdk["defaultHttpInstance"],
  "request" | "get" | "post" | "put" | "patch" | "delete" | "head" | "options"
>;

function getWsProxyAgent(): HttpsProxyAgent<string> | undefined {
  const proxyUrl =
    process.env.https_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.http_proxy ||
    process.env.HTTP_PROXY;
  if (!proxyUrl) return undefined;
  return new (resolveHttpsProxyAgentCtor())(proxyUrl);
}

// Multi-account client cache
const clientCache = new Map<
  string,
  {
    client: FeishuClientInstance;
    config: { appId: string; appSecret: string; domain?: FeishuDomain; httpTimeoutMs: number };
  }
>();

function resolveDomain(domain: FeishuDomain | undefined): string {
  const sdk = resolveFeishuClientSdk();
  if (domain === "lark") {
    return sdk.Domain.Lark;
  }
  if (domain === "feishu" || !domain) {
    return sdk.Domain.Feishu;
  }
  return domain.replace(/\/+$/, ""); // Custom URL for private deployment
}

/**
 * Create an HTTP instance that delegates to the Lark SDK's default instance
 * but injects a default request timeout to prevent indefinite hangs
 * (e.g. when the Feishu API is slow, causing per-chat queue deadlocks).
 */
function createTimeoutHttpInstance(defaultTimeoutMs: number): LarkHttpInstance {
  const base: FeishuHttpInstanceLike = resolveFeishuClientSdk().defaultHttpInstance;

  function injectTimeout<D>(opts?: LarkHttpRequestOptions<D>): LarkHttpRequestOptions<D> {
    return { timeout: defaultTimeoutMs, ...opts } as LarkHttpRequestOptions<D>;
  }

  return {
    request: (opts) => base.request(injectTimeout(opts)),
    get: (url, opts) => base.get(url, injectTimeout(opts)),
    post: (url, data, opts) => base.post(url, data, injectTimeout(opts)),
    put: (url, data, opts) => base.put(url, data, injectTimeout(opts)),
    patch: (url, data, opts) => base.patch(url, data, injectTimeout(opts)),
    delete: (url, opts) => base.delete(url, injectTimeout(opts)),
    head: (url, opts) => base.head(url, injectTimeout(opts)),
    options: (url, opts) => base.options(url, injectTimeout(opts)),
  };
}

/**
 * Credentials needed to create a Feishu client.
 * Both FeishuConfig and ResolvedFeishuAccount satisfy this interface.
 */
export type FeishuClientCredentials = {
  accountId?: string;
  appId?: string;
  appSecret?: string;
  domain?: FeishuDomain;
  httpTimeoutMs?: number;
  config?: Pick<FeishuConfig, "httpTimeoutMs">;
};

function resolveConfiguredHttpTimeoutMs(creds: FeishuClientCredentials): number {
  const clampTimeout = (value: number): number => {
    const rounded = Math.floor(value);
    return Math.min(Math.max(rounded, 1), FEISHU_HTTP_TIMEOUT_MAX_MS);
  };

  const fromDirectField = creds.httpTimeoutMs;
  if (
    typeof fromDirectField === "number" &&
    Number.isFinite(fromDirectField) &&
    fromDirectField > 0
  ) {
    return clampTimeout(fromDirectField);
  }

  const envRaw = process.env[FEISHU_HTTP_TIMEOUT_ENV_VAR];
  if (envRaw) {
    const envValue = Number(envRaw);
    if (Number.isFinite(envValue) && envValue > 0) {
      return clampTimeout(envValue);
    }
  }

  const fromConfig = creds.config?.httpTimeoutMs;
  const timeout = fromConfig;
  if (typeof timeout !== "number" || !Number.isFinite(timeout) || timeout <= 0) {
    return FEISHU_HTTP_TIMEOUT_MS;
  }
  return clampTimeout(timeout);
}

/**
 * Create or get a cached Feishu client for an account.
 * Accepts any object with appId, appSecret, and optional domain/accountId.
 */
export function createFeishuClient(creds: FeishuClientCredentials): FeishuClientInstance {
  const { accountId = "default", appId, appSecret, domain } = creds;
  const defaultHttpTimeoutMs = resolveConfiguredHttpTimeoutMs(creds);
  const sdk = resolveFeishuClientSdk();

  if (!appId || !appSecret) {
    throw new Error(`Feishu credentials not configured for account "${accountId}"`);
  }

  // Check cache
  const cached = clientCache.get(accountId);
  if (
    cached &&
    cached.config.appId === appId &&
    cached.config.appSecret === appSecret &&
    cached.config.domain === domain &&
    cached.config.httpTimeoutMs === defaultHttpTimeoutMs
  ) {
    return cached.client;
  }

  // Create new client with timeout-aware HTTP instance
  const client = new sdk.Client({
    appId,
    appSecret,
    appType: sdk.AppType.SelfBuild,
    domain: resolveDomain(domain),
    httpInstance: createTimeoutHttpInstance(defaultHttpTimeoutMs),
  });

  // Cache it
  clientCache.set(accountId, {
    client,
    config: { appId, appSecret, domain, httpTimeoutMs: defaultHttpTimeoutMs },
  });

  return client;
}

/**
 * Create a Feishu WebSocket client for an account.
 * Note: WSClient is not cached since each call creates a new connection.
 */
export function createFeishuWSClient(account: ResolvedFeishuAccount): FeishuWSClientInstance {
  const { accountId, appId, appSecret, domain } = account;
  const sdk = resolveFeishuClientSdk();

  if (!appId || !appSecret) {
    throw new Error(`Feishu credentials not configured for account "${accountId}"`);
  }

  const agent = getWsProxyAgent();
  return new sdk.WSClient({
    appId,
    appSecret,
    domain: resolveDomain(domain),
    loggerLevel: sdk.LoggerLevel.info,
    ...(agent ? { agent } : {}),
  });
}

/**
 * Create an event dispatcher for an account.
 */
export function createEventDispatcher(
  account: ResolvedFeishuAccount,
): FeishuEventDispatcherInstance {
  return new (resolveFeishuClientSdk()).EventDispatcher({
    encryptKey: account.encryptKey,
    verificationToken: account.verificationToken,
  });
}

/**
 * Get a cached client for an account (if exists).
 */
export function getFeishuClient(accountId: string): FeishuClientInstance | null {
  return clientCache.get(accountId)?.client ?? null;
}

/**
 * Clear client cache for a specific account or all accounts.
 */
export function clearClientCache(accountId?: string): void {
  if (accountId) {
    clientCache.delete(accountId);
  } else {
    clientCache.clear();
  }
}

export function setFeishuClientRuntimeForTest(overrides?: {
  sdk?: Partial<FeishuClientSdk>;
  HttpsProxyAgent?: HttpsProxyAgentCtor;
}): void {
  feishuClientSdk = overrides?.sdk
    ? { ...loadDefaultFeishuClientSdk(), ...overrides.sdk }
    : null;
  httpsProxyAgentCtor = overrides?.HttpsProxyAgent ?? null;
}
