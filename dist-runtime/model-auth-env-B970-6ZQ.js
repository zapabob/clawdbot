import { existsSync, readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { getEnvApiKey } from "@mariozechner/pi-ai";
import { t as normalizeOptionalSecretInput } from "./normalize-secret-input-BVTW5wne.js";
import {
  r as listKnownProviderAuthEnvVarNames,
  t as PROVIDER_AUTH_ENV_VAR_CANDIDATES,
} from "./provider-env-vars-h4NFBrJS.js";
import { i as normalizeProviderIdForAuth } from "./provider-id-CYnSF2NM.js";
import { t as getShellEnvAppliedKeys } from "./shell-env-BOjFl6MZ.js";
//#region src/agents/model-auth-env-vars.ts
const PROVIDER_ENV_API_KEY_CANDIDATES = PROVIDER_AUTH_ENV_VAR_CANDIDATES;
function listKnownProviderEnvApiKeyNames() {
  return listKnownProviderAuthEnvVarNames();
}
const OAUTH_API_KEY_MARKER_PREFIX = "oauth:";
const OLLAMA_LOCAL_AUTH_MARKER = "ollama-local";
const CUSTOM_LOCAL_AUTH_MARKER = "custom-local";
const GCP_VERTEX_CREDENTIALS_MARKER = "gcp-vertex-credentials";
const NON_ENV_SECRETREF_MARKER = "secretref-managed";
const SECRETREF_ENV_HEADER_MARKER_PREFIX = "secretref-env:";
const AWS_SDK_ENV_MARKERS = new Set([
  "AWS_BEARER_TOKEN_BEDROCK",
  "AWS_ACCESS_KEY_ID",
  "AWS_PROFILE",
]);
const LEGACY_ENV_API_KEY_MARKERS = [
  "GOOGLE_API_KEY",
  "DEEPSEEK_API_KEY",
  "PERPLEXITY_API_KEY",
  "FIREWORKS_API_KEY",
  "NOVITA_API_KEY",
  "AZURE_OPENAI_API_KEY",
  "AZURE_API_KEY",
  "MINIMAX_CODE_PLAN_KEY",
];
const KNOWN_ENV_API_KEY_MARKERS = new Set([
  ...listKnownProviderEnvApiKeyNames(),
  ...LEGACY_ENV_API_KEY_MARKERS,
  ...AWS_SDK_ENV_MARKERS,
]);
function isAwsSdkAuthMarker(value) {
  return AWS_SDK_ENV_MARKERS.has(value.trim());
}
function isKnownEnvApiKeyMarker(value) {
  const trimmed = value.trim();
  return KNOWN_ENV_API_KEY_MARKERS.has(trimmed) && !isAwsSdkAuthMarker(trimmed);
}
function isOAuthApiKeyMarker(value) {
  return value.trim().startsWith(OAUTH_API_KEY_MARKER_PREFIX);
}
function resolveNonEnvSecretRefApiKeyMarker(_source) {
  return NON_ENV_SECRETREF_MARKER;
}
function resolveNonEnvSecretRefHeaderValueMarker(_source) {
  return NON_ENV_SECRETREF_MARKER;
}
function resolveEnvSecretRefHeaderValueMarker(envVarName) {
  return `${SECRETREF_ENV_HEADER_MARKER_PREFIX}${envVarName.trim()}`;
}
function isSecretRefHeaderValueMarker(value) {
  const trimmed = value.trim();
  return trimmed === "secretref-managed" || trimmed.startsWith("secretref-env:");
}
function isNonSecretApiKeyMarker(value, opts) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (
    trimmed === "minimax-oauth" ||
    trimmed === "qwen-oauth" ||
    isOAuthApiKeyMarker(trimmed) ||
    trimmed === "ollama-local" ||
    trimmed === "custom-local" ||
    trimmed === "gcp-vertex-credentials" ||
    trimmed === "secretref-managed" ||
    isAwsSdkAuthMarker(trimmed)
  )
    return true;
  if (opts?.includeEnvVarName === false) return false;
  return KNOWN_ENV_API_KEY_MARKERS.has(trimmed);
}
//#endregion
//#region src/agents/anthropic-vertex-provider.ts
const ANTHROPIC_VERTEX_DEFAULT_REGION = "global";
const ANTHROPIC_VERTEX_REGION_RE = /^[a-z0-9-]+$/;
const GCLOUD_DEFAULT_ADC_PATH = join(
  homedir(),
  ".config",
  "gcloud",
  "application_default_credentials.json",
);
function resolveAnthropicVertexProjectId(env = process.env) {
  return (
    normalizeOptionalSecretInput(env.ANTHROPIC_VERTEX_PROJECT_ID) ||
    normalizeOptionalSecretInput(env.GOOGLE_CLOUD_PROJECT) ||
    normalizeOptionalSecretInput(env.GOOGLE_CLOUD_PROJECT_ID) ||
    resolveAnthropicVertexProjectIdFromAdc(env)
  );
}
function resolveAnthropicVertexRegion(env = process.env) {
  const region =
    normalizeOptionalSecretInput(env.GOOGLE_CLOUD_LOCATION) ||
    normalizeOptionalSecretInput(env.CLOUD_ML_REGION);
  return region && ANTHROPIC_VERTEX_REGION_RE.test(region)
    ? region
    : ANTHROPIC_VERTEX_DEFAULT_REGION;
}
function resolveAnthropicVertexRegionFromBaseUrl(baseUrl) {
  const trimmed = baseUrl?.trim();
  if (!trimmed) return;
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    if (host === "aiplatform.googleapis.com") return "global";
    return /^([a-z0-9-]+)-aiplatform\.googleapis\.com$/.exec(host)?.[1];
  } catch {
    return;
  }
}
function resolveAnthropicVertexClientRegion(params) {
  return (
    resolveAnthropicVertexRegionFromBaseUrl(params?.baseUrl) ||
    resolveAnthropicVertexRegion(params?.env)
  );
}
function hasAnthropicVertexMetadataServerAdc(env = process.env) {
  const explicitMetadataOptIn = normalizeOptionalSecretInput(env.ANTHROPIC_VERTEX_USE_GCP_METADATA);
  return explicitMetadataOptIn === "1" || explicitMetadataOptIn?.toLowerCase() === "true";
}
function resolveAnthropicVertexDefaultAdcPath(env = process.env) {
  return platform() === "win32"
    ? join(
        env.APPDATA ?? join(homedir(), "AppData", "Roaming"),
        "gcloud",
        "application_default_credentials.json",
      )
    : GCLOUD_DEFAULT_ADC_PATH;
}
function resolveAnthropicVertexAdcCredentialsPath(env = process.env) {
  const explicitCredentialsPath = normalizeOptionalSecretInput(env.GOOGLE_APPLICATION_CREDENTIALS);
  if (explicitCredentialsPath)
    return existsSync(explicitCredentialsPath) ? explicitCredentialsPath : void 0;
  const defaultAdcPath = resolveAnthropicVertexDefaultAdcPath(env);
  return existsSync(defaultAdcPath) ? defaultAdcPath : void 0;
}
function resolveAnthropicVertexProjectIdFromAdc(env = process.env) {
  const credentialsPath = resolveAnthropicVertexAdcCredentialsPath(env);
  if (!credentialsPath) return;
  try {
    const parsed = JSON.parse(readFileSync(credentialsPath, "utf8"));
    return (
      normalizeOptionalSecretInput(parsed.project_id) ||
      normalizeOptionalSecretInput(parsed.quota_project_id)
    );
  } catch {
    return;
  }
}
function hasAnthropicVertexCredentials(env = process.env) {
  return (
    hasAnthropicVertexMetadataServerAdc(env) ||
    resolveAnthropicVertexAdcCredentialsPath(env) !== void 0
  );
}
function hasAnthropicVertexAvailableAuth(env = process.env) {
  return hasAnthropicVertexCredentials(env);
}
//#endregion
//#region src/agents/model-auth-env.ts
function resolveEnvApiKey(provider, env = process.env) {
  const normalized = normalizeProviderIdForAuth(provider);
  const applied = new Set(getShellEnvAppliedKeys());
  const pick = (envVar) => {
    const value = normalizeOptionalSecretInput(env[envVar]);
    if (!value) return null;
    return {
      apiKey: value,
      source: applied.has(envVar) ? `shell env: ${envVar}` : `env: ${envVar}`,
    };
  };
  const candidates = PROVIDER_ENV_API_KEY_CANDIDATES[normalized];
  if (candidates)
    for (const envVar of candidates) {
      const resolved = pick(envVar);
      if (resolved) return resolved;
    }
  if (normalized === "google-vertex") {
    const envKey = getEnvApiKey(normalized);
    if (!envKey) return null;
    return {
      apiKey: envKey,
      source: "gcloud adc",
    };
  }
  if (normalized === "anthropic-vertex") {
    if (hasAnthropicVertexAvailableAuth(env))
      return {
        apiKey: GCP_VERTEX_CREDENTIALS_MARKER,
        source: "gcloud adc",
      };
    return null;
  }
  return null;
}
//#endregion
export {
  resolveAnthropicVertexRegion as a,
  isKnownEnvApiKeyMarker as c,
  resolveEnvSecretRefHeaderValueMarker as d,
  resolveNonEnvSecretRefApiKeyMarker as f,
  resolveAnthropicVertexProjectId as i,
  isNonSecretApiKeyMarker as l,
  PROVIDER_ENV_API_KEY_CANDIDATES as m,
  hasAnthropicVertexAvailableAuth as n,
  CUSTOM_LOCAL_AUTH_MARKER as o,
  resolveNonEnvSecretRefHeaderValueMarker as p,
  resolveAnthropicVertexClientRegion as r,
  OLLAMA_LOCAL_AUTH_MARKER as s,
  resolveEnvApiKey as t,
  isSecretRefHeaderValueMarker as u,
};
