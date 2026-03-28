import { t as resolveEnvApiKey } from "./model-auth-env-B970-6ZQ.js";
import { n as normalizeSecretInput } from "./normalize-secret-input-BVTW5wne.js";
import { t as resolveSecretInputModeForEnvSelection } from "./provider-auth-mode-C86TOVT1.js";
import {
  n as promptSecretRefForSetup,
  r as resolveRefFallbackInput,
  t as extractEnvVarFromSourceLabel,
} from "./provider-auth-ref-B2krUrnl.js";
import { n as getProviderEnvVars } from "./provider-env-vars-h4NFBrJS.js";
import { i as normalizeProviderIdForAuth } from "./provider-id-CYnSF2NM.js";
import {
  i as coerceSecretRef,
  t as DEFAULT_SECRET_PROVIDER_ALIAS,
} from "./types.secrets-BEA4gMCN.js";
import "node:fs";
import "node:path";
//#region src/plugins/provider-model-primary.ts
function resolvePrimaryModel(model) {
  if (typeof model === "string") return model;
  if (model && typeof model === "object" && typeof model.primary === "string") return model.primary;
}
function applyAgentDefaultPrimaryModel(params) {
  const current = resolvePrimaryModel(params.cfg.agents?.defaults?.model)?.trim();
  if ((current && params.legacyModels?.has(current) ? params.model : current) === params.model)
    return {
      next: params.cfg,
      changed: false,
    };
  return {
    next: {
      ...params.cfg,
      agents: {
        ...params.cfg.agents,
        defaults: {
          ...params.cfg.agents?.defaults,
          model:
            params.cfg.agents?.defaults?.model &&
            typeof params.cfg.agents.defaults.model === "object"
              ? {
                  ...params.cfg.agents.defaults.model,
                  primary: params.model,
                }
              : { primary: params.model },
        },
      },
    },
    changed: true,
  };
}
function applyPrimaryModel(cfg, model) {
  const defaults = cfg.agents?.defaults;
  const existingModel = defaults?.model;
  const existingModels = defaults?.models;
  const fallbacks =
    typeof existingModel === "object" && existingModel !== null && "fallbacks" in existingModel
      ? existingModel.fallbacks
      : void 0;
  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...defaults,
        model: {
          ...(fallbacks ? { fallbacks } : void 0),
          primary: model,
        },
        models: {
          ...existingModels,
          [model]: existingModels?.[model] ?? {},
        },
      },
    },
  };
}
//#endregion
//#region src/plugins/provider-auth-input.ts
const DEFAULT_KEY_PREVIEW = {
  head: 4,
  tail: 4,
};
function normalizeApiKeyInput(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  const assignmentMatch = trimmed.match(/^(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=\s*(.+)$/);
  const valuePart = assignmentMatch ? assignmentMatch[1].trim() : trimmed;
  const unquoted =
    valuePart.length >= 2 &&
    ((valuePart.startsWith('"') && valuePart.endsWith('"')) ||
      (valuePart.startsWith("'") && valuePart.endsWith("'")) ||
      (valuePart.startsWith("`") && valuePart.endsWith("`")))
      ? valuePart.slice(1, -1)
      : valuePart;
  return (unquoted.endsWith(";") ? unquoted.slice(0, -1) : unquoted).trim();
}
const validateApiKeyInput = (value) =>
  normalizeApiKeyInput(value).length > 0 ? void 0 : "Required";
function formatApiKeyPreview(raw, opts = {}) {
  const trimmed = raw.trim();
  if (!trimmed) return "…";
  const head = opts.head ?? DEFAULT_KEY_PREVIEW.head;
  const tail = opts.tail ?? DEFAULT_KEY_PREVIEW.tail;
  if (trimmed.length <= head + tail) {
    const shortHead = Math.min(2, trimmed.length);
    const shortTail = Math.min(2, trimmed.length - shortHead);
    if (shortTail <= 0) return `${trimmed.slice(0, shortHead)}…`;
    return `${trimmed.slice(0, shortHead)}…${trimmed.slice(-shortTail)}`;
  }
  return `${trimmed.slice(0, head)}…${trimmed.slice(-tail)}`;
}
function normalizeTokenProviderInput(tokenProvider) {
  return (
    String(tokenProvider ?? "")
      .trim()
      .toLowerCase() || void 0
  );
}
function normalizeSecretInputModeInput(secretInputMode) {
  const normalized = String(secretInputMode ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "plaintext" || normalized === "ref") return normalized;
}
async function maybeApplyApiKeyFromOption(params) {
  const tokenProvider = normalizeTokenProviderInput(params.tokenProvider);
  const expectedProviders = params.expectedProviders
    .map((provider) => normalizeTokenProviderInput(provider))
    .filter((provider) => Boolean(provider));
  if (!params.token || !tokenProvider || !expectedProviders.includes(tokenProvider)) return;
  const apiKey = params.normalize(params.token);
  await params.setCredential(apiKey, params.secretInputMode);
  return apiKey;
}
async function ensureApiKeyFromOptionEnvOrPrompt(params) {
  const optionApiKey = await maybeApplyApiKeyFromOption({
    token: params.token,
    tokenProvider: params.tokenProvider,
    secretInputMode: params.secretInputMode,
    expectedProviders: params.expectedProviders,
    normalize: params.normalize,
    setCredential: params.setCredential,
  });
  if (optionApiKey) return optionApiKey;
  if (params.noteMessage) await params.prompter.note(params.noteMessage, params.noteTitle);
  return await ensureApiKeyFromEnvOrPrompt({
    config: params.config,
    provider: params.provider,
    envLabel: params.envLabel,
    promptMessage: params.promptMessage,
    normalize: params.normalize,
    validate: params.validate,
    prompter: params.prompter,
    secretInputMode: params.secretInputMode,
    setCredential: params.setCredential,
  });
}
async function ensureApiKeyFromEnvOrPrompt(params) {
  const selectedMode = await resolveSecretInputModeForEnvSelection({
    prompter: params.prompter,
    explicitMode: params.secretInputMode,
  });
  const envKey = resolveEnvApiKey(params.provider);
  if (selectedMode === "ref") {
    if (typeof params.prompter.select !== "function") {
      const fallback = resolveRefFallbackInput({
        config: params.config,
        provider: params.provider,
        preferredEnvVar: envKey?.source ? extractEnvVarFromSourceLabel(envKey.source) : void 0,
      });
      await params.setCredential(fallback.ref, selectedMode);
      return fallback.resolvedValue;
    }
    const resolved = await promptSecretRefForSetup({
      provider: params.provider,
      config: params.config,
      prompter: params.prompter,
      preferredEnvVar: envKey?.source ? extractEnvVarFromSourceLabel(envKey.source) : void 0,
    });
    await params.setCredential(resolved.ref, selectedMode);
    return resolved.resolvedValue;
  }
  if (envKey && selectedMode === "plaintext") {
    if (
      await params.prompter.confirm({
        message: `Use existing ${params.envLabel} (${envKey.source}, ${formatApiKeyPreview(envKey.apiKey)})?`,
        initialValue: true,
      })
    ) {
      await params.setCredential(envKey.apiKey, selectedMode);
      return envKey.apiKey;
    }
  }
  const key = await params.prompter.text({
    message: params.promptMessage,
    validate: params.validate,
  });
  const apiKey = params.normalize(String(key ?? ""));
  await params.setCredential(apiKey, selectedMode);
  return apiKey;
}
//#endregion
//#region src/plugins/provider-auth-helpers.ts
const ENV_REF_PATTERN = /^\$\{([A-Z][A-Z0-9_]*)\}$/;
function buildEnvSecretRef(id) {
  return {
    source: "env",
    provider: DEFAULT_SECRET_PROVIDER_ALIAS,
    id,
  };
}
function parseEnvSecretRef(value) {
  const match = ENV_REF_PATTERN.exec(value);
  if (!match) return null;
  return buildEnvSecretRef(match[1]);
}
function resolveProviderDefaultEnvSecretRef(provider) {
  const envVar = getProviderEnvVars(provider)?.find((candidate) => candidate.trim().length > 0);
  if (!envVar)
    throw new Error(
      `Provider "${provider}" does not have a default env var mapping for secret-input-mode=ref.`,
    );
  return buildEnvSecretRef(envVar);
}
function resolveApiKeySecretInput(provider, input, options) {
  const coercedRef = coerceSecretRef(input);
  if (coercedRef) return coercedRef;
  const normalized = normalizeSecretInput(input);
  const inlineEnvRef = parseEnvSecretRef(normalized);
  if (inlineEnvRef) return inlineEnvRef;
  if (options?.secretInputMode === "ref") return resolveProviderDefaultEnvSecretRef(provider);
  return normalized;
}
function buildApiKeyCredential(provider, input, metadata, options) {
  const secretInput = resolveApiKeySecretInput(provider, input, options);
  if (typeof secretInput === "string")
    return {
      type: "api_key",
      provider,
      key: secretInput,
      ...(metadata ? { metadata } : {}),
    };
  return {
    type: "api_key",
    provider,
    keyRef: secretInput,
    ...(metadata ? { metadata } : {}),
  };
}
function applyAuthProfileConfig(cfg, params) {
  const normalizedProvider = normalizeProviderIdForAuth(params.provider);
  const profiles = {
    ...cfg.auth?.profiles,
    [params.profileId]: {
      provider: params.provider,
      mode: params.mode,
      ...(params.email ? { email: params.email } : {}),
    },
  };
  const configuredProviderProfiles = Object.entries(cfg.auth?.profiles ?? {})
    .filter(([, profile]) => normalizeProviderIdForAuth(profile.provider) === normalizedProvider)
    .map(([profileId, profile]) => ({
      profileId,
      mode: profile.mode,
    }));
  const existingProviderOrder = cfg.auth?.order?.[params.provider];
  const preferProfileFirst = params.preferProfileFirst ?? true;
  const reorderedProviderOrder =
    existingProviderOrder && preferProfileFirst
      ? [
          params.profileId,
          ...existingProviderOrder.filter((profileId) => profileId !== params.profileId),
        ]
      : existingProviderOrder;
  const hasMixedConfiguredModes = configuredProviderProfiles.some(
    ({ profileId, mode }) => profileId !== params.profileId && mode !== params.mode,
  );
  const derivedProviderOrder =
    existingProviderOrder === void 0 && preferProfileFirst && hasMixedConfiguredModes
      ? [
          params.profileId,
          ...configuredProviderProfiles
            .map(({ profileId }) => profileId)
            .filter((profileId) => profileId !== params.profileId),
        ]
      : void 0;
  const order =
    existingProviderOrder !== void 0
      ? {
          ...cfg.auth?.order,
          [params.provider]: reorderedProviderOrder?.includes(params.profileId)
            ? reorderedProviderOrder
            : [...(reorderedProviderOrder ?? []), params.profileId],
        }
      : derivedProviderOrder
        ? {
            ...cfg.auth?.order,
            [params.provider]: derivedProviderOrder,
          }
        : cfg.auth?.order;
  return {
    ...cfg,
    auth: {
      ...cfg.auth,
      profiles,
      ...(order ? { order } : {}),
    },
  };
}
//#endregion
export {
  normalizeApiKeyInput as a,
  validateApiKeyInput as c,
  ensureApiKeyFromOptionEnvOrPrompt as i,
  applyAgentDefaultPrimaryModel as l,
  buildApiKeyCredential as n,
  normalizeSecretInputModeInput as o,
  ensureApiKeyFromEnvOrPrompt as r,
  normalizeTokenProviderInput as s,
  applyAuthProfileConfig as t,
  applyPrimaryModel as u,
};
