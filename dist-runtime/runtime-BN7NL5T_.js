import fs from "node:fs";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import { createJiti } from "jiti";
import {
  Bb as resolveAgentRoute,
  Bc as listRuntimeImageGenerationProviders,
  Dp as matchesMentionPatterns,
  Ea as shouldAckReaction,
  Eg as buildPairingReply,
  Ep as buildMentionRegexes,
  Hs as signalMessageActions,
  Mp as formatInboundEnvelope,
  Op as matchesMentionWithExplicit,
  Pp as resolveEnvelopeFormatOptions,
  Ra as telegramMessageActions,
  Rb as buildAgentSessionKey,
  Sa as setTelegramThreadBindingMaxAgeBySessionKey,
  Sp as shouldComputeCommandAuthorized,
  Ta as removeAckReactionAfterReply,
  Tu as requestHeartbeatNow,
  Up as dispatchReplyFromConfig,
  Va as collectTelegramUnmentionedGroupIds,
  Vp as createReplyDispatcherWithTyping,
  Xm as getChannelActivity,
  Yf as recordInboundSession,
  Zm as recordChannelActivity,
  _b as resolveAgentIdentity,
  _m as normalizeAccountId,
  ab as chunkMarkdownText,
  ar as listWebSearchProviders,
  bp as hasControlCommand,
  cb as chunkTextWithMode,
  cm as createQuickReplyItems,
  cp as resolveTelegramToken,
  cv as readNumberParam,
  df as isVoiceCompatibleAudio,
  dm as pushMessageLine,
  fm as pushMessagesLine,
  gm as listLineAccountIds,
  hi as sendMessageSignal,
  hm as sendMessageLine,
  ia as onAgentEvent,
  ib as chunkByNewline,
  ih as resolveMarkdownTableMode,
  jp as formatAgentEnvelope,
  lb as resolveChunkMode,
  lm as pushFlexMessage,
  mi as monitorSignalProvider,
  mm as pushTextMessageWithQuickReplies,
  nh as resolveChannelGroupRequireMention,
  ob as chunkMarkdownTextWithMode,
  om as createInboundDebouncer,
  or as runWebSearch,
  pi as probeSignal,
  pm as pushTemplateMessage,
  pn as monitorLineProvider,
  rb as convertMarkdownTables,
  rv as resolveAgentTimeoutMs,
  sb as chunkText,
  sm as resolveInboundDebounceMs,
  sv as jsonResult,
  th as resolveChannelGroupPolicy,
  ub as resolveTextChunkLimit,
  um as pushLocationMessage,
  uv as readStringParam,
  vb as resolveEffectiveMessagesConfig,
  vh as buildTemplateMessageFromPayload,
  vi as dispatchReplyWithBufferedBlockDispatcher,
  vm as resolveDefaultLineAccountId,
  xa as setTelegramThreadBindingIdleTimeoutBySessionKey,
  xp as isControlCommandMessage,
  yb as resolveHumanDelayConfig,
  yh as probeLineBot,
  ym as resolveLineAccount,
  zc as generateImage,
  zp as withReplyDispatcher,
} from "./account-resolution-YAil9v6G.js";
import {
  D as ensureAgentWorkspace,
  a as resolveAgentDir,
  d as resolveAgentWorkspaceDir,
  h as resolveSessionAgentId,
} from "./agent-scope-BIySJgkJ.js";
import { m as shouldHandleTextCommands } from "./commands-registry-CbQzy3s0.js";
import { n as DEFAULT_MODEL, r as DEFAULT_PROVIDER } from "./defaults-CUrel7hX.js";
import { c as resolveCommandAuthorizedFromAuthorizers } from "./dm-policy-shared-D3Y8oBe8.js";
import { t as runCommandWithTimeout } from "./exec-CbOKTdtq.js";
import { n as resolveGlobalSingleton } from "./global-singleton-O4L9MBfO.js";
import {
  S as normalizeLogLevel,
  c as shouldLogVerbose,
  d as getChildLogger,
} from "./globals-BKVgh_pY.js";
import { i as getImageMetadata, s as resizeToJpeg } from "./image-ops-BehpV8Fl.js";
import { g as writeConfigFile, s as loadConfig } from "./io-BeL7sW7Y.js";
import {
  a as createLazyRuntimeSurface,
  n as createLazyRuntimeMethodBinder,
  r as createLazyRuntimeModule,
  t as createLazyRuntimeMethod,
} from "./lazy-runtime-DeSnMsfk.js";
import { i as logWarn } from "./logger-BsvC8P6f.js";
import { n as loadPluginManifestRegistry } from "./manifest-registry-CMy5XLiN.js";
import { t as registerMemoryCli } from "./memory-cli-DC5sA9P5.js";
import { t as resolveMemorySearchConfig } from "./memory-search-BR1Y4hk3.js";
import { d as mediaKindFromMime, t as detectMime } from "./mime-lb_Ykmqj.js";
import { S as resolveThinkingDefault } from "./model-selection-CNzhkJya.js";
import {
  c as upsertChannelPairingRequest,
  i as readChannelAllowFromStore,
} from "./pairing-store-C5UkJF1E.js";
import { l as resolveStorePath, r as resolveSessionFilePath } from "./paths-0NHK4yJk.js";
import { _ as resolveStateDir } from "./paths-Chd_ukvM.js";
import { j as saveMediaBuffer } from "./routes-DbO6sePn.js";
import { t as discordMessageActions } from "./runtime-api-DLmwqPEt.js";
import {
  n as sendMessageIMessage,
  r as probeIMessage,
  t as monitorIMessageProvider,
} from "./runtime-api-mA2BgZV0.js";
import {
  D as resolvePluginSdkScopedAliasMap,
  E as resolvePluginSdkAliasFile,
  O as shouldPreferNativeJiti,
  a as logWebSelfId,
  c as monitorWebChannel,
  d as sendPollWhatsApp,
  f as startWebLoginWithQr,
  h as loadWebMedia,
  i as handleWhatsAppAction,
  l as readWebSelfId,
  m as webAuthExists,
  n as getActiveWebListener,
  o as loginWeb,
  p as waitForWebLogin,
  r as getWebAuthAgeMs,
  s as logoutWeb,
  t as createRuntimeWhatsAppLoginTool,
  u as sendMessageWhatsApp,
  w as buildPluginLoaderJitiOptions,
  x as fetchRemoteMedia,
} from "./runtime-whatsapp-boundary-Di5xVA5u.js";
import { T as parseAgentSessionKey } from "./session-key-0JD9qg4o.js";
import { f as onSessionTranscriptUpdate } from "./sessions-CD_-8zJN.js";
import {
  a as recordSessionMetaFromInbound,
  c as updateLastRoute,
  i as readSessionUpdatedAt,
  n as loadSessionStore,
  s as saveSessionStore,
} from "./store-Bo1TX1Sc.js";
import { n as enqueueSystemEvent } from "./system-events-CGA-tC6k.js";
import { x as finalizeInboundContext } from "./templating-B3EHfDLb.js";
import {
  a as setThreadBindingMaxAgeBySessionKey,
  i as setThreadBindingIdleTimeoutBySessionKey,
  l as getThreadBindingManager,
  o as unbindThreadBindingsBySessionKey,
} from "./thread-bindings-D_hD7YlT.js";
import {
  D as resolveThreadBindingMaxAgeExpiresAt,
  E as resolveThreadBindingInactivityExpiresAt,
  O as resolveThreadBindingMaxAgeMs,
  T as resolveThreadBindingIdleTimeoutMs,
} from "./thread-bindings.discord-api-z1ldYT3m.js";
import { t as VERSION } from "./version-yfoo3YbF.js";
//#region src/plugins/runtime/runtime-agent.ts
function defineCachedValue$2(target, key, create) {
  let cached;
  let ready = false;
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get() {
      if (!ready) {
        cached = create();
        ready = true;
      }
      return cached;
    },
  });
}
const loadEmbeddedPiRuntime = createLazyRuntimeModule(
  () => import("./runtime-embedded-pi.runtime-h9w3ZIBY.js"),
);
function createRuntimeAgent() {
  const agentRuntime = {
    defaults: {
      model: DEFAULT_MODEL,
      provider: DEFAULT_PROVIDER,
    },
    resolveAgentDir,
    resolveAgentWorkspaceDir,
    resolveAgentIdentity,
    resolveThinkingDefault,
    resolveAgentTimeoutMs,
    ensureAgentWorkspace,
  };
  defineCachedValue$2(agentRuntime, "runEmbeddedPiAgent", () =>
    createLazyRuntimeMethod(loadEmbeddedPiRuntime, (runtime) => runtime.runEmbeddedPiAgent),
  );
  defineCachedValue$2(agentRuntime, "session", () => ({
    resolveStorePath,
    loadSessionStore,
    saveSessionStore,
    resolveSessionFilePath,
  }));
  return agentRuntime;
}
//#endregion
//#region src/plugins/runtime/runtime-discord-typing.ts
const DEFAULT_DISCORD_TYPING_INTERVAL_MS = 8e3;
async function createDiscordTypingLease(params) {
  const intervalMs =
    typeof params.intervalMs === "number" && Number.isFinite(params.intervalMs)
      ? Math.max(1e3, Math.floor(params.intervalMs))
      : DEFAULT_DISCORD_TYPING_INTERVAL_MS;
  let stopped = false;
  let timer = null;
  const pulse = async () => {
    if (stopped) return;
    await params.pulse({
      channelId: params.channelId,
      accountId: params.accountId,
      cfg: params.cfg,
    });
  };
  await pulse();
  timer = setInterval(() => {
    pulse().catch((err) => {
      logWarn(`plugins: discord typing pulse failed: ${String(err)}`);
    });
  }, intervalMs);
  timer.unref?.();
  return {
    refresh: async () => {
      await pulse();
    },
    stop: () => {
      stopped = true;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
  };
}
//#endregion
//#region src/plugins/runtime/runtime-discord.ts
const bindDiscordRuntimeMethod = createLazyRuntimeMethodBinder(
  createLazyRuntimeSurface(
    () => import("./runtime-discord-ops.runtime-8y1S4ZHL.js"),
    ({ runtimeDiscordOps }) => runtimeDiscordOps,
  ),
);
const auditChannelPermissionsLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.auditChannelPermissions,
);
const listDirectoryGroupsLiveLazy$1 = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.listDirectoryGroupsLive,
);
const listDirectoryPeersLiveLazy$1 = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.listDirectoryPeersLive,
);
const probeDiscordLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.probeDiscord,
);
const resolveChannelAllowlistLazy$1 = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.resolveChannelAllowlist,
);
const resolveUserAllowlistLazy$1 = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.resolveUserAllowlist,
);
const sendComponentMessageLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.sendComponentMessage,
);
const sendMessageDiscordLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.sendMessageDiscord,
);
const sendPollDiscordLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.sendPollDiscord,
);
const monitorDiscordProviderLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.monitorDiscordProvider,
);
const sendTypingDiscordLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.typing.pulse,
);
const editMessageDiscordLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.conversationActions.editMessage,
);
const deleteMessageDiscordLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.conversationActions.deleteMessage,
);
const pinMessageDiscordLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.conversationActions.pinMessage,
);
const unpinMessageDiscordLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.conversationActions.unpinMessage,
);
const createThreadDiscordLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.conversationActions.createThread,
);
const editChannelDiscordLazy = bindDiscordRuntimeMethod(
  (runtimeDiscordOps) => runtimeDiscordOps.conversationActions.editChannel,
);
function createRuntimeDiscord() {
  return {
    messageActions: discordMessageActions,
    auditChannelPermissions: auditChannelPermissionsLazy,
    listDirectoryGroupsLive: listDirectoryGroupsLiveLazy$1,
    listDirectoryPeersLive: listDirectoryPeersLiveLazy$1,
    probeDiscord: probeDiscordLazy,
    resolveChannelAllowlist: resolveChannelAllowlistLazy$1,
    resolveUserAllowlist: resolveUserAllowlistLazy$1,
    sendComponentMessage: sendComponentMessageLazy,
    sendMessageDiscord: sendMessageDiscordLazy,
    sendPollDiscord: sendPollDiscordLazy,
    monitorDiscordProvider: monitorDiscordProviderLazy,
    threadBindings: {
      getManager: getThreadBindingManager,
      resolveIdleTimeoutMs: resolveThreadBindingIdleTimeoutMs,
      resolveInactivityExpiresAt: resolveThreadBindingInactivityExpiresAt,
      resolveMaxAgeMs: resolveThreadBindingMaxAgeMs,
      resolveMaxAgeExpiresAt: resolveThreadBindingMaxAgeExpiresAt,
      setIdleTimeoutBySessionKey: setThreadBindingIdleTimeoutBySessionKey,
      setMaxAgeBySessionKey: setThreadBindingMaxAgeBySessionKey,
      unbindBySessionKey: unbindThreadBindingsBySessionKey,
    },
    typing: {
      pulse: sendTypingDiscordLazy,
      start: async ({ channelId, accountId, cfg, intervalMs }) =>
        await createDiscordTypingLease({
          channelId,
          accountId,
          cfg,
          intervalMs,
          pulse: async ({ channelId, accountId, cfg }) =>
            void (await sendTypingDiscordLazy(channelId, {
              accountId,
              cfg,
            })),
        }),
    },
    conversationActions: {
      editMessage: editMessageDiscordLazy,
      deleteMessage: deleteMessageDiscordLazy,
      pinMessage: pinMessageDiscordLazy,
      unpinMessage: unpinMessageDiscordLazy,
      createThread: createThreadDiscordLazy,
      editChannel: editChannelDiscordLazy,
    },
  };
}
//#endregion
//#region src/plugins/runtime/runtime-imessage.ts
function createRuntimeIMessage() {
  return {
    monitorIMessageProvider,
    probeIMessage,
    sendMessageIMessage,
  };
}
//#endregion
//#region src/plugins/runtime/runtime-matrix-boundary.ts
const MATRIX_PLUGIN_ID = "matrix";
let cachedModulePath = null;
let cachedModule = null;
const jitiLoaders = /* @__PURE__ */ new Map();
function readConfigSafely() {
  try {
    return loadConfig();
  } catch {
    return {};
  }
}
function resolveMatrixPluginRecord() {
  const record = loadPluginManifestRegistry({
    config: readConfigSafely(),
    cache: true,
  }).plugins.find((plugin) => plugin.id === MATRIX_PLUGIN_ID);
  if (!record?.source) return null;
  return {
    rootDir: record.rootDir,
    source: record.source,
  };
}
function resolveMatrixRuntimeModulePath(record) {
  const candidates = [
    path.join(path.dirname(record.source), "runtime-api.js"),
    path.join(path.dirname(record.source), "runtime-api.ts"),
    ...(record.rootDir
      ? [path.join(record.rootDir, "runtime-api.js"), path.join(record.rootDir, "runtime-api.ts")]
      : []),
  ];
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;
  return null;
}
function getJiti(modulePath) {
  const tryNative = shouldPreferNativeJiti(modulePath);
  const cached = jitiLoaders.get(tryNative);
  if (cached) return cached;
  const pluginSdkAlias = resolvePluginSdkAliasFile({
    srcFile: "root-alias.cjs",
    distFile: "root-alias.cjs",
    modulePath,
  });
  const aliasMap = {
    ...(pluginSdkAlias ? { "openclaw/plugin-sdk": pluginSdkAlias } : {}),
    ...resolvePluginSdkScopedAliasMap({ modulePath }),
  };
  const loader = createJiti(import.meta.url, {
    ...buildPluginLoaderJitiOptions(aliasMap),
    tryNative,
  });
  jitiLoaders.set(tryNative, loader);
  return loader;
}
function loadWithJiti(modulePath) {
  return getJiti(modulePath)(modulePath);
}
function loadMatrixModule() {
  const record = resolveMatrixPluginRecord();
  if (!record) return null;
  const modulePath = resolveMatrixRuntimeModulePath(record);
  if (!modulePath) return null;
  if (cachedModule && cachedModulePath === modulePath) return cachedModule;
  const loaded = loadWithJiti(modulePath);
  cachedModulePath = modulePath;
  cachedModule = loaded;
  return loaded;
}
function setMatrixThreadBindingIdleTimeoutBySessionKey(...args) {
  const fn = loadMatrixModule()?.setMatrixThreadBindingIdleTimeoutBySessionKey;
  if (typeof fn !== "function") return [];
  return fn(...args);
}
function setMatrixThreadBindingMaxAgeBySessionKey(...args) {
  const fn = loadMatrixModule()?.setMatrixThreadBindingMaxAgeBySessionKey;
  if (typeof fn !== "function") return [];
  return fn(...args);
}
//#endregion
//#region src/plugins/runtime/runtime-matrix.ts
function createRuntimeMatrix() {
  return {
    threadBindings: {
      setIdleTimeoutBySessionKey: setMatrixThreadBindingIdleTimeoutBySessionKey,
      setMaxAgeBySessionKey: setMatrixThreadBindingMaxAgeBySessionKey,
    },
  };
}
//#endregion
//#region src/plugins/runtime/runtime-signal.ts
function createRuntimeSignal() {
  return {
    probeSignal,
    sendMessageSignal,
    monitorSignalProvider,
    messageActions: signalMessageActions,
  };
}
//#endregion
//#region src/plugins/runtime/runtime-slack.ts
const bindSlackRuntimeMethod = createLazyRuntimeMethodBinder(
  createLazyRuntimeSurface(
    () => import("./runtime-slack-ops.runtime-B8OVlM3D.js"),
    ({ runtimeSlackOps }) => runtimeSlackOps,
  ),
);
const listDirectoryGroupsLiveLazy = bindSlackRuntimeMethod(
  (runtimeSlackOps) => runtimeSlackOps.listDirectoryGroupsLive,
);
const listDirectoryPeersLiveLazy = bindSlackRuntimeMethod(
  (runtimeSlackOps) => runtimeSlackOps.listDirectoryPeersLive,
);
const probeSlackLazy = bindSlackRuntimeMethod((runtimeSlackOps) => runtimeSlackOps.probeSlack);
const resolveChannelAllowlistLazy = bindSlackRuntimeMethod(
  (runtimeSlackOps) => runtimeSlackOps.resolveChannelAllowlist,
);
const resolveUserAllowlistLazy = bindSlackRuntimeMethod(
  (runtimeSlackOps) => runtimeSlackOps.resolveUserAllowlist,
);
const sendMessageSlackLazy = bindSlackRuntimeMethod(
  (runtimeSlackOps) => runtimeSlackOps.sendMessageSlack,
);
const monitorSlackProviderLazy = bindSlackRuntimeMethod(
  (runtimeSlackOps) => runtimeSlackOps.monitorSlackProvider,
);
const handleSlackActionLazy = bindSlackRuntimeMethod(
  (runtimeSlackOps) => runtimeSlackOps.handleSlackAction,
);
function createRuntimeSlack() {
  return {
    listDirectoryGroupsLive: listDirectoryGroupsLiveLazy,
    listDirectoryPeersLive: listDirectoryPeersLiveLazy,
    probeSlack: probeSlackLazy,
    resolveChannelAllowlist: resolveChannelAllowlistLazy,
    resolveUserAllowlist: resolveUserAllowlistLazy,
    sendMessageSlack: sendMessageSlackLazy,
    monitorSlackProvider: monitorSlackProviderLazy,
    handleSlackAction: handleSlackActionLazy,
  };
}
//#endregion
//#region src/plugins/runtime/runtime-telegram-typing.ts
async function createTelegramTypingLease(params) {
  const intervalMs =
    typeof params.intervalMs === "number" && Number.isFinite(params.intervalMs)
      ? Math.max(1e3, Math.floor(params.intervalMs))
      : 4e3;
  let stopped = false;
  const refresh = async () => {
    if (stopped) return;
    await params.pulse({
      to: params.to,
      accountId: params.accountId,
      cfg: params.cfg,
      messageThreadId: params.messageThreadId,
    });
  };
  await refresh();
  const timer = setInterval(() => {
    refresh().catch((err) => {
      logWarn(`plugins: telegram typing pulse failed: ${String(err)}`);
    });
  }, intervalMs);
  timer.unref?.();
  return {
    refresh,
    stop: () => {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
    },
  };
}
//#endregion
//#region src/plugins/runtime/runtime-telegram.ts
const bindTelegramRuntimeMethod = createLazyRuntimeMethodBinder(
  createLazyRuntimeSurface(
    () => import("./runtime-telegram-ops.runtime-BxdK1ogm.js"),
    ({ runtimeTelegramOps }) => runtimeTelegramOps,
  ),
);
const auditGroupMembershipLazy = bindTelegramRuntimeMethod(
  (runtimeTelegramOps) => runtimeTelegramOps.auditGroupMembership,
);
const probeTelegramLazy = bindTelegramRuntimeMethod(
  (runtimeTelegramOps) => runtimeTelegramOps.probeTelegram,
);
const sendMessageTelegramLazy = bindTelegramRuntimeMethod(
  (runtimeTelegramOps) => runtimeTelegramOps.sendMessageTelegram,
);
const sendPollTelegramLazy = bindTelegramRuntimeMethod(
  (runtimeTelegramOps) => runtimeTelegramOps.sendPollTelegram,
);
const monitorTelegramProviderLazy = bindTelegramRuntimeMethod(
  (runtimeTelegramOps) => runtimeTelegramOps.monitorTelegramProvider,
);
const sendTypingTelegramLazy = bindTelegramRuntimeMethod(
  (runtimeTelegramOps) => runtimeTelegramOps.typing.pulse,
);
const editMessageTelegramLazy = bindTelegramRuntimeMethod(
  (runtimeTelegramOps) => runtimeTelegramOps.conversationActions.editMessage,
);
const editMessageReplyMarkupTelegramLazy = bindTelegramRuntimeMethod(
  (runtimeTelegramOps) => runtimeTelegramOps.conversationActions.editReplyMarkup,
);
const deleteMessageTelegramLazy = bindTelegramRuntimeMethod(
  (runtimeTelegramOps) => runtimeTelegramOps.conversationActions.deleteMessage,
);
const renameForumTopicTelegramLazy = bindTelegramRuntimeMethod(
  (runtimeTelegramOps) => runtimeTelegramOps.conversationActions.renameTopic,
);
const pinMessageTelegramLazy = bindTelegramRuntimeMethod(
  (runtimeTelegramOps) => runtimeTelegramOps.conversationActions.pinMessage,
);
const unpinMessageTelegramLazy = bindTelegramRuntimeMethod(
  (runtimeTelegramOps) => runtimeTelegramOps.conversationActions.unpinMessage,
);
function createRuntimeTelegram() {
  return {
    auditGroupMembership: auditGroupMembershipLazy,
    collectUnmentionedGroupIds: collectTelegramUnmentionedGroupIds,
    probeTelegram: probeTelegramLazy,
    resolveTelegramToken,
    sendMessageTelegram: sendMessageTelegramLazy,
    sendPollTelegram: sendPollTelegramLazy,
    monitorTelegramProvider: monitorTelegramProviderLazy,
    messageActions: telegramMessageActions,
    threadBindings: {
      setIdleTimeoutBySessionKey: setTelegramThreadBindingIdleTimeoutBySessionKey,
      setMaxAgeBySessionKey: setTelegramThreadBindingMaxAgeBySessionKey,
    },
    typing: {
      pulse: sendTypingTelegramLazy,
      start: async ({ to, accountId, cfg, intervalMs, messageThreadId }) =>
        await createTelegramTypingLease({
          to,
          accountId,
          cfg,
          intervalMs,
          messageThreadId,
          pulse: async ({ to, accountId, cfg, messageThreadId }) =>
            await sendTypingTelegramLazy(to, {
              accountId,
              cfg,
              messageThreadId,
            }),
        }),
    },
    conversationActions: {
      editMessage: editMessageTelegramLazy,
      editReplyMarkup: editMessageReplyMarkupTelegramLazy,
      clearReplyMarkup: async (chatIdInput, messageIdInput, opts = {}) =>
        await editMessageReplyMarkupTelegramLazy(chatIdInput, messageIdInput, [], opts),
      deleteMessage: deleteMessageTelegramLazy,
      renameTopic: renameForumTopicTelegramLazy,
      pinMessage: pinMessageTelegramLazy,
      unpinMessage: unpinMessageTelegramLazy,
    },
  };
}
//#endregion
//#region src/plugins/runtime/runtime-whatsapp.ts
function createRuntimeWhatsApp() {
  return {
    getActiveWebListener,
    getWebAuthAgeMs,
    logoutWeb,
    logWebSelfId,
    readWebSelfId,
    webAuthExists,
    sendMessageWhatsApp,
    sendPollWhatsApp,
    loginWeb,
    startWebLoginWithQr,
    waitForWebLogin,
    monitorWebChannel,
    handleWhatsAppAction,
    createLoginTool: createRuntimeWhatsAppLoginTool,
  };
}
//#endregion
//#region src/plugins/runtime/runtime-channel.ts
function defineCachedValue$1(target, key, create) {
  let cached;
  let ready = false;
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get() {
      if (!ready) {
        cached = create();
        ready = true;
      }
      return cached;
    },
  });
}
function createRuntimeChannel() {
  const channelRuntime = {
    text: {
      chunkByNewline,
      chunkMarkdownText,
      chunkMarkdownTextWithMode,
      chunkText,
      chunkTextWithMode,
      resolveChunkMode,
      resolveTextChunkLimit,
      hasControlCommand,
      resolveMarkdownTableMode,
      convertMarkdownTables,
    },
    reply: {
      dispatchReplyWithBufferedBlockDispatcher,
      createReplyDispatcherWithTyping,
      resolveEffectiveMessagesConfig,
      resolveHumanDelayConfig,
      dispatchReplyFromConfig,
      withReplyDispatcher,
      finalizeInboundContext,
      formatAgentEnvelope,
      formatInboundEnvelope,
      resolveEnvelopeFormatOptions,
    },
    routing: {
      buildAgentSessionKey,
      resolveAgentRoute,
    },
    pairing: {
      buildPairingReply,
      readAllowFromStore: ({ channel, accountId, env }) =>
        readChannelAllowFromStore(channel, env, accountId),
      upsertPairingRequest: ({ channel, id, accountId, meta, env, pairingAdapter }) =>
        upsertChannelPairingRequest({
          channel,
          id,
          accountId,
          meta,
          env,
          pairingAdapter,
        }),
    },
    media: {
      fetchRemoteMedia,
      saveMediaBuffer,
    },
    activity: {
      record: recordChannelActivity,
      get: getChannelActivity,
    },
    session: {
      resolveStorePath,
      readSessionUpdatedAt,
      recordSessionMetaFromInbound,
      recordInboundSession,
      updateLastRoute,
    },
    mentions: {
      buildMentionRegexes,
      matchesMentionPatterns,
      matchesMentionWithExplicit,
    },
    reactions: {
      shouldAckReaction,
      removeAckReactionAfterReply,
    },
    groups: {
      resolveGroupPolicy: resolveChannelGroupPolicy,
      resolveRequireMention: resolveChannelGroupRequireMention,
    },
    debounce: {
      createInboundDebouncer,
      resolveInboundDebounceMs,
    },
    commands: {
      resolveCommandAuthorizedFromAuthorizers,
      isControlCommandMessage,
      shouldComputeCommandAuthorized,
      shouldHandleTextCommands,
    },
    line: {
      listLineAccountIds,
      resolveDefaultLineAccountId,
      resolveLineAccount,
      normalizeAccountId,
      probeLineBot,
      sendMessageLine,
      pushMessageLine,
      pushMessagesLine,
      pushFlexMessage,
      pushTemplateMessage,
      pushLocationMessage,
      pushTextMessageWithQuickReplies,
      createQuickReplyItems,
      buildTemplateMessageFromPayload,
      monitorLineProvider,
    },
  };
  defineCachedValue$1(channelRuntime, "discord", createRuntimeDiscord);
  defineCachedValue$1(channelRuntime, "slack", createRuntimeSlack);
  defineCachedValue$1(channelRuntime, "telegram", createRuntimeTelegram);
  defineCachedValue$1(channelRuntime, "matrix", createRuntimeMatrix);
  defineCachedValue$1(channelRuntime, "signal", createRuntimeSignal);
  defineCachedValue$1(channelRuntime, "imessage", createRuntimeIMessage);
  defineCachedValue$1(channelRuntime, "whatsapp", createRuntimeWhatsApp);
  return channelRuntime;
}
//#endregion
//#region src/plugins/runtime/runtime-config.ts
function createRuntimeConfig() {
  return {
    loadConfig,
    writeConfigFile,
  };
}
//#endregion
//#region src/plugins/runtime/runtime-events.ts
function createRuntimeEvents() {
  return {
    onAgentEvent,
    onSessionTranscriptUpdate,
  };
}
//#endregion
//#region src/plugins/runtime/runtime-logging.ts
function createRuntimeLogging() {
  return {
    shouldLogVerbose,
    getChildLogger: (bindings, opts) => {
      const logger = getChildLogger(bindings, {
        level: opts?.level ? normalizeLogLevel(opts.level) : void 0,
      });
      return {
        debug: (message) => logger.debug?.(message),
        info: (message) => logger.info(message),
        warn: (message) => logger.warn(message),
        error: (message) => logger.error(message),
      };
    },
  };
}
//#endregion
//#region src/plugins/runtime/runtime-media.ts
function createRuntimeMedia() {
  return {
    loadWebMedia,
    detectMime,
    mediaKindFromMime,
    isVoiceCompatibleAudio,
    getImageMetadata,
    resizeToJpeg,
  };
}
//#endregion
//#region src/plugins/runtime/native-deps.ts
function formatNativeDependencyHint(params) {
  const manager = params.manager ?? "pnpm";
  const rebuildCommand =
    params.rebuildCommand ??
    (manager === "npm"
      ? `npm rebuild ${params.packageName}`
      : manager === "yarn"
        ? `yarn rebuild ${params.packageName}`
        : `pnpm rebuild ${params.packageName}`);
  const steps = [
    params.approveBuildsCommand ??
      (manager === "pnpm" ? `pnpm approve-builds (select ${params.packageName})` : void 0),
    rebuildCommand,
    params.downloadCommand,
  ].filter((step) => Boolean(step));
  if (steps.length === 0) return `Install ${params.packageName} and rebuild its native module.`;
  return `Install ${params.packageName} and rebuild its native module (${steps.join("; ")}).`;
}
//#endregion
//#region src/plugins/runtime/runtime-system.ts
function createRuntimeSystem() {
  return {
    enqueueSystemEvent,
    requestHeartbeatNow,
    runCommandWithTimeout,
    formatNativeDependencyHint,
  };
}
//#endregion
//#region src/agents/tools/memory-tool.ts
let memoryToolRuntimePromise = null;
async function loadMemoryToolRuntime() {
  memoryToolRuntimePromise ??= import("./memory-tool.runtime-B-Yf7nUk.js");
  return await memoryToolRuntimePromise;
}
const MemorySearchSchema = Type.Object({
  query: Type.String(),
  maxResults: Type.Optional(Type.Number()),
  minScore: Type.Optional(Type.Number()),
});
const MemoryGetSchema = Type.Object({
  path: Type.String(),
  from: Type.Optional(Type.Number()),
  lines: Type.Optional(Type.Number()),
});
function resolveMemoryToolContext(options) {
  const cfg = options.config;
  if (!cfg) return null;
  const agentId = resolveSessionAgentId({
    sessionKey: options.agentSessionKey,
    config: cfg,
  });
  if (!resolveMemorySearchConfig(cfg, agentId)) return null;
  return {
    cfg,
    agentId,
  };
}
async function getMemoryManagerContext(params) {
  return await getMemoryManagerContextWithPurpose({
    ...params,
    purpose: void 0,
  });
}
async function getMemoryManagerContextWithPurpose(params) {
  const { getMemorySearchManager } = await loadMemoryToolRuntime();
  const { manager, error } = await getMemorySearchManager({
    cfg: params.cfg,
    agentId: params.agentId,
    purpose: params.purpose,
  });
  return manager ? { manager } : { error };
}
function createMemoryTool(params) {
  const ctx = resolveMemoryToolContext(params.options);
  if (!ctx) return null;
  return {
    label: params.label,
    name: params.name,
    description: params.description,
    parameters: params.parameters,
    execute: params.execute(ctx),
  };
}
function createMemorySearchTool(options) {
  return createMemoryTool({
    options,
    label: "Memory Search",
    name: "memory_search",
    description:
      "Mandatory recall step: semantically search MEMORY.md + memory/*.md (and optional session transcripts) before answering questions about prior work, decisions, dates, people, preferences, or todos; returns top snippets with path + lines. If response has disabled=true, memory retrieval is unavailable and should be surfaced to the user.",
    parameters: MemorySearchSchema,
    execute:
      ({ cfg, agentId }) =>
      async (_toolCallId, params) => {
        const query = readStringParam(params, "query", { required: true });
        const maxResults = readNumberParam(params, "maxResults");
        const minScore = readNumberParam(params, "minScore");
        const { resolveMemoryBackendConfig } = await loadMemoryToolRuntime();
        const memory = await getMemoryManagerContext({
          cfg,
          agentId,
        });
        if ("error" in memory) return jsonResult(buildMemorySearchUnavailableResult(memory.error));
        try {
          const citationsMode = resolveMemoryCitationsMode(cfg);
          const includeCitations = shouldIncludeCitations({
            mode: citationsMode,
            sessionKey: options.agentSessionKey,
          });
          const rawResults = await memory.manager.search(query, {
            maxResults,
            minScore,
            sessionKey: options.agentSessionKey,
          });
          const status = memory.manager.status();
          const decorated = decorateCitations(rawResults, includeCitations);
          const resolved = resolveMemoryBackendConfig({
            cfg,
            agentId,
          });
          const results =
            status.backend === "qmd"
              ? clampResultsByInjectedChars(decorated, resolved.qmd?.limits.maxInjectedChars)
              : decorated;
          const searchMode = status.custom?.searchMode;
          return jsonResult({
            results,
            provider: status.provider,
            model: status.model,
            fallback: status.fallback,
            citations: citationsMode,
            mode: searchMode,
          });
        } catch (err) {
          return jsonResult(
            buildMemorySearchUnavailableResult(err instanceof Error ? err.message : String(err)),
          );
        }
      },
  });
}
function createMemoryGetTool(options) {
  return createMemoryTool({
    options,
    label: "Memory Get",
    name: "memory_get",
    description:
      "Safe snippet read from MEMORY.md or memory/*.md with optional from/lines; use after memory_search to pull only the needed lines and keep context small.",
    parameters: MemoryGetSchema,
    execute:
      ({ cfg, agentId }) =>
      async (_toolCallId, params) => {
        const relPath = readStringParam(params, "path", { required: true });
        const from = readNumberParam(params, "from", { integer: true });
        const lines = readNumberParam(params, "lines", { integer: true });
        const { readAgentMemoryFile, resolveMemoryBackendConfig } = await loadMemoryToolRuntime();
        if (
          resolveMemoryBackendConfig({
            cfg,
            agentId,
          }).backend === "builtin"
        )
          try {
            return jsonResult(
              await readAgentMemoryFile({
                cfg,
                agentId,
                relPath,
                from: from ?? void 0,
                lines: lines ?? void 0,
              }),
            );
          } catch (err) {
            return jsonResult({
              path: relPath,
              text: "",
              disabled: true,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        const memory = await getMemoryManagerContextWithPurpose({
          cfg,
          agentId,
          purpose: "status",
        });
        if ("error" in memory)
          return jsonResult({
            path: relPath,
            text: "",
            disabled: true,
            error: memory.error,
          });
        try {
          return jsonResult(
            await memory.manager.readFile({
              relPath,
              from: from ?? void 0,
              lines: lines ?? void 0,
            }),
          );
        } catch (err) {
          return jsonResult({
            path: relPath,
            text: "",
            disabled: true,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      },
  });
}
function resolveMemoryCitationsMode(cfg) {
  const mode = cfg.memory?.citations;
  if (mode === "on" || mode === "off" || mode === "auto") return mode;
  return "auto";
}
function decorateCitations(results, include) {
  if (!include)
    return results.map((entry) => ({
      ...entry,
      citation: void 0,
    }));
  return results.map((entry) => {
    const citation = formatCitation(entry);
    const snippet = `${entry.snippet.trim()}\n\nSource: ${citation}`;
    return {
      ...entry,
      citation,
      snippet,
    };
  });
}
function formatCitation(entry) {
  const lineRange =
    entry.startLine === entry.endLine
      ? `#L${entry.startLine}`
      : `#L${entry.startLine}-L${entry.endLine}`;
  return `${entry.path}${lineRange}`;
}
function clampResultsByInjectedChars(results, budget) {
  if (!budget || budget <= 0) return results;
  let remaining = budget;
  const clamped = [];
  for (const entry of results) {
    if (remaining <= 0) break;
    const snippet = entry.snippet ?? "";
    if (snippet.length <= remaining) {
      clamped.push(entry);
      remaining -= snippet.length;
    } else {
      const trimmed = snippet.slice(0, Math.max(0, remaining));
      clamped.push({
        ...entry,
        snippet: trimmed,
      });
      break;
    }
  }
  return clamped;
}
function buildMemorySearchUnavailableResult(error) {
  const reason = (error ?? "memory search unavailable").trim() || "memory search unavailable";
  const isQuotaError = /insufficient_quota|quota|429/.test(reason.toLowerCase());
  return {
    results: [],
    disabled: true,
    unavailable: true,
    error: reason,
    warning: isQuotaError
      ? "Memory search is unavailable because the embedding provider quota is exhausted."
      : "Memory search is unavailable due to an embedding/provider error.",
    action: isQuotaError
      ? "Top up or switch embedding provider, then retry memory_search."
      : "Check embedding provider configuration and retry memory_search.",
  };
}
function shouldIncludeCitations(params) {
  if (params.mode === "on") return true;
  if (params.mode === "off") return false;
  return deriveChatTypeFromSessionKey(params.sessionKey) === "direct";
}
function deriveChatTypeFromSessionKey(sessionKey) {
  const parsed = parseAgentSessionKey(sessionKey);
  if (!parsed?.rest) return "direct";
  const tokens = new Set(parsed.rest.toLowerCase().split(":").filter(Boolean));
  if (tokens.has("channel")) return "channel";
  if (tokens.has("group")) return "group";
  return "direct";
}
//#endregion
//#region src/plugins/runtime/runtime-tools.ts
function createRuntimeTools() {
  return {
    createMemoryGetTool,
    createMemorySearchTool,
    registerMemoryCli,
  };
}
//#endregion
//#region src/plugins/runtime/index.ts
function defineCachedValue(target, key, create) {
  let cached;
  let ready = false;
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get() {
      if (!ready) {
        cached = create();
        ready = true;
      }
      return cached;
    },
  });
}
const loadTtsRuntime = createLazyRuntimeModule(() => import("./runtime-tts.runtime-BKnW57Nb.js"));
const loadMediaUnderstandingRuntime = createLazyRuntimeModule(
  () => import("./runtime-media-understanding.runtime-MHQ6hVam.js"),
);
const loadModelAuthRuntime = createLazyRuntimeModule(
  () => import("./runtime-model-auth.runtime-CeCNVe34.js"),
);
function createRuntimeTts() {
  const bindTtsRuntime = createLazyRuntimeMethodBinder(loadTtsRuntime);
  return {
    textToSpeech: bindTtsRuntime((runtime) => runtime.textToSpeech),
    textToSpeechTelephony: bindTtsRuntime((runtime) => runtime.textToSpeechTelephony),
    listVoices: bindTtsRuntime((runtime) => runtime.listSpeechVoices),
  };
}
function createRuntimeMediaUnderstandingFacade() {
  const bindMediaUnderstandingRuntime = createLazyRuntimeMethodBinder(
    loadMediaUnderstandingRuntime,
  );
  return {
    runFile: bindMediaUnderstandingRuntime((runtime) => runtime.runMediaUnderstandingFile),
    describeImageFile: bindMediaUnderstandingRuntime((runtime) => runtime.describeImageFile),
    describeImageFileWithModel: bindMediaUnderstandingRuntime(
      (runtime) => runtime.describeImageFileWithModel,
    ),
    describeVideoFile: bindMediaUnderstandingRuntime((runtime) => runtime.describeVideoFile),
    transcribeAudioFile: bindMediaUnderstandingRuntime((runtime) => runtime.transcribeAudioFile),
  };
}
function createRuntimeModelAuth() {
  const getApiKeyForModel = createLazyRuntimeMethod(
    loadModelAuthRuntime,
    (runtime) => runtime.getApiKeyForModel,
  );
  const resolveApiKeyForProvider = createLazyRuntimeMethod(
    loadModelAuthRuntime,
    (runtime) => runtime.resolveApiKeyForProvider,
  );
  return {
    getApiKeyForModel: (params) =>
      getApiKeyForModel({
        model: params.model,
        cfg: params.cfg,
      }),
    resolveApiKeyForProvider: (params) =>
      resolveApiKeyForProvider({
        provider: params.provider,
        cfg: params.cfg,
      }),
  };
}
function createUnavailableSubagentRuntime() {
  const unavailable = () => {
    throw new Error("Plugin runtime subagent methods are only available during a gateway request.");
  };
  return {
    run: unavailable,
    waitForRun: unavailable,
    getSessionMessages: unavailable,
    getSession: unavailable,
    deleteSession: unavailable,
  };
}
const gatewaySubagentState = resolveGlobalSingleton(
  Symbol.for("openclaw.plugin.gatewaySubagentRuntime"),
  () => ({ subagent: void 0 }),
);
/**
 * Set the process-global gateway subagent runtime.
 * Called during gateway startup so that gateway-bindable plugin runtimes can
 * resolve subagent methods dynamically even when their registry was cached
 * before the gateway finished loading plugins.
 */
function setGatewaySubagentRuntime(subagent) {
  gatewaySubagentState.subagent = subagent;
}
/**
 * Create a late-binding subagent that resolves to:
 * 1. An explicitly provided subagent (from runtimeOptions), OR
 * 2. The process-global gateway subagent when the caller explicitly opts in, OR
 * 3. The unavailable fallback (throws with a clear error message).
 */
function createLateBindingSubagent(explicit, allowGatewaySubagentBinding = false) {
  if (explicit) return explicit;
  const unavailable = createUnavailableSubagentRuntime();
  if (!allowGatewaySubagentBinding) return unavailable;
  return new Proxy(unavailable, {
    get(_target, prop, _receiver) {
      const resolved = gatewaySubagentState.subagent ?? unavailable;
      return Reflect.get(resolved, prop, resolved);
    },
  });
}
function createPluginRuntime(_options = {}) {
  const mediaUnderstanding = createRuntimeMediaUnderstandingFacade();
  const runtime = {
    version: VERSION,
    config: createRuntimeConfig(),
    agent: createRuntimeAgent(),
    subagent: createLateBindingSubagent(
      _options.subagent,
      _options.allowGatewaySubagentBinding === true,
    ),
    system: createRuntimeSystem(),
    media: createRuntimeMedia(),
    imageGeneration: {
      generate: generateImage,
      listProviders: listRuntimeImageGenerationProviders,
    },
    webSearch: {
      listProviders: listWebSearchProviders,
      search: runWebSearch,
    },
    tools: createRuntimeTools(),
    channel: createRuntimeChannel(),
    events: createRuntimeEvents(),
    logging: createRuntimeLogging(),
    state: { resolveStateDir },
  };
  defineCachedValue(runtime, "tts", createRuntimeTts);
  defineCachedValue(runtime, "mediaUnderstanding", () => mediaUnderstanding);
  defineCachedValue(runtime, "stt", () => ({
    transcribeAudioFile: mediaUnderstanding.transcribeAudioFile,
  }));
  defineCachedValue(runtime, "modelAuth", createRuntimeModelAuth);
  return runtime;
}
//#endregion
export { setGatewaySubagentRuntime as n, createPluginRuntime as t };
