import "./io-BeL7sW7Y.js";
import "./paths-Chd_ukvM.js";
import "./globals-BKVgh_pY.js";
import "./theme-CWrxY1-_.js";
import "./utils-DGUUVa38.js";
import "./subsystem-BZRyMoTO.js";
import "./ansi-D3lUajt1.js";
import {
  a as resolveAgentDir,
  f as resolveDefaultAgentId,
  h as resolveSessionAgentId,
} from "./agent-scope-BIySJgkJ.js";
import "./file-identity-DgWfjfnD.js";
import "./boundary-file-read-DZTg2Wyt.js";
import "./logger-BsvC8P6f.js";
import "./exec-CbOKTdtq.js";
import "./registry-B5KsIQB2.js";
import "./message-channel-BTVKzHsu.js";
import "./defaults-CUrel7hX.js";
import "./boolean-CsNbQKvJ.js";
import "./env-C-KVzFmc.js";
import "./shell-env-BOjFl6MZ.js";
import "./config-state-CGV1IKLE.js";
import "./version-yfoo3YbF.js";
import "./min-host-version-DM6er2ZX.js";
import "./manifest-registry-CMy5XLiN.js";
import "./runtime-guard-WQAOpX6v.js";
import "./safe-text-CpFY0TZg.js";
import "./model-selection-CNzhkJya.js";
import "./env-substitution-X9lTyhgh.js";
import "./network-mode-JwypQ_rG.js";
import "./ip-CWtG939A.js";
import "./config-Cfud9qZm.js";
import "./runtime-Bd4XqlOP.js";
import "./profiles-DothReVm.js";
import "./auth-profiles-BWz6ST0A.js";
import "./json-file-zQUdGjzr.js";
import "./audit-fs-BVqUNCSg.js";
import "./resolve-BNoFF8j-.js";
import "./thinking-D1lo1J1T.js";
import {
  c as resolveModelSelectionFromDirective,
  n as enqueueModeSwitchEvents,
  t as canPersistInternalExecDirective,
} from "./directive-handling.shared-CFIq1IzV.js";
import "./plugins-AUGbKgu9.js";
import "./paths-0NHK4yJk.js";
import "./session-write-lock-D4oaWfci.js";
import {
  d as lookupCachedContextTokens,
  g as applyModelOverrideToSessionEntry,
  t as applyVerboseOverride,
} from "./level-overrides-DfXHgPB9.js";
import { l as updateSessionStore } from "./store-Bo1TX1Sc.js";
import { n as enqueueSystemEvent } from "./system-events-CGA-tC6k.js";
//#region src/auto-reply/reply/directive-handling.persist.ts
async function persistInlineDirectives(params) {
  const {
    directives,
    cfg,
    sessionEntry,
    sessionStore,
    sessionKey,
    storePath,
    elevatedEnabled,
    elevatedAllowed,
    defaultProvider,
    defaultModel,
    aliasIndex,
    allowedModelKeys,
    initialModelLabel,
    formatModelSwitchEvent,
    agentCfg,
  } = params;
  let { provider, model } = params;
  const allowInternalExecPersistence = canPersistInternalExecDirective({
    surface: params.surface,
    gatewayClientScopes: params.gatewayClientScopes,
  });
  const activeAgentId = sessionKey
    ? resolveSessionAgentId({
        sessionKey,
        config: cfg,
      })
    : resolveDefaultAgentId(cfg);
  const agentDir = params.agentDir ?? resolveAgentDir(cfg, activeAgentId);
  if (sessionEntry && sessionStore && sessionKey) {
    const prevElevatedLevel =
      sessionEntry.elevatedLevel ?? agentCfg?.elevatedDefault ?? (elevatedAllowed ? "on" : "off");
    const prevReasoningLevel = sessionEntry.reasoningLevel ?? "off";
    let elevatedChanged =
      directives.hasElevatedDirective &&
      directives.elevatedLevel !== void 0 &&
      elevatedEnabled &&
      elevatedAllowed;
    let reasoningChanged = directives.hasReasoningDirective && directives.reasoningLevel !== void 0;
    let updated = false;
    if (directives.hasThinkDirective && directives.thinkLevel) {
      sessionEntry.thinkingLevel = directives.thinkLevel;
      updated = true;
    }
    if (directives.hasVerboseDirective && directives.verboseLevel) {
      applyVerboseOverride(sessionEntry, directives.verboseLevel);
      updated = true;
    }
    if (directives.hasReasoningDirective && directives.reasoningLevel) {
      if (directives.reasoningLevel === "off") sessionEntry.reasoningLevel = "off";
      else sessionEntry.reasoningLevel = directives.reasoningLevel;
      reasoningChanged =
        reasoningChanged ||
        (directives.reasoningLevel !== prevReasoningLevel && directives.reasoningLevel !== void 0);
      updated = true;
    }
    if (
      directives.hasElevatedDirective &&
      directives.elevatedLevel &&
      elevatedEnabled &&
      elevatedAllowed
    ) {
      sessionEntry.elevatedLevel = directives.elevatedLevel;
      elevatedChanged =
        elevatedChanged ||
        (directives.elevatedLevel !== prevElevatedLevel && directives.elevatedLevel !== void 0);
      updated = true;
    }
    if (directives.hasExecDirective && directives.hasExecOptions && allowInternalExecPersistence) {
      if (directives.execHost) {
        sessionEntry.execHost = directives.execHost;
        updated = true;
      }
      if (directives.execSecurity) {
        sessionEntry.execSecurity = directives.execSecurity;
        updated = true;
      }
      if (directives.execAsk) {
        sessionEntry.execAsk = directives.execAsk;
        updated = true;
      }
      if (directives.execNode) {
        sessionEntry.execNode = directives.execNode;
        updated = true;
      }
    }
    const modelDirective =
      directives.hasModelDirective && params.effectiveModelDirective
        ? params.effectiveModelDirective
        : void 0;
    if (modelDirective) {
      const modelResolution = resolveModelSelectionFromDirective({
        directives: {
          ...directives,
          hasModelDirective: true,
          rawModelDirective: modelDirective,
        },
        cfg,
        agentDir,
        defaultProvider,
        defaultModel,
        aliasIndex,
        allowedModelKeys,
        allowedModelCatalog: [],
        provider,
      });
      if (modelResolution.modelSelection) {
        const { updated: modelUpdated } = applyModelOverrideToSessionEntry({
          entry: sessionEntry,
          selection: modelResolution.modelSelection,
          profileOverride: modelResolution.profileOverride,
        });
        provider = modelResolution.modelSelection.provider;
        model = modelResolution.modelSelection.model;
        const nextLabel = `${provider}/${model}`;
        if (nextLabel !== initialModelLabel)
          enqueueSystemEvent(
            formatModelSwitchEvent(nextLabel, modelResolution.modelSelection.alias),
            {
              sessionKey,
              contextKey: `model:${nextLabel}`,
            },
          );
        updated = updated || modelUpdated;
      }
    }
    if (directives.hasQueueDirective && directives.queueReset) {
      delete sessionEntry.queueMode;
      delete sessionEntry.queueDebounceMs;
      delete sessionEntry.queueCap;
      delete sessionEntry.queueDrop;
      updated = true;
    }
    if (updated) {
      sessionEntry.updatedAt = Date.now();
      sessionStore[sessionKey] = sessionEntry;
      if (storePath)
        await updateSessionStore(storePath, (store) => {
          store[sessionKey] = sessionEntry;
        });
      enqueueModeSwitchEvents({
        enqueueSystemEvent,
        sessionEntry,
        sessionKey,
        elevatedChanged,
        reasoningChanged,
      });
    }
  }
  return {
    provider,
    model,
    contextTokens: agentCfg?.contextTokens ?? lookupCachedContextTokens(model) ?? 2e5,
  };
}
//#endregion
export { persistInlineDirectives };
