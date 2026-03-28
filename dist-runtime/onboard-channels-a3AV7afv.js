import * as crypto$1 from "node:crypto";
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync, promises, readFileSync } from "node:fs";
import * as http$1 from "node:http";
import { createServer as createServer$2 } from "node:http";
import * as https$1 from "node:https";
import net from "node:net";
import os, { homedir } from "node:os";
import path, { basename, isAbsolute } from "node:path";
import * as querystring from "node:querystring";
import tls from "node:tls";
import { Type } from "@sinclair/typebox";
import WebSocket from "ws";
import { z, z as z$2 } from "zod";
import {
  $g as createOpenProviderGroupPolicyWarningCollector,
  $h as patchChannelConfigForAccount,
  $s as resolveSignalAccount,
  Ac as readBooleanParam,
  Af as createChannelDirectoryAdapter,
  Ag as createHybridChannelConfigAdapter,
  Am as requestBodyErrorToText,
  Ba as auditTelegramGroupMembership,
  Bd as sendTelegramPayloadMessages,
  Bg as createEmptyChannelResult,
  Bh as createPromptParsedAllowFromForAccount,
  C_ as applySetupAccountConfigPatch,
  Cf as parseTelegramTarget,
  Cs as parseSlackBlocksInput,
  Da as createAccountStatusSink,
  Db as resolveDefaultDiscordAccountId,
  Dg as createLoggedPairingApprovalNotifier,
  Dm as isRequestBodyLimitError,
  Do as normalizeAllowListLower,
  Ds as resolveSlackAccount,
  E_ as migrateBaseNameToDefaultAccount,
  Es as resolveDefaultSlackAccountId,
  Fa as buildTelegramExecApprovalButtons,
  Fn as buildModelsProviderData,
  Fo as listSlackMessageActions,
  Fp as dispatchInboundReplyWithBase,
  Gg as composeAccountWarningCollectors,
  Gm as buildExecApprovalPendingReplyPayload,
  H as parseDiscordTarget,
  Ha as looksLikeSignalTargetId,
  Hb as createAccountListHelpers,
  Hg as resolveOutboundSendDep,
  Hh as createTopLevelChannelAllowFromSetter,
  Hs as signalMessageActions,
  Ih as createAccountScopedAllowFromSection,
  Io as isSlackInteractiveRepliesEnabled,
  Ip as createChannelReplyPipeline,
  Jd as sendTypingTelegram,
  Jg as createAllowlistProviderOpenWarningCollector,
  Jm as resolveExecApprovalCommandDisplay,
  Js as resolveSignalPeerId,
  Kb as resolveMergedAccountConfig,
  Kg as composeWarningCollectors,
  Kp as deliverFormattedTextWithAttachments,
  Lg as attachChannelToResult,
  Lh as createAccountScopedGroupAccessSection,
  Lo as listSlackDirectoryGroupsFromConfig,
  M_ as normalizeInteractiveReply,
  Mf as buildTelegramGroupPeerId,
  Mg as createScopedDmSecurityResolver,
  Mn as resolveExactLineGroupConfigKey,
  Mo as resolveSlackGroupRequireMention,
  Nb as normalizeOutboundThreadId,
  Ng as formatTrimmedAllowFromEntries,
  No as resolveSlackGroupToolPolicy,
  Np as formatInboundFromLabel$1,
  Ny as createDedupeCache,
  O_ as patchScopedAccountConfig,
  Oa as runPassiveAccountLifecycle,
  Ob as resolveDiscordAccount,
  Of as listResolvedDirectoryEntriesFromSources,
  Og as createPairingPrefixStripper,
  Os as resolveSlackReplyToMode,
  Pa as registerPluginHttpRoute,
  Pb as buildOutboundBaseSessionKey,
  Pd as collectTelegramStatusIssues,
  Pg as mapAllowFromEntries,
  Po as extractSlackToolSend,
  Qg as createOpenProviderConfiguredRouteWarningCollector,
  Qp as resolveSendableOutboundReplyParts,
  Qs as resolveDefaultSignalAccountId,
  Rb as buildAgentSessionKey,
  Rg as attachChannelToResults,
  Rh as createAllowFromSection,
  Ro as listSlackDirectoryPeersFromConfig,
  Rs as buildPendingHistoryContextFromMap,
  S_ as applyAccountNameToChannelSection,
  Sb as inspectDiscordAccount,
  Sf as resolveTelegramExecApprovalTarget,
  Sh as formatNormalizedAllowFromEntries,
  So as buildSlackThreadingToolContext,
  Tf as listTelegramDirectoryPeersFromConfig,
  Tg as createChannelPairingController,
  Ts as listSlackAccountIds,
  Ua as normalizeSignalMessagingTarget,
  Ub as describeAccountSnapshot,
  Ug as buildOpenGroupPolicyRestrictSendersWarning,
  Uh as createTopLevelChannelDmPolicy,
  Us as createMessageToolButtonsSchema,
  Va as collectTelegramUnmentionedGroupIds,
  Vb as buildSecretInputSchema,
  Vg as createRawChannelSendResultAdapter,
  Vh as createStandardChannelSetupStatus,
  Vo as buildSlackInteractiveBlocks,
  Vs as recordPendingHistoryEntryIfEnabled,
  Wb as listCombinedAccountIds,
  Wg as buildOpenGroupPolicyWarning,
  Wh as createTopLevelChannelDmPolicySetter,
  Ws as createMessageToolCardSchema,
  Xg as createConditionalWarningCollector,
  Xh as noteChannelLookupSummary,
  Xp as resolveOutboundMediaUrls,
  Xs as resolveSignalSender,
  Yg as createAllowlistProviderRouteAllowlistWarningCollector,
  Yh as noteChannelLookupFailure,
  Yp as isNumericTargetId,
  Ys as resolveSignalRecipient,
  Zg as createOpenGroupPolicyRestrictSendersWarningCollector,
  Zh as parseMentionOrPrefixedId,
  Zs as listSignalAccountIds,
  __ as PAIRING_APPROVED_MESSAGE,
  _f as resolveTelegramGroupRequireMention,
  _g as createChatChannelPlugin,
  _p as resolveMentionGatingWithBypass,
  a as looksLikeDiscordTargetId,
  ac as parseIMessageTarget,
  ag as resolveAccountIdForConfigure,
  ap as mergeTelegramAccountConfig,
  as as resolveSlackChannelId,
  av as createActionGate,
  b_ as buildCatchallMultiAccountChannelSchema,
  ba as monitorTelegramProvider,
  bg as stripChannelTargetPrefix,
  bm as createRuntimeDirectoryLiveAdapter,
  c as resolveDiscordGroupRequireMention,
  c_ as createStaticReplyToModeResolver,
  cf as buildAgentMediaPayload,
  cg as runSingleChannelSecretStep,
  cv as readNumberParam,
  d as listDiscordDirectoryPeersFromConfig,
  d_ as buildTokenChannelStatusSummary,
  dc as resolveIMessageGroupToolPolicy,
  dg as setSetupChannelEnabled,
  dn as lineSetupAdapter,
  e_ as projectAccountConfigWarningCollector,
  ep as lookupTelegramChatId,
  eu as enablePluginInConfig,
  f_ as collectStatusIssuesFromLastError,
  fc as listIMessageAccountIds,
  ff as parseTelegramReplyToMessageId,
  fg as splitSetupEntries,
  fn as LineChannelConfigSchema,
  gg as createChannelPluginBase,
  gi as markdownToSignalTextChunks,
  gm as listLineAccountIds,
  gp as logTypingFailure,
  hf as normalizeTelegramMessagingTarget,
  hg as buildChannelOutboundSessionRoute,
  hp as logInboundDrop,
  ht as TextDisplay,
  ic as normalizeIMessageHandle,
  ih as resolveMarkdownTableMode,
  ip as listTelegramAccountIds,
  is as parseSlackTarget,
  j_ as emptyPluginConfigSchema,
  jf as createEmptyChannelDirectoryAdapter,
  jg as createScopedChannelConfigAdapter,
  jn as createLoggerBackedRuntime,
  k_ as prepareScopedSetupConfig,
  ka as waitUntilAbort,
  kf as listResolvedDirectoryUserEntriesFromAllowFrom,
  kg as adaptScopedAccountAccessor,
  km as readRequestBodyWithLimit,
  kn as createFixedWindowRateLimiter,
  l as resolveDiscordGroupToolPolicy,
  l_ as buildBaseChannelStatusSummary,
  lf as resolveChannelMediaMaxBytes,
  lt as fetchChannelPermissionsDiscord,
  lv as readReactionParams,
  m_ as createDefaultChannelRuntimeState,
  mc as resolveIMessageAccount,
  mf as looksLikeTelegramTargetId,
  mn as processLineMessage,
  ms as createSlackWebClient,
  mt as Separator,
  n as resolveAccountWithDefaultFallback,
  n_ as projectConfigAccountIdWarningCollector,
  ng as promptParsedAllowFromForAccount,
  nh as resolveChannelGroupRequireMention,
  nm as sendPayloadWithChunkedTextAndMedia,
  o as normalizeDiscordMessagingTarget,
  og as resolveEntriesWithOptionalToken,
  op as resolveDefaultTelegramAccountId,
  os as SLACK_TEXT_LIMIT,
  p_ as createComputedAccountStatusAdapter,
  pc as resolveDefaultIMessageAccountId,
  pf as parseTelegramThreadId,
  qg as createAllowlistProviderGroupPolicyWarningCollector,
  qh as mergeAllowFromEntries,
  qm as getExecApprovalReplyMetadata,
  qp as deliverTextOrMediaReply,
  qs as looksLikeUuid,
  r as collectDiscordStatusIssues,
  rc as looksLikeIMessageExplicitTargetId,
  rg as promptResolvedAllowFrom,
  ro as parseTelegramTopicConversation,
  rp as inspectTelegramAccount,
  s as normalizeDiscordOutboundTarget,
  sg as resolveSetupAccountId,
  sp as resolveTelegramAccount,
  sv as jsonResult,
  t_ as projectAccountWarningCollector,
  tc as inferIMessageTargetChatType,
  tg as promptLegacyChannelAllowFromForAccount,
  u as listDiscordDirectoryGroupsFromConfig,
  u_ as buildProbeChannelStatusSummary,
  ub as resolveTextChunkLimit,
  uc as resolveIMessageGroupRequireMention,
  ug as setChannelDmPolicyWithAllowFrom,
  un as lineSetupWizard,
  uv as readStringParam,
  v_ as clearAccountEntryFields,
  vf as resolveTelegramGroupToolPolicy,
  vg as defineChannelPluginEntry,
  vm as resolveDefaultLineAccountId,
  w_ as createEnvPatchedAccountSetupAdapter,
  wb as listDiscordAccountIds,
  wf as listTelegramDirectoryGroupsFromConfig,
  ws as inspectSlackAccount,
  x_ as buildChannelConfigSchema,
  xf as isTelegramExecApprovalClientEnabled,
  xg as stripTargetKindPrefix,
  xh as formatAllowFromLowercase,
  xm as createRuntimeOutboundDelegates,
  y_ as AllowFromListSchema,
  ya as probeTelegram,
  yf as createRestrictSendersChannelSecurity,
  yg as defineSetupPluginEntry,
  ym as resolveLineAccount,
  za as extractToolSend,
  zg as createAttachedChannelResultAdapter,
  zh as createLegacyCompatChannelDmPolicy,
  zs as clearHistoryEntriesIfEnabled,
  zy as isChannelConfigured,
} from "./account-resolution-YAil9v6G.js";
import {
  a as resolveConfiguredFromCredentialStatuses,
  o as resolveConfiguredFromRequiredCredentialStatuses,
  r as projectCredentialSnapshotFields,
} from "./account-snapshot-fields-foxLy_VQ.js";
import {
  i as resolveZaloAccount,
  n as listZaloAccountIds,
  r as resolveDefaultZaloAccountId,
  t as listEnabledZaloAccounts,
} from "./accounts-DD9J-j_R.js";
import {
  d as resolveAgentWorkspaceDir,
  f as resolveDefaultAgentId,
} from "./agent-scope-BIySJgkJ.js";
import {
  n as collectDiscordAuditChannelIds,
  t as auditDiscordChannelPermissions,
} from "./audit-BuJR4P8I.js";
import { r as listChannelPluginCatalogEntries } from "./catalog-CG5xLIMc.js";
import { t as formatCliCommand } from "./command-format-CI2Z3AdK.js";
import { i as tryReadSecretFileSync } from "./connection-auth-C0gZDDKX.js";
import {
  C as resolveDefaultGroupPolicy,
  S as resolveAllowlistProviderRuntimeGroupPolicy,
  T as warnMissingProviderGroupPolicyFallbackOnce,
  _ as resolveDangerousNameMatchingEnabled,
  a as resolveDmGroupAccessWithLists,
  f as evaluateMatchedGroupAccessForPolicy,
  g as isDangerousNameMatchingEnabled,
  i as resolveDmGroupAccessWithCommandGate,
  l as resolveControlCommandGate,
  m as evaluateSenderGroupAccessForPolicy,
  n as readStoreAllowFromForDmPolicy,
  o as resolveEffectiveAllowFromLists,
  t as DM_GROUP_ACCESS_REASON,
  x as GROUP_POLICY_BLOCKED_LABEL,
} from "./dm-policy-shared-D3Y8oBe8.js";
import { t as fetchWithSsrFGuard } from "./fetch-guard-Bwkm96YC.js";
import {
  n as parseOptionalDelimitedEntries,
  r as resolveChannelDefaultAccountId,
} from "./helpers-BQ7Yhtpb.js";
import {
  B as BlockStreamingCoalesceSchema$1,
  C as DiscordConfigSchema,
  D as TelegramConfigSchema,
  E as SlackConfigSchema,
  H as GroupPolicySchema$1,
  K as requireOpenAllowFrom,
  T as SignalConfigSchema,
  U as MarkdownConfigSchema$1,
  V as DmPolicySchema$1,
  W as ReplyRuntimeConfigSchemaShape,
  w as IMessageConfigSchema,
  z as ToolPolicySchema$1,
} from "./io-BeL7sW7Y.js";
import {
  i as createLazyRuntimeNamedExport,
  r as createLazyRuntimeModule,
} from "./lazy-runtime-DeSnMsfk.js";
import { o as resolveStoredModelOverride } from "./level-overrides-DfXHgPB9.js";
import { t as formatDocsLink } from "./links-CZOLMG0R.js";
import { n as loadPluginManifestRegistry } from "./manifest-registry-CMy5XLiN.js";
import { l as normalizeMessageChannel } from "./message-channel-BTVKzHsu.js";
import { r as resolveFeishuGroupToolPolicy } from "./monitor-CMtQU_o22.js";
import { a as isTrustedProxyAddress, l as resolveClientIp } from "./net-B1gQyBKw.js";
import { i as parseStrictPositiveInteger } from "./parse-finite-number-z2CWSfSn.js";
import { l as resolveStorePath } from "./paths-0NHK4yJk.js";
import {
  n as loadChannelSetupPluginRegistrySnapshotForChannel,
  t as ensureChannelSetupPluginInstalled,
} from "./plugin-install-BOzKUolT.js";
import {
  d as resolveNestedAllowlistDecision,
  l as resolveChannelEntryMatchWithFallback,
  o as buildChannelKeyCandidates,
  r as resolveAllowlistMatchSimple,
  s as normalizeChannelSlug,
} from "./plugins-AUGbKgu9.js";
import { r as normalizeProviderId } from "./provider-id-CYnSF2NM.js";
import {
  a as listFeishuDirectoryPeers,
  i as listFeishuDirectoryGroups,
  l as registerFeishuChatTools,
  u as resolveToolsConfig,
} from "./reactions--IAyT0-F.js";
import {
  i as listChatChannels,
  n as formatChannelSelectionLine,
  r as getChatChannelMeta,
  t as formatChannelPrimerLine,
  u as CHAT_CHANNEL_ORDER,
} from "./registry-B5KsIQB2.js";
import {
  n as resolveSlackUserAllowlist,
  r as handleSlackAction,
  t as resolveSlackChannelAllowlist,
} from "./resolve-channels-DRbGghq8.js";
import { t as resolveDiscordUserAllowlist } from "./resolve-users-CbF5fL17.js";
import {
  n as zaloSetupWizard,
  r as zaloSetupAdapter,
  t as chunkTextForOutbound,
} from "./runtime-api-j7kJbVIJ.js";
import { i as normalizeIMessageMessagingTarget } from "./runtime-api-mA2BgZV0.js";
import {
  r as getActivePluginRegistryVersion,
  s as requireActivePluginRegistry,
} from "./runtime-Bd4XqlOP.js";
import { n as setZaloRuntime } from "./runtime-CEBJRx-j.js";
import { t as createPluginRuntimeStore } from "./runtime-store-Dh8fm3Ic.js";
import {
  h as loadWebMedia,
  v as getAgentScopedMediaLocalRoots,
} from "./runtime-whatsapp-boundary-Di5xVA5u.js";
import {
  C as feishuSetupWizard,
  D as looksLikeFeishuId,
  E as feishuSetupAdapter,
  F as listFeishuAccountIds,
  I as resolveDefaultFeishuAccountId,
  L as resolveFeishuAccount,
  O as normalizeFeishuTarget,
  P as listEnabledFeishuAccounts,
  R as resolveFeishuCredentials,
  S as createPersistentDedupe,
  b as buildFeishuConversationId,
  g as setFeishuRuntime,
  h as getFeishuRuntime,
  j as createFeishuClient,
  x as parseFeishuConversationId,
  y as getFeishuThreadBindingManager,
} from "./send-DnN1-Sre.js";
import {
  g as normalizeAccountId,
  h as DEFAULT_ACCOUNT_ID,
  u as resolveThreadSessionKeys$1,
  v as isBlockedObjectKey,
} from "./session-key-0JD9qg4o.js";
import {
  a as imessageSetupAdapter,
  c as setIMessageRuntime,
  n as createIMessageSetupWizardProxy,
  s as getIMessageRuntime,
} from "./setup-core-C5AO0Myq2.js";
import {
  n as createDiscordSetupWizardProxy,
  r as discordSetupAdapter,
} from "./setup-core-CQ8M6fSi.js";
import {
  n as createSignalSetupWizardProxy,
  o as signalSetupAdapter,
} from "./setup-core-w7EBN6u4.js";
import { t as promptChannelAccessConfig } from "./setup-group-access-CJUzc8dq.js";
import { t as listSkillCommandsForAgents } from "./skill-commands-DnBwBMmQ.js";
import {
  n as normalizeSlackMessagingTarget,
  t as looksLikeSlackTargetId,
} from "./slack-yOsQuAbT.js";
import { n as loadSessionStore } from "./store-Bo1TX1Sc.js";
import {
  n as listThreadBindingsBySessionKey,
  o as unbindThreadBindingsBySessionKey,
  t as autoBindSpawnedDiscordSubagent,
} from "./thread-bindings-D_hD7YlT.js";
import {
  a as hasConfiguredSecretInput,
  c as normalizeResolvedSecretInputString,
  l as normalizeSecretInputString,
} from "./types.secrets-BEA4gMCN.js";
import { r as probeDiscord, t as DiscordUiContainer } from "./ui-B90rE-ng.js";
import { d as isRecord, m as normalizeE164 } from "./utils-DGUUVa38.js";
import {
  D as listBlueBubblesAccountIds,
  M as normalizeBlueBubblesServerUrl,
  O as resolveBlueBubblesAccount,
  S as getCachedBlueBubblesPrivateApiStatus,
  T as isMacOS26OrHigher,
  _ as resolveBlueBubblesGroupRequireMention,
  a as inferBlueBubblesTargetChatType,
  b as BLUEBUBBLES_ACTION_NAMES,
  c as looksLikeBlueBubblesTargetId,
  d as parseBlueBubblesAllowTarget,
  f as parseBlueBubblesTarget,
  g as collectBlueBubblesStatusIssues,
  k as resolveDefaultBlueBubblesAccountId,
  l as normalizeBlueBubblesHandle,
  m as setBlueBubblesRuntime,
  r as extractHandleFromChatGuid,
  s as looksLikeBlueBubblesExplicitTargetId,
  t as DEFAULT_WEBHOOK_PATH$2,
  u as normalizeBlueBubblesMessagingTarget,
  v as resolveBlueBubblesGroupToolPolicy,
  y as BLUEBUBBLES_ACTIONS,
} from "./webhook-shared-DemgUaBR.js";
import { t as rawDataToString } from "./ws-DfGZCMhF.js";
//#region src/channels/plugins/target-resolvers.ts
function buildUnresolvedTargetResults(inputs, note) {
  return inputs.map((input) => ({
    input,
    resolved: false,
    note,
  }));
}
async function resolveTargetsWithOptionalToken(params) {
  const token = params.token?.trim();
  if (!token) return buildUnresolvedTargetResults(params.inputs, params.missingTokenNote);
  return (
    await params.resolveWithToken({
      token,
      inputs: params.inputs,
    })
  ).map(params.mapResolved);
}
//#endregion
//#region extensions/bluebubbles/src/actions.ts
const loadBlueBubblesActionsRuntime = createLazyRuntimeNamedExport(
  () => import("./actions.runtime-BJp2XtOE.js"),
  "blueBubblesActionsRuntime",
);
const providerId$1 = "bluebubbles";
function mapTarget(raw) {
  const parsed = parseBlueBubblesTarget(raw);
  if (parsed.kind === "chat_guid")
    return {
      kind: "chat_guid",
      chatGuid: parsed.chatGuid,
    };
  if (parsed.kind === "chat_id")
    return {
      kind: "chat_id",
      chatId: parsed.chatId,
    };
  if (parsed.kind === "chat_identifier")
    return {
      kind: "chat_identifier",
      chatIdentifier: parsed.chatIdentifier,
    };
  return {
    kind: "handle",
    address: normalizeBlueBubblesHandle(parsed.to),
    service: parsed.service,
  };
}
function readMessageText(params) {
  return readStringParam(params, "text") ?? readStringParam(params, "message");
}
/** Supported action names for BlueBubbles */
const SUPPORTED_ACTIONS = new Set(BLUEBUBBLES_ACTION_NAMES);
const PRIVATE_API_ACTIONS = new Set([
  "react",
  "edit",
  "unsend",
  "reply",
  "sendWithEffect",
  "renameGroup",
  "setGroupIcon",
  "addParticipant",
  "removeParticipant",
  "leaveGroup",
]);
const bluebubblesMessageActions = {
  describeMessageTool: ({ cfg, currentChannelId }) => {
    const account = resolveBlueBubblesAccount({ cfg });
    if (!account.enabled || !account.configured) return null;
    const gate = createActionGate(cfg.channels?.bluebubbles?.actions);
    const actions = /* @__PURE__ */ new Set();
    const macOS26 = isMacOS26OrHigher(account.accountId);
    const privateApiStatus = getCachedBlueBubblesPrivateApiStatus(account.accountId);
    for (const action of BLUEBUBBLES_ACTION_NAMES) {
      const spec = BLUEBUBBLES_ACTIONS[action];
      if (!spec?.gate) continue;
      if (privateApiStatus === false && PRIVATE_API_ACTIONS.has(action)) continue;
      if ("unsupportedOnMacOS26" in spec && spec.unsupportedOnMacOS26 && macOS26) continue;
      if (gate(spec.gate)) actions.add(action);
    }
    const lowered =
      (currentChannelId ? normalizeBlueBubblesMessagingTarget(currentChannelId) : void 0)
        ?.trim()
        .toLowerCase() ?? "";
    if (
      !(
        lowered.startsWith("chat_guid:") ||
        lowered.startsWith("chat_id:") ||
        lowered.startsWith("chat_identifier:") ||
        lowered.startsWith("group:")
      )
    ) {
      for (const action of BLUEBUBBLES_ACTION_NAMES)
        if ("groupOnly" in BLUEBUBBLES_ACTIONS[action] && BLUEBUBBLES_ACTIONS[action].groupOnly)
          actions.delete(action);
    }
    return { actions: Array.from(actions) };
  },
  supportsAction: ({ action }) => SUPPORTED_ACTIONS.has(action),
  extractToolSend: ({ args }) => extractToolSend(args, "sendMessage"),
  handleAction: async ({ action, params, cfg, accountId, toolContext }) => {
    const runtime = await loadBlueBubblesActionsRuntime();
    const account = resolveBlueBubblesAccount({
      cfg,
      accountId: accountId ?? void 0,
    });
    const baseUrl = normalizeSecretInputString(account.config.serverUrl);
    const password = normalizeSecretInputString(account.config.password);
    const opts = {
      cfg,
      accountId: accountId ?? void 0,
    };
    const assertPrivateApiEnabled = () => {
      if (getCachedBlueBubblesPrivateApiStatus(account.accountId) === false)
        throw new Error(
          `BlueBubbles ${action} requires Private API, but it is disabled on the BlueBubbles server.`,
        );
    };
    const resolveChatGuid = async () => {
      const chatGuid = readStringParam(params, "chatGuid");
      if (chatGuid?.trim()) return chatGuid.trim();
      const chatIdentifier = readStringParam(params, "chatIdentifier");
      const chatId = readNumberParam(params, "chatId", { integer: true });
      const to = readStringParam(params, "to");
      const contextTarget = toolContext?.currentChannelId?.trim();
      const target = chatIdentifier?.trim()
        ? {
            kind: "chat_identifier",
            chatIdentifier: chatIdentifier.trim(),
          }
        : typeof chatId === "number"
          ? {
              kind: "chat_id",
              chatId,
            }
          : to
            ? mapTarget(to)
            : contextTarget
              ? mapTarget(contextTarget)
              : null;
      if (!target)
        throw new Error(`BlueBubbles ${action} requires chatGuid, chatIdentifier, chatId, or to.`);
      if (!baseUrl || !password)
        throw new Error(`BlueBubbles ${action} requires serverUrl and password.`);
      const resolved = await runtime.resolveChatGuidForTarget({
        baseUrl,
        password,
        target,
      });
      if (!resolved)
        throw new Error(`BlueBubbles ${action} failed: chatGuid not found for target.`);
      return resolved;
    };
    if (action === "react") {
      assertPrivateApiEnabled();
      const { emoji, remove, isEmpty } = readReactionParams(params, {
        removeErrorMessage: "Emoji is required to remove a BlueBubbles reaction.",
      });
      if (isEmpty && !remove)
        throw new Error(
          "BlueBubbles react requires emoji parameter. Use action=react with emoji=<emoji> and messageId=<message_id>.",
        );
      const rawMessageId = readStringParam(params, "messageId");
      if (!rawMessageId)
        throw new Error(
          "BlueBubbles react requires messageId parameter (the message ID to react to). Use action=react with messageId=<message_id>, emoji=<emoji>, and to/chatGuid to identify the chat.",
        );
      const messageId = runtime.resolveBlueBubblesMessageId(rawMessageId, {
        requireKnownShortId: true,
      });
      const partIndex = readNumberParam(params, "partIndex", { integer: true });
      const resolvedChatGuid = await resolveChatGuid();
      await runtime.sendBlueBubblesReaction({
        chatGuid: resolvedChatGuid,
        messageGuid: messageId,
        emoji,
        remove: remove || void 0,
        partIndex: typeof partIndex === "number" ? partIndex : void 0,
        opts,
      });
      return jsonResult({
        ok: true,
        ...(remove ? { removed: true } : { added: emoji }),
      });
    }
    if (action === "edit") {
      assertPrivateApiEnabled();
      if (isMacOS26OrHigher(accountId ?? void 0))
        throw new Error(
          "BlueBubbles edit is not supported on macOS 26 or higher. Apple removed the ability to edit iMessages in this version.",
        );
      const rawMessageId = readStringParam(params, "messageId");
      const newText =
        readStringParam(params, "text") ??
        readStringParam(params, "newText") ??
        readStringParam(params, "message");
      if (!rawMessageId || !newText) {
        const missing = [];
        if (!rawMessageId) missing.push("messageId (the message ID to edit)");
        if (!newText) missing.push("text (the new message content)");
        throw new Error(
          `BlueBubbles edit requires: ${missing.join(", ")}. Use action=edit with messageId=<message_id>, text=<new_content>.`,
        );
      }
      const messageId = runtime.resolveBlueBubblesMessageId(rawMessageId, {
        requireKnownShortId: true,
      });
      const partIndex = readNumberParam(params, "partIndex", { integer: true });
      const backwardsCompatMessage = readStringParam(params, "backwardsCompatMessage");
      await runtime.editBlueBubblesMessage(messageId, newText, {
        ...opts,
        partIndex: typeof partIndex === "number" ? partIndex : void 0,
        backwardsCompatMessage: backwardsCompatMessage ?? void 0,
      });
      return jsonResult({
        ok: true,
        edited: rawMessageId,
      });
    }
    if (action === "unsend") {
      assertPrivateApiEnabled();
      const rawMessageId = readStringParam(params, "messageId");
      if (!rawMessageId)
        throw new Error(
          "BlueBubbles unsend requires messageId parameter (the message ID to unsend). Use action=unsend with messageId=<message_id>.",
        );
      const messageId = runtime.resolveBlueBubblesMessageId(rawMessageId, {
        requireKnownShortId: true,
      });
      const partIndex = readNumberParam(params, "partIndex", { integer: true });
      await runtime.unsendBlueBubblesMessage(messageId, {
        ...opts,
        partIndex: typeof partIndex === "number" ? partIndex : void 0,
      });
      return jsonResult({
        ok: true,
        unsent: rawMessageId,
      });
    }
    if (action === "reply") {
      assertPrivateApiEnabled();
      const rawMessageId = readStringParam(params, "messageId");
      const text = readMessageText(params);
      const to = readStringParam(params, "to") ?? readStringParam(params, "target");
      if (!rawMessageId || !text || !to) {
        const missing = [];
        if (!rawMessageId) missing.push("messageId (the message ID to reply to)");
        if (!text) missing.push("text or message (the reply message content)");
        if (!to) missing.push("to or target (the chat target)");
        throw new Error(
          `BlueBubbles reply requires: ${missing.join(", ")}. Use action=reply with messageId=<message_id>, message=<your reply>, target=<chat_target>.`,
        );
      }
      const messageId = runtime.resolveBlueBubblesMessageId(rawMessageId, {
        requireKnownShortId: true,
      });
      const partIndex = readNumberParam(params, "partIndex", { integer: true });
      return jsonResult({
        ok: true,
        messageId: (
          await runtime.sendMessageBlueBubbles(to, text, {
            ...opts,
            replyToMessageGuid: messageId,
            replyToPartIndex: typeof partIndex === "number" ? partIndex : void 0,
          })
        ).messageId,
        repliedTo: rawMessageId,
      });
    }
    if (action === "sendWithEffect") {
      assertPrivateApiEnabled();
      const text = readMessageText(params);
      const to = readStringParam(params, "to") ?? readStringParam(params, "target");
      const effectId = readStringParam(params, "effectId") ?? readStringParam(params, "effect");
      if (!text || !to || !effectId) {
        const missing = [];
        if (!text) missing.push("text or message (the message content)");
        if (!to) missing.push("to or target (the chat target)");
        if (!effectId)
          missing.push(
            "effectId or effect (e.g., slam, loud, gentle, invisible-ink, confetti, lasers, fireworks, balloons, heart)",
          );
        throw new Error(
          `BlueBubbles sendWithEffect requires: ${missing.join(", ")}. Use action=sendWithEffect with message=<message>, target=<chat_target>, effectId=<effect_name>.`,
        );
      }
      return jsonResult({
        ok: true,
        messageId: (
          await runtime.sendMessageBlueBubbles(to, text, {
            ...opts,
            effectId,
          })
        ).messageId,
        effect: effectId,
      });
    }
    if (action === "renameGroup") {
      assertPrivateApiEnabled();
      const resolvedChatGuid = await resolveChatGuid();
      const displayName = readStringParam(params, "displayName") ?? readStringParam(params, "name");
      if (!displayName)
        throw new Error("BlueBubbles renameGroup requires displayName or name parameter.");
      await runtime.renameBlueBubblesChat(resolvedChatGuid, displayName, opts);
      return jsonResult({
        ok: true,
        renamed: resolvedChatGuid,
        displayName,
      });
    }
    if (action === "setGroupIcon") {
      assertPrivateApiEnabled();
      const resolvedChatGuid = await resolveChatGuid();
      const base64Buffer = readStringParam(params, "buffer");
      const filename =
        readStringParam(params, "filename") ?? readStringParam(params, "name") ?? "icon.png";
      const contentType =
        readStringParam(params, "contentType") ?? readStringParam(params, "mimeType");
      if (!base64Buffer)
        throw new Error(
          "BlueBubbles setGroupIcon requires an image. Use action=setGroupIcon with media=<image_url> or path=<local_file_path> to set the group icon.",
        );
      const buffer = Uint8Array.from(atob(base64Buffer), (c) => c.charCodeAt(0));
      await runtime.setGroupIconBlueBubbles(resolvedChatGuid, buffer, filename, {
        ...opts,
        contentType: contentType ?? void 0,
      });
      return jsonResult({
        ok: true,
        chatGuid: resolvedChatGuid,
        iconSet: true,
      });
    }
    if (action === "addParticipant") {
      assertPrivateApiEnabled();
      const resolvedChatGuid = await resolveChatGuid();
      const address = readStringParam(params, "address") ?? readStringParam(params, "participant");
      if (!address)
        throw new Error("BlueBubbles addParticipant requires address or participant parameter.");
      await runtime.addBlueBubblesParticipant(resolvedChatGuid, address, opts);
      return jsonResult({
        ok: true,
        added: address,
        chatGuid: resolvedChatGuid,
      });
    }
    if (action === "removeParticipant") {
      assertPrivateApiEnabled();
      const resolvedChatGuid = await resolveChatGuid();
      const address = readStringParam(params, "address") ?? readStringParam(params, "participant");
      if (!address)
        throw new Error("BlueBubbles removeParticipant requires address or participant parameter.");
      await runtime.removeBlueBubblesParticipant(resolvedChatGuid, address, opts);
      return jsonResult({
        ok: true,
        removed: address,
        chatGuid: resolvedChatGuid,
      });
    }
    if (action === "leaveGroup") {
      assertPrivateApiEnabled();
      const resolvedChatGuid = await resolveChatGuid();
      await runtime.leaveBlueBubblesChat(resolvedChatGuid, opts);
      return jsonResult({
        ok: true,
        left: resolvedChatGuid,
      });
    }
    if (action === "sendAttachment") {
      const to = readStringParam(params, "to", { required: true });
      const filename = readStringParam(params, "filename", { required: true });
      const caption = readStringParam(params, "caption");
      const contentType =
        readStringParam(params, "contentType") ?? readStringParam(params, "mimeType");
      const asVoice = readBooleanParam(params, "asVoice");
      const base64Buffer = readStringParam(params, "buffer");
      const filePath = readStringParam(params, "path") ?? readStringParam(params, "filePath");
      let buffer;
      if (base64Buffer) buffer = Uint8Array.from(atob(base64Buffer), (c) => c.charCodeAt(0));
      else if (filePath)
        throw new Error(
          "BlueBubbles sendAttachment: filePath not supported in action, provide buffer as base64.",
        );
      else throw new Error("BlueBubbles sendAttachment requires buffer (base64) parameter.");
      return jsonResult({
        ok: true,
        messageId: (
          await runtime.sendBlueBubblesAttachment({
            to,
            buffer,
            filename,
            contentType: contentType ?? void 0,
            caption: caption ?? void 0,
            asVoice: asVoice ?? void 0,
            opts,
          })
        ).messageId,
      });
    }
    throw new Error(`Action ${action} is not supported for provider ${providerId$1}.`);
  },
};
//#endregion
//#region extensions/bluebubbles/src/config-schema.ts
const bluebubblesActionSchema = z
  .object({
    reactions: z.boolean().default(true),
    edit: z.boolean().default(true),
    unsend: z.boolean().default(true),
    reply: z.boolean().default(true),
    sendWithEffect: z.boolean().default(true),
    renameGroup: z.boolean().default(true),
    setGroupIcon: z.boolean().default(true),
    addParticipant: z.boolean().default(true),
    removeParticipant: z.boolean().default(true),
    leaveGroup: z.boolean().default(true),
    sendAttachment: z.boolean().default(true),
  })
  .optional();
const bluebubblesGroupConfigSchema = z.object({
  requireMention: z.boolean().optional(),
  tools: ToolPolicySchema$1,
});
const BlueBubblesConfigSchema = buildCatchallMultiAccountChannelSchema(
  z
    .object({
      name: z.string().optional(),
      enabled: z.boolean().optional(),
      markdown: MarkdownConfigSchema$1,
      serverUrl: z.string().optional(),
      password: buildSecretInputSchema().optional(),
      webhookPath: z.string().optional(),
      dmPolicy: DmPolicySchema$1.optional(),
      allowFrom: AllowFromListSchema,
      groupAllowFrom: AllowFromListSchema,
      groupPolicy: GroupPolicySchema$1.optional(),
      historyLimit: z.number().int().min(0).optional(),
      dmHistoryLimit: z.number().int().min(0).optional(),
      textChunkLimit: z.number().int().positive().optional(),
      chunkMode: z.enum(["length", "newline"]).optional(),
      mediaMaxMb: z.number().int().positive().optional(),
      mediaLocalRoots: z.array(z.string()).optional(),
      sendReadReceipts: z.boolean().optional(),
      allowPrivateNetwork: z.boolean().optional(),
      blockStreaming: z.boolean().optional(),
      groups: z.object({}).catchall(bluebubblesGroupConfigSchema).optional(),
    })
    .superRefine((value, ctx) => {
      const serverUrl = value.serverUrl?.trim() ?? "";
      const passwordConfigured = hasConfiguredSecretInput(value.password);
      if (serverUrl && !passwordConfigured)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "password is required when serverUrl is configured",
        });
    }),
).extend({ actions: bluebubblesActionSchema });
//#endregion
//#region extensions/bluebubbles/src/session-route.ts
function resolveBlueBubblesOutboundSessionRoute(params) {
  const stripped = stripChannelTargetPrefix(params.target, "bluebubbles");
  if (!stripped) return null;
  const parsed = parseBlueBubblesTarget(stripped);
  const isGroup =
    parsed.kind === "chat_id" || parsed.kind === "chat_guid" || parsed.kind === "chat_identifier";
  const peerId =
    parsed.kind === "chat_id"
      ? String(parsed.chatId)
      : parsed.kind === "chat_guid"
        ? parsed.chatGuid
        : parsed.kind === "chat_identifier"
          ? parsed.chatIdentifier
          : parsed.to;
  return buildChannelOutboundSessionRoute({
    cfg: params.cfg,
    agentId: params.agentId,
    channel: "bluebubbles",
    accountId: params.accountId,
    peer: {
      kind: isGroup ? "group" : "direct",
      id: peerId,
    },
    chatType: isGroup ? "group" : "direct",
    from: isGroup ? `group:${peerId}` : `bluebubbles:${peerId}`,
    to: `bluebubbles:${stripped}`,
  });
}
//#endregion
//#region extensions/bluebubbles/src/config-apply.ts
function normalizePatch(patch, onlyDefinedFields) {
  if (!onlyDefinedFields) return patch;
  const next = {};
  if (patch.serverUrl !== void 0) next.serverUrl = patch.serverUrl;
  if (patch.password !== void 0) next.password = patch.password;
  if (patch.webhookPath !== void 0) next.webhookPath = patch.webhookPath;
  return next;
}
function applyBlueBubblesConnectionConfig(params) {
  const patch = normalizePatch(params.patch, params.onlyDefinedFields === true);
  if (params.accountId === "default")
    return {
      ...params.cfg,
      channels: {
        ...params.cfg.channels,
        bluebubbles: {
          ...params.cfg.channels?.bluebubbles,
          enabled: true,
          ...patch,
        },
      },
    };
  const currentAccount = params.cfg.channels?.bluebubbles?.accounts?.[params.accountId];
  const enabled =
    params.accountEnabled === "preserve-or-true"
      ? (currentAccount?.enabled ?? true)
      : (params.accountEnabled ?? true);
  return {
    ...params.cfg,
    channels: {
      ...params.cfg.channels,
      bluebubbles: {
        ...params.cfg.channels?.bluebubbles,
        enabled: true,
        accounts: {
          ...params.cfg.channels?.bluebubbles?.accounts,
          [params.accountId]: {
            ...currentAccount,
            enabled,
            ...patch,
          },
        },
      },
    },
  };
}
//#endregion
//#region extensions/bluebubbles/src/setup-core.ts
const channel$10 = "bluebubbles";
const setBlueBubblesTopLevelDmPolicy = createTopLevelChannelDmPolicySetter({ channel: channel$10 });
function setBlueBubblesDmPolicy(cfg, dmPolicy) {
  return setBlueBubblesTopLevelDmPolicy(cfg, dmPolicy);
}
function setBlueBubblesAllowFrom(cfg, accountId, allowFrom) {
  return patchScopedAccountConfig({
    cfg,
    channelKey: channel$10,
    accountId,
    patch: { allowFrom },
    ensureChannelEnabled: false,
    ensureAccountEnabled: false,
  });
}
const blueBubblesSetupAdapter = {
  resolveAccountId: ({ accountId }) => normalizeAccountId(accountId),
  applyAccountName: ({ cfg, accountId, name }) =>
    prepareScopedSetupConfig({
      cfg,
      channelKey: channel$10,
      accountId,
      name,
    }),
  validateInput: ({ input }) => {
    if (!input.httpUrl && !input.password) return "BlueBubbles requires --http-url and --password.";
    if (!input.httpUrl) return "BlueBubbles requires --http-url.";
    if (!input.password) return "BlueBubbles requires --password.";
    return null;
  },
  applyAccountConfig: ({ cfg, accountId, input }) => {
    return applyBlueBubblesConnectionConfig({
      cfg: prepareScopedSetupConfig({
        cfg,
        channelKey: channel$10,
        accountId,
        name: input.name,
        migrateBaseName: true,
      }),
      accountId,
      patch: {
        serverUrl: input.httpUrl,
        password: input.password,
        webhookPath: input.webhookPath,
      },
      onlyDefinedFields: true,
    });
  },
};
//#endregion
//#region extensions/bluebubbles/src/setup-surface.ts
const channel$9 = "bluebubbles";
const CONFIGURE_CUSTOM_WEBHOOK_FLAG = "__bluebubblesConfigureCustomWebhookPath";
function parseBlueBubblesAllowFromInput(raw) {
  return raw
    .split(/[\n,]+/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}
function validateBlueBubblesAllowFromEntry(value) {
  try {
    if (value === "*") return value;
    const parsed = parseBlueBubblesAllowTarget(value);
    if (parsed.kind === "handle" && !parsed.handle) return null;
    return value.trim() || null;
  } catch {
    return null;
  }
}
const promptBlueBubblesAllowFrom = createPromptParsedAllowFromForAccount({
  defaultAccountId: (cfg) => resolveDefaultBlueBubblesAccountId(cfg),
  noteTitle: "BlueBubbles allowlist",
  noteLines: [
    "Allowlist BlueBubbles DMs by handle or chat target.",
    "Examples:",
    "- +15555550123",
    "- user@example.com",
    "- chat_id:123",
    "- chat_guid:iMessage;-;+15555550123",
    "Multiple entries: comma- or newline-separated.",
    `Docs: ${formatDocsLink("/channels/bluebubbles", "bluebubbles")}`,
  ],
  message: "BlueBubbles allowFrom (handle or chat_id)",
  placeholder: "+15555550123, user@example.com, chat_id:123",
  parseEntries: (raw) => {
    const entries = parseBlueBubblesAllowFromInput(raw);
    for (const entry of entries)
      if (!validateBlueBubblesAllowFromEntry(entry))
        return {
          entries: [],
          error: `Invalid entry: ${entry}`,
        };
    return { entries };
  },
  getExistingAllowFrom: ({ cfg, accountId }) =>
    resolveBlueBubblesAccount({
      cfg,
      accountId,
    }).config.allowFrom ?? [],
  applyAllowFrom: ({ cfg, accountId, allowFrom }) =>
    setBlueBubblesAllowFrom(cfg, accountId, allowFrom),
});
function validateBlueBubblesServerUrlInput(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "Required";
  try {
    const normalized = normalizeBlueBubblesServerUrl(trimmed);
    new URL(normalized);
    return;
  } catch {
    return "Invalid URL format";
  }
}
function applyBlueBubblesSetupPatch(cfg, accountId, patch) {
  return applyBlueBubblesConnectionConfig({
    cfg,
    accountId,
    patch,
    onlyDefinedFields: true,
    accountEnabled: "preserve-or-true",
  });
}
function resolveBlueBubblesServerUrl(cfg, accountId) {
  return (
    resolveBlueBubblesAccount({
      cfg,
      accountId,
    }).config.serverUrl?.trim() || void 0
  );
}
function resolveBlueBubblesWebhookPath(cfg, accountId) {
  return (
    resolveBlueBubblesAccount({
      cfg,
      accountId,
    }).config.webhookPath?.trim() || void 0
  );
}
function validateBlueBubblesWebhookPath(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "Required";
  if (!trimmed.startsWith("/")) return "Path must start with /";
}
const dmPolicy$1 = {
  label: "BlueBubbles",
  channel: channel$9,
  policyKey: "channels.bluebubbles.dmPolicy",
  allowFromKey: "channels.bluebubbles.allowFrom",
  getCurrent: (cfg) => cfg.channels?.bluebubbles?.dmPolicy ?? "pairing",
  setPolicy: (cfg, policy) => setBlueBubblesDmPolicy(cfg, policy),
  promptAllowFrom: promptBlueBubblesAllowFrom,
};
const blueBubblesSetupWizard = {
  channel: channel$9,
  stepOrder: "text-first",
  status: {
    ...createStandardChannelSetupStatus({
      channelLabel: "BlueBubbles",
      configuredLabel: "configured",
      unconfiguredLabel: "needs setup",
      configuredHint: "configured",
      unconfiguredHint: "iMessage via BlueBubbles app",
      configuredScore: 1,
      unconfiguredScore: 0,
      includeStatusLine: true,
      resolveConfigured: ({ cfg }) =>
        listBlueBubblesAccountIds(cfg).some((accountId) => {
          return resolveBlueBubblesAccount({
            cfg,
            accountId,
          }).configured;
        }),
    }),
    resolveSelectionHint: ({ configured }) =>
      configured ? "configured" : "iMessage via BlueBubbles app",
  },
  prepare: async ({ cfg, accountId, prompter, credentialValues }) => {
    const existingWebhookPath = resolveBlueBubblesWebhookPath(cfg, accountId);
    const wantsCustomWebhook = await prompter.confirm({
      message: `Configure a custom webhook path? (default: ${DEFAULT_WEBHOOK_PATH$2})`,
      initialValue: Boolean(existingWebhookPath && existingWebhookPath !== "/bluebubbles-webhook"),
    });
    return {
      cfg: wantsCustomWebhook
        ? cfg
        : applyBlueBubblesSetupPatch(cfg, accountId, { webhookPath: DEFAULT_WEBHOOK_PATH$2 }),
      credentialValues: {
        ...credentialValues,
        [CONFIGURE_CUSTOM_WEBHOOK_FLAG]: wantsCustomWebhook ? "1" : "0",
      },
    };
  },
  credentials: [
    {
      inputKey: "password",
      providerHint: channel$9,
      credentialLabel: "server password",
      helpTitle: "BlueBubbles password",
      helpLines: [
        "Enter the BlueBubbles server password.",
        "Find this in the BlueBubbles Server app under Settings.",
      ],
      envPrompt: "",
      keepPrompt: "BlueBubbles password already set. Keep it?",
      inputPrompt: "BlueBubbles password",
      inspect: ({ cfg, accountId }) => {
        const existingPassword = resolveBlueBubblesAccount({
          cfg,
          accountId,
        }).config.password;
        return {
          accountConfigured: resolveBlueBubblesAccount({
            cfg,
            accountId,
          }).configured,
          hasConfiguredValue: hasConfiguredSecretInput(existingPassword),
          resolvedValue: normalizeSecretInputString(existingPassword) ?? void 0,
        };
      },
      applySet: async ({ cfg, accountId, value }) =>
        applyBlueBubblesSetupPatch(cfg, accountId, { password: value }),
    },
  ],
  textInputs: [
    {
      inputKey: "httpUrl",
      message: "BlueBubbles server URL",
      placeholder: "http://192.168.1.100:1234",
      helpTitle: "BlueBubbles server URL",
      helpLines: [
        "Enter the BlueBubbles server URL (e.g., http://192.168.1.100:1234).",
        "Find this in the BlueBubbles Server app under Connection.",
        `Docs: ${formatDocsLink("/channels/bluebubbles", "bluebubbles")}`,
      ],
      currentValue: ({ cfg, accountId }) => resolveBlueBubblesServerUrl(cfg, accountId),
      validate: ({ value }) => validateBlueBubblesServerUrlInput(value),
      normalizeValue: ({ value }) => String(value).trim(),
      applySet: async ({ cfg, accountId, value }) =>
        applyBlueBubblesSetupPatch(cfg, accountId, { serverUrl: value }),
    },
    {
      inputKey: "webhookPath",
      message: "Webhook path",
      placeholder: DEFAULT_WEBHOOK_PATH$2,
      currentValue: ({ cfg, accountId }) => {
        const value = resolveBlueBubblesWebhookPath(cfg, accountId);
        return value && value !== "/bluebubbles-webhook" ? value : void 0;
      },
      shouldPrompt: ({ credentialValues }) =>
        credentialValues[CONFIGURE_CUSTOM_WEBHOOK_FLAG] === "1",
      validate: ({ value }) => validateBlueBubblesWebhookPath(value),
      normalizeValue: ({ value }) => String(value).trim(),
      applySet: async ({ cfg, accountId, value }) =>
        applyBlueBubblesSetupPatch(cfg, accountId, { webhookPath: value }),
    },
  ],
  completionNote: {
    title: "BlueBubbles next steps",
    lines: [
      "Configure the webhook URL in BlueBubbles Server:",
      "1. Open BlueBubbles Server -> Settings -> Webhooks",
      "2. Add your OpenClaw gateway URL + webhook path",
      `   Example: https://your-gateway-host:3000${DEFAULT_WEBHOOK_PATH$2}`,
      "3. Enable the webhook and save",
      "",
      `Docs: ${formatDocsLink("/channels/bluebubbles", "bluebubbles")}`,
    ],
  },
  dmPolicy: dmPolicy$1,
  allowFrom: createAllowFromSection({
    helpTitle: "BlueBubbles allowlist",
    helpLines: [
      "Allowlist BlueBubbles DMs by handle or chat target.",
      "Examples:",
      "- +15555550123",
      "- user@example.com",
      "- chat_id:123",
      "- chat_guid:iMessage;-;+15555550123",
      "Multiple entries: comma- or newline-separated.",
      `Docs: ${formatDocsLink("/channels/bluebubbles", "bluebubbles")}`,
    ],
    message: "BlueBubbles allowFrom (handle or chat_id)",
    placeholder: "+15555550123, user@example.com, chat_id:123",
    invalidWithoutCredentialNote:
      "Use a BlueBubbles handle or chat target like +15555550123 or chat_id:123.",
    parseInputs: parseBlueBubblesAllowFromInput,
    parseId: (raw) => validateBlueBubblesAllowFromEntry(raw),
    apply: async ({ cfg, accountId, allowFrom }) =>
      setBlueBubblesAllowFrom(cfg, accountId, allowFrom),
  }),
  disable: (cfg) => ({
    ...cfg,
    channels: {
      ...cfg.channels,
      bluebubbles: {
        ...cfg.channels?.bluebubbles,
        enabled: false,
      },
    },
  }),
};
//#endregion
//#region extensions/bluebubbles/src/channel.ts
const loadBlueBubblesChannelRuntime = createLazyRuntimeNamedExport(
  () => import("./channel.runtime-CuWAMkVx.js"),
  "blueBubblesChannelRuntime",
);
const bluebubblesConfigAdapter = createScopedChannelConfigAdapter({
  sectionKey: "bluebubbles",
  listAccountIds: listBlueBubblesAccountIds,
  resolveAccount: adaptScopedAccountAccessor(resolveBlueBubblesAccount),
  defaultAccountId: resolveDefaultBlueBubblesAccountId,
  clearBaseFields: ["serverUrl", "password", "name", "webhookPath"],
  resolveAllowFrom: (account) => account.config.allowFrom,
  formatAllowFrom: (allowFrom) =>
    formatNormalizedAllowFromEntries({
      allowFrom,
      normalizeEntry: (entry) => normalizeBlueBubblesHandle(entry.replace(/^bluebubbles:/i, "")),
    }),
});
const resolveBlueBubblesDmPolicy = createScopedDmSecurityResolver({
  channelKey: "bluebubbles",
  resolvePolicy: (account) => account.config.dmPolicy,
  resolveAllowFrom: (account) => account.config.allowFrom,
  policyPathSuffix: "dmPolicy",
  normalizeEntry: (raw) => normalizeBlueBubblesHandle(raw.replace(/^bluebubbles:/i, "")),
});
const collectBlueBubblesSecurityWarnings = createOpenGroupPolicyRestrictSendersWarningCollector({
  resolveGroupPolicy: (account) => account.config.groupPolicy,
  defaultGroupPolicy: "allowlist",
  surface: "BlueBubbles groups",
  openScope: "any member",
  groupPolicyPath: "channels.bluebubbles.groupPolicy",
  groupAllowFromPath: "channels.bluebubbles.groupAllowFrom",
  mentionGated: false,
});
const bluebubblesPlugin = createChatChannelPlugin({
  base: {
    id: "bluebubbles",
    meta: {
      id: "bluebubbles",
      label: "BlueBubbles",
      selectionLabel: "BlueBubbles (macOS app)",
      detailLabel: "BlueBubbles",
      docsPath: "/channels/bluebubbles",
      docsLabel: "bluebubbles",
      blurb: "iMessage via the BlueBubbles mac app + REST API.",
      systemImage: "bubble.left.and.text.bubble.right",
      aliases: ["bb"],
      order: 75,
      preferOver: ["imessage"],
    },
    capabilities: {
      chatTypes: ["direct", "group"],
      media: true,
      reactions: true,
      edit: true,
      unsend: true,
      reply: true,
      effects: true,
      groupManagement: true,
    },
    groups: {
      resolveRequireMention: resolveBlueBubblesGroupRequireMention,
      resolveToolPolicy: resolveBlueBubblesGroupToolPolicy,
    },
    reload: { configPrefixes: ["channels.bluebubbles"] },
    configSchema: buildChannelConfigSchema(BlueBubblesConfigSchema),
    setupWizard: blueBubblesSetupWizard,
    config: {
      ...bluebubblesConfigAdapter,
      isConfigured: (account) => account.configured,
      describeAccount: (account) =>
        describeAccountSnapshot({
          account,
          configured: account.configured,
          extra: { baseUrl: account.baseUrl },
        }),
    },
    actions: bluebubblesMessageActions,
    messaging: {
      normalizeTarget: normalizeBlueBubblesMessagingTarget,
      inferTargetChatType: ({ to }) => inferBlueBubblesTargetChatType(to),
      resolveOutboundSessionRoute: (params) => resolveBlueBubblesOutboundSessionRoute(params),
      targetResolver: {
        looksLikeId: looksLikeBlueBubblesExplicitTargetId,
        hint: "<handle|chat_guid:GUID|chat_id:ID|chat_identifier:ID>",
        resolveTarget: async ({ normalized }) => {
          const to = normalized?.trim();
          if (!to) return null;
          const chatType = inferBlueBubblesTargetChatType(to);
          if (!chatType) return null;
          return {
            to,
            kind: chatType === "direct" ? "user" : "group",
            source: "normalized",
          };
        },
      },
      formatTargetDisplay: ({ target, display }) => {
        const shouldParseDisplay = (value) => {
          if (looksLikeBlueBubblesTargetId(value)) return true;
          return /^(bluebubbles:|chat_guid:|chat_id:|chat_identifier:)/i.test(value);
        };
        const extractCleanDisplay = (value) => {
          const trimmed = value?.trim();
          if (!trimmed) return null;
          try {
            const parsed = parseBlueBubblesTarget(trimmed);
            if (parsed.kind === "chat_guid") {
              const handle = extractHandleFromChatGuid(parsed.chatGuid);
              if (handle) return handle;
            }
            if (parsed.kind === "handle") return normalizeBlueBubblesHandle(parsed.to);
          } catch {}
          const stripped = trimmed
            .replace(/^bluebubbles:/i, "")
            .replace(/^chat_guid:/i, "")
            .replace(/^chat_id:/i, "")
            .replace(/^chat_identifier:/i, "");
          const handle = extractHandleFromChatGuid(stripped);
          if (handle) return handle;
          if (stripped.includes(";-;") || stripped.includes(";+;")) return null;
          return stripped;
        };
        const trimmedDisplay = display?.trim();
        if (trimmedDisplay) {
          if (!shouldParseDisplay(trimmedDisplay)) return trimmedDisplay;
          const cleanDisplay = extractCleanDisplay(trimmedDisplay);
          if (cleanDisplay) return cleanDisplay;
        }
        const cleanTarget = extractCleanDisplay(target);
        if (cleanTarget) return cleanTarget;
        return display?.trim() || target?.trim() || "";
      },
    },
    setup: blueBubblesSetupAdapter,
    status: createComputedAccountStatusAdapter({
      defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID),
      collectStatusIssues: collectBlueBubblesStatusIssues,
      buildChannelSummary: ({ snapshot }) =>
        buildProbeChannelStatusSummary(snapshot, { baseUrl: snapshot.baseUrl ?? null }),
      probeAccount: async ({ account, timeoutMs }) =>
        (await loadBlueBubblesChannelRuntime()).probeBlueBubbles({
          baseUrl: account.baseUrl,
          password: account.config.password ?? null,
          timeoutMs,
        }),
      resolveAccountSnapshot: ({ account, runtime, probe }) => {
        const running = runtime?.running ?? false;
        const probeOk = probe?.ok;
        return {
          accountId: account.accountId,
          name: account.name,
          enabled: account.enabled,
          configured: account.configured,
          extra: {
            baseUrl: account.baseUrl,
            connected: probeOk ?? running,
          },
        };
      },
    }),
    gateway: {
      startAccount: async (ctx) => {
        const runtime = await loadBlueBubblesChannelRuntime();
        const account = ctx.account;
        const webhookPath = runtime.resolveWebhookPathFromConfig(account.config);
        const statusSink = createAccountStatusSink({
          accountId: ctx.accountId,
          setStatus: ctx.setStatus,
        });
        statusSink({ baseUrl: account.baseUrl });
        ctx.log?.info(`[${account.accountId}] starting provider (webhook=${webhookPath})`);
        return runtime.monitorBlueBubblesProvider({
          account,
          config: ctx.cfg,
          runtime: ctx.runtime,
          abortSignal: ctx.abortSignal,
          statusSink,
          webhookPath,
        });
      },
    },
  },
  security: {
    resolveDmPolicy: resolveBlueBubblesDmPolicy,
    collectWarnings: projectAccountWarningCollector(collectBlueBubblesSecurityWarnings),
  },
  threading: {
    buildToolContext: ({ context, hasRepliedRef }) => ({
      currentChannelId: context.To?.trim() || void 0,
      currentThreadTs: context.ReplyToIdFull ?? context.ReplyToId,
      hasRepliedRef,
    }),
  },
  pairing: {
    text: {
      idLabel: "bluebubblesSenderId",
      message: PAIRING_APPROVED_MESSAGE,
      normalizeAllowEntry: createPairingPrefixStripper(
        /^bluebubbles:/i,
        normalizeBlueBubblesHandle,
      ),
      notify: async ({ cfg, id, message }) => {
        await (await loadBlueBubblesChannelRuntime()).sendMessageBlueBubbles(id, message, { cfg });
      },
    },
  },
  outbound: {
    base: {
      deliveryMode: "direct",
      textChunkLimit: 4e3,
      resolveTarget: ({ to }) => {
        const trimmed = to?.trim();
        if (!trimmed)
          return {
            ok: false,
            error: /* @__PURE__ */ new Error(
              "Delivering to BlueBubbles requires --to <handle|chat_guid:GUID>",
            ),
          };
        return {
          ok: true,
          to: trimmed,
        };
      },
    },
    attachedResults: {
      channel: "bluebubbles",
      sendText: async ({ cfg, to, text, accountId, replyToId }) => {
        const runtime = await loadBlueBubblesChannelRuntime();
        const rawReplyToId = typeof replyToId === "string" ? replyToId.trim() : "";
        const replyToMessageGuid = rawReplyToId
          ? runtime.resolveBlueBubblesMessageId(rawReplyToId, { requireKnownShortId: true })
          : "";
        return await runtime.sendMessageBlueBubbles(to, text, {
          cfg,
          accountId: accountId ?? void 0,
          replyToMessageGuid: replyToMessageGuid || void 0,
        });
      },
      sendMedia: async (ctx) => {
        const runtime = await loadBlueBubblesChannelRuntime();
        const { cfg, to, text, mediaUrl, accountId, replyToId } = ctx;
        const { mediaPath, mediaBuffer, contentType, filename, caption } = ctx;
        return await runtime.sendBlueBubblesMedia({
          cfg,
          to,
          mediaUrl,
          mediaPath,
          mediaBuffer,
          contentType,
          filename,
          caption: caption ?? text ?? void 0,
          replyToId: replyToId ?? null,
          accountId: accountId ?? void 0,
        });
      },
    },
  },
});
defineChannelPluginEntry({
  id: "bluebubbles",
  name: "BlueBubbles",
  description: "BlueBubbles channel plugin (macOS app)",
  plugin: bluebubblesPlugin,
  setRuntime: setBlueBubblesRuntime,
});
//#endregion
//#region src/plugin-sdk/allowlist-config-edit.ts
const DM_ALLOWLIST_CONFIG_PATHS = {
  readPaths: [["allowFrom"]],
  writePath: ["allowFrom"],
};
const GROUP_ALLOWLIST_CONFIG_PATHS = {
  readPaths: [["groupAllowFrom"]],
  writePath: ["groupAllowFrom"],
};
const LEGACY_DM_ALLOWLIST_CONFIG_PATHS = {
  readPaths: [["allowFrom"], ["dm", "allowFrom"]],
  writePath: ["allowFrom"],
  cleanupPaths: [["dm", "allowFrom"]],
};
function resolveDmGroupAllowlistConfigPaths(scope) {
  return scope === "dm" ? DM_ALLOWLIST_CONFIG_PATHS : GROUP_ALLOWLIST_CONFIG_PATHS;
}
function resolveLegacyDmAllowlistConfigPaths(scope) {
  return scope === "dm" ? LEGACY_DM_ALLOWLIST_CONFIG_PATHS : null;
}
/** Coerce stored allowlist entries into presentable non-empty strings. */
function readConfiguredAllowlistEntries(entries) {
  return (entries ?? []).map(String).filter(Boolean);
}
/** Collect labeled allowlist overrides from a flat keyed record. */
function collectAllowlistOverridesFromRecord(params) {
  const overrides = [];
  for (const [key, value] of Object.entries(params.record ?? {})) {
    if (!value) continue;
    const entries = readConfiguredAllowlistEntries(params.resolveEntries(value));
    if (entries.length === 0) continue;
    overrides.push({
      label: params.label(key, value),
      entries,
    });
  }
  return overrides;
}
/** Collect labeled allowlist overrides from an outer record with nested child records. */
function collectNestedAllowlistOverridesFromRecord(params) {
  const overrides = [];
  for (const [outerKey, outerValue] of Object.entries(params.record ?? {})) {
    if (!outerValue) continue;
    const outerEntries = readConfiguredAllowlistEntries(params.resolveOuterEntries(outerValue));
    if (outerEntries.length > 0)
      overrides.push({
        label: params.outerLabel(outerKey, outerValue),
        entries: outerEntries,
      });
    overrides.push(
      ...collectAllowlistOverridesFromRecord({
        record: params.resolveChildren(outerValue),
        label: (innerKey, innerValue) => params.innerLabel(outerKey, innerKey, innerValue),
        resolveEntries: params.resolveInnerEntries,
      }),
    );
  }
  return overrides;
}
/** Build an account-scoped flat override resolver from a keyed allowlist record. */
function createFlatAllowlistOverrideResolver(params) {
  return (account) =>
    collectAllowlistOverridesFromRecord({
      record: params.resolveRecord(account),
      label: params.label,
      resolveEntries: params.resolveEntries,
    });
}
/** Build an account-scoped nested override resolver from hierarchical allowlist records. */
function createNestedAllowlistOverrideResolver(params) {
  return (account) =>
    collectNestedAllowlistOverridesFromRecord({
      record: params.resolveRecord(account),
      outerLabel: params.outerLabel,
      resolveOuterEntries: params.resolveOuterEntries,
      resolveChildren: params.resolveChildren,
      innerLabel: params.innerLabel,
      resolveInnerEntries: params.resolveInnerEntries,
    });
}
/** Build the common account-scoped token-gated allowlist name resolver. */
function createAccountScopedAllowlistNameResolver(params) {
  return async ({ cfg, accountId, entries }) => {
    const account = params.resolveAccount({
      cfg,
      accountId,
    });
    const token = params.resolveToken(account)?.trim();
    if (!token) return [];
    return await params.resolveNames({
      token,
      entries,
    });
  };
}
function resolveAccountScopedWriteTarget(parsed, channelId, accountId) {
  const channels = (parsed.channels ??= {});
  const channel = (channels[channelId] ??= {});
  const normalizedAccountId = normalizeAccountId(accountId);
  if (isBlockedObjectKey(normalizedAccountId))
    return {
      target: channel,
      pathPrefix: `channels.${channelId}`,
      writeTarget: {
        kind: "channel",
        scope: { channelId },
      },
    };
  const hasAccounts = Boolean(channel.accounts && typeof channel.accounts === "object");
  if (!(normalizedAccountId !== "default" || hasAccounts))
    return {
      target: channel,
      pathPrefix: `channels.${channelId}`,
      writeTarget: {
        kind: "channel",
        scope: { channelId },
      },
    };
  const accounts = (channel.accounts ??= {});
  const existingAccount = Object.hasOwn(accounts, normalizedAccountId)
    ? accounts[normalizedAccountId]
    : void 0;
  if (!existingAccount || typeof existingAccount !== "object") accounts[normalizedAccountId] = {};
  return {
    target: accounts[normalizedAccountId],
    pathPrefix: `channels.${channelId}.accounts.${normalizedAccountId}`,
    writeTarget: {
      kind: "account",
      scope: {
        channelId,
        accountId: normalizedAccountId,
      },
    },
  };
}
function getNestedValue(root, path) {
  let current = root;
  for (const key of path) {
    if (!current || typeof current !== "object") return;
    current = current[key];
  }
  return current;
}
function ensureNestedObject(root, path) {
  let current = root;
  for (const key of path) {
    const existing = current[key];
    if (!existing || typeof existing !== "object") current[key] = {};
    current = current[key];
  }
  return current;
}
function setNestedValue(root, path, value) {
  if (path.length === 0) return;
  if (path.length === 1) {
    root[path[0]] = value;
    return;
  }
  const parent = ensureNestedObject(root, path.slice(0, -1));
  parent[path[path.length - 1]] = value;
}
function deleteNestedValue(root, path) {
  if (path.length === 0) return;
  if (path.length === 1) {
    delete root[path[0]];
    return;
  }
  const parent = getNestedValue(root, path.slice(0, -1));
  if (!parent || typeof parent !== "object") return;
  delete parent[path[path.length - 1]];
}
function applyAccountScopedAllowlistConfigEdit(params) {
  const resolvedTarget = resolveAccountScopedWriteTarget(
    params.parsedConfig,
    params.channelId,
    params.accountId,
  );
  const existing = [];
  for (const path of params.paths.readPaths) {
    const existingRaw = getNestedValue(resolvedTarget.target, path);
    if (!Array.isArray(existingRaw)) continue;
    for (const entry of existingRaw) {
      const value = String(entry).trim();
      if (!value || existing.includes(value)) continue;
      existing.push(value);
    }
  }
  const normalizedEntry = params.normalize([params.entry]);
  if (normalizedEntry.length === 0) return { kind: "invalid-entry" };
  const existingNormalized = params.normalize(existing);
  const shouldMatch = (value) => normalizedEntry.includes(value);
  let changed = false;
  let next = existing;
  const configHasEntry = existingNormalized.some((value) => shouldMatch(value));
  if (params.action === "add") {
    if (!configHasEntry) {
      next = [...existing, params.entry.trim()];
      changed = true;
    }
  } else {
    const keep = [];
    for (const entry of existing) {
      if (params.normalize([entry]).some((value) => shouldMatch(value))) {
        changed = true;
        continue;
      }
      keep.push(entry);
    }
    next = keep;
  }
  if (changed) {
    if (next.length === 0) deleteNestedValue(resolvedTarget.target, params.paths.writePath);
    else setNestedValue(resolvedTarget.target, params.paths.writePath, next);
    for (const path of params.paths.cleanupPaths ?? [])
      deleteNestedValue(resolvedTarget.target, path);
  }
  return {
    kind: "ok",
    changed,
    pathLabel: `${resolvedTarget.pathPrefix}.${params.paths.writePath.join(".")}`,
    writeTarget: resolvedTarget.writeTarget,
  };
}
/** Build the default account-scoped allowlist editor used by channel plugins with config-backed lists. */
function buildAccountScopedAllowlistConfigEditor(params) {
  return ({ cfg, parsedConfig, accountId, scope, action, entry }) => {
    const paths = params.resolvePaths(scope);
    if (!paths) return null;
    return applyAccountScopedAllowlistConfigEdit({
      parsedConfig,
      channelId: params.channelId,
      accountId,
      action,
      entry,
      normalize: (values) =>
        params.normalize({
          cfg,
          accountId,
          values,
        }),
      paths,
    });
  };
}
function buildAccountAllowlistAdapter(params) {
  return {
    supportsScope: params.supportsScope,
    readConfig: ({ cfg, accountId }) =>
      params.readConfig(
        params.resolveAccount({
          cfg,
          accountId,
        }),
      ),
    applyConfigEdit: buildAccountScopedAllowlistConfigEditor({
      channelId: params.channelId,
      normalize: params.normalize,
      resolvePaths: params.resolvePaths,
    }),
  };
}
/** Build the common DM/group allowlist adapter used by channels that store both lists in config. */
function buildDmGroupAccountAllowlistAdapter(params) {
  return buildAccountAllowlistAdapter({
    channelId: params.channelId,
    resolveAccount: params.resolveAccount,
    normalize: params.normalize,
    supportsScope: ({ scope }) => scope === "dm" || scope === "group" || scope === "all",
    resolvePaths: resolveDmGroupAllowlistConfigPaths,
    readConfig: (account) => ({
      dmAllowFrom: readConfiguredAllowlistEntries(params.resolveDmAllowFrom(account)),
      groupAllowFrom: readConfiguredAllowlistEntries(params.resolveGroupAllowFrom(account)),
      dmPolicy: params.resolveDmPolicy?.(account) ?? void 0,
      groupPolicy: params.resolveGroupPolicy?.(account) ?? void 0,
      groupOverrides: params.resolveGroupOverrides?.(account),
    }),
  });
}
/** Build the common DM-only allowlist adapter for channels with legacy dm.allowFrom fallback paths. */
function buildLegacyDmAccountAllowlistAdapter(params) {
  return buildAccountAllowlistAdapter({
    channelId: params.channelId,
    resolveAccount: params.resolveAccount,
    normalize: params.normalize,
    supportsScope: ({ scope }) => scope === "dm",
    resolvePaths: resolveLegacyDmAllowlistConfigPaths,
    readConfig: (account) => ({
      dmAllowFrom: readConfiguredAllowlistEntries(params.resolveDmAllowFrom(account)),
      groupPolicy: params.resolveGroupPolicy?.(account) ?? void 0,
      groupOverrides: params.resolveGroupOverrides?.(account),
    }),
  });
}
//#endregion
//#region extensions/discord/src/exec-approvals.ts
function isDiscordExecApprovalClientEnabled(params) {
  const config = resolveDiscordAccount(params).config.execApprovals;
  return Boolean(config?.enabled && (config.approvers?.length ?? 0) > 0);
}
function shouldSuppressLocalDiscordExecApprovalPrompt(params) {
  return (
    isDiscordExecApprovalClientEnabled(params) &&
    getExecApprovalReplyMetadata(params.payload) !== null
  );
}
//#endregion
//#region extensions/discord/src/runtime.ts
const { setRuntime: setDiscordRuntime, getRuntime: getDiscordRuntime } = createPluginRuntimeStore(
  "Discord runtime not initialized",
);
//#endregion
//#region extensions/discord/src/shared.ts
const DISCORD_CHANNEL = "discord";
async function loadDiscordChannelRuntime() {
  return await import("./channel.runtime-L68f4jVg.js");
}
const discordSetupWizard = createDiscordSetupWizardProxy(
  async () => (await loadDiscordChannelRuntime()).discordSetupWizard,
);
const discordConfigAdapter = createScopedChannelConfigAdapter({
  sectionKey: DISCORD_CHANNEL,
  listAccountIds: listDiscordAccountIds,
  resolveAccount: adaptScopedAccountAccessor(resolveDiscordAccount),
  inspectAccount: adaptScopedAccountAccessor(inspectDiscordAccount),
  defaultAccountId: resolveDefaultDiscordAccountId,
  clearBaseFields: ["token", "name"],
  resolveAllowFrom: (account) => account.config.dm?.allowFrom,
  formatAllowFrom: (allowFrom) => formatAllowFromLowercase({ allowFrom }),
  resolveDefaultTo: (account) => account.config.defaultTo,
});
function createDiscordPluginBase(params) {
  return createChannelPluginBase({
    id: DISCORD_CHANNEL,
    setupWizard: discordSetupWizard,
    meta: { ...getChatChannelMeta(DISCORD_CHANNEL) },
    capabilities: {
      chatTypes: ["direct", "channel", "thread"],
      polls: true,
      reactions: true,
      threads: true,
      media: true,
      nativeCommands: true,
    },
    streaming: {
      blockStreamingCoalesceDefaults: {
        minChars: 1500,
        idleMs: 1e3,
      },
    },
    reload: { configPrefixes: ["channels.discord"] },
    configSchema: buildChannelConfigSchema(DiscordConfigSchema),
    config: {
      ...discordConfigAdapter,
      isConfigured: (account) => Boolean(account.token?.trim()),
      describeAccount: (account) =>
        describeAccountSnapshot({
          account,
          configured: Boolean(account.token?.trim()),
          extra: { tokenSource: account.tokenSource },
        }),
    },
    setup: params.setup,
  });
}
//#endregion
//#region extensions/discord/src/channel.ts
let discordProviderRuntimePromise;
async function loadDiscordProviderRuntime() {
  discordProviderRuntimePromise ??= import("./provider.runtime-Hkhfz93q.js");
  return await discordProviderRuntimePromise;
}
getChatChannelMeta("discord");
const REQUIRED_DISCORD_PERMISSIONS = ["ViewChannel", "SendMessages"];
const resolveDiscordDmPolicy = createScopedDmSecurityResolver({
  channelKey: "discord",
  resolvePolicy: (account) => account.config.dm?.policy,
  resolveAllowFrom: (account) => account.config.dm?.allowFrom,
  allowFromPathSuffix: "dm.",
  normalizeEntry: (raw) =>
    raw
      .trim()
      .replace(/^(discord|user):/i, "")
      .replace(/^<@!?(\d+)>$/, "$1"),
});
function formatDiscordIntents(intents) {
  if (!intents) return "unknown";
  return [
    `messageContent=${intents.messageContent ?? "unknown"}`,
    `guildMembers=${intents.guildMembers ?? "unknown"}`,
    `presence=${intents.presence ?? "unknown"}`,
  ].join(" ");
}
const discordMessageActions = {
  describeMessageTool: (ctx) =>
    getDiscordRuntime().channel.discord.messageActions?.describeMessageTool?.(ctx) ?? null,
  extractToolSend: (ctx) =>
    getDiscordRuntime().channel.discord.messageActions?.extractToolSend?.(ctx) ?? null,
  handleAction: async (ctx) => {
    const ma = getDiscordRuntime().channel.discord.messageActions;
    if (!ma?.handleAction) throw new Error("Discord message actions not available");
    return ma.handleAction(ctx);
  },
  requiresTrustedRequesterSender: ({ action, toolContext }) =>
    Boolean(toolContext && (action === "timeout" || action === "kick" || action === "ban")),
};
function buildDiscordCrossContextComponents(params) {
  const trimmed = params.message.trim();
  const components = [];
  if (trimmed) {
    components.push(new TextDisplay(params.message));
    components.push(
      new Separator({
        divider: true,
        spacing: "small",
      }),
    );
  }
  components.push(new TextDisplay(`*From ${params.originLabel}*`));
  return [
    new DiscordUiContainer({
      cfg: params.cfg,
      accountId: params.accountId,
      components,
    }),
  ];
}
function hasDiscordExecApprovalDmRoute(cfg) {
  return listDiscordAccountIds(cfg).some((accountId) => {
    const execApprovals = resolveDiscordAccount({
      cfg,
      accountId,
    }).config.execApprovals;
    if (!execApprovals?.enabled || (execApprovals.approvers?.length ?? 0) === 0) return false;
    const target = execApprovals.target ?? "dm";
    return target === "dm" || target === "both";
  });
}
const resolveDiscordAllowlistGroupOverrides = createNestedAllowlistOverrideResolver({
  resolveRecord: (account) => account.config.guilds,
  outerLabel: (guildKey) => `guild ${guildKey}`,
  resolveOuterEntries: (guildCfg) => guildCfg?.users,
  resolveChildren: (guildCfg) => guildCfg?.channels,
  innerLabel: (guildKey, channelKey) => `guild ${guildKey} / channel ${channelKey}`,
  resolveInnerEntries: (channelCfg) => channelCfg?.users,
});
const resolveDiscordAllowlistNames = createAccountScopedAllowlistNameResolver({
  resolveAccount: resolveDiscordAccount,
  resolveToken: (account) => account.token,
  resolveNames: ({ token, entries }) =>
    resolveDiscordUserAllowlist({
      token,
      entries,
    }),
});
const collectDiscordSecurityWarnings = createOpenProviderConfiguredRouteWarningCollector({
  providerConfigPresent: (cfg) => cfg.channels?.discord !== void 0,
  resolveGroupPolicy: (account) => account.config.groupPolicy,
  resolveRouteAllowlistConfigured: (account) => Object.keys(account.config.guilds ?? {}).length > 0,
  configureRouteAllowlist: {
    surface: "Discord guilds",
    openScope: "any channel not explicitly denied",
    groupPolicyPath: "channels.discord.groupPolicy",
    routeAllowlistPath: "channels.discord.guilds.<id>.channels",
  },
  missingRouteAllowlist: {
    surface: "Discord guilds",
    openBehavior: "with no guild/channel allowlist; any channel can trigger (mention-gated)",
    remediation:
      'Set channels.discord.groupPolicy="allowlist" and configure channels.discord.guilds.<id>.channels',
  },
});
function normalizeDiscordAcpConversationId(conversationId) {
  const normalized = conversationId.trim();
  return normalized ? { conversationId: normalized } : null;
}
function matchDiscordAcpConversation(params) {
  if (params.bindingConversationId === params.conversationId)
    return {
      conversationId: params.conversationId,
      matchPriority: 2,
    };
  if (
    params.parentConversationId &&
    params.parentConversationId !== params.conversationId &&
    params.bindingConversationId === params.parentConversationId
  )
    return {
      conversationId: params.parentConversationId,
      matchPriority: 1,
    };
  return null;
}
function parseDiscordExplicitTarget(raw) {
  try {
    const target = parseDiscordTarget(raw, { defaultKind: "channel" });
    if (!target) return null;
    return {
      to: target.id,
      chatType: target.kind === "user" ? "direct" : "channel",
    };
  } catch {
    return null;
  }
}
function buildDiscordBaseSessionKey(params) {
  return buildOutboundBaseSessionKey({
    ...params,
    channel: "discord",
  });
}
function resolveDiscordOutboundTargetKindHint(params) {
  const resolvedKind = params.resolvedTarget?.kind;
  if (resolvedKind === "user") return "user";
  if (resolvedKind === "group" || resolvedKind === "channel") return "channel";
  const target = params.target.trim();
  if (/^channel:/i.test(target)) return "channel";
  if (/^(user:|discord:|@|<@!?)/i.test(target)) return "user";
}
function resolveDiscordOutboundSessionRoute(params) {
  const parsed = parseDiscordTarget(params.target, {
    defaultKind: resolveDiscordOutboundTargetKindHint(params),
  });
  if (!parsed) return null;
  const isDm = parsed.kind === "user";
  const peer = {
    kind: isDm ? "direct" : "channel",
    id: parsed.id,
  };
  const baseSessionKey = buildDiscordBaseSessionKey({
    cfg: params.cfg,
    agentId: params.agentId,
    accountId: params.accountId,
    peer,
  });
  const explicitThreadId = normalizeOutboundThreadId(params.threadId);
  return {
    sessionKey: resolveThreadSessionKeys$1({
      baseSessionKey,
      threadId: explicitThreadId ?? normalizeOutboundThreadId(params.replyToId),
      useSuffix: false,
    }).sessionKey,
    baseSessionKey,
    peer,
    chatType: isDm ? "direct" : "channel",
    from: isDm ? `discord:${parsed.id}` : `discord:channel:${parsed.id}`,
    to: isDm ? `user:${parsed.id}` : `channel:${parsed.id}`,
    threadId: explicitThreadId ?? void 0,
  };
}
const discordPlugin = createChatChannelPlugin({
  base: {
    ...createDiscordPluginBase({ setup: discordSetupAdapter }),
    allowlist: {
      ...buildLegacyDmAccountAllowlistAdapter({
        channelId: "discord",
        resolveAccount: resolveDiscordAccount,
        normalize: ({ cfg, accountId, values }) =>
          discordConfigAdapter.formatAllowFrom({
            cfg,
            accountId,
            allowFrom: values,
          }),
        resolveDmAllowFrom: (account) => account.config.allowFrom ?? account.config.dm?.allowFrom,
        resolveGroupPolicy: (account) => account.config.groupPolicy,
        resolveGroupOverrides: resolveDiscordAllowlistGroupOverrides,
      }),
      resolveNames: resolveDiscordAllowlistNames,
    },
    groups: {
      resolveRequireMention: resolveDiscordGroupRequireMention,
      resolveToolPolicy: resolveDiscordGroupToolPolicy,
    },
    mentions: { stripPatterns: () => ["<@!?\\d+>"] },
    agentPrompt: {
      messageToolHints: () => [
        "- Discord components: set `components` when sending messages to include buttons, selects, or v2 containers.",
        "- Forms: add `components.modal` (title, fields). OpenClaw adds a trigger button and routes submissions as new messages.",
      ],
    },
    messaging: {
      normalizeTarget: normalizeDiscordMessagingTarget,
      resolveSessionTarget: ({ id }) => normalizeDiscordMessagingTarget(`channel:${id}`),
      parseExplicitTarget: ({ raw }) => parseDiscordExplicitTarget(raw),
      inferTargetChatType: ({ to }) => parseDiscordExplicitTarget(to)?.chatType,
      buildCrossContextComponents: buildDiscordCrossContextComponents,
      resolveOutboundSessionRoute: (params) => resolveDiscordOutboundSessionRoute(params),
      targetResolver: {
        looksLikeId: looksLikeDiscordTargetId,
        hint: "<channelId|user:ID|channel:ID>",
      },
    },
    execApprovals: {
      getInitiatingSurfaceState: ({ cfg, accountId }) =>
        isDiscordExecApprovalClientEnabled({
          cfg,
          accountId,
        })
          ? { kind: "enabled" }
          : { kind: "disabled" },
      shouldSuppressLocalPrompt: ({ cfg, accountId, payload }) =>
        shouldSuppressLocalDiscordExecApprovalPrompt({
          cfg,
          accountId,
          payload,
        }),
      hasConfiguredDmRoute: ({ cfg }) => hasDiscordExecApprovalDmRoute(cfg),
      shouldSuppressForwardingFallback: ({ cfg, target }) =>
        (normalizeMessageChannel(target.channel) ?? target.channel) === "discord" &&
        isDiscordExecApprovalClientEnabled({
          cfg,
          accountId: target.accountId,
        }),
    },
    directory: createChannelDirectoryAdapter({
      listPeers: async (params) => listDiscordDirectoryPeersFromConfig(params),
      listGroups: async (params) => listDiscordDirectoryGroupsFromConfig(params),
      ...createRuntimeDirectoryLiveAdapter({
        getRuntime: () => getDiscordRuntime().channel.discord,
        listPeersLive: (runtime) => runtime.listDirectoryPeersLive,
        listGroupsLive: (runtime) => runtime.listDirectoryGroupsLive,
      }),
    }),
    resolver: {
      resolveTargets: async ({ cfg, accountId, inputs, kind }) => {
        const account = resolveDiscordAccount({
          cfg,
          accountId,
        });
        if (kind === "group")
          return resolveTargetsWithOptionalToken({
            token: account.token,
            inputs,
            missingTokenNote: "missing Discord token",
            resolveWithToken: ({ token, inputs }) =>
              getDiscordRuntime().channel.discord.resolveChannelAllowlist({
                token,
                entries: inputs,
              }),
            mapResolved: (entry) => ({
              input: entry.input,
              resolved: entry.resolved,
              id: entry.channelId ?? entry.guildId,
              name:
                entry.channelName ??
                entry.guildName ??
                (entry.guildId && !entry.channelId ? entry.guildId : void 0),
              note: entry.note,
            }),
          });
        return resolveTargetsWithOptionalToken({
          token: account.token,
          inputs,
          missingTokenNote: "missing Discord token",
          resolveWithToken: ({ token, inputs }) =>
            getDiscordRuntime().channel.discord.resolveUserAllowlist({
              token,
              entries: inputs,
            }),
          mapResolved: (entry) => ({
            input: entry.input,
            resolved: entry.resolved,
            id: entry.id,
            name: entry.name,
            note: entry.note,
          }),
        });
      },
    },
    actions: discordMessageActions,
    bindings: {
      compileConfiguredBinding: ({ conversationId }) =>
        normalizeDiscordAcpConversationId(conversationId),
      matchInboundConversation: ({ compiledBinding, conversationId, parentConversationId }) =>
        matchDiscordAcpConversation({
          bindingConversationId: compiledBinding.conversationId,
          conversationId,
          parentConversationId,
        }),
    },
    status: createComputedAccountStatusAdapter({
      defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID, {
        connected: false,
        reconnectAttempts: 0,
        lastConnectedAt: null,
        lastDisconnect: null,
        lastEventAt: null,
      }),
      collectStatusIssues: collectDiscordStatusIssues,
      buildChannelSummary: ({ snapshot }) =>
        buildTokenChannelStatusSummary(snapshot, { includeMode: false }),
      probeAccount: async ({ account, timeoutMs }) =>
        probeDiscord(account.token, timeoutMs, { includeApplication: true }),
      formatCapabilitiesProbe: ({ probe }) => {
        const discordProbe = probe;
        const lines = [];
        if (discordProbe?.bot?.username) {
          const botId = discordProbe.bot.id ? ` (${discordProbe.bot.id})` : "";
          lines.push({ text: `Bot: @${discordProbe.bot.username}${botId}` });
        }
        if (discordProbe?.application?.intents)
          lines.push({
            text: `Intents: ${formatDiscordIntents(discordProbe.application.intents)}`,
          });
        return lines;
      },
      buildCapabilitiesDiagnostics: async ({ account, timeoutMs, target }) => {
        if (!target?.trim()) return;
        const parsedTarget = parseDiscordTarget(target.trim(), { defaultKind: "channel" });
        const details = {
          target: {
            raw: target,
            normalized: parsedTarget?.normalized,
            kind: parsedTarget?.kind,
            channelId: parsedTarget?.kind === "channel" ? parsedTarget.id : void 0,
          },
        };
        if (!parsedTarget || parsedTarget.kind !== "channel")
          return {
            details,
            lines: [
              {
                text: "Permissions: Target looks like a DM user; pass channel:<id> to audit channel permissions.",
                tone: "error",
              },
            ],
          };
        const token = account.token?.trim();
        if (!token)
          return {
            details,
            lines: [
              {
                text: "Permissions: Discord bot token missing for permission audit.",
                tone: "error",
              },
            ],
          };
        try {
          const perms = await fetchChannelPermissionsDiscord(parsedTarget.id, {
            token,
            accountId: account.accountId ?? void 0,
          });
          const missingRequired = REQUIRED_DISCORD_PERMISSIONS.filter(
            (permission) => !perms.permissions.includes(permission),
          );
          details.permissions = {
            channelId: perms.channelId,
            guildId: perms.guildId,
            isDm: perms.isDm,
            channelType: perms.channelType,
            permissions: perms.permissions,
            missingRequired,
            raw: perms.raw,
          };
          return {
            details,
            lines: [
              {
                text: `Permissions (${perms.channelId}): ${perms.permissions.length ? perms.permissions.join(", ") : "none"}`,
              },
              missingRequired.length > 0
                ? {
                    text: `Missing required: ${missingRequired.join(", ")}`,
                    tone: "warn",
                  }
                : {
                    text: "Missing required: none",
                    tone: "success",
                  },
            ],
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          details.permissions = {
            channelId: parsedTarget.id,
            error: message,
          };
          return {
            details,
            lines: [
              {
                text: `Permissions: ${message}`,
                tone: "error",
              },
            ],
          };
        }
      },
      auditAccount: async ({ account, timeoutMs, cfg }) => {
        const { channelIds, unresolvedChannels } = collectDiscordAuditChannelIds({
          cfg,
          accountId: account.accountId,
        });
        if (!channelIds.length && unresolvedChannels === 0) return;
        const botToken = account.token?.trim();
        if (!botToken)
          return {
            ok: unresolvedChannels === 0,
            checkedChannels: 0,
            unresolvedChannels,
            channels: [],
            elapsedMs: 0,
          };
        return {
          ...(await auditDiscordChannelPermissions({
            token: botToken,
            accountId: account.accountId,
            channelIds,
            timeoutMs,
          })),
          unresolvedChannels,
        };
      },
      resolveAccountSnapshot: ({ account, runtime, probe, audit }) => {
        const configured =
          resolveConfiguredFromCredentialStatuses(account) ?? Boolean(account.token?.trim());
        const app = runtime?.application ?? probe?.application;
        const bot = runtime?.bot ?? probe?.bot;
        return {
          accountId: account.accountId,
          name: account.name,
          enabled: account.enabled,
          configured,
          extra: {
            ...projectCredentialSnapshotFields(account),
            connected: runtime?.connected ?? false,
            reconnectAttempts: runtime?.reconnectAttempts,
            lastConnectedAt: runtime?.lastConnectedAt ?? null,
            lastDisconnect: runtime?.lastDisconnect ?? null,
            lastEventAt: runtime?.lastEventAt ?? null,
            application: app ?? void 0,
            bot: bot ?? void 0,
            audit,
          },
        };
      },
    }),
    gateway: {
      startAccount: async (ctx) => {
        const account = ctx.account;
        const token = account.token.trim();
        let discordBotLabel = "";
        try {
          const probe = await probeDiscord(token, 2500, { includeApplication: true });
          const username = probe.ok ? probe.bot?.username?.trim() : null;
          if (username) discordBotLabel = ` (@${username})`;
          ctx.setStatus({
            accountId: account.accountId,
            bot: probe.bot,
            application: probe.application,
          });
          const messageContent = probe.application?.intents?.messageContent;
          if (messageContent === "disabled")
            ctx.log?.warn(
              `[${account.accountId}] Discord Message Content Intent is disabled; bot may not respond to channel messages. Enable it in Discord Dev Portal (Bot → Privileged Gateway Intents) or require mentions.`,
            );
          else if (messageContent === "limited")
            ctx.log?.info(
              `[${account.accountId}] Discord Message Content Intent is limited; bots under 100 servers can use it without verification.`,
            );
        } catch (err) {
          if (getDiscordRuntime().logging.shouldLogVerbose())
            ctx.log?.debug?.(`[${account.accountId}] bot probe failed: ${String(err)}`);
        }
        ctx.log?.info(`[${account.accountId}] starting provider${discordBotLabel}`);
        return (await loadDiscordProviderRuntime()).monitorDiscordProvider({
          token,
          accountId: account.accountId,
          config: ctx.cfg,
          runtime: ctx.runtime,
          abortSignal: ctx.abortSignal,
          mediaMaxMb: account.config.mediaMaxMb,
          historyLimit: account.config.historyLimit,
          setStatus: (patch) =>
            ctx.setStatus({
              accountId: account.accountId,
              ...patch,
            }),
        });
      },
    },
  },
  pairing: {
    text: {
      idLabel: "discordUserId",
      message: PAIRING_APPROVED_MESSAGE,
      normalizeAllowEntry: createPairingPrefixStripper(/^(discord|user):/i),
      notify: async ({ id, message }) => {
        await getDiscordRuntime().channel.discord.sendMessageDiscord(`user:${id}`, message);
      },
    },
  },
  security: {
    resolveDmPolicy: resolveDiscordDmPolicy,
    collectWarnings: collectDiscordSecurityWarnings,
  },
  threading: { topLevelReplyToMode: "discord" },
  outbound: {
    base: {
      deliveryMode: "direct",
      chunker: null,
      textChunkLimit: 2e3,
      pollMaxOptions: 10,
      resolveTarget: ({ to }) => normalizeDiscordOutboundTarget(to),
    },
    attachedResults: {
      channel: "discord",
      sendText: async ({ cfg, to, text, accountId, deps, replyToId, silent }) => {
        return await (
          resolveOutboundSendDep(deps, "discord") ??
          getDiscordRuntime().channel.discord.sendMessageDiscord
        )(to, text, {
          verbose: false,
          cfg,
          replyTo: replyToId ?? void 0,
          accountId: accountId ?? void 0,
          silent: silent ?? void 0,
        });
      },
      sendMedia: async ({
        cfg,
        to,
        text,
        mediaUrl,
        mediaLocalRoots,
        accountId,
        deps,
        replyToId,
        silent,
      }) => {
        return await (
          resolveOutboundSendDep(deps, "discord") ??
          getDiscordRuntime().channel.discord.sendMessageDiscord
        )(to, text, {
          verbose: false,
          cfg,
          mediaUrl,
          mediaLocalRoots,
          replyTo: replyToId ?? void 0,
          accountId: accountId ?? void 0,
          silent: silent ?? void 0,
        });
      },
      sendPoll: async ({ cfg, to, poll, accountId, silent }) =>
        await getDiscordRuntime().channel.discord.sendPollDiscord(to, poll, {
          cfg,
          accountId: accountId ?? void 0,
          silent: silent ?? void 0,
        }),
    },
  },
});
//#endregion
//#region extensions/discord/src/subagent-hooks.ts
function summarizeError$1(err) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "error";
}
function registerDiscordSubagentHooks(api) {
  const resolveThreadBindingFlags = (accountId) => {
    const account = resolveDiscordAccount({
      cfg: api.config,
      accountId,
    });
    const baseThreadBindings = api.config.channels?.discord?.threadBindings;
    const accountThreadBindings =
      api.config.channels?.discord?.accounts?.[account.accountId]?.threadBindings;
    return {
      enabled:
        accountThreadBindings?.enabled ??
        baseThreadBindings?.enabled ??
        api.config.session?.threadBindings?.enabled ??
        true,
      spawnSubagentSessions:
        accountThreadBindings?.spawnSubagentSessions ??
        baseThreadBindings?.spawnSubagentSessions ??
        false,
    };
  };
  api.on("subagent_spawning", async (event) => {
    if (!event.threadRequested) return;
    if (event.requester?.channel?.trim().toLowerCase() !== "discord") return;
    const threadBindingFlags = resolveThreadBindingFlags(event.requester?.accountId);
    if (!threadBindingFlags.enabled)
      return {
        status: "error",
        error:
          "Discord thread bindings are disabled (set channels.discord.threadBindings.enabled=true to override for this account, or session.threadBindings.enabled=true globally).",
      };
    if (!threadBindingFlags.spawnSubagentSessions)
      return {
        status: "error",
        error:
          "Discord thread-bound subagent spawns are disabled for this account (set channels.discord.threadBindings.spawnSubagentSessions=true to enable).",
      };
    try {
      if (
        !(await autoBindSpawnedDiscordSubagent({
          accountId: event.requester?.accountId,
          channel: event.requester?.channel,
          to: event.requester?.to,
          threadId: event.requester?.threadId,
          childSessionKey: event.childSessionKey,
          agentId: event.agentId,
          label: event.label,
          boundBy: "system",
        }))
      )
        return {
          status: "error",
          error:
            "Unable to create or bind a Discord thread for this subagent session. Session mode is unavailable for this target.",
        };
      return {
        status: "ok",
        threadBindingReady: true,
      };
    } catch (err) {
      return {
        status: "error",
        error: `Discord thread bind failed: ${summarizeError$1(err)}`,
      };
    }
  });
  api.on("subagent_ended", (event) => {
    unbindThreadBindingsBySessionKey({
      targetSessionKey: event.targetSessionKey,
      accountId: event.accountId,
      targetKind: event.targetKind,
      reason: event.reason,
      sendFarewell: event.sendFarewell,
    });
  });
  api.on("subagent_delivery_target", (event) => {
    if (!event.expectsCompletionMessage) return;
    if (event.requesterOrigin?.channel?.trim().toLowerCase() !== "discord") return;
    const requesterAccountId = event.requesterOrigin?.accountId?.trim();
    const requesterThreadId =
      event.requesterOrigin?.threadId != null && event.requesterOrigin.threadId !== ""
        ? String(event.requesterOrigin.threadId).trim()
        : "";
    const bindings = listThreadBindingsBySessionKey({
      targetSessionKey: event.childSessionKey,
      ...(requesterAccountId ? { accountId: requesterAccountId } : {}),
      targetKind: "subagent",
    });
    if (bindings.length === 0) return;
    let binding;
    if (requesterThreadId)
      binding = bindings.find((entry) => {
        if (entry.threadId !== requesterThreadId) return false;
        if (requesterAccountId && entry.accountId !== requesterAccountId) return false;
        return true;
      });
    if (!binding && bindings.length === 1) binding = bindings[0];
    if (!binding) return;
    return {
      origin: {
        channel: "discord",
        accountId: binding.accountId,
        to: `channel:${binding.threadId}`,
        threadId: binding.threadId,
      },
    };
  });
}
defineChannelPluginEntry({
  id: "discord",
  name: "Discord",
  description: "Discord channel plugin",
  plugin: discordPlugin,
  setRuntime: setDiscordRuntime,
  registerFull: registerDiscordSubagentHooks,
});
//#endregion
//#region extensions/discord/src/channel.setup.ts
const discordSetupPlugin = { ...createDiscordPluginBase({ setup: discordSetupAdapter }) };
defineSetupPluginEntry(discordSetupPlugin);
//#endregion
//#region extensions/feishu/src/tool-account.ts
function normalizeOptionalAccountId(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : void 0;
}
function readConfiguredDefaultAccountId(config) {
  const value = config?.channels?.feishu?.defaultAccount;
  if (typeof value !== "string") return;
  return normalizeOptionalAccountId(value);
}
function resolveFeishuToolAccount(params) {
  if (!params.api.config) throw new Error("Feishu config unavailable");
  return resolveFeishuAccount({
    cfg: params.api.config,
    accountId:
      normalizeOptionalAccountId(params.executeParams?.accountId) ??
      readConfiguredDefaultAccountId(params.api.config) ??
      normalizeOptionalAccountId(params.defaultAccountId),
  });
}
function createFeishuToolClient(params) {
  return createFeishuClient(resolveFeishuToolAccount(params));
}
function resolveAnyEnabledFeishuToolsConfig(accounts) {
  const merged = {
    doc: false,
    chat: false,
    wiki: false,
    drive: false,
    perm: false,
    scopes: false,
  };
  for (const account of accounts) {
    const cfg = resolveToolsConfig(account.config.tools);
    merged.doc = merged.doc || cfg.doc;
    merged.chat = merged.chat || cfg.chat;
    merged.wiki = merged.wiki || cfg.wiki;
    merged.drive = merged.drive || cfg.drive;
    merged.perm = merged.perm || cfg.perm;
    merged.scopes = merged.scopes || cfg.scopes;
  }
  return merged;
}
//#endregion
//#region extensions/feishu/src/bitable.ts
function json$1(data) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    details: data,
  };
}
var LarkApiError = class extends Error {
  constructor(code, message, api, context) {
    super(`[${api}] code=${code} message=${message}`);
    this.name = "LarkApiError";
    this.code = code;
    this.api = api;
    this.context = context;
  }
};
function ensureLarkSuccess(res, api, context) {
  if (res.code !== 0)
    throw new LarkApiError(res.code ?? -1, res.msg ?? "unknown error", api, context);
}
/** Field type ID to human-readable name */
const FIELD_TYPE_NAMES = {
  1: "Text",
  2: "Number",
  3: "SingleSelect",
  4: "MultiSelect",
  5: "DateTime",
  7: "Checkbox",
  11: "User",
  13: "Phone",
  15: "URL",
  17: "Attachment",
  18: "SingleLink",
  19: "Lookup",
  20: "Formula",
  21: "DuplexLink",
  22: "Location",
  23: "GroupChat",
  1001: "CreatedTime",
  1002: "ModifiedTime",
  1003: "CreatedUser",
  1004: "ModifiedUser",
  1005: "AutoNumber",
};
/** Parse bitable URL and extract tokens */
function parseBitableUrl(url) {
  try {
    const u = new URL(url);
    const tableId = u.searchParams.get("table") ?? void 0;
    const wikiMatch = u.pathname.match(/\/wiki\/([A-Za-z0-9]+)/);
    if (wikiMatch)
      return {
        token: wikiMatch[1],
        tableId,
        isWiki: true,
      };
    const baseMatch = u.pathname.match(/\/base\/([A-Za-z0-9]+)/);
    if (baseMatch)
      return {
        token: baseMatch[1],
        tableId,
        isWiki: false,
      };
    return null;
  } catch {
    return null;
  }
}
/** Get app_token from wiki node_token */
async function getAppTokenFromWiki(client, nodeToken) {
  const res = await client.wiki.space.getNode({ params: { token: nodeToken } });
  ensureLarkSuccess(res, "wiki.space.getNode", { nodeToken });
  const node = res.data?.node;
  if (!node) throw new Error("Node not found");
  if (node.obj_type !== "bitable")
    throw new Error(`Node is not a bitable (type: ${node.obj_type})`);
  return node.obj_token;
}
/** Get bitable metadata from URL (handles both /base/ and /wiki/ URLs) */
async function getBitableMeta(client, url) {
  const parsed = parseBitableUrl(url);
  if (!parsed) throw new Error("Invalid URL format. Expected /base/XXX or /wiki/XXX URL");
  let appToken;
  if (parsed.isWiki) appToken = await getAppTokenFromWiki(client, parsed.token);
  else appToken = parsed.token;
  const res = await client.bitable.app.get({ path: { app_token: appToken } });
  ensureLarkSuccess(res, "bitable.app.get", { appToken });
  let tables = [];
  if (!parsed.tableId) {
    const tablesRes = await client.bitable.appTable.list({ path: { app_token: appToken } });
    if (tablesRes.code === 0)
      tables = (tablesRes.data?.items ?? []).map((t) => ({
        table_id: t.table_id,
        name: t.name,
      }));
  }
  return {
    app_token: appToken,
    table_id: parsed.tableId,
    name: res.data?.app?.name,
    url_type: parsed.isWiki ? "wiki" : "base",
    ...(tables.length > 0 && { tables }),
    hint: parsed.tableId
      ? `Use app_token="${appToken}" and table_id="${parsed.tableId}" for other bitable tools`
      : `Use app_token="${appToken}" for other bitable tools. Select a table_id from the tables list.`,
  };
}
async function listFields(client, appToken, tableId) {
  const res = await client.bitable.appTableField.list({
    path: {
      app_token: appToken,
      table_id: tableId,
    },
  });
  ensureLarkSuccess(res, "bitable.appTableField.list", {
    appToken,
    tableId,
  });
  const fields = res.data?.items ?? [];
  return {
    fields: fields.map((f) => ({
      field_id: f.field_id,
      field_name: f.field_name,
      type: f.type,
      type_name: FIELD_TYPE_NAMES[f.type ?? 0] || `type_${f.type}`,
      is_primary: f.is_primary,
      ...(f.property && { property: f.property }),
    })),
    total: fields.length,
  };
}
async function listRecords(client, appToken, tableId, pageSize, pageToken) {
  const res = await client.bitable.appTableRecord.list({
    path: {
      app_token: appToken,
      table_id: tableId,
    },
    params: {
      page_size: pageSize ?? 100,
      ...(pageToken && { page_token: pageToken }),
    },
  });
  ensureLarkSuccess(res, "bitable.appTableRecord.list", {
    appToken,
    tableId,
    pageSize,
  });
  return {
    records: res.data?.items ?? [],
    has_more: res.data?.has_more ?? false,
    page_token: res.data?.page_token,
    total: res.data?.total,
  };
}
async function getRecord(client, appToken, tableId, recordId) {
  const res = await client.bitable.appTableRecord.get({
    path: {
      app_token: appToken,
      table_id: tableId,
      record_id: recordId,
    },
  });
  ensureLarkSuccess(res, "bitable.appTableRecord.get", {
    appToken,
    tableId,
    recordId,
  });
  return { record: res.data?.record };
}
async function createRecord(client, appToken, tableId, fields) {
  const res = await client.bitable.appTableRecord.create({
    path: {
      app_token: appToken,
      table_id: tableId,
    },
    data: { fields },
  });
  ensureLarkSuccess(res, "bitable.appTableRecord.create", {
    appToken,
    tableId,
  });
  return { record: res.data?.record };
}
/** Default field types created for new Bitable tables (to be cleaned up) */
const DEFAULT_CLEANUP_FIELD_TYPES = new Set([3, 5, 17]);
/** Clean up default placeholder rows and fields in a newly created Bitable table */
async function cleanupNewBitable(client, appToken, tableId, tableName, logger) {
  let cleanedRows = 0;
  let cleanedFields = 0;
  const fieldsRes = await client.bitable.appTableField.list({
    path: {
      app_token: appToken,
      table_id: tableId,
    },
  });
  if (fieldsRes.code === 0 && fieldsRes.data?.items) {
    const primaryField = fieldsRes.data.items.find((f) => f.is_primary);
    if (primaryField?.field_id)
      try {
        const newFieldName = tableName.length <= 20 ? tableName : "Name";
        await client.bitable.appTableField.update({
          path: {
            app_token: appToken,
            table_id: tableId,
            field_id: primaryField.field_id,
          },
          data: {
            field_name: newFieldName,
            type: 1,
          },
        });
        cleanedFields++;
      } catch (err) {
        logger.debug(`Failed to rename primary field: ${err}`);
      }
    const defaultFieldsToDelete = fieldsRes.data.items.filter(
      (f) => !f.is_primary && DEFAULT_CLEANUP_FIELD_TYPES.has(f.type ?? 0),
    );
    for (const field of defaultFieldsToDelete)
      if (field.field_id)
        try {
          await client.bitable.appTableField.delete({
            path: {
              app_token: appToken,
              table_id: tableId,
              field_id: field.field_id,
            },
          });
          cleanedFields++;
        } catch (err) {
          logger.debug(`Failed to delete default field ${field.field_name}: ${err}`);
        }
  }
  const recordsRes = await client.bitable.appTableRecord.list({
    path: {
      app_token: appToken,
      table_id: tableId,
    },
    params: { page_size: 100 },
  });
  if (recordsRes.code === 0 && recordsRes.data?.items) {
    const emptyRecordIds = recordsRes.data.items
      .filter((r) => !r.fields || Object.keys(r.fields).length === 0)
      .map((r) => r.record_id)
      .filter((id) => Boolean(id));
    if (emptyRecordIds.length > 0)
      try {
        await client.bitable.appTableRecord.batchDelete({
          path: {
            app_token: appToken,
            table_id: tableId,
          },
          data: { records: emptyRecordIds },
        });
        cleanedRows = emptyRecordIds.length;
      } catch {
        for (const recordId of emptyRecordIds)
          try {
            await client.bitable.appTableRecord.delete({
              path: {
                app_token: appToken,
                table_id: tableId,
                record_id: recordId,
              },
            });
            cleanedRows++;
          } catch (err) {
            logger.debug(`Failed to delete empty row ${recordId}: ${err}`);
          }
      }
  }
  return {
    cleanedRows,
    cleanedFields,
  };
}
async function createApp(client, name, folderToken, logger) {
  const res = await client.bitable.app.create({
    data: {
      name,
      ...(folderToken && { folder_token: folderToken }),
    },
  });
  ensureLarkSuccess(res, "bitable.app.create", {
    name,
    folderToken,
  });
  const appToken = res.data?.app?.app_token;
  if (!appToken) throw new Error("Failed to create Bitable: no app_token returned");
  const log = logger ?? {
    debug: () => {},
    warn: () => {},
  };
  let tableId;
  let cleanedRows = 0;
  let cleanedFields = 0;
  try {
    const tablesRes = await client.bitable.appTable.list({ path: { app_token: appToken } });
    if (tablesRes.code === 0 && tablesRes.data?.items && tablesRes.data.items.length > 0) {
      tableId = tablesRes.data.items[0].table_id ?? void 0;
      if (tableId) {
        const cleanup = await cleanupNewBitable(client, appToken, tableId, name, log);
        cleanedRows = cleanup.cleanedRows;
        cleanedFields = cleanup.cleanedFields;
      }
    }
  } catch (err) {
    log.debug(`Cleanup failed (non-critical): ${err}`);
  }
  return {
    app_token: appToken,
    table_id: tableId,
    name: res.data?.app?.name,
    url: res.data?.app?.url,
    cleaned_placeholder_rows: cleanedRows,
    cleaned_default_fields: cleanedFields,
    hint: tableId
      ? `Table created. Use app_token="${appToken}" and table_id="${tableId}" for other bitable tools.`
      : "Table created. Use feishu_bitable_get_meta to get table_id and field details.",
  };
}
async function createField(client, appToken, tableId, fieldName, fieldType, property) {
  const res = await client.bitable.appTableField.create({
    path: {
      app_token: appToken,
      table_id: tableId,
    },
    data: {
      field_name: fieldName,
      type: fieldType,
      ...(property && { property }),
    },
  });
  ensureLarkSuccess(res, "bitable.appTableField.create", {
    appToken,
    tableId,
    fieldName,
    fieldType,
  });
  return {
    field_id: res.data?.field?.field_id,
    field_name: res.data?.field?.field_name,
    type: res.data?.field?.type,
    type_name: FIELD_TYPE_NAMES[res.data?.field?.type ?? 0] || `type_${res.data?.field?.type}`,
  };
}
async function updateRecord(client, appToken, tableId, recordId, fields) {
  const res = await client.bitable.appTableRecord.update({
    path: {
      app_token: appToken,
      table_id: tableId,
      record_id: recordId,
    },
    data: { fields },
  });
  ensureLarkSuccess(res, "bitable.appTableRecord.update", {
    appToken,
    tableId,
    recordId,
  });
  return { record: res.data?.record };
}
const GetMetaSchema = Type.Object({
  url: Type.String({
    description: "Bitable URL. Supports both formats: /base/XXX?table=YYY or /wiki/XXX?table=YYY",
  }),
});
const ListFieldsSchema = Type.Object({
  app_token: Type.String({
    description: "Bitable app token (use feishu_bitable_get_meta to get from URL)",
  }),
  table_id: Type.String({ description: "Table ID (from URL: ?table=YYY)" }),
});
const ListRecordsSchema = Type.Object({
  app_token: Type.String({
    description: "Bitable app token (use feishu_bitable_get_meta to get from URL)",
  }),
  table_id: Type.String({ description: "Table ID (from URL: ?table=YYY)" }),
  page_size: Type.Optional(
    Type.Number({
      description: "Number of records per page (1-500, default 100)",
      minimum: 1,
      maximum: 500,
    }),
  ),
  page_token: Type.Optional(
    Type.String({ description: "Pagination token from previous response" }),
  ),
});
const GetRecordSchema = Type.Object({
  app_token: Type.String({
    description: "Bitable app token (use feishu_bitable_get_meta to get from URL)",
  }),
  table_id: Type.String({ description: "Table ID (from URL: ?table=YYY)" }),
  record_id: Type.String({ description: "Record ID to retrieve" }),
});
const CreateRecordSchema = Type.Object({
  app_token: Type.String({
    description: "Bitable app token (use feishu_bitable_get_meta to get from URL)",
  }),
  table_id: Type.String({ description: "Table ID (from URL: ?table=YYY)" }),
  fields: Type.Record(Type.String(), Type.Any(), {
    description:
      "Field values keyed by field name. Format by type: Text='string', Number=123, SingleSelect='Option', MultiSelect=['A','B'], DateTime=timestamp_ms, User=[{id:'ou_xxx'}], URL={text:'Display',link:'https://...'}",
  }),
});
const CreateAppSchema = Type.Object({
  name: Type.String({ description: "Name for the new Bitable application" }),
  folder_token: Type.Optional(
    Type.String({ description: "Optional folder token to place the Bitable in a specific folder" }),
  ),
});
const CreateFieldSchema = Type.Object({
  app_token: Type.String({
    description:
      "Bitable app token (use feishu_bitable_get_meta to get from URL, or feishu_bitable_create_app to create new)",
  }),
  table_id: Type.String({ description: "Table ID (from URL: ?table=YYY)" }),
  field_name: Type.String({ description: "Name for the new field" }),
  field_type: Type.Number({
    description:
      "Field type ID: 1=Text, 2=Number, 3=SingleSelect, 4=MultiSelect, 5=DateTime, 7=Checkbox, 11=User, 13=Phone, 15=URL, 17=Attachment, 18=SingleLink, 19=Lookup, 20=Formula, 21=DuplexLink, 22=Location, 23=GroupChat, 1001=CreatedTime, 1002=ModifiedTime, 1003=CreatedUser, 1004=ModifiedUser, 1005=AutoNumber",
    minimum: 1,
  }),
  property: Type.Optional(
    Type.Record(Type.String(), Type.Any(), {
      description: "Field-specific properties (e.g., options for SingleSelect, format for Number)",
    }),
  ),
});
const UpdateRecordSchema = Type.Object({
  app_token: Type.String({
    description: "Bitable app token (use feishu_bitable_get_meta to get from URL)",
  }),
  table_id: Type.String({ description: "Table ID (from URL: ?table=YYY)" }),
  record_id: Type.String({ description: "Record ID to update" }),
  fields: Type.Record(Type.String(), Type.Any(), {
    description: "Field values to update (same format as create_record)",
  }),
});
function registerFeishuBitableTools(api) {
  if (!api.config) {
    api.logger.debug?.("feishu_bitable: No config available, skipping bitable tools");
    return;
  }
  if (listEnabledFeishuAccounts(api.config).length === 0) {
    api.logger.debug?.("feishu_bitable: No Feishu accounts configured, skipping bitable tools");
    return;
  }
  const getClient = (params, defaultAccountId) =>
    createFeishuToolClient({
      api,
      executeParams: params,
      defaultAccountId,
    });
  const registerBitableTool = (params) => {
    api.registerTool(
      (ctx) => ({
        name: params.name,
        label: params.label,
        description: params.description,
        parameters: params.parameters,
        async execute(_toolCallId, rawParams) {
          try {
            return json$1(
              await params.execute({
                params: rawParams,
                defaultAccountId: ctx.agentAccountId,
              }),
            );
          } catch (err) {
            return json$1({ error: err instanceof Error ? err.message : String(err) });
          }
        },
      }),
      { name: params.name },
    );
  };
  registerBitableTool({
    name: "feishu_bitable_get_meta",
    label: "Feishu Bitable Get Meta",
    description:
      "Parse a Bitable URL and get app_token, table_id, and table list. Use this first when given a /wiki/ or /base/ URL.",
    parameters: GetMetaSchema,
    async execute({ params, defaultAccountId }) {
      return getBitableMeta(getClient(params, defaultAccountId), params.url);
    },
  });
  registerBitableTool({
    name: "feishu_bitable_list_fields",
    label: "Feishu Bitable List Fields",
    description: "List all fields (columns) in a Bitable table with their types and properties",
    parameters: ListFieldsSchema,
    async execute({ params, defaultAccountId }) {
      return listFields(getClient(params, defaultAccountId), params.app_token, params.table_id);
    },
  });
  registerBitableTool({
    name: "feishu_bitable_list_records",
    label: "Feishu Bitable List Records",
    description: "List records (rows) from a Bitable table with pagination support",
    parameters: ListRecordsSchema,
    async execute({ params, defaultAccountId }) {
      return listRecords(
        getClient(params, defaultAccountId),
        params.app_token,
        params.table_id,
        params.page_size,
        params.page_token,
      );
    },
  });
  registerBitableTool({
    name: "feishu_bitable_get_record",
    label: "Feishu Bitable Get Record",
    description: "Get a single record by ID from a Bitable table",
    parameters: GetRecordSchema,
    async execute({ params, defaultAccountId }) {
      return getRecord(
        getClient(params, defaultAccountId),
        params.app_token,
        params.table_id,
        params.record_id,
      );
    },
  });
  registerBitableTool({
    name: "feishu_bitable_create_record",
    label: "Feishu Bitable Create Record",
    description: "Create a new record (row) in a Bitable table",
    parameters: CreateRecordSchema,
    async execute({ params, defaultAccountId }) {
      return createRecord(
        getClient(params, defaultAccountId),
        params.app_token,
        params.table_id,
        params.fields,
      );
    },
  });
  registerBitableTool({
    name: "feishu_bitable_update_record",
    label: "Feishu Bitable Update Record",
    description: "Update an existing record (row) in a Bitable table",
    parameters: UpdateRecordSchema,
    async execute({ params, defaultAccountId }) {
      return updateRecord(
        getClient(params, defaultAccountId),
        params.app_token,
        params.table_id,
        params.record_id,
        params.fields,
      );
    },
  });
  registerBitableTool({
    name: "feishu_bitable_create_app",
    label: "Feishu Bitable Create App",
    description: "Create a new Bitable (multidimensional table) application",
    parameters: CreateAppSchema,
    async execute({ params, defaultAccountId }) {
      return createApp(getClient(params, defaultAccountId), params.name, params.folder_token, {
        debug: (msg) => api.logger.debug?.(msg),
        warn: (msg) => api.logger.warn?.(msg),
      });
    },
  });
  registerBitableTool({
    name: "feishu_bitable_create_field",
    label: "Feishu Bitable Create Field",
    description: "Create a new field (column) in a Bitable table",
    parameters: CreateFieldSchema,
    async execute({ params, defaultAccountId }) {
      return createField(
        getClient(params, defaultAccountId),
        params.app_token,
        params.table_id,
        params.field_name,
        params.field_type,
        params.property,
      );
    },
  });
  api.logger.info?.("feishu_bitable: Registered bitable tools");
}
//#endregion
//#region extensions/feishu/src/config-schema.ts
const ChannelActionsSchema = z$2
  .object({ reactions: z$2.boolean().optional() })
  .strict()
  .optional();
const DmPolicySchema = z$2.enum(["open", "pairing", "allowlist"]);
const GroupPolicySchema = z$2.union([
  z$2.enum(["open", "allowlist", "disabled"]),
  z$2.literal("allowall").transform(() => "open"),
]);
const FeishuDomainSchema = z$2.union([
  z$2.enum(["feishu", "lark"]),
  z$2.string().url().startsWith("https://"),
]);
const FeishuConnectionModeSchema = z$2.enum(["websocket", "webhook"]);
const ToolPolicySchema = z$2
  .object({
    allow: z$2.array(z$2.string()).optional(),
    deny: z$2.array(z$2.string()).optional(),
  })
  .strict()
  .optional();
const DmConfigSchema = z$2
  .object({
    enabled: z$2.boolean().optional(),
    systemPrompt: z$2.string().optional(),
  })
  .strict()
  .optional();
const MarkdownConfigSchema = z$2
  .object({
    mode: z$2.enum(["native", "escape", "strip"]).optional(),
    tableMode: z$2.enum(["native", "ascii", "simple"]).optional(),
  })
  .strict()
  .optional();
const RenderModeSchema = z$2.enum(["auto", "raw", "card"]).optional();
const StreamingModeSchema = z$2.boolean().optional();
const BlockStreamingCoalesceSchema = z$2
  .object({
    enabled: z$2.boolean().optional(),
    minDelayMs: z$2.number().int().positive().optional(),
    maxDelayMs: z$2.number().int().positive().optional(),
  })
  .strict()
  .optional();
const ChannelHeartbeatVisibilitySchema = z$2
  .object({
    visibility: z$2.enum(["visible", "hidden"]).optional(),
    intervalMs: z$2.number().int().positive().optional(),
  })
  .strict()
  .optional();
/**
 * Dynamic agent creation configuration.
 * When enabled, a new agent is created for each unique DM user.
 */
const DynamicAgentCreationSchema = z$2
  .object({
    enabled: z$2.boolean().optional(),
    workspaceTemplate: z$2.string().optional(),
    agentDirTemplate: z$2.string().optional(),
    maxAgents: z$2.number().int().positive().optional(),
  })
  .strict()
  .optional();
/**
 * Feishu tools configuration.
 * Controls which tool categories are enabled.
 *
 * Dependencies:
 * - wiki requires doc (wiki content is edited via doc tools)
 * - perm can work independently but is typically used with drive
 */
const FeishuToolsConfigSchema = z$2
  .object({
    doc: z$2.boolean().optional(),
    chat: z$2.boolean().optional(),
    wiki: z$2.boolean().optional(),
    drive: z$2.boolean().optional(),
    perm: z$2.boolean().optional(),
    scopes: z$2.boolean().optional(),
  })
  .strict()
  .optional();
/**
 * Group session scope for routing Feishu group messages.
 * - "group" (default): one session per group chat
 * - "group_sender": one session per (group + sender)
 * - "group_topic": one session per group topic thread (falls back to group if no topic)
 * - "group_topic_sender": one session per (group + topic thread + sender),
 *   falls back to (group + sender) if no topic
 */
const GroupSessionScopeSchema = z$2
  .enum(["group", "group_sender", "group_topic", "group_topic_sender"])
  .optional();
/**
 * @deprecated Use groupSessionScope instead.
 *
 * Topic session isolation mode for group chats.
 * - "disabled" (default): All messages in a group share one session
 * - "enabled": Messages in different topics get separate sessions
 *
 * Topic routing uses `root_id` when present to keep session continuity and
 * falls back to `thread_id` when `root_id` is unavailable.
 */
const TopicSessionModeSchema = z$2.enum(["disabled", "enabled"]).optional();
const ReactionNotificationModeSchema = z$2.enum(["off", "own", "all"]).optional();
/**
 * Reply-in-thread mode for group chats.
 * - "disabled" (default): Bot replies are normal inline replies
 * - "enabled": Bot replies create or continue a Feishu topic thread
 *
 * When enabled, the Feishu reply API is called with `reply_in_thread: true`,
 * causing the reply to appear as a topic (话题) under the original message.
 */
const ReplyInThreadSchema = z$2.enum(["disabled", "enabled"]).optional();
const FeishuGroupSchema = z$2
  .object({
    requireMention: z$2.boolean().optional(),
    tools: ToolPolicySchema,
    skills: z$2.array(z$2.string()).optional(),
    enabled: z$2.boolean().optional(),
    allowFrom: z$2.array(z$2.union([z$2.string(), z$2.number()])).optional(),
    systemPrompt: z$2.string().optional(),
    groupSessionScope: GroupSessionScopeSchema,
    topicSessionMode: TopicSessionModeSchema,
    replyInThread: ReplyInThreadSchema,
  })
  .strict();
const FeishuSharedConfigShape = {
  webhookHost: z$2.string().optional(),
  webhookPort: z$2.number().int().positive().optional(),
  capabilities: z$2.array(z$2.string()).optional(),
  markdown: MarkdownConfigSchema,
  configWrites: z$2.boolean().optional(),
  dmPolicy: DmPolicySchema.optional(),
  allowFrom: z$2.array(z$2.union([z$2.string(), z$2.number()])).optional(),
  groupPolicy: GroupPolicySchema.optional(),
  groupAllowFrom: z$2.array(z$2.union([z$2.string(), z$2.number()])).optional(),
  groupSenderAllowFrom: z$2.array(z$2.union([z$2.string(), z$2.number()])).optional(),
  requireMention: z$2.boolean().optional(),
  groups: z$2.record(z$2.string(), FeishuGroupSchema.optional()).optional(),
  historyLimit: z$2.number().int().min(0).optional(),
  dmHistoryLimit: z$2.number().int().min(0).optional(),
  dms: z$2.record(z$2.string(), DmConfigSchema).optional(),
  textChunkLimit: z$2.number().int().positive().optional(),
  chunkMode: z$2.enum(["length", "newline"]).optional(),
  blockStreamingCoalesce: BlockStreamingCoalesceSchema,
  mediaMaxMb: z$2.number().positive().optional(),
  httpTimeoutMs: z$2.number().int().positive().max(3e5).optional(),
  heartbeat: ChannelHeartbeatVisibilitySchema,
  renderMode: RenderModeSchema,
  streaming: StreamingModeSchema,
  tools: FeishuToolsConfigSchema,
  actions: ChannelActionsSchema,
  replyInThread: ReplyInThreadSchema,
  reactionNotifications: ReactionNotificationModeSchema,
  typingIndicator: z$2.boolean().optional(),
  resolveSenderNames: z$2.boolean().optional(),
};
/**
 * Per-account configuration.
 * All fields are optional - missing fields inherit from top-level config.
 */
const FeishuAccountConfigSchema = z$2
  .object({
    enabled: z$2.boolean().optional(),
    name: z$2.string().optional(),
    appId: z$2.string().optional(),
    appSecret: buildSecretInputSchema().optional(),
    encryptKey: buildSecretInputSchema().optional(),
    verificationToken: buildSecretInputSchema().optional(),
    domain: FeishuDomainSchema.optional(),
    connectionMode: FeishuConnectionModeSchema.optional(),
    webhookPath: z$2.string().optional(),
    ...FeishuSharedConfigShape,
    groupSessionScope: GroupSessionScopeSchema,
    topicSessionMode: TopicSessionModeSchema,
  })
  .strict();
const FeishuConfigSchema = z$2
  .object({
    enabled: z$2.boolean().optional(),
    defaultAccount: z$2.string().optional(),
    appId: z$2.string().optional(),
    appSecret: buildSecretInputSchema().optional(),
    encryptKey: buildSecretInputSchema().optional(),
    verificationToken: buildSecretInputSchema().optional(),
    domain: FeishuDomainSchema.optional().default("feishu"),
    connectionMode: FeishuConnectionModeSchema.optional().default("websocket"),
    webhookPath: z$2.string().optional().default("/feishu/events"),
    ...FeishuSharedConfigShape,
    dmPolicy: DmPolicySchema.optional().default("pairing"),
    reactionNotifications: ReactionNotificationModeSchema.optional().default("own"),
    groupPolicy: GroupPolicySchema.optional().default("allowlist"),
    requireMention: z$2.boolean().optional().default(true),
    groupSessionScope: GroupSessionScopeSchema,
    topicSessionMode: TopicSessionModeSchema,
    dynamicAgentCreation: DynamicAgentCreationSchema,
    typingIndicator: z$2.boolean().optional().default(true),
    resolveSenderNames: z$2.boolean().optional().default(true),
    accounts: z$2.record(z$2.string(), FeishuAccountConfigSchema.optional()).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const defaultAccount = value.defaultAccount?.trim();
    if (defaultAccount && value.accounts && Object.keys(value.accounts).length > 0) {
      const normalizedDefaultAccount = normalizeAccountId(defaultAccount);
      if (!Object.prototype.hasOwnProperty.call(value.accounts, normalizedDefaultAccount))
        ctx.addIssue({
          code: z$2.ZodIssueCode.custom,
          path: ["defaultAccount"],
          message: `channels.feishu.defaultAccount="${defaultAccount}" does not match a configured account key`,
        });
    }
    const defaultConnectionMode = value.connectionMode ?? "websocket";
    const defaultVerificationTokenConfigured = hasConfiguredSecretInput(value.verificationToken);
    const defaultEncryptKeyConfigured = hasConfiguredSecretInput(value.encryptKey);
    if (defaultConnectionMode === "webhook") {
      if (!defaultVerificationTokenConfigured)
        ctx.addIssue({
          code: z$2.ZodIssueCode.custom,
          path: ["verificationToken"],
          message:
            'channels.feishu.connectionMode="webhook" requires channels.feishu.verificationToken',
        });
      if (!defaultEncryptKeyConfigured)
        ctx.addIssue({
          code: z$2.ZodIssueCode.custom,
          path: ["encryptKey"],
          message: 'channels.feishu.connectionMode="webhook" requires channels.feishu.encryptKey',
        });
    }
    for (const [accountId, account] of Object.entries(value.accounts ?? {})) {
      if (!account) continue;
      if ((account.connectionMode ?? defaultConnectionMode) !== "webhook") continue;
      const accountVerificationTokenConfigured =
        hasConfiguredSecretInput(account.verificationToken) || defaultVerificationTokenConfigured;
      const accountEncryptKeyConfigured =
        hasConfiguredSecretInput(account.encryptKey) || defaultEncryptKeyConfigured;
      if (!accountVerificationTokenConfigured)
        ctx.addIssue({
          code: z$2.ZodIssueCode.custom,
          path: ["accounts", accountId, "verificationToken"],
          message: `channels.feishu.accounts.${accountId}.connectionMode="webhook" requires a verificationToken (account-level or top-level)`,
        });
      if (!accountEncryptKeyConfigured)
        ctx.addIssue({
          code: z$2.ZodIssueCode.custom,
          path: ["accounts", accountId, "encryptKey"],
          message: `channels.feishu.accounts.${accountId}.connectionMode="webhook" requires an encryptKey (account-level or top-level)`,
        });
    }
    if (value.dmPolicy === "open") {
      if (!(value.allowFrom ?? []).some((entry) => String(entry).trim() === "*"))
        ctx.addIssue({
          code: z$2.ZodIssueCode.custom,
          path: ["allowFrom"],
          message:
            'channels.feishu.dmPolicy="open" requires channels.feishu.allowFrom to include "*"',
        });
    }
  });
//#endregion
//#region extensions/feishu/src/session-route.ts
function resolveFeishuOutboundSessionRoute(params) {
  let trimmed = stripChannelTargetPrefix(params.target, "feishu", "lark");
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  let isGroup = false;
  let typeExplicit = false;
  if (lower.startsWith("group:") || lower.startsWith("chat:") || lower.startsWith("channel:")) {
    trimmed = trimmed.replace(/^(group|chat|channel):/i, "").trim();
    isGroup = true;
    typeExplicit = true;
  } else if (lower.startsWith("user:") || lower.startsWith("dm:")) {
    trimmed = trimmed.replace(/^(user|dm):/i, "").trim();
    isGroup = false;
    typeExplicit = true;
  }
  if (!typeExplicit) {
    const idLower = trimmed.toLowerCase();
    if (idLower.startsWith("ou_") || idLower.startsWith("on_")) isGroup = false;
  }
  return buildChannelOutboundSessionRoute({
    cfg: params.cfg,
    agentId: params.agentId,
    channel: "feishu",
    accountId: params.accountId,
    peer: {
      kind: isGroup ? "group" : "direct",
      id: trimmed,
    },
    chatType: isGroup ? "group" : "direct",
    from: isGroup ? `feishu:group:${trimmed}` : `feishu:${trimmed}`,
    to: trimmed,
  });
}
//#endregion
//#region extensions/feishu/src/channel.ts
function readFeishuMediaParam(params) {
  const media = params.media;
  if (typeof media !== "string") return;
  return media.trim() ? media : void 0;
}
const meta$4 = {
  id: "feishu",
  label: "Feishu",
  selectionLabel: "Feishu/Lark (飞书)",
  docsPath: "/channels/feishu",
  docsLabel: "feishu",
  blurb: "飞书/Lark enterprise messaging.",
  aliases: ["lark"],
  order: 70,
};
const loadFeishuChannelRuntime = createLazyRuntimeNamedExport(
  () => import("./channel.runtime-C4GlVrgW.js"),
  "feishuChannelRuntime",
);
const collectFeishuSecurityWarnings = createAllowlistProviderGroupPolicyWarningCollector({
  providerConfigPresent: (cfg) => cfg.channels?.feishu !== void 0,
  resolveGroupPolicy: ({ cfg, accountId }) =>
    resolveFeishuAccount({
      cfg,
      accountId,
    }).config?.groupPolicy,
  collect: ({ cfg, accountId, groupPolicy }) => {
    if (groupPolicy !== "open") return [];
    return [
      `- Feishu[${
        resolveFeishuAccount({
          cfg,
          accountId,
        }).accountId
      }] groups: groupPolicy="open" allows any member to trigger (mention-gated). Set channels.feishu.groupPolicy="allowlist" + channels.feishu.groupAllowFrom to restrict senders.`,
    ];
  },
});
function describeFeishuMessageTool({ cfg }) {
  const enabled =
    cfg.channels?.feishu?.enabled !== false &&
    Boolean(resolveFeishuCredentials(cfg.channels?.feishu));
  if (listEnabledFeishuAccounts(cfg).length === 0)
    return {
      actions: [],
      capabilities: enabled ? ["cards"] : [],
      schema: enabled ? { properties: { card: createMessageToolCardSchema() } } : null,
    };
  const actions = new Set([
    "send",
    "read",
    "edit",
    "thread-reply",
    "pin",
    "list-pins",
    "unpin",
    "member-info",
    "channel-info",
    "channel-list",
  ]);
  if (areAnyFeishuReactionActionsEnabled(cfg)) {
    actions.add("react");
    actions.add("reactions");
  }
  return {
    actions: Array.from(actions),
    capabilities: enabled ? ["cards"] : [],
    schema: enabled ? { properties: { card: createMessageToolCardSchema() } } : null,
  };
}
function setFeishuNamedAccountEnabled(cfg, accountId, enabled) {
  const feishuCfg = cfg.channels?.feishu;
  return {
    ...cfg,
    channels: {
      ...cfg.channels,
      feishu: {
        ...feishuCfg,
        accounts: {
          ...feishuCfg?.accounts,
          [accountId]: {
            ...feishuCfg?.accounts?.[accountId],
            enabled,
          },
        },
      },
    },
  };
}
const feishuConfigAdapter = createHybridChannelConfigAdapter({
  sectionKey: "feishu",
  listAccountIds: listFeishuAccountIds,
  resolveAccount: adaptScopedAccountAccessor(resolveFeishuAccount),
  defaultAccountId: resolveDefaultFeishuAccountId,
  clearBaseFields: [],
  resolveAllowFrom: (account) => account.config.allowFrom,
  formatAllowFrom: (allowFrom) => formatAllowFromLowercase({ allowFrom }),
});
function isFeishuReactionsActionEnabled(params) {
  if (!params.account.enabled || !params.account.configured) return false;
  return createActionGate(params.account.config.actions ?? params.cfg.channels?.feishu?.actions)(
    "reactions",
  );
}
function areAnyFeishuReactionActionsEnabled(cfg) {
  for (const account of listEnabledFeishuAccounts(cfg))
    if (
      isFeishuReactionsActionEnabled({
        cfg,
        account,
      })
    )
      return true;
  return false;
}
function isSupportedFeishuDirectConversationId(conversationId) {
  const trimmed = conversationId.trim();
  if (!trimmed || trimmed.includes(":")) return false;
  if (trimmed.startsWith("oc_") || trimmed.startsWith("on_")) return false;
  return true;
}
function normalizeFeishuAcpConversationId(conversationId) {
  const parsed = parseFeishuConversationId({ conversationId });
  if (
    !parsed ||
    (parsed.scope !== "group_topic" &&
      parsed.scope !== "group_topic_sender" &&
      !isSupportedFeishuDirectConversationId(parsed.canonicalConversationId))
  )
    return null;
  return {
    conversationId: parsed.canonicalConversationId,
    parentConversationId:
      parsed.scope === "group_topic" || parsed.scope === "group_topic_sender"
        ? parsed.chatId
        : void 0,
  };
}
function matchFeishuAcpConversation(params) {
  const binding = normalizeFeishuAcpConversationId(params.bindingConversationId);
  if (!binding) return null;
  const incoming = parseFeishuConversationId({
    conversationId: params.conversationId,
    parentConversationId: params.parentConversationId,
  });
  if (
    !incoming ||
    (incoming.scope !== "group_topic" &&
      incoming.scope !== "group_topic_sender" &&
      !isSupportedFeishuDirectConversationId(incoming.canonicalConversationId))
  )
    return null;
  const matchesCanonicalConversation = binding.conversationId === incoming.canonicalConversationId;
  const matchesParentTopicForSenderScopedConversation =
    incoming.scope === "group_topic_sender" &&
    binding.parentConversationId === incoming.chatId &&
    binding.conversationId === `${incoming.chatId}:topic:${incoming.topicId}`;
  if (!matchesCanonicalConversation && !matchesParentTopicForSenderScopedConversation) return null;
  return {
    conversationId: matchesParentTopicForSenderScopedConversation
      ? binding.conversationId
      : incoming.canonicalConversationId,
    parentConversationId:
      incoming.scope === "group_topic" || incoming.scope === "group_topic_sender"
        ? incoming.chatId
        : void 0,
    matchPriority: matchesCanonicalConversation ? 2 : 1,
  };
}
function jsonActionResult(details) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(details),
      },
    ],
    details,
  };
}
function readFirstString(params, keys, fallback) {
  for (const key of keys) {
    const value = params[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
}
function readOptionalNumber(params, keys) {
  for (const key of keys) {
    const value = params[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
}
function resolveFeishuActionTarget(ctx) {
  return readFirstString(ctx.params, ["to", "target"], ctx.toolContext?.currentChannelId);
}
function resolveFeishuChatId(ctx) {
  const raw = readFirstString(
    ctx.params,
    ["chatId", "chat_id", "channelId", "channel_id", "to", "target"],
    ctx.toolContext?.currentChannelId,
  );
  if (!raw) return;
  if (/^(user|dm|open_id):/i.test(raw)) return;
  if (/^(chat|group|channel):/i.test(raw)) return normalizeFeishuTarget(raw) ?? void 0;
  return raw;
}
function resolveFeishuMessageId(params) {
  return readFirstString(params, ["messageId", "message_id", "replyTo", "reply_to"]);
}
function resolveFeishuMemberId(params) {
  return readFirstString(params, [
    "memberId",
    "member_id",
    "userId",
    "user_id",
    "openId",
    "open_id",
    "unionId",
    "union_id",
  ]);
}
function resolveFeishuMemberIdType(params) {
  const raw = readFirstString(params, [
    "memberIdType",
    "member_id_type",
    "userIdType",
    "user_id_type",
  ]);
  if (raw === "open_id" || raw === "user_id" || raw === "union_id") return raw;
  if (
    readFirstString(params, ["userId", "user_id"]) &&
    !readFirstString(params, ["openId", "open_id", "unionId", "union_id"])
  )
    return "user_id";
  if (
    readFirstString(params, ["unionId", "union_id"]) &&
    !readFirstString(params, ["openId", "open_id"])
  )
    return "union_id";
  return "open_id";
}
const feishuPlugin = createChatChannelPlugin({
  base: {
    id: "feishu",
    meta: { ...meta$4 },
    capabilities: {
      chatTypes: ["direct", "channel"],
      polls: false,
      threads: true,
      media: true,
      reactions: true,
      edit: true,
      reply: true,
    },
    agentPrompt: {
      messageToolHints: () => [
        "- Feishu targeting: omit `target` to reply to the current conversation (auto-inferred). Explicit targets: `user:open_id` or `chat:chat_id`.",
        "- Feishu supports interactive cards plus native image, file, audio, and video/media delivery.",
        "- Feishu supports `send`, `read`, `edit`, `thread-reply`, pins, and channel/member lookup, plus reactions when enabled.",
      ],
    },
    groups: { resolveToolPolicy: resolveFeishuGroupToolPolicy },
    mentions: { stripPatterns: () => ['<at user_id="[^"]*">[^<]*</at>'] },
    reload: { configPrefixes: ["channels.feishu"] },
    configSchema: buildChannelConfigSchema(FeishuConfigSchema),
    config: {
      ...feishuConfigAdapter,
      setAccountEnabled: ({ cfg, accountId, enabled }) => {
        if (accountId === "default")
          return {
            ...cfg,
            channels: {
              ...cfg.channels,
              feishu: {
                ...cfg.channels?.feishu,
                enabled,
              },
            },
          };
        return setFeishuNamedAccountEnabled(cfg, accountId, enabled);
      },
      deleteAccount: ({ cfg, accountId }) => {
        if (accountId === "default") {
          const next = { ...cfg };
          const nextChannels = { ...cfg.channels };
          delete nextChannels.feishu;
          if (Object.keys(nextChannels).length > 0) next.channels = nextChannels;
          else delete next.channels;
          return next;
        }
        const feishuCfg = cfg.channels?.feishu;
        const accounts = { ...feishuCfg?.accounts };
        delete accounts[accountId];
        return {
          ...cfg,
          channels: {
            ...cfg.channels,
            feishu: {
              ...feishuCfg,
              accounts: Object.keys(accounts).length > 0 ? accounts : void 0,
            },
          },
        };
      },
      isConfigured: (account) => account.configured,
      describeAccount: (account) =>
        describeAccountSnapshot({
          account,
          configured: account.configured,
          extra: {
            appId: account.appId,
            domain: account.domain,
          },
        }),
    },
    actions: {
      describeMessageTool: describeFeishuMessageTool,
      handleAction: async (ctx) => {
        const account = resolveFeishuAccount({
          cfg: ctx.cfg,
          accountId: ctx.accountId ?? void 0,
        });
        if (
          (ctx.action === "react" || ctx.action === "reactions") &&
          !isFeishuReactionsActionEnabled({
            cfg: ctx.cfg,
            account,
          })
        )
          throw new Error("Feishu reactions are disabled via actions.reactions.");
        if (ctx.action === "send" || ctx.action === "thread-reply") {
          const to = resolveFeishuActionTarget(ctx);
          if (!to) throw new Error(`Feishu ${ctx.action} requires a target (to).`);
          const replyToMessageId =
            ctx.action === "thread-reply" ? resolveFeishuMessageId(ctx.params) : void 0;
          if (ctx.action === "thread-reply" && !replyToMessageId)
            throw new Error("Feishu thread-reply requires messageId.");
          const card =
            ctx.params.card && typeof ctx.params.card === "object" ? ctx.params.card : void 0;
          const text = readFirstString(ctx.params, ["text", "message"]);
          const mediaUrl = readFeishuMediaParam(ctx.params);
          if (card && mediaUrl)
            throw new Error(`Feishu ${ctx.action} does not support card with media.`);
          if (!card && !text && !mediaUrl)
            throw new Error(`Feishu ${ctx.action} requires text/message, media, or card.`);
          const runtime = await loadFeishuChannelRuntime();
          const maybeSendMedia = runtime.feishuOutbound.sendMedia;
          if (mediaUrl && !maybeSendMedia)
            throw new Error("Feishu media sending is not available.");
          const sendMedia = maybeSendMedia;
          let result;
          if (card)
            result = await runtime.sendCardFeishu({
              cfg: ctx.cfg,
              to,
              card,
              accountId: ctx.accountId ?? void 0,
              replyToMessageId,
              replyInThread: ctx.action === "thread-reply",
            });
          else if (mediaUrl)
            result = await sendMedia({
              cfg: ctx.cfg,
              to,
              text: text ?? "",
              mediaUrl,
              accountId: ctx.accountId ?? void 0,
              mediaLocalRoots: ctx.mediaLocalRoots,
              replyToId: replyToMessageId,
            });
          else
            result = await runtime.sendMessageFeishu({
              cfg: ctx.cfg,
              to,
              text,
              accountId: ctx.accountId ?? void 0,
              replyToMessageId,
              replyInThread: ctx.action === "thread-reply",
            });
          return jsonActionResult({
            ok: true,
            channel: "feishu",
            action: ctx.action,
            ...result,
          });
        }
        if (ctx.action === "read") {
          const messageId = resolveFeishuMessageId(ctx.params);
          if (!messageId) throw new Error("Feishu read requires messageId.");
          const { getMessageFeishu } = await loadFeishuChannelRuntime();
          const message = await getMessageFeishu({
            cfg: ctx.cfg,
            messageId,
            accountId: ctx.accountId ?? void 0,
          });
          if (!message)
            return {
              isError: true,
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    error: `Feishu read failed or message not found: ${messageId}`,
                  }),
                },
              ],
              details: { error: `Feishu read failed or message not found: ${messageId}` },
            };
          return jsonActionResult({
            ok: true,
            channel: "feishu",
            action: "read",
            message,
          });
        }
        if (ctx.action === "edit") {
          const messageId = resolveFeishuMessageId(ctx.params);
          if (!messageId) throw new Error("Feishu edit requires messageId.");
          const text = readFirstString(ctx.params, ["text", "message"]);
          const card =
            ctx.params.card && typeof ctx.params.card === "object" ? ctx.params.card : void 0;
          const { editMessageFeishu } = await loadFeishuChannelRuntime();
          return jsonActionResult({
            ok: true,
            channel: "feishu",
            action: "edit",
            ...(await editMessageFeishu({
              cfg: ctx.cfg,
              messageId,
              text,
              card,
              accountId: ctx.accountId ?? void 0,
            })),
          });
        }
        if (ctx.action === "pin") {
          const messageId = resolveFeishuMessageId(ctx.params);
          if (!messageId) throw new Error("Feishu pin requires messageId.");
          const { createPinFeishu } = await loadFeishuChannelRuntime();
          return jsonActionResult({
            ok: true,
            channel: "feishu",
            action: "pin",
            pin: await createPinFeishu({
              cfg: ctx.cfg,
              messageId,
              accountId: ctx.accountId ?? void 0,
            }),
          });
        }
        if (ctx.action === "unpin") {
          const messageId = resolveFeishuMessageId(ctx.params);
          if (!messageId) throw new Error("Feishu unpin requires messageId.");
          const { removePinFeishu } = await loadFeishuChannelRuntime();
          await removePinFeishu({
            cfg: ctx.cfg,
            messageId,
            accountId: ctx.accountId ?? void 0,
          });
          return jsonActionResult({
            ok: true,
            channel: "feishu",
            action: "unpin",
            messageId,
          });
        }
        if (ctx.action === "list-pins") {
          const chatId = resolveFeishuChatId(ctx);
          if (!chatId) throw new Error("Feishu list-pins requires chatId or channelId.");
          const { listPinsFeishu } = await loadFeishuChannelRuntime();
          return jsonActionResult({
            ok: true,
            channel: "feishu",
            action: "list-pins",
            ...(await listPinsFeishu({
              cfg: ctx.cfg,
              chatId,
              startTime: readFirstString(ctx.params, ["startTime", "start_time"]),
              endTime: readFirstString(ctx.params, ["endTime", "end_time"]),
              pageSize: readOptionalNumber(ctx.params, ["pageSize", "page_size"]),
              pageToken: readFirstString(ctx.params, ["pageToken", "page_token"]),
              accountId: ctx.accountId ?? void 0,
            })),
          });
        }
        if (ctx.action === "channel-info") {
          const chatId = resolveFeishuChatId(ctx);
          if (!chatId) throw new Error("Feishu channel-info requires chatId or channelId.");
          const runtime = await loadFeishuChannelRuntime();
          const client = createFeishuClient(account);
          const channel = await runtime.getChatInfo(client, chatId);
          if (!(ctx.params.includeMembers === true || ctx.params.members === true))
            return jsonActionResult({
              ok: true,
              provider: "feishu",
              action: "channel-info",
              channel,
            });
          return jsonActionResult({
            ok: true,
            provider: "feishu",
            action: "channel-info",
            channel,
            members: await runtime.getChatMembers(
              client,
              chatId,
              readOptionalNumber(ctx.params, ["pageSize", "page_size"]),
              readFirstString(ctx.params, ["pageToken", "page_token"]),
              resolveFeishuMemberIdType(ctx.params),
            ),
          });
        }
        if (ctx.action === "member-info") {
          const runtime = await loadFeishuChannelRuntime();
          const client = createFeishuClient(account);
          const memberId = resolveFeishuMemberId(ctx.params);
          if (memberId)
            return jsonActionResult({
              ok: true,
              channel: "feishu",
              action: "member-info",
              member: await runtime.getFeishuMemberInfo(
                client,
                memberId,
                resolveFeishuMemberIdType(ctx.params),
              ),
            });
          const chatId = resolveFeishuChatId(ctx);
          if (!chatId) throw new Error("Feishu member-info requires memberId or chatId/channelId.");
          return jsonActionResult({
            ok: true,
            channel: "feishu",
            action: "member-info",
            ...(await runtime.getChatMembers(
              client,
              chatId,
              readOptionalNumber(ctx.params, ["pageSize", "page_size"]),
              readFirstString(ctx.params, ["pageToken", "page_token"]),
              resolveFeishuMemberIdType(ctx.params),
            )),
          });
        }
        if (ctx.action === "channel-list") {
          const runtime = await loadFeishuChannelRuntime();
          const query = readFirstString(ctx.params, ["query"]);
          const limit = readOptionalNumber(ctx.params, ["limit"]);
          const scope = readFirstString(ctx.params, ["scope", "kind"]) ?? "all";
          if (
            scope === "groups" ||
            scope === "group" ||
            scope === "channels" ||
            scope === "channel"
          )
            return jsonActionResult({
              ok: true,
              channel: "feishu",
              action: "channel-list",
              groups: await runtime.listFeishuDirectoryGroupsLive({
                cfg: ctx.cfg,
                query,
                limit,
                fallbackToStatic: false,
                accountId: ctx.accountId ?? void 0,
              }),
            });
          if (
            scope === "peers" ||
            scope === "peer" ||
            scope === "members" ||
            scope === "member" ||
            scope === "users" ||
            scope === "user"
          )
            return jsonActionResult({
              ok: true,
              channel: "feishu",
              action: "channel-list",
              peers: await runtime.listFeishuDirectoryPeersLive({
                cfg: ctx.cfg,
                query,
                limit,
                fallbackToStatic: false,
                accountId: ctx.accountId ?? void 0,
              }),
            });
          const [groups, peers] = await Promise.all([
            runtime.listFeishuDirectoryGroupsLive({
              cfg: ctx.cfg,
              query,
              limit,
              fallbackToStatic: false,
              accountId: ctx.accountId ?? void 0,
            }),
            runtime.listFeishuDirectoryPeersLive({
              cfg: ctx.cfg,
              query,
              limit,
              fallbackToStatic: false,
              accountId: ctx.accountId ?? void 0,
            }),
          ]);
          return jsonActionResult({
            ok: true,
            channel: "feishu",
            action: "channel-list",
            groups,
            peers,
          });
        }
        if (ctx.action === "react") {
          const messageId = resolveFeishuMessageId(ctx.params);
          if (!messageId) throw new Error("Feishu reaction requires messageId.");
          const emoji = typeof ctx.params.emoji === "string" ? ctx.params.emoji.trim() : "";
          const remove = ctx.params.remove === true;
          const clearAll = ctx.params.clearAll === true;
          if (remove) {
            if (!emoji) throw new Error("Emoji is required to remove a Feishu reaction.");
            const { listReactionsFeishu, removeReactionFeishu } = await loadFeishuChannelRuntime();
            const ownReaction = (
              await listReactionsFeishu({
                cfg: ctx.cfg,
                messageId,
                emojiType: emoji,
                accountId: ctx.accountId ?? void 0,
              })
            ).find((entry) => entry.operatorType === "app");
            if (!ownReaction)
              return jsonActionResult({
                ok: true,
                removed: null,
              });
            await removeReactionFeishu({
              cfg: ctx.cfg,
              messageId,
              reactionId: ownReaction.reactionId,
              accountId: ctx.accountId ?? void 0,
            });
            return jsonActionResult({
              ok: true,
              removed: emoji,
            });
          }
          if (!emoji) {
            if (!clearAll)
              throw new Error(
                "Emoji is required to add a Feishu reaction. Set clearAll=true to remove all bot reactions.",
              );
            const { listReactionsFeishu, removeReactionFeishu } = await loadFeishuChannelRuntime();
            const reactions = await listReactionsFeishu({
              cfg: ctx.cfg,
              messageId,
              accountId: ctx.accountId ?? void 0,
            });
            let removed = 0;
            for (const reaction of reactions.filter((entry) => entry.operatorType === "app")) {
              await removeReactionFeishu({
                cfg: ctx.cfg,
                messageId,
                reactionId: reaction.reactionId,
                accountId: ctx.accountId ?? void 0,
              });
              removed += 1;
            }
            return jsonActionResult({
              ok: true,
              removed,
            });
          }
          const { addReactionFeishu } = await loadFeishuChannelRuntime();
          await addReactionFeishu({
            cfg: ctx.cfg,
            messageId,
            emojiType: emoji,
            accountId: ctx.accountId ?? void 0,
          });
          return jsonActionResult({
            ok: true,
            added: emoji,
          });
        }
        if (ctx.action === "reactions") {
          const messageId = resolveFeishuMessageId(ctx.params);
          if (!messageId) throw new Error("Feishu reactions lookup requires messageId.");
          const { listReactionsFeishu } = await loadFeishuChannelRuntime();
          return jsonActionResult({
            ok: true,
            reactions: await listReactionsFeishu({
              cfg: ctx.cfg,
              messageId,
              accountId: ctx.accountId ?? void 0,
            }),
          });
        }
        throw new Error(`Unsupported Feishu action: "${String(ctx.action)}"`);
      },
    },
    bindings: {
      compileConfiguredBinding: ({ conversationId }) =>
        normalizeFeishuAcpConversationId(conversationId),
      matchInboundConversation: ({ compiledBinding, conversationId, parentConversationId }) =>
        matchFeishuAcpConversation({
          bindingConversationId: compiledBinding.conversationId,
          conversationId,
          parentConversationId,
        }),
    },
    setup: feishuSetupAdapter,
    setupWizard: feishuSetupWizard,
    messaging: {
      normalizeTarget: (raw) => normalizeFeishuTarget(raw) ?? void 0,
      resolveOutboundSessionRoute: (params) => resolveFeishuOutboundSessionRoute(params),
      targetResolver: {
        looksLikeId: looksLikeFeishuId,
        hint: "<chatId|user:openId|chat:chatId>",
      },
    },
    directory: createChannelDirectoryAdapter({
      listPeers: async ({ cfg, query, limit, accountId }) =>
        listFeishuDirectoryPeers({
          cfg,
          query: query ?? void 0,
          limit: limit ?? void 0,
          accountId: accountId ?? void 0,
        }),
      listGroups: async ({ cfg, query, limit, accountId }) =>
        listFeishuDirectoryGroups({
          cfg,
          query: query ?? void 0,
          limit: limit ?? void 0,
          accountId: accountId ?? void 0,
        }),
      ...createRuntimeDirectoryLiveAdapter({
        getRuntime: loadFeishuChannelRuntime,
        listPeersLive:
          (runtime) =>
          async ({ cfg, query, limit, accountId }) =>
            await runtime.listFeishuDirectoryPeersLive({
              cfg,
              query: query ?? void 0,
              limit: limit ?? void 0,
              accountId: accountId ?? void 0,
            }),
        listGroupsLive:
          (runtime) =>
          async ({ cfg, query, limit, accountId }) =>
            await runtime.listFeishuDirectoryGroupsLive({
              cfg,
              query: query ?? void 0,
              limit: limit ?? void 0,
              accountId: accountId ?? void 0,
            }),
      }),
    }),
    status: createComputedAccountStatusAdapter({
      defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID, { port: null }),
      buildChannelSummary: ({ snapshot }) =>
        buildProbeChannelStatusSummary(snapshot, { port: snapshot.port ?? null }),
      probeAccount: async ({ account }) =>
        await (await loadFeishuChannelRuntime()).probeFeishu(account),
      resolveAccountSnapshot: ({ account, runtime }) => ({
        accountId: account.accountId,
        enabled: account.enabled,
        configured: account.configured,
        name: account.name,
        extra: {
          appId: account.appId,
          domain: account.domain,
          port: runtime?.port ?? null,
        },
      }),
    }),
    gateway: {
      startAccount: async (ctx) => {
        const { monitorFeishuProvider } = await import("./monitor-CppBVT4k.js");
        const account = resolveFeishuAccount({
          cfg: ctx.cfg,
          accountId: ctx.accountId,
        });
        const port = account.config?.webhookPort ?? null;
        ctx.setStatus({
          accountId: ctx.accountId,
          port,
        });
        ctx.log?.info(
          `starting feishu[${ctx.accountId}] (mode: ${account.config?.connectionMode ?? "websocket"})`,
        );
        return monitorFeishuProvider({
          config: ctx.cfg,
          runtime: ctx.runtime,
          abortSignal: ctx.abortSignal,
          accountId: ctx.accountId,
        });
      },
    },
  },
  security: {
    collectWarnings: projectConfigAccountIdWarningCollector(collectFeishuSecurityWarnings),
  },
  pairing: {
    text: {
      idLabel: "feishuUserId",
      message: PAIRING_APPROVED_MESSAGE,
      normalizeAllowEntry: createPairingPrefixStripper(/^(feishu|user|open_id):/i),
      notify: async ({ cfg, id, message }) => {
        const { sendMessageFeishu } = await loadFeishuChannelRuntime();
        await sendMessageFeishu({
          cfg,
          to: id,
          text: message,
        });
      },
    },
  },
  outbound: {
    deliveryMode: "direct",
    chunker: (text, limit) => getFeishuRuntime().channel.text.chunkMarkdownText(text, limit),
    chunkerMode: "markdown",
    textChunkLimit: 4e3,
    ...createRuntimeOutboundDelegates({
      getRuntime: loadFeishuChannelRuntime,
      sendText: { resolve: (runtime) => runtime.feishuOutbound.sendText },
      sendMedia: { resolve: (runtime) => runtime.feishuOutbound.sendMedia },
    }),
  },
});
//#endregion
//#region extensions/feishu/src/doc-schema.ts
const tableCreationProperties = {
  doc_token: Type.String({ description: "Document token" }),
  parent_block_id: Type.Optional(
    Type.String({ description: "Parent block ID (default: document root)" }),
  ),
  row_size: Type.Integer({
    description: "Table row count",
    minimum: 1,
  }),
  column_size: Type.Integer({
    description: "Table column count",
    minimum: 1,
  }),
  column_width: Type.Optional(
    Type.Array(Type.Number({ minimum: 1 }), {
      description: "Column widths in px (length should match column_size)",
    }),
  ),
};
const FeishuDocSchema = Type.Union([
  Type.Object({
    action: Type.Literal("read"),
    doc_token: Type.String({ description: "Document token (extract from URL /docx/XXX)" }),
  }),
  Type.Object({
    action: Type.Literal("write"),
    doc_token: Type.String({ description: "Document token" }),
    content: Type.String({
      description: "Markdown content to write (replaces entire document content)",
    }),
  }),
  Type.Object({
    action: Type.Literal("append"),
    doc_token: Type.String({ description: "Document token" }),
    content: Type.String({ description: "Markdown content to append to end of document" }),
  }),
  Type.Object({
    action: Type.Literal("insert"),
    doc_token: Type.String({ description: "Document token" }),
    content: Type.String({ description: "Markdown content to insert" }),
    after_block_id: Type.String({
      description: "Insert content after this block ID. Use list_blocks to find block IDs.",
    }),
  }),
  Type.Object({
    action: Type.Literal("create"),
    title: Type.String({ description: "Document title" }),
    folder_token: Type.Optional(Type.String({ description: "Target folder token (optional)" })),
    grant_to_requester: Type.Optional(
      Type.Boolean({
        description:
          "Grant edit permission to the trusted requesting Feishu user from runtime context (default: true).",
      }),
    ),
  }),
  Type.Object({
    action: Type.Literal("list_blocks"),
    doc_token: Type.String({ description: "Document token" }),
  }),
  Type.Object({
    action: Type.Literal("get_block"),
    doc_token: Type.String({ description: "Document token" }),
    block_id: Type.String({ description: "Block ID (from list_blocks)" }),
  }),
  Type.Object({
    action: Type.Literal("update_block"),
    doc_token: Type.String({ description: "Document token" }),
    block_id: Type.String({ description: "Block ID (from list_blocks)" }),
    content: Type.String({ description: "New text content" }),
  }),
  Type.Object({
    action: Type.Literal("delete_block"),
    doc_token: Type.String({ description: "Document token" }),
    block_id: Type.String({ description: "Block ID" }),
  }),
  Type.Object({
    action: Type.Literal("create_table"),
    ...tableCreationProperties,
  }),
  Type.Object({
    action: Type.Literal("write_table_cells"),
    doc_token: Type.String({ description: "Document token" }),
    table_block_id: Type.String({ description: "Table block ID" }),
    values: Type.Array(Type.Array(Type.String()), {
      description: "2D matrix values[row][col] to write into table cells",
      minItems: 1,
    }),
  }),
  Type.Object({
    action: Type.Literal("create_table_with_values"),
    ...tableCreationProperties,
    values: Type.Array(Type.Array(Type.String()), {
      description: "2D matrix values[row][col] to write into table cells",
      minItems: 1,
    }),
  }),
  Type.Object({
    action: Type.Literal("insert_table_row"),
    doc_token: Type.String({ description: "Document token" }),
    block_id: Type.String({ description: "Table block ID" }),
    row_index: Type.Optional(
      Type.Number({ description: "Row index to insert at (-1 for end, default: -1)" }),
    ),
  }),
  Type.Object({
    action: Type.Literal("insert_table_column"),
    doc_token: Type.String({ description: "Document token" }),
    block_id: Type.String({ description: "Table block ID" }),
    column_index: Type.Optional(
      Type.Number({ description: "Column index to insert at (-1 for end, default: -1)" }),
    ),
  }),
  Type.Object({
    action: Type.Literal("delete_table_rows"),
    doc_token: Type.String({ description: "Document token" }),
    block_id: Type.String({ description: "Table block ID" }),
    row_start: Type.Number({ description: "Start row index (0-based)" }),
    row_count: Type.Optional(Type.Number({ description: "Number of rows to delete (default: 1)" })),
  }),
  Type.Object({
    action: Type.Literal("delete_table_columns"),
    doc_token: Type.String({ description: "Document token" }),
    block_id: Type.String({ description: "Table block ID" }),
    column_start: Type.Number({ description: "Start column index (0-based)" }),
    column_count: Type.Optional(
      Type.Number({ description: "Number of columns to delete (default: 1)" }),
    ),
  }),
  Type.Object({
    action: Type.Literal("merge_table_cells"),
    doc_token: Type.String({ description: "Document token" }),
    block_id: Type.String({ description: "Table block ID" }),
    row_start: Type.Number({ description: "Start row index" }),
    row_end: Type.Number({ description: "End row index (exclusive)" }),
    column_start: Type.Number({ description: "Start column index" }),
    column_end: Type.Number({ description: "End column index (exclusive)" }),
  }),
  Type.Object({
    action: Type.Literal("upload_image"),
    doc_token: Type.String({ description: "Document token" }),
    url: Type.Optional(Type.String({ description: "Remote image URL (http/https)" })),
    file_path: Type.Optional(Type.String({ description: "Local image file path" })),
    image: Type.Optional(
      Type.String({
        description:
          "Image as data URI (data:image/png;base64,...) or plain base64 string. Use instead of url/file_path for DALL-E outputs, canvas screenshots, etc.",
      }),
    ),
    parent_block_id: Type.Optional(
      Type.String({ description: "Parent block ID (default: document root)" }),
    ),
    filename: Type.Optional(Type.String({ description: "Optional filename override" })),
    index: Type.Optional(
      Type.Integer({
        minimum: 0,
        description: "Insert position (0-based index among siblings). Omit to append.",
      }),
    ),
  }),
  Type.Object({
    action: Type.Literal("upload_file"),
    doc_token: Type.String({ description: "Document token" }),
    url: Type.Optional(Type.String({ description: "Remote file URL (http/https)" })),
    file_path: Type.Optional(Type.String({ description: "Local file path" })),
    parent_block_id: Type.Optional(
      Type.String({ description: "Parent block ID (default: document root)" }),
    ),
    filename: Type.Optional(Type.String({ description: "Optional filename override" })),
  }),
  Type.Object({
    action: Type.Literal("color_text"),
    doc_token: Type.String({ description: "Document token" }),
    block_id: Type.String({ description: "Text block ID to update" }),
    content: Type.String({
      description:
        'Text with color markup. Tags: [red], [green], [blue], [orange], [yellow], [purple], [grey], [bold], [bg:yellow]. Example: "Revenue [green]+15%[/green] YoY"',
    }),
  }),
]);
//#endregion
//#region extensions/feishu/src/docx-table-ops.ts
const MIN_COLUMN_WIDTH = 50;
const MAX_COLUMN_WIDTH = 400;
const DEFAULT_TABLE_WIDTH = 730;
/**
 * Calculate adaptive column widths based on cell content length.
 *
 * Algorithm:
 * 1. For each column, find the max content length across all rows
 * 2. Weight CJK characters as 2x width (they render wider)
 * 3. Calculate proportional widths based on content length
 * 4. Apply min/max constraints
 * 5. Redistribute remaining space to fill total table width
 *
 * Total width is derived from the original column_width values returned
 * by the Convert API, ensuring tables match Feishu's expected dimensions.
 *
 * @param blocks - Array of blocks from Convert API
 * @param tableBlockId - The block_id of the table block
 * @returns Array of column widths in pixels
 */
function calculateAdaptiveColumnWidths(blocks, tableBlockId) {
  const tableBlock = blocks.find((b) => b.block_id === tableBlockId && b.block_type === 31);
  if (!tableBlock?.table?.property) return [];
  const { row_size, column_size, column_width: originalWidths } = tableBlock.table.property;
  const totalWidth =
    originalWidths && originalWidths.length > 0
      ? originalWidths.reduce((a, b) => a + b, 0)
      : DEFAULT_TABLE_WIDTH;
  const cellIds = tableBlock.children || [];
  const blockMap = /* @__PURE__ */ new Map();
  for (const block of blocks) blockMap.set(block.block_id, block);
  function getCellText(cellId) {
    const cell = blockMap.get(cellId);
    if (!cell?.children) return "";
    let text = "";
    const childIds = Array.isArray(cell.children) ? cell.children : [cell.children];
    for (const childId of childIds) {
      const child = blockMap.get(childId);
      if (child?.text?.elements) {
        for (const elem of child.text.elements)
          if (elem.text_run?.content) text += elem.text_run.content;
      }
    }
    return text;
  }
  function getWeightedLength(text) {
    return [...text].reduce((sum, char) => {
      return sum + (char.charCodeAt(0) > 255 ? 2 : 1);
    }, 0);
  }
  const maxLengths = new Array(column_size).fill(0);
  for (let row = 0; row < row_size; row++)
    for (let col = 0; col < column_size; col++) {
      const cellId = cellIds[row * column_size + col];
      if (cellId) {
        const length = getWeightedLength(getCellText(cellId));
        maxLengths[col] = Math.max(maxLengths[col], length);
      }
    }
  const totalLength = maxLengths.reduce((a, b) => a + b, 0);
  if (totalLength === 0) {
    const equalWidth = Math.max(
      MIN_COLUMN_WIDTH,
      Math.min(MAX_COLUMN_WIDTH, Math.floor(totalWidth / column_size)),
    );
    return new Array(column_size).fill(equalWidth);
  }
  let widths = maxLengths.map((len) => {
    const proportion = len / totalLength;
    return Math.round(proportion * totalWidth);
  });
  widths = widths.map((w) => Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, w)));
  let remaining = totalWidth - widths.reduce((a, b) => a + b, 0);
  while (remaining > 0) {
    const growable = widths.map((w, i) => (w < MAX_COLUMN_WIDTH ? i : -1)).filter((i) => i >= 0);
    if (growable.length === 0) break;
    const perColumn = Math.floor(remaining / growable.length);
    if (perColumn === 0) break;
    for (const i of growable) {
      const add = Math.min(perColumn, MAX_COLUMN_WIDTH - widths[i]);
      widths[i] += add;
      remaining -= add;
    }
  }
  return widths;
}
/**
 * Clean blocks for Descendant API with adaptive column widths.
 *
 * - Removes parent_id from all blocks
 * - Fixes children type (string → array) for TableCell blocks
 * - Removes merge_info (read-only, causes API error)
 * - Calculates and applies adaptive column_width for tables
 *
 * @param blocks - Array of blocks from Convert API
 * @returns Cleaned blocks ready for Descendant API
 */
function cleanBlocksForDescendant(blocks) {
  const tableWidths = /* @__PURE__ */ new Map();
  for (const block of blocks)
    if (block.block_type === 31) {
      const widths = calculateAdaptiveColumnWidths(blocks, block.block_id);
      tableWidths.set(block.block_id, widths);
    }
  return blocks.map((block) => {
    const { parent_id: _parentId, ...cleanBlock } = block;
    if (cleanBlock.block_type === 32 && typeof cleanBlock.children === "string")
      cleanBlock.children = [cleanBlock.children];
    if (cleanBlock.block_type === 31 && cleanBlock.table) {
      const { cells: _cells, ...tableWithoutCells } = cleanBlock.table;
      const { row_size, column_size } = tableWithoutCells.property || {};
      const adaptiveWidths = tableWidths.get(block.block_id);
      cleanBlock.table = {
        property: {
          row_size,
          column_size,
          ...(adaptiveWidths?.length && { column_width: adaptiveWidths }),
        },
      };
    }
    return cleanBlock;
  });
}
async function insertTableRow(client, docToken, blockId, rowIndex = -1) {
  const res = await client.docx.documentBlock.patch({
    path: {
      document_id: docToken,
      block_id: blockId,
    },
    data: { insert_table_row: { row_index: rowIndex } },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    block: res.data?.block,
  };
}
async function insertTableColumn(client, docToken, blockId, columnIndex = -1) {
  const res = await client.docx.documentBlock.patch({
    path: {
      document_id: docToken,
      block_id: blockId,
    },
    data: { insert_table_column: { column_index: columnIndex } },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    block: res.data?.block,
  };
}
async function deleteTableRows(client, docToken, blockId, rowStart, rowCount = 1) {
  const res = await client.docx.documentBlock.patch({
    path: {
      document_id: docToken,
      block_id: blockId,
    },
    data: {
      delete_table_rows: {
        row_start_index: rowStart,
        row_end_index: rowStart + rowCount,
      },
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    rows_deleted: rowCount,
    block: res.data?.block,
  };
}
async function deleteTableColumns(client, docToken, blockId, columnStart, columnCount = 1) {
  const res = await client.docx.documentBlock.patch({
    path: {
      document_id: docToken,
      block_id: blockId,
    },
    data: {
      delete_table_columns: {
        column_start_index: columnStart,
        column_end_index: columnStart + columnCount,
      },
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    columns_deleted: columnCount,
    block: res.data?.block,
  };
}
async function mergeTableCells(
  client,
  docToken,
  blockId,
  rowStart,
  rowEnd,
  columnStart,
  columnEnd,
) {
  const res = await client.docx.documentBlock.patch({
    path: {
      document_id: docToken,
      block_id: blockId,
    },
    data: {
      merge_table_cells: {
        row_start_index: rowStart,
        row_end_index: rowEnd,
        column_start_index: columnStart,
        column_end_index: columnEnd,
      },
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    block: res.data?.block,
  };
}
//#endregion
//#region extensions/feishu/src/docx-batch-insert.ts
const BATCH_SIZE = 1e3;
/**
 * Collect all descendant blocks for a given first-level block ID.
 * Recursively traverses the block tree to gather all children.
 */
function collectDescendants(blockMap, rootId) {
  const result = [];
  const visited = /* @__PURE__ */ new Set();
  function collect(blockId) {
    if (visited.has(blockId)) return;
    visited.add(blockId);
    const block = blockMap.get(blockId);
    if (!block) return;
    result.push(block);
    const children = block.children;
    if (Array.isArray(children)) for (const childId of children) collect(childId);
    else if (typeof children === "string") collect(children);
  }
  collect(rootId);
  return result;
}
/**
 * Insert a single batch of blocks using Descendant API.
 *
 * @param parentBlockId - Parent block to insert into (defaults to docToken)
 * @param index - Position within parent's children (-1 = end)
 */
async function insertBatch(
  client,
  docToken,
  blocks,
  firstLevelBlockIds,
  parentBlockId = docToken,
  index = -1,
) {
  const descendants = cleanBlocksForDescendant(blocks);
  if (descendants.length === 0) return [];
  const res = await client.docx.documentBlockDescendant.create({
    path: {
      document_id: docToken,
      block_id: parentBlockId,
    },
    data: {
      children_id: firstLevelBlockIds,
      descendants,
      index,
    },
  });
  if (res.code !== 0) throw new Error(`${res.msg} (code: ${res.code})`);
  return res.data?.children ?? [];
}
/**
 * Insert blocks in batches for large documents (>1000 blocks).
 *
 * Batches are split to ensure BOTH children_id AND descendants
 * arrays stay under the 1000 block API limit.
 *
 * @param client - Feishu API client
 * @param docToken - Document ID
 * @param blocks - All blocks from Convert API
 * @param firstLevelBlockIds - IDs of top-level blocks to insert
 * @param logger - Optional logger for progress updates
 * @param parentBlockId - Parent block to insert into (defaults to docToken = document root)
 * @param startIndex - Starting position within parent (-1 = end). For multi-batch inserts,
 *   each batch advances this by the number of first-level IDs inserted so far.
 * @returns Inserted children blocks and any skipped block IDs
 */
async function insertBlocksInBatches(
  client,
  docToken,
  blocks,
  firstLevelBlockIds,
  logger,
  parentBlockId = docToken,
  startIndex = -1,
) {
  const allChildren = [];
  const batches = [];
  let currentBatch = {
    firstLevelIds: [],
    blocks: [],
  };
  const usedBlockIds = /* @__PURE__ */ new Set();
  const blockMap = /* @__PURE__ */ new Map();
  for (const block of blocks) blockMap.set(block.block_id, block);
  for (const firstLevelId of firstLevelBlockIds) {
    const newBlocks = collectDescendants(blockMap, firstLevelId).filter(
      (b) => !usedBlockIds.has(b.block_id),
    );
    if (newBlocks.length > 1e3)
      throw new Error(
        `Block "${firstLevelId}" has ${newBlocks.length} descendants, which exceeds the Feishu API limit of ${BATCH_SIZE} blocks per request. Please split the content into smaller sections.`,
      );
    if (currentBatch.blocks.length + newBlocks.length > 1e3 && currentBatch.blocks.length > 0) {
      batches.push(currentBatch);
      currentBatch = {
        firstLevelIds: [],
        blocks: [],
      };
    }
    currentBatch.firstLevelIds.push(firstLevelId);
    for (const block of newBlocks) {
      currentBatch.blocks.push(block);
      usedBlockIds.add(block.block_id);
    }
  }
  if (currentBatch.blocks.length > 0) batches.push(currentBatch);
  let currentIndex = startIndex;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    logger?.info?.(
      `feishu_doc: Inserting batch ${i + 1}/${batches.length} (${batch.blocks.length} blocks)...`,
    );
    const children = await insertBatch(
      client,
      docToken,
      batch.blocks,
      batch.firstLevelIds,
      parentBlockId,
      currentIndex,
    );
    allChildren.push(...children);
    if (currentIndex !== -1) currentIndex += batch.firstLevelIds.length;
  }
  return {
    children: allChildren,
    skipped: [],
  };
}
//#endregion
//#region extensions/feishu/src/docx-color-text.ts
const TEXT_COLOR = {
  red: 1,
  orange: 2,
  yellow: 3,
  green: 4,
  blue: 5,
  purple: 6,
  grey: 7,
  gray: 7,
};
const BACKGROUND_COLOR = {
  red: 1,
  orange: 2,
  yellow: 3,
  green: 4,
  blue: 5,
  purple: 6,
  grey: 7,
  gray: 7,
};
/**
 * Parse color markup into segments.
 *
 * Supports:
 *   [red]text[/red]               → red text
 *   [bg:yellow]text[/bg]          → yellow background
 *   [bold]text[/bold]             → bold
 *   [green bold]text[/green]      → green + bold
 */
function parseColorMarkup(content) {
  const segments = [];
  const KNOWN = "(?:bg:[a-z]+|bold|red|orange|yellow|green|blue|purple|gr[ae]y)";
  const tagPattern = new RegExp(
    `\\[(${KNOWN}(?:\\s+${KNOWN})*)\\](.*?)\\[\\/(?:[^\\]]+)\\]|([^[]+|\\[)`,
    "gis",
  );
  let match;
  while ((match = tagPattern.exec(content)) !== null)
    if (match[3] !== void 0) {
      if (match[3]) segments.push({ text: match[3] });
    } else {
      const tagStr = match[1].toLowerCase().trim();
      const text = match[2];
      const tags = tagStr.split(/\s+/);
      const segment = { text };
      for (const tag of tags)
        if (tag.startsWith("bg:")) {
          const color = tag.slice(3);
          if (BACKGROUND_COLOR[color]) segment.bgColor = BACKGROUND_COLOR[color];
        } else if (tag === "bold") segment.bold = true;
        else if (TEXT_COLOR[tag]) segment.textColor = TEXT_COLOR[tag];
      if (text) segments.push(segment);
    }
  return segments;
}
/**
 * Update a text block with colored segments.
 */
async function updateColorText(client, docToken, blockId, content) {
  const segments = parseColorMarkup(content);
  const elements = segments.map((seg) => ({
    text_run: {
      content: seg.text,
      text_element_style: {
        ...(seg.textColor && { text_color: seg.textColor }),
        ...(seg.bgColor && { background_color: seg.bgColor }),
        ...(seg.bold && { bold: true }),
      },
    },
  }));
  const res = await client.docx.documentBlock.patch({
    path: {
      document_id: docToken,
      block_id: blockId,
    },
    data: { update_text_elements: { elements } },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    segments: segments.length,
    block: res.data?.block,
  };
}
//#endregion
//#region extensions/feishu/src/docx.ts
function json(data) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    details: data,
  };
}
/** Extract image URLs from markdown content */
function extractImageUrls(markdown) {
  const regex = /!\[[^\]]*\]\(([^)]+)\)/g;
  const urls = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const url = match[1].trim();
    if (url.startsWith("http://") || url.startsWith("https://")) urls.push(url);
  }
  return urls;
}
const BLOCK_TYPE_NAMES = {
  1: "Page",
  2: "Text",
  3: "Heading1",
  4: "Heading2",
  5: "Heading3",
  12: "Bullet",
  13: "Ordered",
  14: "Code",
  15: "Quote",
  17: "Todo",
  18: "Bitable",
  21: "Diagram",
  22: "Divider",
  23: "File",
  27: "Image",
  30: "Sheet",
  31: "Table",
  32: "TableCell",
};
const UNSUPPORTED_CREATE_TYPES = new Set([31, 32]);
/** Clean blocks for insertion (remove unsupported types and read-only fields) */
function cleanBlocksForInsert(blocks) {
  const skipped = [];
  return {
    cleaned: blocks
      .filter((block) => {
        if (UNSUPPORTED_CREATE_TYPES.has(block.block_type)) {
          const typeName = BLOCK_TYPE_NAMES[block.block_type] || `type_${block.block_type}`;
          skipped.push(typeName);
          return false;
        }
        return true;
      })
      .map((block) => {
        if (block.block_type === 31 && block.table?.merge_info) {
          const { merge_info: _merge_info, ...tableRest } = block.table;
          return {
            ...block,
            table: tableRest,
          };
        }
        return block;
      }),
    skipped,
  };
}
const MAX_CONVERT_RETRY_DEPTH = 8;
async function convertMarkdown(client, markdown) {
  const res = await client.docx.document.convert({
    data: {
      content_type: "markdown",
      content: markdown,
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    blocks: res.data?.blocks ?? [],
    firstLevelBlockIds: res.data?.first_level_block_ids ?? [],
  };
}
function normalizeChildIds(children) {
  if (Array.isArray(children)) return children.filter((child) => typeof child === "string");
  if (typeof children === "string") return [children];
  return [];
}
function normalizeConvertedBlockTree(blocks, firstLevelIds) {
  if (blocks.length <= 1)
    return {
      orderedBlocks: blocks,
      rootIds:
        blocks.length === 1 && typeof blocks[0]?.block_id === "string" ? [blocks[0].block_id] : [],
    };
  const byId = /* @__PURE__ */ new Map();
  const originalOrder = /* @__PURE__ */ new Map();
  for (const [index, block] of blocks.entries())
    if (typeof block?.block_id === "string") {
      byId.set(block.block_id, block);
      originalOrder.set(block.block_id, index);
    }
  const childIds = /* @__PURE__ */ new Set();
  for (const block of blocks)
    for (const childId of normalizeChildIds(block?.children)) childIds.add(childId);
  const inferredTopLevelIds = blocks
    .filter((block) => {
      const blockId = block?.block_id;
      if (typeof blockId !== "string") return false;
      const parentId = typeof block?.parent_id === "string" ? block.parent_id : "";
      return !childIds.has(blockId) && (!parentId || !byId.has(parentId));
    })
    .sort((a, b) => (originalOrder.get(a.block_id) ?? 0) - (originalOrder.get(b.block_id) ?? 0))
    .map((block) => block.block_id);
  const rootIds = (
    firstLevelIds && firstLevelIds.length > 0 ? firstLevelIds : inferredTopLevelIds
  ).filter((id, index, arr) => typeof id === "string" && byId.has(id) && arr.indexOf(id) === index);
  const orderedBlocks = [];
  const visited = /* @__PURE__ */ new Set();
  const visit = (blockId) => {
    if (!byId.has(blockId) || visited.has(blockId)) return;
    visited.add(blockId);
    const block = byId.get(blockId);
    orderedBlocks.push(block);
    for (const childId of normalizeChildIds(block?.children)) visit(childId);
  };
  for (const rootId of rootIds) visit(rootId);
  for (const block of blocks)
    if (typeof block?.block_id === "string") visit(block.block_id);
    else orderedBlocks.push(block);
  return {
    orderedBlocks,
    rootIds,
  };
}
async function insertBlocks(client, docToken, blocks, parentBlockId, index) {
  const { cleaned, skipped } = cleanBlocksForInsert(blocks);
  const blockId = parentBlockId ?? docToken;
  if (cleaned.length === 0)
    return {
      children: [],
      skipped,
    };
  const allInserted = [];
  for (const [offset, block] of cleaned.entries()) {
    const res = await client.docx.documentBlockChildren.create({
      path: {
        document_id: docToken,
        block_id: blockId,
      },
      data: {
        children: [block],
        ...(index !== void 0 ? { index: index + offset } : {}),
      },
    });
    if (res.code !== 0) throw new Error(res.msg);
    allInserted.push(...(res.data?.children ?? []));
  }
  return {
    children: allInserted,
    skipped,
  };
}
/** Split markdown into chunks at top-level headings (# or ##) to stay within API content limits */
function splitMarkdownByHeadings(markdown) {
  const lines = markdown.split("\n");
  const chunks = [];
  let current = [];
  let inFencedBlock = false;
  for (const line of lines) {
    if (/^(`{3,}|~{3,})/.test(line)) inFencedBlock = !inFencedBlock;
    if (!inFencedBlock && /^#{1,2}\s/.test(line) && current.length > 0) {
      chunks.push(current.join("\n"));
      current = [];
    }
    current.push(line);
  }
  if (current.length > 0) chunks.push(current.join("\n"));
  return chunks;
}
/** Split markdown by size, preferring to break outside fenced code blocks when possible */
function splitMarkdownBySize(markdown, maxChars) {
  if (markdown.length <= maxChars) return [markdown];
  const lines = markdown.split("\n");
  const chunks = [];
  let current = [];
  let currentLength = 0;
  let inFencedBlock = false;
  for (const line of lines) {
    if (/^(`{3,}|~{3,})/.test(line)) inFencedBlock = !inFencedBlock;
    const lineLength = line.length + 1;
    const wouldExceed = currentLength + lineLength > maxChars;
    if (current.length > 0 && wouldExceed && !inFencedBlock) {
      chunks.push(current.join("\n"));
      current = [];
      currentLength = 0;
    }
    current.push(line);
    currentLength += lineLength;
  }
  if (current.length > 0) chunks.push(current.join("\n"));
  if (chunks.length > 1) return chunks;
  const midpoint = Math.floor(lines.length / 2);
  if (midpoint <= 0 || midpoint >= lines.length) return [markdown];
  return [lines.slice(0, midpoint).join("\n"), lines.slice(midpoint).join("\n")];
}
async function convertMarkdownWithFallback(client, markdown, depth = 0) {
  try {
    return await convertMarkdown(client, markdown);
  } catch (error) {
    if (depth >= MAX_CONVERT_RETRY_DEPTH || markdown.length < 2) throw error;
    const chunks = splitMarkdownBySize(markdown, Math.max(256, Math.floor(markdown.length / 2)));
    if (chunks.length <= 1) throw error;
    const blocks = [];
    const firstLevelBlockIds = [];
    for (const chunk of chunks) {
      const converted = await convertMarkdownWithFallback(client, chunk, depth + 1);
      blocks.push(...converted.blocks);
      firstLevelBlockIds.push(...converted.firstLevelBlockIds);
    }
    return {
      blocks,
      firstLevelBlockIds,
    };
  }
}
/** Convert markdown in chunks to avoid document.convert content size limits */
async function chunkedConvertMarkdown(client, markdown) {
  const chunks = splitMarkdownByHeadings(markdown);
  const allBlocks = [];
  const allRootIds = [];
  for (const chunk of chunks) {
    const { blocks, firstLevelBlockIds } = await convertMarkdownWithFallback(client, chunk);
    const { orderedBlocks, rootIds } = normalizeConvertedBlockTree(blocks, firstLevelBlockIds);
    allBlocks.push(...orderedBlocks);
    allRootIds.push(...rootIds);
  }
  return {
    blocks: allBlocks,
    firstLevelBlockIds: allRootIds,
  };
}
/**
 * Insert blocks using the Descendant API (supports tables, nested lists, large docs).
 * Unlike the Children API, this supports block_type 31/32 (Table/TableCell).
 *
 * @param parentBlockId - Parent block to insert into (defaults to docToken = document root)
 * @param index - Position within parent's children (-1 = end, 0 = first)
 */
async function insertBlocksWithDescendant(
  client,
  docToken,
  blocks,
  firstLevelBlockIds,
  { parentBlockId = docToken, index = -1 } = {},
) {
  const descendants = cleanBlocksForDescendant(blocks);
  if (descendants.length === 0) return { children: [] };
  const res = await client.docx.documentBlockDescendant.create({
    path: {
      document_id: docToken,
      block_id: parentBlockId,
    },
    data: {
      children_id: firstLevelBlockIds,
      descendants,
      index,
    },
  });
  if (res.code !== 0) throw new Error(`${res.msg} (code: ${res.code})`);
  return { children: res.data?.children ?? [] };
}
async function clearDocumentContent(client, docToken) {
  const existing = await client.docx.documentBlock.list({ path: { document_id: docToken } });
  if (existing.code !== 0) throw new Error(existing.msg);
  const childIds =
    existing.data?.items
      ?.filter((b) => b.parent_id === docToken && b.block_type !== 1)
      .map((b) => b.block_id) ?? [];
  if (childIds.length > 0) {
    const res = await client.docx.documentBlockChildren.batchDelete({
      path: {
        document_id: docToken,
        block_id: docToken,
      },
      data: {
        start_index: 0,
        end_index: childIds.length,
      },
    });
    if (res.code !== 0) throw new Error(res.msg);
  }
  return childIds.length;
}
async function uploadImageToDocx(client, blockId, imageBuffer, fileName, docToken) {
  const fileToken = (
    await client.drive.media.uploadAll({
      data: {
        file_name: fileName,
        parent_type: "docx_image",
        parent_node: blockId,
        size: imageBuffer.length,
        file: imageBuffer,
        ...(docToken ? { extra: JSON.stringify({ drive_route_token: docToken }) } : {}),
      },
    })
  )?.file_token;
  if (!fileToken) throw new Error("Image upload failed: no file_token returned");
  return fileToken;
}
async function downloadImage(url, maxBytes) {
  return (
    await getFeishuRuntime().channel.media.fetchRemoteMedia({
      url,
      maxBytes,
    })
  ).buffer;
}
async function resolveUploadInput(url, filePath, maxBytes, explicitFileName, imageInput) {
  const inputSources = [
    url ? "url" : null,
    filePath ? "file_path" : null,
    imageInput ? "image" : null,
  ].filter(Boolean);
  if (inputSources.length > 1)
    throw new Error(`Provide only one image source; got: ${inputSources.join(", ")}`);
  if (imageInput?.startsWith("data:")) {
    const commaIdx = imageInput.indexOf(",");
    if (commaIdx === -1) throw new Error("Invalid data URI: missing comma separator.");
    const header = imageInput.slice(0, commaIdx);
    const data = imageInput.slice(commaIdx + 1);
    if (!header.includes(";base64"))
      throw new Error(
        "Invalid data URI: missing ';base64' marker. Expected format: data:image/png;base64,<base64data>",
      );
    const trimmedData = data.trim();
    if (trimmedData.length === 0 || !/^[A-Za-z0-9+/]+=*$/.test(trimmedData))
      throw new Error(
        `Invalid data URI: base64 payload contains characters outside the standard alphabet.`,
      );
    const ext = header.match(/data:([^;]+)/)?.[1]?.split("/")[1] ?? "png";
    const estimatedBytes = Math.ceil((trimmedData.length * 3) / 4);
    if (estimatedBytes > maxBytes)
      throw new Error(
        `Image data URI exceeds limit: estimated ${estimatedBytes} bytes > ${maxBytes} bytes`,
      );
    return {
      buffer: Buffer.from(trimmedData, "base64"),
      fileName: explicitFileName ?? `image.${ext}`,
    };
  }
  if (imageInput) {
    const candidate = imageInput.startsWith("~") ? imageInput.replace(/^~/, homedir()) : imageInput;
    const unambiguousPath =
      imageInput.startsWith("~") || imageInput.startsWith("./") || imageInput.startsWith("../");
    const absolutePath = isAbsolute(imageInput);
    if (unambiguousPath || (absolutePath && existsSync(candidate))) {
      const buffer = await promises.readFile(candidate);
      if (buffer.length > maxBytes)
        throw new Error(`Local file exceeds limit: ${buffer.length} bytes > ${maxBytes} bytes`);
      return {
        buffer,
        fileName: explicitFileName ?? basename(candidate),
      };
    }
    if (absolutePath && !existsSync(candidate))
      throw new Error(
        `File not found: "${candidate}". If you intended to pass image binary data, use a data URI instead: data:image/jpeg;base64,...`,
      );
  }
  if (imageInput) {
    const trimmed = imageInput.trim();
    if (trimmed.length === 0 || !/^[A-Za-z0-9+/]+=*$/.test(trimmed))
      throw new Error(
        "Invalid base64: image input contains characters outside the standard base64 alphabet. Use a data URI (data:image/png;base64,...) or a local file path instead.",
      );
    const estimatedBytes = Math.ceil((trimmed.length * 3) / 4);
    if (estimatedBytes > maxBytes)
      throw new Error(
        `Base64 image exceeds limit: estimated ${estimatedBytes} bytes > ${maxBytes} bytes`,
      );
    const buffer = Buffer.from(trimmed, "base64");
    if (buffer.length === 0)
      throw new Error("Base64 image decoded to empty buffer; check the input.");
    return {
      buffer,
      fileName: explicitFileName ?? "image.png",
    };
  }
  if (!url && !filePath)
    throw new Error("Either url, file_path, or image (base64/data URI) must be provided");
  if (url && filePath) throw new Error("Provide only one of url or file_path");
  if (url) {
    const fetched = await getFeishuRuntime().channel.media.fetchRemoteMedia({
      url,
      maxBytes,
    });
    const guessed = new URL(url).pathname.split("/").pop() || "upload.bin";
    return {
      buffer: fetched.buffer,
      fileName: explicitFileName || guessed,
    };
  }
  const buffer = await promises.readFile(filePath);
  if (buffer.length > maxBytes)
    throw new Error(`Local file exceeds limit: ${buffer.length} bytes > ${maxBytes} bytes`);
  return {
    buffer,
    fileName: explicitFileName || basename(filePath),
  };
}
async function processImages(client, docToken, markdown, insertedBlocks, maxBytes) {
  const imageUrls = extractImageUrls(markdown);
  if (imageUrls.length === 0) return 0;
  const imageBlocks = insertedBlocks.filter((b) => b.block_type === 27);
  let processed = 0;
  for (let i = 0; i < Math.min(imageUrls.length, imageBlocks.length); i++) {
    const url = imageUrls[i];
    const blockId = imageBlocks[i].block_id;
    try {
      const fileToken = await uploadImageToDocx(
        client,
        blockId,
        await downloadImage(url, maxBytes),
        new URL(url).pathname.split("/").pop() || `image_${i}.png`,
        docToken,
      );
      await client.docx.documentBlock.patch({
        path: {
          document_id: docToken,
          block_id: blockId,
        },
        data: { replace_image: { token: fileToken } },
      });
      processed++;
    } catch (err) {
      console.error(`Failed to process image ${url}:`, err);
    }
  }
  return processed;
}
async function uploadImageBlock(
  client,
  docToken,
  maxBytes,
  url,
  filePath,
  parentBlockId,
  filename,
  index,
  imageInput,
) {
  const insertRes = await client.docx.documentBlockChildren.create({
    path: {
      document_id: docToken,
      block_id: parentBlockId ?? docToken,
    },
    params: { document_revision_id: -1 },
    data: {
      children: [
        {
          block_type: 27,
          image: {},
        },
      ],
      index: index ?? -1,
    },
  });
  if (insertRes.code !== 0) throw new Error(`Failed to create image block: ${insertRes.msg}`);
  const imageBlockId = insertRes.data?.children?.find((b) => b.block_type === 27)?.block_id;
  if (!imageBlockId) throw new Error("Failed to create image block");
  const upload = await resolveUploadInput(url, filePath, maxBytes, filename, imageInput);
  const fileToken = await uploadImageToDocx(
    client,
    imageBlockId,
    upload.buffer,
    upload.fileName,
    docToken,
  );
  const patchRes = await client.docx.documentBlock.patch({
    path: {
      document_id: docToken,
      block_id: imageBlockId,
    },
    data: { replace_image: { token: fileToken } },
  });
  if (patchRes.code !== 0) throw new Error(patchRes.msg);
  return {
    success: true,
    block_id: imageBlockId,
    file_token: fileToken,
    file_name: upload.fileName,
    size: upload.buffer.length,
  };
}
async function uploadFileBlock(client, docToken, maxBytes, url, filePath, parentBlockId, filename) {
  const blockId = parentBlockId ?? docToken;
  const upload = await resolveUploadInput(url, filePath, maxBytes, filename);
  const converted = await convertMarkdown(
    client,
    `[${upload.fileName}](https://example.com/placeholder)`,
  );
  const { orderedBlocks } = normalizeConvertedBlockTree(
    converted.blocks,
    converted.firstLevelBlockIds,
  );
  const { children: inserted } = await insertBlocks(client, docToken, orderedBlocks, blockId);
  const placeholderBlock = inserted[0];
  if (!placeholderBlock?.block_id)
    throw new Error("Failed to create placeholder block for file upload");
  const parentId = placeholderBlock.parent_id ?? blockId;
  const childrenRes = await client.docx.documentBlockChildren.get({
    path: {
      document_id: docToken,
      block_id: parentId,
    },
  });
  if (childrenRes.code !== 0) throw new Error(childrenRes.msg);
  const placeholderIdx = (childrenRes.data?.items ?? []).findIndex(
    (item) => item.block_id === placeholderBlock.block_id,
  );
  if (placeholderIdx >= 0) {
    const deleteRes = await client.docx.documentBlockChildren.batchDelete({
      path: {
        document_id: docToken,
        block_id: parentId,
      },
      data: {
        start_index: placeholderIdx,
        end_index: placeholderIdx + 1,
      },
    });
    if (deleteRes.code !== 0) throw new Error(deleteRes.msg);
  }
  const fileToken = (
    await client.drive.media.uploadAll({
      data: {
        file_name: upload.fileName,
        parent_type: "docx_file",
        parent_node: docToken,
        size: upload.buffer.length,
        file: upload.buffer,
      },
    })
  )?.file_token;
  if (!fileToken) throw new Error("File upload failed: no file_token returned");
  return {
    success: true,
    file_token: fileToken,
    file_name: upload.fileName,
    size: upload.buffer.length,
    note: "File uploaded to drive. Use the file_token to reference it. Direct file block creation is not supported by the Feishu API.",
  };
}
const STRUCTURED_BLOCK_TYPES = new Set([14, 18, 21, 23, 27, 30, 31, 32]);
async function readDoc(client, docToken) {
  const [contentRes, infoRes, blocksRes] = await Promise.all([
    client.docx.document.rawContent({ path: { document_id: docToken } }),
    client.docx.document.get({ path: { document_id: docToken } }),
    client.docx.documentBlock.list({ path: { document_id: docToken } }),
  ]);
  if (contentRes.code !== 0) throw new Error(contentRes.msg);
  const blocks = blocksRes.data?.items ?? [];
  const blockCounts = {};
  const structuredTypes = [];
  for (const b of blocks) {
    const type = b.block_type ?? 0;
    const name = BLOCK_TYPE_NAMES[type] || `type_${type}`;
    blockCounts[name] = (blockCounts[name] || 0) + 1;
    if (STRUCTURED_BLOCK_TYPES.has(type) && !structuredTypes.includes(name))
      structuredTypes.push(name);
  }
  let hint;
  if (structuredTypes.length > 0)
    hint = `This document contains ${structuredTypes.join(", ")} which are NOT included in the plain text above. Use feishu_doc with action: "list_blocks" to get full content.`;
  return {
    title: infoRes.data?.document?.title,
    content: contentRes.data?.content,
    revision_id: infoRes.data?.document?.revision_id,
    block_count: blocks.length,
    block_types: blockCounts,
    ...(hint && { hint }),
  };
}
async function createDoc(client, title, folderToken, options) {
  const res = await client.docx.document.create({
    data: {
      title,
      folder_token: folderToken,
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  const doc = res.data?.document;
  const docToken = doc?.document_id;
  if (!docToken) throw new Error("Document creation succeeded but no document_id was returned");
  const shouldGrantToRequester = options?.grantToRequester !== false;
  const requesterOpenId = options?.requesterOpenId?.trim();
  const requesterPermType = "edit";
  let requesterPermissionAdded = false;
  let requesterPermissionSkippedReason;
  let requesterPermissionError;
  if (shouldGrantToRequester)
    if (!requesterOpenId)
      requesterPermissionSkippedReason = "trusted requester identity unavailable";
    else
      try {
        await client.drive.permissionMember.create({
          path: { token: docToken },
          params: {
            type: "docx",
            need_notification: false,
          },
          data: {
            member_type: "openid",
            member_id: requesterOpenId,
            perm: requesterPermType,
          },
        });
        requesterPermissionAdded = true;
      } catch (err) {
        requesterPermissionError = err instanceof Error ? err.message : String(err);
      }
  return {
    document_id: docToken,
    title: doc?.title,
    url: `https://feishu.cn/docx/${docToken}`,
    ...(shouldGrantToRequester && {
      requester_permission_added: requesterPermissionAdded,
      ...(requesterOpenId && { requester_open_id: requesterOpenId }),
      requester_perm_type: requesterPermType,
      ...(requesterPermissionSkippedReason && {
        requester_permission_skipped_reason: requesterPermissionSkippedReason,
      }),
      ...(requesterPermissionError && { requester_permission_error: requesterPermissionError }),
    }),
  };
}
async function writeDoc(client, docToken, markdown, maxBytes, logger) {
  const deleted = await clearDocumentContent(client, docToken);
  logger?.info?.("feishu_doc: Converting markdown...");
  const { blocks, firstLevelBlockIds } = await chunkedConvertMarkdown(client, markdown);
  if (blocks.length === 0)
    return {
      success: true,
      blocks_deleted: deleted,
      blocks_added: 0,
      images_processed: 0,
    };
  logger?.info?.(`feishu_doc: Converted to ${blocks.length} blocks, inserting...`);
  const { orderedBlocks, rootIds } = normalizeConvertedBlockTree(blocks, firstLevelBlockIds);
  const { children: inserted } =
    blocks.length > 1e3
      ? await insertBlocksInBatches(client, docToken, orderedBlocks, rootIds, logger)
      : await insertBlocksWithDescendant(client, docToken, orderedBlocks, rootIds);
  const imagesProcessed = await processImages(client, docToken, markdown, inserted, maxBytes);
  logger?.info?.(`feishu_doc: Done (${blocks.length} blocks, ${imagesProcessed} images)`);
  return {
    success: true,
    blocks_deleted: deleted,
    blocks_added: blocks.length,
    images_processed: imagesProcessed,
  };
}
async function appendDoc(client, docToken, markdown, maxBytes, logger) {
  logger?.info?.("feishu_doc: Converting markdown...");
  const { blocks, firstLevelBlockIds } = await chunkedConvertMarkdown(client, markdown);
  if (blocks.length === 0) throw new Error("Content is empty");
  logger?.info?.(`feishu_doc: Converted to ${blocks.length} blocks, inserting...`);
  const { orderedBlocks, rootIds } = normalizeConvertedBlockTree(blocks, firstLevelBlockIds);
  const { children: inserted } =
    blocks.length > 1e3
      ? await insertBlocksInBatches(client, docToken, orderedBlocks, rootIds, logger)
      : await insertBlocksWithDescendant(client, docToken, orderedBlocks, rootIds);
  const imagesProcessed = await processImages(client, docToken, markdown, inserted, maxBytes);
  logger?.info?.(`feishu_doc: Done (${blocks.length} blocks, ${imagesProcessed} images)`);
  return {
    success: true,
    blocks_added: blocks.length,
    images_processed: imagesProcessed,
    block_ids: inserted.map((b) => b.block_id),
  };
}
async function insertDoc(client, docToken, markdown, afterBlockId, maxBytes, logger) {
  const blockInfo = await client.docx.documentBlock.get({
    path: {
      document_id: docToken,
      block_id: afterBlockId,
    },
  });
  if (blockInfo.code !== 0) throw new Error(blockInfo.msg);
  const parentId = blockInfo.data?.block?.parent_id ?? docToken;
  const items = [];
  let pageToken;
  do {
    const childrenRes = await client.docx.documentBlockChildren.get({
      path: {
        document_id: docToken,
        block_id: parentId,
      },
      params: pageToken ? { page_token: pageToken } : {},
    });
    if (childrenRes.code !== 0) throw new Error(childrenRes.msg);
    items.push(...(childrenRes.data?.items ?? []));
    pageToken = childrenRes.data?.page_token ?? void 0;
  } while (pageToken);
  const blockIndex = items.findIndex((item) => item.block_id === afterBlockId);
  if (blockIndex === -1)
    throw new Error(
      `after_block_id "${afterBlockId}" was not found among the children of parent block "${parentId}". Use list_blocks to verify the block ID.`,
    );
  const insertIndex = blockIndex + 1;
  logger?.info?.("feishu_doc: Converting markdown...");
  const { blocks, firstLevelBlockIds } = await chunkedConvertMarkdown(client, markdown);
  if (blocks.length === 0) throw new Error("Content is empty");
  const { orderedBlocks, rootIds } = normalizeConvertedBlockTree(blocks, firstLevelBlockIds);
  logger?.info?.(
    `feishu_doc: Converted to ${blocks.length} blocks, inserting at index ${insertIndex}...`,
  );
  const { children: inserted } =
    blocks.length > 1e3
      ? await insertBlocksInBatches(
          client,
          docToken,
          orderedBlocks,
          rootIds,
          logger,
          parentId,
          insertIndex,
        )
      : await insertBlocksWithDescendant(client, docToken, orderedBlocks, rootIds, {
          parentBlockId: parentId,
          index: insertIndex,
        });
  const imagesProcessed = await processImages(client, docToken, markdown, inserted, maxBytes);
  logger?.info?.(`feishu_doc: Done (${blocks.length} blocks, ${imagesProcessed} images)`);
  return {
    success: true,
    blocks_added: blocks.length,
    images_processed: imagesProcessed,
    block_ids: inserted.map((b) => b.block_id),
  };
}
async function createTable(client, docToken, rowSize, columnSize, parentBlockId, columnWidth) {
  if (columnWidth && columnWidth.length !== columnSize)
    throw new Error("column_width length must equal column_size");
  const blockId = parentBlockId ?? docToken;
  const res = await client.docx.documentBlockChildren.create({
    path: {
      document_id: docToken,
      block_id: blockId,
    },
    data: {
      children: [
        {
          block_type: 31,
          table: {
            property: {
              row_size: rowSize,
              column_size: columnSize,
              ...(columnWidth && columnWidth.length > 0 ? { column_width: columnWidth } : {}),
            },
          },
        },
      ],
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  const tableBlock = res.data?.children?.find((b) => b.block_type === 31);
  const cells = tableBlock?.children ?? [];
  return {
    success: true,
    table_block_id: tableBlock?.block_id,
    row_size: rowSize,
    column_size: columnSize,
    table_cell_block_ids: cells.map((c) => c.block_id).filter(Boolean),
    raw_children_count: res.data?.children?.length ?? 0,
  };
}
async function writeTableCells(client, docToken, tableBlockId, values) {
  if (!values.length || !values[0]?.length) throw new Error("values must be a non-empty 2D array");
  const tableRes = await client.docx.documentBlock.get({
    path: {
      document_id: docToken,
      block_id: tableBlockId,
    },
  });
  if (tableRes.code !== 0) throw new Error(tableRes.msg);
  const tableBlock = tableRes.data?.block;
  if (tableBlock?.block_type !== 31) throw new Error("table_block_id is not a table block");
  const tableData = tableBlock.table;
  const rows = tableData?.property?.row_size;
  const cols = tableData?.property?.column_size;
  const cellIds = tableData?.cells ?? [];
  if (!rows || !cols || !cellIds.length)
    throw new Error(
      "Table cell IDs unavailable from table block. Use list_blocks/get_block and pass explicit cell block IDs if needed.",
    );
  const writeRows = Math.min(values.length, rows);
  let written = 0;
  for (let r = 0; r < writeRows; r++) {
    const rowValues = values[r] ?? [];
    const writeCols = Math.min(rowValues.length, cols);
    for (let c = 0; c < writeCols; c++) {
      const cellId = cellIds[r * cols + c];
      if (!cellId) continue;
      const childrenRes = await client.docx.documentBlockChildren.get({
        path: {
          document_id: docToken,
          block_id: cellId,
        },
      });
      if (childrenRes.code !== 0) throw new Error(childrenRes.msg);
      const existingChildren = childrenRes.data?.items ?? [];
      if (existingChildren.length > 0) {
        const delRes = await client.docx.documentBlockChildren.batchDelete({
          path: {
            document_id: docToken,
            block_id: cellId,
          },
          data: {
            start_index: 0,
            end_index: existingChildren.length,
          },
        });
        if (delRes.code !== 0) throw new Error(delRes.msg);
      }
      const converted = await convertMarkdown(client, rowValues[c] ?? "");
      const { orderedBlocks } = normalizeConvertedBlockTree(
        converted.blocks,
        converted.firstLevelBlockIds,
      );
      if (orderedBlocks.length > 0) await insertBlocks(client, docToken, orderedBlocks, cellId);
      written++;
    }
  }
  return {
    success: true,
    table_block_id: tableBlockId,
    cells_written: written,
    table_size: {
      rows,
      cols,
    },
  };
}
async function createTableWithValues(
  client,
  docToken,
  rowSize,
  columnSize,
  values,
  parentBlockId,
  columnWidth,
) {
  const tableBlockId = (
    await createTable(client, docToken, rowSize, columnSize, parentBlockId, columnWidth)
  ).table_block_id;
  if (!tableBlockId) throw new Error("create_table succeeded but table_block_id is missing");
  return {
    success: true,
    table_block_id: tableBlockId,
    row_size: rowSize,
    column_size: columnSize,
    cells_written: (await writeTableCells(client, docToken, tableBlockId, values)).cells_written,
  };
}
async function updateBlock(client, docToken, blockId, content) {
  const blockInfo = await client.docx.documentBlock.get({
    path: {
      document_id: docToken,
      block_id: blockId,
    },
  });
  if (blockInfo.code !== 0) throw new Error(blockInfo.msg);
  const res = await client.docx.documentBlock.patch({
    path: {
      document_id: docToken,
      block_id: blockId,
    },
    data: { update_text_elements: { elements: [{ text_run: { content } }] } },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    block_id: blockId,
  };
}
async function deleteBlock(client, docToken, blockId) {
  const blockInfo = await client.docx.documentBlock.get({
    path: {
      document_id: docToken,
      block_id: blockId,
    },
  });
  if (blockInfo.code !== 0) throw new Error(blockInfo.msg);
  const parentId = blockInfo.data?.block?.parent_id ?? docToken;
  const children = await client.docx.documentBlockChildren.get({
    path: {
      document_id: docToken,
      block_id: parentId,
    },
  });
  if (children.code !== 0) throw new Error(children.msg);
  const index = (children.data?.items ?? []).findIndex((item) => item.block_id === blockId);
  if (index === -1) throw new Error("Block not found");
  const res = await client.docx.documentBlockChildren.batchDelete({
    path: {
      document_id: docToken,
      block_id: parentId,
    },
    data: {
      start_index: index,
      end_index: index + 1,
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    deleted_block_id: blockId,
  };
}
async function listBlocks(client, docToken) {
  const res = await client.docx.documentBlock.list({ path: { document_id: docToken } });
  if (res.code !== 0) throw new Error(res.msg);
  return { blocks: res.data?.items ?? [] };
}
async function getBlock(client, docToken, blockId) {
  const res = await client.docx.documentBlock.get({
    path: {
      document_id: docToken,
      block_id: blockId,
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return { block: res.data?.block };
}
async function listAppScopes(client) {
  const res = await client.application.scope.list({});
  if (res.code !== 0) throw new Error(res.msg);
  const scopes = res.data?.scopes ?? [];
  const granted = scopes.filter((s) => s.grant_status === 1);
  const pending = scopes.filter((s) => s.grant_status !== 1);
  return {
    granted: granted.map((s) => ({
      name: s.scope_name,
      type: s.scope_type,
    })),
    pending: pending.map((s) => ({
      name: s.scope_name,
      type: s.scope_type,
    })),
    summary: `${granted.length} granted, ${pending.length} pending`,
  };
}
function registerFeishuDocTools(api) {
  if (!api.config) {
    api.logger.debug?.("feishu_doc: No config available, skipping doc tools");
    return;
  }
  const accounts = listEnabledFeishuAccounts(api.config);
  if (accounts.length === 0) {
    api.logger.debug?.("feishu_doc: No Feishu accounts configured, skipping doc tools");
    return;
  }
  const toolsCfg = resolveAnyEnabledFeishuToolsConfig(accounts);
  const registered = [];
  const getClient = (params, defaultAccountId) =>
    createFeishuToolClient({
      api,
      executeParams: params,
      defaultAccountId,
    });
  const getMediaMaxBytes = (params, defaultAccountId) =>
    (resolveFeishuToolAccount({
      api,
      executeParams: params,
      defaultAccountId,
    }).config?.mediaMaxMb ?? 30) *
    1024 *
    1024;
  if (toolsCfg.doc) {
    api.registerTool(
      (ctx) => {
        const defaultAccountId = ctx.agentAccountId;
        const trustedRequesterOpenId =
          ctx.messageChannel === "feishu" ? ctx.requesterSenderId?.trim() || void 0 : void 0;
        return {
          name: "feishu_doc",
          label: "Feishu Doc",
          description:
            "Feishu document operations. Actions: read, write, append, insert, create, list_blocks, get_block, update_block, delete_block, create_table, write_table_cells, create_table_with_values, insert_table_row, insert_table_column, delete_table_rows, delete_table_columns, merge_table_cells, upload_image, upload_file, color_text",
          parameters: FeishuDocSchema,
          async execute(_toolCallId, params) {
            const p = params;
            try {
              const client = getClient(p, defaultAccountId);
              switch (p.action) {
                case "read":
                  return json(await readDoc(client, p.doc_token));
                case "write":
                  return json(
                    await writeDoc(
                      client,
                      p.doc_token,
                      p.content,
                      getMediaMaxBytes(p, defaultAccountId),
                      api.logger,
                    ),
                  );
                case "append":
                  return json(
                    await appendDoc(
                      client,
                      p.doc_token,
                      p.content,
                      getMediaMaxBytes(p, defaultAccountId),
                      api.logger,
                    ),
                  );
                case "insert":
                  return json(
                    await insertDoc(
                      client,
                      p.doc_token,
                      p.content,
                      p.after_block_id,
                      getMediaMaxBytes(p, defaultAccountId),
                      api.logger,
                    ),
                  );
                case "create":
                  return json(
                    await createDoc(client, p.title, p.folder_token, {
                      grantToRequester: p.grant_to_requester,
                      requesterOpenId: trustedRequesterOpenId,
                    }),
                  );
                case "list_blocks":
                  return json(await listBlocks(client, p.doc_token));
                case "get_block":
                  return json(await getBlock(client, p.doc_token, p.block_id));
                case "update_block":
                  return json(await updateBlock(client, p.doc_token, p.block_id, p.content));
                case "delete_block":
                  return json(await deleteBlock(client, p.doc_token, p.block_id));
                case "create_table":
                  return json(
                    await createTable(
                      client,
                      p.doc_token,
                      p.row_size,
                      p.column_size,
                      p.parent_block_id,
                      p.column_width,
                    ),
                  );
                case "write_table_cells":
                  return json(
                    await writeTableCells(client, p.doc_token, p.table_block_id, p.values),
                  );
                case "create_table_with_values":
                  return json(
                    await createTableWithValues(
                      client,
                      p.doc_token,
                      p.row_size,
                      p.column_size,
                      p.values,
                      p.parent_block_id,
                      p.column_width,
                    ),
                  );
                case "upload_image":
                  return json(
                    await uploadImageBlock(
                      client,
                      p.doc_token,
                      getMediaMaxBytes(p, defaultAccountId),
                      p.url,
                      p.file_path,
                      p.parent_block_id,
                      p.filename,
                      p.index,
                      p.image,
                    ),
                  );
                case "upload_file":
                  return json(
                    await uploadFileBlock(
                      client,
                      p.doc_token,
                      getMediaMaxBytes(p, defaultAccountId),
                      p.url,
                      p.file_path,
                      p.parent_block_id,
                      p.filename,
                    ),
                  );
                case "color_text":
                  return json(await updateColorText(client, p.doc_token, p.block_id, p.content));
                case "insert_table_row":
                  return json(await insertTableRow(client, p.doc_token, p.block_id, p.row_index));
                case "insert_table_column":
                  return json(
                    await insertTableColumn(client, p.doc_token, p.block_id, p.column_index),
                  );
                case "delete_table_rows":
                  return json(
                    await deleteTableRows(
                      client,
                      p.doc_token,
                      p.block_id,
                      p.row_start,
                      p.row_count,
                    ),
                  );
                case "delete_table_columns":
                  return json(
                    await deleteTableColumns(
                      client,
                      p.doc_token,
                      p.block_id,
                      p.column_start,
                      p.column_count,
                    ),
                  );
                case "merge_table_cells":
                  return json(
                    await mergeTableCells(
                      client,
                      p.doc_token,
                      p.block_id,
                      p.row_start,
                      p.row_end,
                      p.column_start,
                      p.column_end,
                    ),
                  );
                default:
                  return json({ error: `Unknown action: ${p.action}` });
              }
            } catch (err) {
              return json({ error: err instanceof Error ? err.message : String(err) });
            }
          },
        };
      },
      { name: "feishu_doc" },
    );
    registered.push("feishu_doc");
  }
  if (toolsCfg.scopes) {
    api.registerTool(
      (ctx) => ({
        name: "feishu_app_scopes",
        label: "Feishu App Scopes",
        description:
          "List current app permissions (scopes). Use to debug permission issues or check available capabilities.",
        parameters: Type.Object({}),
        async execute() {
          try {
            return json(await listAppScopes(getClient(void 0, ctx.agentAccountId)));
          } catch (err) {
            return json({ error: err instanceof Error ? err.message : String(err) });
          }
        },
      }),
      { name: "feishu_app_scopes" },
    );
    registered.push("feishu_app_scopes");
  }
  if (registered.length > 0) api.logger.info?.(`feishu_doc: Registered ${registered.join(", ")}`);
}
//#endregion
//#region extensions/feishu/src/drive-schema.ts
const FileType = Type.Union([
  Type.Literal("doc"),
  Type.Literal("docx"),
  Type.Literal("sheet"),
  Type.Literal("bitable"),
  Type.Literal("folder"),
  Type.Literal("file"),
  Type.Literal("mindnote"),
  Type.Literal("shortcut"),
]);
const FeishuDriveSchema = Type.Union([
  Type.Object({
    action: Type.Literal("list"),
    folder_token: Type.Optional(
      Type.String({ description: "Folder token (optional, omit for root directory)" }),
    ),
  }),
  Type.Object({
    action: Type.Literal("info"),
    file_token: Type.String({ description: "File or folder token" }),
    type: FileType,
  }),
  Type.Object({
    action: Type.Literal("create_folder"),
    name: Type.String({ description: "Folder name" }),
    folder_token: Type.Optional(
      Type.String({ description: "Parent folder token (optional, omit for root)" }),
    ),
  }),
  Type.Object({
    action: Type.Literal("move"),
    file_token: Type.String({ description: "File token to move" }),
    type: FileType,
    folder_token: Type.String({ description: "Target folder token" }),
  }),
  Type.Object({
    action: Type.Literal("delete"),
    file_token: Type.String({ description: "File token to delete" }),
    type: FileType,
  }),
]);
//#endregion
//#region extensions/feishu/src/tool-result.ts
function jsonToolResult(data) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    details: data,
  };
}
function unknownToolActionResult(action) {
  return jsonToolResult({ error: `Unknown action: ${String(action)}` });
}
function toolExecutionErrorResult(error) {
  return jsonToolResult({ error: error instanceof Error ? error.message : String(error) });
}
//#endregion
//#region extensions/feishu/src/drive.ts
async function getRootFolderToken(client) {
  const domain = client.domain ?? "https://open.feishu.cn";
  const res = await client.httpInstance.get(
    `${domain}/open-apis/drive/explorer/v2/root_folder/meta`,
  );
  if (res.code !== 0) throw new Error(res.msg ?? "Failed to get root folder");
  const token = res.data?.token;
  if (!token) throw new Error("Root folder token not found");
  return token;
}
async function listFolder(client, folderToken) {
  const validFolderToken = folderToken && folderToken !== "0" ? folderToken : void 0;
  const res = await client.drive.file.list({
    params: validFolderToken ? { folder_token: validFolderToken } : {},
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    files:
      res.data?.files?.map((f) => ({
        token: f.token,
        name: f.name,
        type: f.type,
        url: f.url,
        created_time: f.created_time,
        modified_time: f.modified_time,
        owner_id: f.owner_id,
      })) ?? [],
    next_page_token: res.data?.next_page_token,
  };
}
async function getFileInfo(client, fileToken, folderToken) {
  const res = await client.drive.file.list({
    params: folderToken ? { folder_token: folderToken } : {},
  });
  if (res.code !== 0) throw new Error(res.msg);
  const file = res.data?.files?.find((f) => f.token === fileToken);
  if (!file) throw new Error(`File not found: ${fileToken}`);
  return {
    token: file.token,
    name: file.name,
    type: file.type,
    url: file.url,
    created_time: file.created_time,
    modified_time: file.modified_time,
    owner_id: file.owner_id,
  };
}
async function createFolder(client, name, folderToken) {
  let effectiveToken = folderToken && folderToken !== "0" ? folderToken : "0";
  if (effectiveToken === "0")
    try {
      effectiveToken = await getRootFolderToken(client);
    } catch {}
  const res = await client.drive.file.createFolder({
    data: {
      name,
      folder_token: effectiveToken,
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    token: res.data?.token,
    url: res.data?.url,
  };
}
async function moveFile(client, fileToken, type, folderToken) {
  const res = await client.drive.file.move({
    path: { file_token: fileToken },
    data: {
      type,
      folder_token: folderToken,
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    task_id: res.data?.task_id,
  };
}
async function deleteFile(client, fileToken, type) {
  const res = await client.drive.file.delete({
    path: { file_token: fileToken },
    params: { type },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    task_id: res.data?.task_id,
  };
}
function registerFeishuDriveTools(api) {
  if (!api.config) {
    api.logger.debug?.("feishu_drive: No config available, skipping drive tools");
    return;
  }
  const accounts = listEnabledFeishuAccounts(api.config);
  if (accounts.length === 0) {
    api.logger.debug?.("feishu_drive: No Feishu accounts configured, skipping drive tools");
    return;
  }
  if (!resolveAnyEnabledFeishuToolsConfig(accounts).drive) {
    api.logger.debug?.("feishu_drive: drive tool disabled in config");
    return;
  }
  api.registerTool(
    (ctx) => {
      const defaultAccountId = ctx.agentAccountId;
      return {
        name: "feishu_drive",
        label: "Feishu Drive",
        description:
          "Feishu cloud storage operations. Actions: list, info, create_folder, move, delete",
        parameters: FeishuDriveSchema,
        async execute(_toolCallId, params) {
          const p = params;
          try {
            const client = createFeishuToolClient({
              api,
              executeParams: p,
              defaultAccountId,
            });
            switch (p.action) {
              case "list":
                return jsonToolResult(await listFolder(client, p.folder_token));
              case "info":
                return jsonToolResult(await getFileInfo(client, p.file_token));
              case "create_folder":
                return jsonToolResult(await createFolder(client, p.name, p.folder_token));
              case "move":
                return jsonToolResult(await moveFile(client, p.file_token, p.type, p.folder_token));
              case "delete":
                return jsonToolResult(await deleteFile(client, p.file_token, p.type));
              default:
                return unknownToolActionResult(p.action);
            }
          } catch (err) {
            return toolExecutionErrorResult(err);
          }
        },
      };
    },
    { name: "feishu_drive" },
  );
  api.logger.info?.(`feishu_drive: Registered feishu_drive tool`);
}
//#endregion
//#region extensions/feishu/src/perm-schema.ts
const TokenType = Type.Union([
  Type.Literal("doc"),
  Type.Literal("docx"),
  Type.Literal("sheet"),
  Type.Literal("bitable"),
  Type.Literal("folder"),
  Type.Literal("file"),
  Type.Literal("wiki"),
  Type.Literal("mindnote"),
]);
const MemberType = Type.Union([
  Type.Literal("email"),
  Type.Literal("openid"),
  Type.Literal("userid"),
  Type.Literal("unionid"),
  Type.Literal("openchat"),
  Type.Literal("opendepartmentid"),
]);
const Permission = Type.Union([
  Type.Literal("view"),
  Type.Literal("edit"),
  Type.Literal("full_access"),
]);
const FeishuPermSchema = Type.Union([
  Type.Object({
    action: Type.Literal("list"),
    token: Type.String({ description: "File token" }),
    type: TokenType,
  }),
  Type.Object({
    action: Type.Literal("add"),
    token: Type.String({ description: "File token" }),
    type: TokenType,
    member_type: MemberType,
    member_id: Type.String({ description: "Member ID (email, open_id, user_id, etc.)" }),
    perm: Permission,
  }),
  Type.Object({
    action: Type.Literal("remove"),
    token: Type.String({ description: "File token" }),
    type: TokenType,
    member_type: MemberType,
    member_id: Type.String({ description: "Member ID to remove" }),
  }),
]);
//#endregion
//#region extensions/feishu/src/perm.ts
async function listMembers(client, token, type) {
  const res = await client.drive.permissionMember.list({
    path: { token },
    params: { type },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    members:
      res.data?.items?.map((m) => ({
        member_type: m.member_type,
        member_id: m.member_id,
        perm: m.perm,
        name: m.name,
      })) ?? [],
  };
}
async function addMember(client, token, type, memberType, memberId, perm) {
  const res = await client.drive.permissionMember.create({
    path: { token },
    params: {
      type,
      need_notification: false,
    },
    data: {
      member_type: memberType,
      member_id: memberId,
      perm,
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    member: res.data?.member,
  };
}
async function removeMember(client, token, type, memberType, memberId) {
  const res = await client.drive.permissionMember.delete({
    path: {
      token,
      member_id: memberId,
    },
    params: {
      type,
      member_type: memberType,
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return { success: true };
}
function registerFeishuPermTools(api) {
  if (!api.config) {
    api.logger.debug?.("feishu_perm: No config available, skipping perm tools");
    return;
  }
  const accounts = listEnabledFeishuAccounts(api.config);
  if (accounts.length === 0) {
    api.logger.debug?.("feishu_perm: No Feishu accounts configured, skipping perm tools");
    return;
  }
  if (!resolveAnyEnabledFeishuToolsConfig(accounts).perm) {
    api.logger.debug?.("feishu_perm: perm tool disabled in config (default: false)");
    return;
  }
  api.registerTool(
    (ctx) => {
      const defaultAccountId = ctx.agentAccountId;
      return {
        name: "feishu_perm",
        label: "Feishu Perm",
        description: "Feishu permission management. Actions: list, add, remove",
        parameters: FeishuPermSchema,
        async execute(_toolCallId, params) {
          const p = params;
          try {
            const client = createFeishuToolClient({
              api,
              executeParams: p,
              defaultAccountId,
            });
            switch (p.action) {
              case "list":
                return jsonToolResult(await listMembers(client, p.token, p.type));
              case "add":
                return jsonToolResult(
                  await addMember(client, p.token, p.type, p.member_type, p.member_id, p.perm),
                );
              case "remove":
                return jsonToolResult(
                  await removeMember(client, p.token, p.type, p.member_type, p.member_id),
                );
              default:
                return unknownToolActionResult(p.action);
            }
          } catch (err) {
            return toolExecutionErrorResult(err);
          }
        },
      };
    },
    { name: "feishu_perm" },
  );
  api.logger.info?.(`feishu_perm: Registered feishu_perm tool`);
}
//#endregion
//#region extensions/feishu/src/subagent-hooks.ts
function summarizeError(err) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "error";
}
function stripProviderPrefix(raw) {
  return raw.replace(/^(feishu|lark):/i, "").trim();
}
function resolveFeishuRequesterConversation(params) {
  const manager = getFeishuThreadBindingManager(params.accountId);
  if (!manager) return null;
  const rawTo = params.to?.trim();
  const withoutProviderPrefix = rawTo ? stripProviderPrefix(rawTo) : "";
  const normalizedTarget = rawTo ? normalizeFeishuTarget(rawTo) : null;
  const threadId =
    params.threadId != null && params.threadId !== "" ? String(params.threadId).trim() : "";
  const isChatTarget = /^(chat|group|channel):/i.test(withoutProviderPrefix);
  const parsedRequesterTopic =
    normalizedTarget && threadId && isChatTarget
      ? parseFeishuConversationId({
          conversationId: buildFeishuConversationId({
            chatId: normalizedTarget,
            scope: "group_topic",
            topicId: threadId,
          }),
          parentConversationId: normalizedTarget,
        })
      : null;
  const requesterSessionKey = params.requesterSessionKey?.trim();
  if (requesterSessionKey) {
    const existingBindings = manager.listBySessionKey(requesterSessionKey);
    if (existingBindings.length === 1) {
      const existing = existingBindings[0];
      return {
        accountId: existing.accountId,
        conversationId: existing.conversationId,
        parentConversationId: existing.parentConversationId,
      };
    }
    if (existingBindings.length > 1) {
      if (rawTo && normalizedTarget && !threadId && !isChatTarget) {
        const directMatches = existingBindings.filter(
          (entry) =>
            entry.accountId === manager.accountId &&
            entry.conversationId === normalizedTarget &&
            !entry.parentConversationId,
        );
        if (directMatches.length === 1) {
          const existing = directMatches[0];
          return {
            accountId: existing.accountId,
            conversationId: existing.conversationId,
            parentConversationId: existing.parentConversationId,
          };
        }
        return null;
      }
      if (parsedRequesterTopic) {
        const matchingTopicBindings = existingBindings.filter((entry) => {
          const parsed = parseFeishuConversationId({
            conversationId: entry.conversationId,
            parentConversationId: entry.parentConversationId,
          });
          return (
            parsed?.chatId === parsedRequesterTopic.chatId &&
            parsed?.topicId === parsedRequesterTopic.topicId
          );
        });
        if (matchingTopicBindings.length === 1) {
          const existing = matchingTopicBindings[0];
          return {
            accountId: existing.accountId,
            conversationId: existing.conversationId,
            parentConversationId: existing.parentConversationId,
          };
        }
        const senderScopedTopicBindings = matchingTopicBindings.filter((entry) => {
          return (
            parseFeishuConversationId({
              conversationId: entry.conversationId,
              parentConversationId: entry.parentConversationId,
            })?.scope === "group_topic_sender"
          );
        });
        if (
          senderScopedTopicBindings.length === 1 &&
          matchingTopicBindings.length === senderScopedTopicBindings.length
        ) {
          const existing = senderScopedTopicBindings[0];
          return {
            accountId: existing.accountId,
            conversationId: existing.conversationId,
            parentConversationId: existing.parentConversationId,
          };
        }
        return null;
      }
    }
  }
  if (!rawTo) return null;
  if (!normalizedTarget) return null;
  if (threadId) {
    if (!isChatTarget) return null;
    return {
      accountId: manager.accountId,
      conversationId: buildFeishuConversationId({
        chatId: normalizedTarget,
        scope: "group_topic",
        topicId: threadId,
      }),
      parentConversationId: normalizedTarget,
    };
  }
  if (isChatTarget) return null;
  return {
    accountId: manager.accountId,
    conversationId: normalizedTarget,
  };
}
function resolveFeishuDeliveryOrigin(params) {
  const deliveryTo = params.deliveryTo?.trim();
  const deliveryThreadId = params.deliveryThreadId?.trim();
  if (deliveryTo)
    return {
      channel: "feishu",
      accountId: params.accountId,
      to: deliveryTo,
      ...(deliveryThreadId ? { threadId: deliveryThreadId } : {}),
    };
  const parsed = parseFeishuConversationId({
    conversationId: params.conversationId,
    parentConversationId: params.parentConversationId,
  });
  if (parsed?.topicId)
    return {
      channel: "feishu",
      accountId: params.accountId,
      to: `chat:${params.parentConversationId?.trim() || parsed.chatId}`,
      threadId: parsed.topicId,
    };
  return {
    channel: "feishu",
    accountId: params.accountId,
    to: `user:${params.conversationId}`,
  };
}
function resolveMatchingChildBinding(params) {
  const manager = getFeishuThreadBindingManager(params.accountId);
  if (!manager) return null;
  const childBindings = manager.listBySessionKey(params.childSessionKey.trim());
  if (childBindings.length === 0) return null;
  const requesterConversation = resolveFeishuRequesterConversation({
    accountId: manager.accountId,
    to: params.requesterOrigin?.to,
    threadId: params.requesterOrigin?.threadId,
    requesterSessionKey: params.requesterSessionKey,
  });
  if (requesterConversation) {
    const matched = childBindings.find(
      (entry) =>
        entry.accountId === requesterConversation.accountId &&
        entry.conversationId === requesterConversation.conversationId &&
        (entry.parentConversationId?.trim() || void 0) ===
          (requesterConversation.parentConversationId?.trim() || void 0),
    );
    if (matched) return matched;
  }
  return childBindings.length === 1 ? childBindings[0] : null;
}
function registerFeishuSubagentHooks(api) {
  api.on("subagent_spawning", async (event, ctx) => {
    if (!event.threadRequested) return;
    if (event.requester?.channel?.trim().toLowerCase() !== "feishu") return;
    const manager = getFeishuThreadBindingManager(event.requester?.accountId);
    if (!manager)
      return {
        status: "error",
        error:
          "Feishu current-conversation binding is unavailable because the Feishu account monitor is not active.",
      };
    const conversation = resolveFeishuRequesterConversation({
      accountId: event.requester?.accountId,
      to: event.requester?.to,
      threadId: event.requester?.threadId,
      requesterSessionKey: ctx.requesterSessionKey,
    });
    if (!conversation)
      return {
        status: "error",
        error:
          "Feishu current-conversation binding is only available in direct messages or topic conversations.",
      };
    try {
      if (
        !manager.bindConversation({
          conversationId: conversation.conversationId,
          parentConversationId: conversation.parentConversationId,
          targetKind: "subagent",
          targetSessionKey: event.childSessionKey,
          metadata: {
            agentId: event.agentId,
            label: event.label,
            boundBy: "system",
            deliveryTo: event.requester?.to,
            deliveryThreadId:
              event.requester?.threadId != null && event.requester.threadId !== ""
                ? String(event.requester.threadId)
                : void 0,
          },
        })
      )
        return {
          status: "error",
          error:
            "Unable to bind this Feishu conversation to the spawned subagent session. Session mode is unavailable for this target.",
        };
      return {
        status: "ok",
        threadBindingReady: true,
      };
    } catch (err) {
      return {
        status: "error",
        error: `Feishu conversation bind failed: ${summarizeError(err)}`,
      };
    }
  });
  api.on("subagent_delivery_target", (event) => {
    if (!event.expectsCompletionMessage) return;
    if (event.requesterOrigin?.channel?.trim().toLowerCase() !== "feishu") return;
    const binding = resolveMatchingChildBinding({
      accountId: event.requesterOrigin?.accountId,
      childSessionKey: event.childSessionKey,
      requesterSessionKey: event.requesterSessionKey,
      requesterOrigin: {
        to: event.requesterOrigin?.to,
        threadId: event.requesterOrigin?.threadId,
      },
    });
    if (!binding) return;
    return {
      origin: resolveFeishuDeliveryOrigin({
        conversationId: binding.conversationId,
        parentConversationId: binding.parentConversationId,
        accountId: binding.accountId,
        deliveryTo: binding.deliveryTo,
        deliveryThreadId: binding.deliveryThreadId,
      }),
    };
  });
  api.on("subagent_ended", (event) => {
    getFeishuThreadBindingManager(event.accountId)?.unbindBySessionKey(event.targetSessionKey);
  });
}
//#endregion
//#region extensions/feishu/src/wiki-schema.ts
const FeishuWikiSchema = Type.Union([
  Type.Object({ action: Type.Literal("spaces") }),
  Type.Object({
    action: Type.Literal("nodes"),
    space_id: Type.String({ description: "Knowledge space ID" }),
    parent_node_token: Type.Optional(
      Type.String({ description: "Parent node token (optional, omit for root)" }),
    ),
  }),
  Type.Object({
    action: Type.Literal("get"),
    token: Type.String({ description: "Wiki node token (from URL /wiki/XXX)" }),
  }),
  Type.Object({
    action: Type.Literal("search"),
    query: Type.String({ description: "Search query" }),
    space_id: Type.Optional(Type.String({ description: "Limit search to this space (optional)" })),
  }),
  Type.Object({
    action: Type.Literal("create"),
    space_id: Type.String({ description: "Knowledge space ID" }),
    title: Type.String({ description: "Node title" }),
    obj_type: Type.Optional(
      Type.Union([Type.Literal("docx"), Type.Literal("sheet"), Type.Literal("bitable")], {
        description: "Object type (default: docx)",
      }),
    ),
    parent_node_token: Type.Optional(
      Type.String({ description: "Parent node token (optional, omit for root)" }),
    ),
  }),
  Type.Object({
    action: Type.Literal("move"),
    space_id: Type.String({ description: "Source knowledge space ID" }),
    node_token: Type.String({ description: "Node token to move" }),
    target_space_id: Type.Optional(
      Type.String({ description: "Target space ID (optional, same space if omitted)" }),
    ),
    target_parent_token: Type.Optional(
      Type.String({ description: "Target parent node token (optional, root if omitted)" }),
    ),
  }),
  Type.Object({
    action: Type.Literal("rename"),
    space_id: Type.String({ description: "Knowledge space ID" }),
    node_token: Type.String({ description: "Node token to rename" }),
    title: Type.String({ description: "New title" }),
  }),
]);
//#endregion
//#region extensions/feishu/src/wiki.ts
const WIKI_ACCESS_HINT =
  "To grant wiki access: Open wiki space → Settings → Members → Add the bot. See: https://open.feishu.cn/document/server-docs/docs/wiki-v2/wiki-qa#a40ad4ca";
async function listSpaces(client) {
  const res = await client.wiki.space.list({});
  if (res.code !== 0) throw new Error(res.msg);
  const spaces =
    res.data?.items?.map((s) => ({
      space_id: s.space_id,
      name: s.name,
      description: s.description,
      visibility: s.visibility,
    })) ?? [];
  return {
    spaces,
    ...(spaces.length === 0 && { hint: WIKI_ACCESS_HINT }),
  };
}
async function listNodes(client, spaceId, parentNodeToken) {
  const res = await client.wiki.spaceNode.list({
    path: { space_id: spaceId },
    params: { parent_node_token: parentNodeToken },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    nodes:
      res.data?.items?.map((n) => ({
        node_token: n.node_token,
        obj_token: n.obj_token,
        obj_type: n.obj_type,
        title: n.title,
        has_child: n.has_child,
      })) ?? [],
  };
}
async function getNode(client, token) {
  const res = await client.wiki.space.getNode({ params: { token } });
  if (res.code !== 0) throw new Error(res.msg);
  const node = res.data?.node;
  return {
    node_token: node?.node_token,
    space_id: node?.space_id,
    obj_token: node?.obj_token,
    obj_type: node?.obj_type,
    title: node?.title,
    parent_node_token: node?.parent_node_token,
    has_child: node?.has_child,
    creator: node?.creator,
    create_time: node?.node_create_time,
  };
}
async function createNode(client, spaceId, title, objType, parentNodeToken) {
  const res = await client.wiki.spaceNode.create({
    path: { space_id: spaceId },
    data: {
      obj_type: objType || "docx",
      node_type: "origin",
      title,
      parent_node_token: parentNodeToken,
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  const node = res.data?.node;
  return {
    node_token: node?.node_token,
    obj_token: node?.obj_token,
    obj_type: node?.obj_type,
    title: node?.title,
  };
}
async function moveNode(client, spaceId, nodeToken, targetSpaceId, targetParentToken) {
  const res = await client.wiki.spaceNode.move({
    path: {
      space_id: spaceId,
      node_token: nodeToken,
    },
    data: {
      target_space_id: targetSpaceId || spaceId,
      target_parent_token: targetParentToken,
    },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    node_token: res.data?.node?.node_token,
  };
}
async function renameNode(client, spaceId, nodeToken, title) {
  const res = await client.wiki.spaceNode.updateTitle({
    path: {
      space_id: spaceId,
      node_token: nodeToken,
    },
    data: { title },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    success: true,
    node_token: nodeToken,
    title,
  };
}
function registerFeishuWikiTools(api) {
  if (!api.config) {
    api.logger.debug?.("feishu_wiki: No config available, skipping wiki tools");
    return;
  }
  const accounts = listEnabledFeishuAccounts(api.config);
  if (accounts.length === 0) {
    api.logger.debug?.("feishu_wiki: No Feishu accounts configured, skipping wiki tools");
    return;
  }
  if (!resolveAnyEnabledFeishuToolsConfig(accounts).wiki) {
    api.logger.debug?.("feishu_wiki: wiki tool disabled in config");
    return;
  }
  api.registerTool(
    (ctx) => {
      const defaultAccountId = ctx.agentAccountId;
      return {
        name: "feishu_wiki",
        label: "Feishu Wiki",
        description:
          "Feishu knowledge base operations. Actions: spaces, nodes, get, create, move, rename",
        parameters: FeishuWikiSchema,
        async execute(_toolCallId, params) {
          const p = params;
          try {
            const client = createFeishuToolClient({
              api,
              executeParams: p,
              defaultAccountId,
            });
            switch (p.action) {
              case "spaces":
                return jsonToolResult(await listSpaces(client));
              case "nodes":
                return jsonToolResult(await listNodes(client, p.space_id, p.parent_node_token));
              case "get":
                return jsonToolResult(await getNode(client, p.token));
              case "search":
                return jsonToolResult({
                  error:
                    "Search is not available. Use feishu_wiki with action: 'nodes' to browse or action: 'get' to lookup by token.",
                });
              case "create":
                return jsonToolResult(
                  await createNode(client, p.space_id, p.title, p.obj_type, p.parent_node_token),
                );
              case "move":
                return jsonToolResult(
                  await moveNode(
                    client,
                    p.space_id,
                    p.node_token,
                    p.target_space_id,
                    p.target_parent_token,
                  ),
                );
              case "rename":
                return jsonToolResult(await renameNode(client, p.space_id, p.node_token, p.title));
              default:
                return unknownToolActionResult(p.action);
            }
          } catch (err) {
            return toolExecutionErrorResult(err);
          }
        },
      };
    },
    { name: "feishu_wiki" },
  );
  api.logger.info?.(`feishu_wiki: Registered feishu_wiki tool`);
}
defineChannelPluginEntry({
  id: "feishu",
  name: "Feishu",
  description: "Feishu/Lark channel plugin",
  plugin: feishuPlugin,
  setRuntime: setFeishuRuntime,
  registerFull(api) {
    registerFeishuSubagentHooks(api);
    registerFeishuDocTools(api);
    registerFeishuChatTools(api);
    registerFeishuWikiTools(api);
    registerFeishuDriveTools(api);
    registerFeishuPermTools(api);
    registerFeishuBitableTools(api);
  },
});
//#endregion
//#region src/plugin-sdk/extension-shared.ts
function buildPassiveChannelStatusSummary(snapshot, extra) {
  return {
    configured: snapshot.configured ?? false,
    ...(extra ?? {}),
    running: snapshot.running ?? false,
    lastStartAt: snapshot.lastStartAt ?? null,
    lastStopAt: snapshot.lastStopAt ?? null,
    lastError: snapshot.lastError ?? null,
  };
}
function buildPassiveProbedChannelStatusSummary(snapshot, extra) {
  return {
    ...buildPassiveChannelStatusSummary(snapshot, extra),
    probe: snapshot.probe,
    lastProbeAt: snapshot.lastProbeAt ?? null,
  };
}
async function runStoppablePassiveMonitor(params) {
  await runPassiveAccountLifecycle({
    abortSignal: params.abortSignal,
    start: params.start,
    stop: async (monitor) => {
      monitor.stop();
    },
  });
}
function resolveLoggerBackedRuntime(runtime, logger) {
  return (
    runtime ??
    createLoggerBackedRuntime({
      logger,
      exitError: () => /* @__PURE__ */ new Error("Runtime exit not available"),
    })
  );
}
function requireChannelOpenAllowFrom(params) {
  params.requireOpenAllowFrom({
    policy: params.policy,
    allowFrom: params.allowFrom,
    ctx: params.ctx,
    path: ["allowFrom"],
    message: `channels.${params.channel}.dmPolicy="open" requires channels.${params.channel}.allowFrom to include "*"`,
  });
}
function readStatusIssueFields(value, fields) {
  if (!value || typeof value !== "object") return null;
  const record = value;
  const result = {};
  for (const field of fields) result[field] = record[field];
  return result;
}
function coerceStatusIssueAccountId(value) {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : void 0;
}
//#endregion
//#region extensions/imessage/src/shared.ts
const IMESSAGE_CHANNEL = "imessage";
async function loadIMessageChannelRuntime$1() {
  return await import("./channel.runtime-fZB-0Kn4.js");
}
const imessageSetupWizard = createIMessageSetupWizardProxy(
  async () => (await loadIMessageChannelRuntime$1()).imessageSetupWizard,
);
const imessageConfigAdapter = createScopedChannelConfigAdapter({
  sectionKey: IMESSAGE_CHANNEL,
  listAccountIds: listIMessageAccountIds,
  resolveAccount: adaptScopedAccountAccessor(resolveIMessageAccount),
  defaultAccountId: resolveDefaultIMessageAccountId,
  clearBaseFields: ["cliPath", "dbPath", "service", "region", "name"],
  resolveAllowFrom: (account) => account.config.allowFrom,
  formatAllowFrom: (allowFrom) => formatTrimmedAllowFromEntries(allowFrom),
  resolveDefaultTo: (account) => account.config.defaultTo,
});
const imessageSecurityAdapter = createRestrictSendersChannelSecurity({
  channelKey: IMESSAGE_CHANNEL,
  resolveDmPolicy: (account) => account.config.dmPolicy,
  resolveDmAllowFrom: (account) => account.config.allowFrom,
  resolveGroupPolicy: (account) => account.config.groupPolicy,
  surface: "iMessage groups",
  openScope: "any member",
  groupPolicyPath: "channels.imessage.groupPolicy",
  groupAllowFromPath: "channels.imessage.groupAllowFrom",
  mentionGated: false,
  policyPathSuffix: "dmPolicy",
});
function createIMessagePluginBase(params) {
  return createChannelPluginBase({
    id: IMESSAGE_CHANNEL,
    meta: {
      ...getChatChannelMeta(IMESSAGE_CHANNEL),
      aliases: ["imsg"],
      showConfigured: false,
    },
    setupWizard: params.setupWizard,
    capabilities: {
      chatTypes: ["direct", "group"],
      media: true,
    },
    reload: { configPrefixes: ["channels.imessage"] },
    configSchema: buildChannelConfigSchema(IMessageConfigSchema),
    config: {
      ...imessageConfigAdapter,
      isConfigured: (account) => account.configured,
      describeAccount: (account) =>
        describeAccountSnapshot({
          account,
          configured: account.configured,
        }),
    },
    security: imessageSecurityAdapter,
    setup: params.setup,
  });
}
//#endregion
//#region extensions/imessage/src/channel.ts
const loadIMessageChannelRuntime = createLazyRuntimeModule(
  () => import("./channel.runtime-fZB-0Kn4.js"),
);
function buildIMessageBaseSessionKey(params) {
  return buildOutboundBaseSessionKey({
    ...params,
    channel: "imessage",
  });
}
function resolveIMessageOutboundSessionRoute(params) {
  const parsed = parseIMessageTarget(params.target);
  if (parsed.kind === "handle") {
    const handle = normalizeIMessageHandle(parsed.to);
    if (!handle) return null;
    const peer = {
      kind: "direct",
      id: handle,
    };
    const baseSessionKey = buildIMessageBaseSessionKey({
      cfg: params.cfg,
      agentId: params.agentId,
      accountId: params.accountId,
      peer,
    });
    return {
      sessionKey: baseSessionKey,
      baseSessionKey,
      peer,
      chatType: "direct",
      from: `imessage:${handle}`,
      to: `imessage:${handle}`,
    };
  }
  const peerId =
    parsed.kind === "chat_id"
      ? String(parsed.chatId)
      : parsed.kind === "chat_guid"
        ? parsed.chatGuid
        : parsed.chatIdentifier;
  if (!peerId) return null;
  const peer = {
    kind: "group",
    id: peerId,
  };
  const baseSessionKey = buildIMessageBaseSessionKey({
    cfg: params.cfg,
    agentId: params.agentId,
    accountId: params.accountId,
    peer,
  });
  const toPrefix =
    parsed.kind === "chat_id"
      ? "chat_id"
      : parsed.kind === "chat_guid"
        ? "chat_guid"
        : "chat_identifier";
  return {
    sessionKey: baseSessionKey,
    baseSessionKey,
    peer,
    chatType: "group",
    from: `imessage:group:${peerId}`,
    to: `${toPrefix}:${peerId}`,
  };
}
const imessagePlugin = createChatChannelPlugin({
  base: {
    ...createIMessagePluginBase({
      setupWizard: imessageSetupWizard,
      setup: imessageSetupAdapter,
    }),
    allowlist: buildDmGroupAccountAllowlistAdapter({
      channelId: "imessage",
      resolveAccount: resolveIMessageAccount,
      normalize: ({ values }) => formatTrimmedAllowFromEntries(values),
      resolveDmAllowFrom: (account) => account.config.allowFrom,
      resolveGroupAllowFrom: (account) => account.config.groupAllowFrom,
      resolveDmPolicy: (account) => account.config.dmPolicy,
      resolveGroupPolicy: (account) => account.config.groupPolicy,
    }),
    groups: {
      resolveRequireMention: resolveIMessageGroupRequireMention,
      resolveToolPolicy: resolveIMessageGroupToolPolicy,
    },
    messaging: {
      normalizeTarget: normalizeIMessageMessagingTarget,
      inferTargetChatType: ({ to }) => inferIMessageTargetChatType(to),
      resolveOutboundSessionRoute: (params) => resolveIMessageOutboundSessionRoute(params),
      targetResolver: {
        looksLikeId: looksLikeIMessageExplicitTargetId,
        hint: "<handle|chat_id:ID>",
        resolveTarget: async ({ normalized }) => {
          const to = normalized?.trim();
          if (!to) return null;
          const chatType = inferIMessageTargetChatType(to);
          if (!chatType) return null;
          return {
            to,
            kind: chatType === "direct" ? "user" : "group",
            source: "normalized",
          };
        },
      },
    },
    status: createComputedAccountStatusAdapter({
      defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID, {
        cliPath: null,
        dbPath: null,
      }),
      collectStatusIssues: (accounts) => collectStatusIssuesFromLastError("imessage", accounts),
      buildChannelSummary: ({ snapshot }) =>
        buildPassiveProbedChannelStatusSummary(snapshot, {
          cliPath: snapshot.cliPath ?? null,
          dbPath: snapshot.dbPath ?? null,
        }),
      probeAccount: async ({ timeoutMs }) =>
        await (await loadIMessageChannelRuntime()).probeIMessageAccount(timeoutMs),
      resolveAccountSnapshot: ({ account, runtime }) => ({
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured: account.configured,
        extra: {
          cliPath: runtime?.cliPath ?? account.config.cliPath ?? null,
          dbPath: runtime?.dbPath ?? account.config.dbPath ?? null,
        },
      }),
      resolveAccountState: ({ enabled }) => (enabled ? "enabled" : "disabled"),
    }),
    gateway: {
      startAccount: async (ctx) =>
        await (await loadIMessageChannelRuntime()).startIMessageGatewayAccount(ctx),
    },
  },
  pairing: {
    text: {
      idLabel: "imessageSenderId",
      message: "OpenClaw: your access has been approved.",
      notify: async ({ id }) =>
        await (await loadIMessageChannelRuntime()).notifyIMessageApproval(id),
    },
  },
  security: imessageSecurityAdapter,
  outbound: {
    base: {
      deliveryMode: "direct",
      chunker: (text, limit) => getIMessageRuntime().channel.text.chunkText(text, limit),
      chunkerMode: "text",
      textChunkLimit: 4e3,
    },
    attachedResults: {
      channel: "imessage",
      sendText: async ({ cfg, to, text, accountId, deps, replyToId }) =>
        await (
          await loadIMessageChannelRuntime()
        ).sendIMessageOutbound({
          cfg,
          to,
          text,
          accountId: accountId ?? void 0,
          deps,
          replyToId: replyToId ?? void 0,
        }),
      sendMedia: async ({ cfg, to, text, mediaUrl, mediaLocalRoots, accountId, deps, replyToId }) =>
        await (
          await loadIMessageChannelRuntime()
        ).sendIMessageOutbound({
          cfg,
          to,
          text,
          mediaUrl,
          mediaLocalRoots,
          accountId: accountId ?? void 0,
          deps,
          replyToId: replyToId ?? void 0,
        }),
    },
  },
});
defineChannelPluginEntry({
  id: "imessage",
  name: "iMessage",
  description: "iMessage channel plugin",
  plugin: imessagePlugin,
  setRuntime: setIMessageRuntime,
});
//#endregion
//#region extensions/imessage/src/channel.setup.ts
const imessageSetupPlugin = {
  ...createIMessagePluginBase({
    setupWizard: imessageSetupWizard,
    setup: imessageSetupAdapter,
  }),
};
defineSetupPluginEntry(imessageSetupPlugin);
//#endregion
//#region extensions/irc/src/accounts.ts
const TRUTHY_ENV = new Set(["true", "1", "yes", "on"]);
function parseTruthy(value) {
  if (!value) return false;
  return TRUTHY_ENV.has(value.trim().toLowerCase());
}
function parseIntEnv(value) {
  if (!value?.trim()) return;
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) return;
  return parsed;
}
const { listAccountIds: listIrcAccountIds, resolveDefaultAccountId: resolveDefaultIrcAccountId } =
  createAccountListHelpers("irc", { normalizeAccountId });
function mergeIrcAccountConfig(cfg, accountId) {
  return resolveMergedAccountConfig({
    channelConfig: cfg.channels?.irc,
    accounts: cfg.channels?.irc?.accounts,
    accountId,
    omitKeys: ["defaultAccount"],
    normalizeAccountId,
    nestedObjectKeys: ["nickserv"],
  });
}
function resolvePassword(accountId, merged) {
  if (accountId === "default") {
    const envPassword = process.env.IRC_PASSWORD?.trim();
    if (envPassword)
      return {
        password: envPassword,
        source: "env",
      };
  }
  if (merged.passwordFile?.trim()) {
    const filePassword = tryReadSecretFileSync(merged.passwordFile, "IRC password file", {
      rejectSymlink: true,
    });
    if (filePassword)
      return {
        password: filePassword,
        source: "passwordFile",
      };
  }
  const configPassword = normalizeResolvedSecretInputString({
    value: merged.password,
    path: `channels.irc.accounts.${accountId}.password`,
  });
  if (configPassword)
    return {
      password: configPassword,
      source: "config",
    };
  return {
    password: "",
    source: "none",
  };
}
function resolveNickServConfig(accountId, nickserv) {
  const base = nickserv ?? {};
  const envPassword = accountId === "default" ? process.env.IRC_NICKSERV_PASSWORD?.trim() : void 0;
  const envRegisterEmail =
    accountId === "default" ? process.env.IRC_NICKSERV_REGISTER_EMAIL?.trim() : void 0;
  const passwordFile = base.passwordFile?.trim();
  let resolvedPassword =
    normalizeResolvedSecretInputString({
      value: base.password,
      path: `channels.irc.accounts.${accountId}.nickserv.password`,
    }) ||
    envPassword ||
    "";
  if (!resolvedPassword && passwordFile)
    resolvedPassword =
      tryReadSecretFileSync(passwordFile, "IRC NickServ password file", { rejectSymlink: true }) ??
      "";
  return {
    ...base,
    service: base.service?.trim() || void 0,
    passwordFile: passwordFile || void 0,
    password: resolvedPassword || void 0,
    registerEmail: base.registerEmail?.trim() || envRegisterEmail || void 0,
  };
}
function resolveIrcAccount(params) {
  const hasExplicitAccountId = Boolean(params.accountId?.trim());
  const baseEnabled = params.cfg.channels?.irc?.enabled !== false;
  const resolve = (accountId) => {
    const merged = mergeIrcAccountConfig(params.cfg, accountId);
    const accountEnabled = merged.enabled !== false;
    const enabled = baseEnabled && accountEnabled;
    const tls =
      typeof merged.tls === "boolean"
        ? merged.tls
        : accountId === "default" && process.env.IRC_TLS
          ? parseTruthy(process.env.IRC_TLS)
          : true;
    const envPort = accountId === "default" ? parseIntEnv(process.env.IRC_PORT) : void 0;
    const port = merged.port ?? envPort ?? (tls ? 6697 : 6667);
    const envChannels =
      accountId === "default" ? parseOptionalDelimitedEntries(process.env.IRC_CHANNELS) : void 0;
    const host = (
      merged.host?.trim() ||
      (accountId === "default" ? process.env.IRC_HOST?.trim() : "") ||
      ""
    ).trim();
    const nick = (
      merged.nick?.trim() ||
      (accountId === "default" ? process.env.IRC_NICK?.trim() : "") ||
      ""
    ).trim();
    const username = (
      merged.username?.trim() ||
      (accountId === "default" ? process.env.IRC_USERNAME?.trim() : "") ||
      nick ||
      "openclaw"
    ).trim();
    const realname = (
      merged.realname?.trim() ||
      (accountId === "default" ? process.env.IRC_REALNAME?.trim() : "") ||
      "OpenClaw"
    ).trim();
    const passwordResolution = resolvePassword(accountId, merged);
    const nickserv = resolveNickServConfig(accountId, merged.nickserv);
    const config = {
      ...merged,
      channels: merged.channels ?? envChannels,
      tls,
      port,
      host,
      nick,
      username,
      realname,
      nickserv,
    };
    return {
      accountId,
      enabled,
      name: merged.name?.trim() || void 0,
      configured: Boolean(host && nick),
      host,
      port,
      tls,
      nick,
      username,
      realname,
      password: passwordResolution.password,
      passwordSource: passwordResolution.source,
      config,
    };
  };
  const primary = resolve(normalizeAccountId(params.accountId));
  if (hasExplicitAccountId) return primary;
  if (primary.configured) return primary;
  const fallbackId = resolveDefaultIrcAccountId(params.cfg);
  if (fallbackId === primary.accountId) return primary;
  const fallback = resolve(fallbackId);
  if (!fallback.configured) return primary;
  return fallback;
}
//#endregion
//#region extensions/irc/src/control-chars.ts
function isIrcControlChar(charCode) {
  return charCode <= 31 || charCode === 127;
}
function hasIrcControlChars(value) {
  for (const char of value) if (isIrcControlChar(char.charCodeAt(0))) return true;
  return false;
}
function stripIrcControlChars(value) {
  let out = "";
  for (const char of value) if (!isIrcControlChar(char.charCodeAt(0))) out += char;
  return out;
}
//#endregion
//#region extensions/irc/src/normalize.ts
const IRC_TARGET_PATTERN$1 = /^[^\s:]+$/u;
function isChannelTarget(target) {
  return target.startsWith("#") || target.startsWith("&");
}
function normalizeIrcMessagingTarget(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;
  let target = trimmed;
  if (target.toLowerCase().startsWith("irc:")) target = target.slice(4).trim();
  if (target.toLowerCase().startsWith("channel:")) {
    target = target.slice(8).trim();
    if (!target.startsWith("#") && !target.startsWith("&")) target = `#${target}`;
  }
  if (target.toLowerCase().startsWith("user:")) target = target.slice(5).trim();
  if (!target || !looksLikeIrcTargetId(target)) return;
  return target;
}
function looksLikeIrcTargetId(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (hasIrcControlChars(trimmed)) return false;
  return IRC_TARGET_PATTERN$1.test(trimmed);
}
function normalizeIrcAllowEntry(raw) {
  let value = raw.trim().toLowerCase();
  if (!value) return "";
  if (value.startsWith("irc:")) value = value.slice(4);
  if (value.startsWith("user:")) value = value.slice(5);
  return value.trim();
}
function normalizeIrcAllowlist(entries) {
  return (entries ?? []).map((entry) => normalizeIrcAllowEntry(String(entry))).filter(Boolean);
}
function buildIrcAllowlistCandidates(message, params) {
  const nick = message.senderNick.trim().toLowerCase();
  const user = message.senderUser?.trim().toLowerCase();
  const host = message.senderHost?.trim().toLowerCase();
  const candidates = /* @__PURE__ */ new Set();
  if (nick && params?.allowNameMatching === true) candidates.add(nick);
  if (nick && user) candidates.add(`${nick}!${user}`);
  if (nick && host) candidates.add(`${nick}@${host}`);
  if (nick && user && host) candidates.add(`${nick}!${user}@${host}`);
  return [...candidates];
}
function resolveIrcAllowlistMatch(params) {
  const allowFrom = new Set(
    params.allowFrom.map((entry) => entry.trim().toLowerCase()).filter(Boolean),
  );
  if (allowFrom.has("*"))
    return {
      allowed: true,
      source: "wildcard",
    };
  const candidates = buildIrcAllowlistCandidates(params.message, {
    allowNameMatching: params.allowNameMatching,
  });
  for (const candidate of candidates)
    if (allowFrom.has(candidate))
      return {
        allowed: true,
        source: candidate,
      };
  return { allowed: false };
}
//#endregion
//#region extensions/irc/src/setup-core.ts
const channel$8 = "irc";
const setIrcTopLevelDmPolicy = createTopLevelChannelDmPolicySetter({ channel: channel$8 });
const setIrcTopLevelAllowFrom = createTopLevelChannelAllowFromSetter({ channel: channel$8 });
function parsePort(raw, fallback) {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) return fallback;
  return parsed;
}
function updateIrcAccountConfig(cfg, accountId, patch) {
  return patchScopedAccountConfig({
    cfg,
    channelKey: channel$8,
    accountId,
    patch,
    ensureChannelEnabled: false,
    ensureAccountEnabled: false,
  });
}
function setIrcDmPolicy(cfg, dmPolicy) {
  return setIrcTopLevelDmPolicy(cfg, dmPolicy);
}
function setIrcAllowFrom(cfg, allowFrom) {
  return setIrcTopLevelAllowFrom(cfg, allowFrom);
}
function setIrcNickServ(cfg, accountId, nickserv) {
  return updateIrcAccountConfig(cfg, accountId, { nickserv });
}
function setIrcGroupAccess(cfg, accountId, policy, entries, normalizeGroupEntry) {
  if (policy !== "allowlist")
    return updateIrcAccountConfig(cfg, accountId, {
      enabled: true,
      groupPolicy: policy,
    });
  const normalizedEntries = [
    ...new Set(entries.map((entry) => normalizeGroupEntry(entry)).filter(Boolean)),
  ];
  return updateIrcAccountConfig(cfg, accountId, {
    enabled: true,
    groupPolicy: "allowlist",
    groups: Object.fromEntries(normalizedEntries.map((entry) => [entry, {}])),
  });
}
const ircSetupAdapter = {
  resolveAccountId: ({ accountId }) => normalizeAccountId(accountId),
  applyAccountName: ({ cfg, accountId, name }) =>
    applyAccountNameToChannelSection({
      cfg,
      channelKey: channel$8,
      accountId,
      name,
    }),
  validateInput: ({ input }) => {
    const setupInput = input;
    if (!setupInput.host?.trim()) return "IRC requires host.";
    if (!setupInput.nick?.trim()) return "IRC requires nick.";
    return null;
  },
  applyAccountConfig: ({ cfg, accountId, input }) => {
    const setupInput = input;
    const namedConfig = applyAccountNameToChannelSection({
      cfg,
      channelKey: channel$8,
      accountId,
      name: setupInput.name,
    });
    const portInput =
      typeof setupInput.port === "number" ? String(setupInput.port) : String(setupInput.port ?? "");
    return patchScopedAccountConfig({
      cfg: namedConfig,
      channelKey: channel$8,
      accountId,
      patch: {
        enabled: true,
        host: setupInput.host?.trim(),
        port: portInput ? parsePort(portInput, setupInput.tls === false ? 6667 : 6697) : void 0,
        tls: setupInput.tls,
        nick: setupInput.nick?.trim(),
        username: setupInput.username?.trim(),
        realname: setupInput.realname?.trim(),
        password: setupInput.password?.trim(),
        channels: setupInput.channels,
      },
    });
  },
};
//#endregion
//#region extensions/irc/src/setup-surface.ts
const channel$7 = "irc";
const USE_ENV_FLAG = "__ircUseEnv";
const TLS_FLAG = "__ircTls";
function parseListInput(raw) {
  return raw
    .split(/[\n,;]+/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}
function normalizeGroupEntry(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed === "*") return "*";
  const normalized = normalizeIrcMessagingTarget(trimmed) ?? trimmed;
  if (isChannelTarget(normalized)) return normalized;
  return `#${normalized.replace(/^#+/, "")}`;
}
const promptIrcAllowFrom = createPromptParsedAllowFromForAccount({
  defaultAccountId: (cfg) => resolveDefaultIrcAccountId(cfg),
  noteTitle: "IRC allowlist",
  noteLines: [
    "Allowlist IRC DMs by sender.",
    "Examples:",
    "- alice",
    "- alice!ident@example.org",
    "Multiple entries: comma-separated.",
  ],
  message: "IRC allowFrom (nick or nick!user@host)",
  placeholder: "alice, bob!ident@example.org",
  parseEntries: (raw) => ({
    entries: parseListInput(raw)
      .map((entry) => normalizeIrcAllowEntry(entry))
      .map((entry) => entry.trim())
      .filter(Boolean),
  }),
  getExistingAllowFrom: ({ cfg }) => cfg.channels?.irc?.allowFrom ?? [],
  applyAllowFrom: ({ cfg, allowFrom }) => setIrcAllowFrom(cfg, allowFrom),
});
async function promptIrcNickServConfig(params) {
  const existing = resolveIrcAccount({
    cfg: params.cfg,
    accountId: params.accountId,
  }).config.nickserv;
  const hasExisting = Boolean(existing?.password || existing?.passwordFile);
  if (
    !(await params.prompter.confirm({
      message: hasExisting ? "Update NickServ settings?" : "Configure NickServ identify/register?",
      initialValue: hasExisting,
    }))
  )
    return params.cfg;
  const service = String(
    await params.prompter.text({
      message: "NickServ service nick",
      initialValue: existing?.service || "NickServ",
      validate: (value) => (String(value ?? "").trim() ? void 0 : "Required"),
    }),
  ).trim();
  const useEnvPassword =
    params.accountId === "default" &&
    Boolean(process.env.IRC_NICKSERV_PASSWORD?.trim()) &&
    !(existing?.password || existing?.passwordFile)
      ? await params.prompter.confirm({
          message: "IRC_NICKSERV_PASSWORD detected. Use env var?",
          initialValue: true,
        })
      : false;
  const password = useEnvPassword
    ? void 0
    : String(
        await params.prompter.text({
          message: "NickServ password (blank to disable NickServ auth)",
          validate: () => void 0,
        }),
      ).trim();
  if (!password && !useEnvPassword)
    return setIrcNickServ(params.cfg, params.accountId, {
      enabled: false,
      service,
    });
  const register = await params.prompter.confirm({
    message: "Send NickServ REGISTER on connect?",
    initialValue: existing?.register ?? false,
  });
  const registerEmail = register
    ? String(
        await params.prompter.text({
          message: "NickServ register email",
          initialValue:
            existing?.registerEmail ||
            (params.accountId === "default" ? process.env.IRC_NICKSERV_REGISTER_EMAIL : void 0),
          validate: (value) => (String(value ?? "").trim() ? void 0 : "Required"),
        }),
      ).trim()
    : void 0;
  return setIrcNickServ(params.cfg, params.accountId, {
    enabled: true,
    service,
    ...(password ? { password } : {}),
    register,
    ...(registerEmail ? { registerEmail } : {}),
  });
}
const ircDmPolicy = {
  label: "IRC",
  channel: channel$7,
  policyKey: "channels.irc.dmPolicy",
  allowFromKey: "channels.irc.allowFrom",
  getCurrent: (cfg) => cfg.channels?.irc?.dmPolicy ?? "pairing",
  setPolicy: (cfg, policy) => setIrcDmPolicy(cfg, policy),
  promptAllowFrom: async ({ cfg, prompter, accountId }) =>
    await promptIrcAllowFrom({
      cfg,
      prompter,
      accountId,
    }),
};
const ircSetupWizard = {
  channel: channel$7,
  status: createStandardChannelSetupStatus({
    channelLabel: "IRC",
    configuredLabel: "configured",
    unconfiguredLabel: "needs host + nick",
    configuredHint: "configured",
    unconfiguredHint: "needs host + nick",
    configuredScore: 1,
    unconfiguredScore: 0,
    includeStatusLine: true,
    resolveConfigured: ({ cfg }) =>
      listIrcAccountIds(cfg).some(
        (accountId) =>
          resolveIrcAccount({
            cfg,
            accountId,
          }).configured,
      ),
  }),
  introNote: {
    title: "IRC setup",
    lines: [
      "IRC needs server host + bot nick.",
      "Recommended: TLS on port 6697.",
      "Optional: NickServ identify/register can be configured after the basic account fields.",
      'Set channels.irc.groupPolicy="allowlist" and channels.irc.groups for tighter channel control.',
      'Note: IRC channels are mention-gated by default. To allow unmentioned replies, set channels.irc.groups["#channel"].requireMention=false (or "*" for all).',
      "Env vars supported: IRC_HOST, IRC_PORT, IRC_TLS, IRC_NICK, IRC_USERNAME, IRC_REALNAME, IRC_PASSWORD, IRC_CHANNELS, IRC_NICKSERV_PASSWORD, IRC_NICKSERV_REGISTER_EMAIL.",
      `Docs: ${formatDocsLink("/channels/irc", "channels/irc")}`,
    ],
    shouldShow: ({ cfg, accountId }) =>
      !resolveIrcAccount({
        cfg,
        accountId,
      }).configured,
  },
  prepare: async ({ cfg, accountId, credentialValues, prompter }) => {
    const resolved = resolveIrcAccount({
      cfg,
      accountId,
    });
    const isDefaultAccount = accountId === DEFAULT_ACCOUNT_ID;
    const envHost = isDefaultAccount ? process.env.IRC_HOST?.trim() : "";
    const envNick = isDefaultAccount ? process.env.IRC_NICK?.trim() : "";
    if (Boolean(envHost && envNick && !resolved.config.host && !resolved.config.nick)) {
      if (
        await prompter.confirm({
          message: "IRC_HOST and IRC_NICK detected. Use env vars?",
          initialValue: true,
        })
      )
        return {
          cfg: updateIrcAccountConfig(cfg, accountId, { enabled: true }),
          credentialValues: {
            ...credentialValues,
            [USE_ENV_FLAG]: "1",
          },
        };
    }
    const tls = await prompter.confirm({
      message: "Use TLS for IRC?",
      initialValue: resolved.config.tls ?? true,
    });
    return {
      cfg: updateIrcAccountConfig(cfg, accountId, {
        enabled: true,
        tls,
      }),
      credentialValues: {
        ...credentialValues,
        [USE_ENV_FLAG]: "0",
        [TLS_FLAG]: tls ? "1" : "0",
      },
    };
  },
  credentials: [],
  textInputs: [
    {
      inputKey: "httpHost",
      message: "IRC server host",
      currentValue: ({ cfg, accountId }) =>
        resolveIrcAccount({
          cfg,
          accountId,
        }).config.host || void 0,
      shouldPrompt: ({ credentialValues }) => credentialValues[USE_ENV_FLAG] !== "1",
      validate: ({ value }) => (String(value ?? "").trim() ? void 0 : "Required"),
      normalizeValue: ({ value }) => String(value).trim(),
      applySet: async ({ cfg, accountId, value }) =>
        updateIrcAccountConfig(cfg, accountId, {
          enabled: true,
          host: value,
        }),
    },
    {
      inputKey: "httpPort",
      message: "IRC server port",
      currentValue: ({ cfg, accountId }) =>
        String(
          resolveIrcAccount({
            cfg,
            accountId,
          }).config.port ?? "",
        ),
      shouldPrompt: ({ credentialValues }) => credentialValues[USE_ENV_FLAG] !== "1",
      initialValue: ({ cfg, accountId, credentialValues }) => {
        const resolved = resolveIrcAccount({
          cfg,
          accountId,
        });
        const tls = credentialValues[TLS_FLAG] === "0" ? false : true;
        const defaultPort = resolved.config.port ?? (tls ? 6697 : 6667);
        return String(defaultPort);
      },
      validate: ({ value }) => {
        const parsed = Number.parseInt(String(value ?? "").trim(), 10);
        return Number.isFinite(parsed) && parsed >= 1 && parsed <= 65535
          ? void 0
          : "Use a port between 1 and 65535";
      },
      normalizeValue: ({ value }) => String(parsePort(String(value), 6697)),
      applySet: async ({ cfg, accountId, value }) =>
        updateIrcAccountConfig(cfg, accountId, {
          enabled: true,
          port: parsePort(String(value), 6697),
        }),
    },
    {
      inputKey: "token",
      message: "IRC nick",
      currentValue: ({ cfg, accountId }) =>
        resolveIrcAccount({
          cfg,
          accountId,
        }).config.nick || void 0,
      shouldPrompt: ({ credentialValues }) => credentialValues[USE_ENV_FLAG] !== "1",
      validate: ({ value }) => (String(value ?? "").trim() ? void 0 : "Required"),
      normalizeValue: ({ value }) => String(value).trim(),
      applySet: async ({ cfg, accountId, value }) =>
        updateIrcAccountConfig(cfg, accountId, {
          enabled: true,
          nick: value,
        }),
    },
    {
      inputKey: "userId",
      message: "IRC username",
      currentValue: ({ cfg, accountId }) =>
        resolveIrcAccount({
          cfg,
          accountId,
        }).config.username || void 0,
      shouldPrompt: ({ credentialValues }) => credentialValues[USE_ENV_FLAG] !== "1",
      initialValue: ({ cfg, accountId, credentialValues }) =>
        resolveIrcAccount({
          cfg,
          accountId,
        }).config.username ||
        credentialValues.token ||
        "openclaw",
      validate: ({ value }) => (String(value ?? "").trim() ? void 0 : "Required"),
      normalizeValue: ({ value }) => String(value).trim(),
      applySet: async ({ cfg, accountId, value }) =>
        updateIrcAccountConfig(cfg, accountId, {
          enabled: true,
          username: value,
        }),
    },
    {
      inputKey: "deviceName",
      message: "IRC real name",
      currentValue: ({ cfg, accountId }) =>
        resolveIrcAccount({
          cfg,
          accountId,
        }).config.realname || void 0,
      shouldPrompt: ({ credentialValues }) => credentialValues[USE_ENV_FLAG] !== "1",
      initialValue: ({ cfg, accountId }) =>
        resolveIrcAccount({
          cfg,
          accountId,
        }).config.realname || "OpenClaw",
      validate: ({ value }) => (String(value ?? "").trim() ? void 0 : "Required"),
      normalizeValue: ({ value }) => String(value).trim(),
      applySet: async ({ cfg, accountId, value }) =>
        updateIrcAccountConfig(cfg, accountId, {
          enabled: true,
          realname: value,
        }),
    },
    {
      inputKey: "groupChannels",
      message: "Auto-join IRC channels (optional, comma-separated)",
      placeholder: "#openclaw, #ops",
      required: false,
      applyEmptyValue: true,
      currentValue: ({ cfg, accountId }) =>
        resolveIrcAccount({
          cfg,
          accountId,
        }).config.channels?.join(", "),
      shouldPrompt: ({ credentialValues }) => credentialValues[USE_ENV_FLAG] !== "1",
      normalizeValue: ({ value }) =>
        parseListInput(String(value))
          .map((entry) => normalizeGroupEntry(entry))
          .filter((entry) => Boolean(entry && entry !== "*"))
          .filter((entry) => isChannelTarget(entry))
          .join(", "),
      applySet: async ({ cfg, accountId, value }) => {
        const channels = parseListInput(String(value))
          .map((entry) => normalizeGroupEntry(entry))
          .filter((entry) => Boolean(entry && entry !== "*"))
          .filter((entry) => isChannelTarget(entry));
        return updateIrcAccountConfig(cfg, accountId, {
          enabled: true,
          channels: channels.length > 0 ? channels : void 0,
        });
      },
    },
  ],
  groupAccess: {
    label: "IRC channels",
    placeholder: "#openclaw, #ops, *",
    currentPolicy: ({ cfg, accountId }) =>
      resolveIrcAccount({
        cfg,
        accountId,
      }).config.groupPolicy ?? "allowlist",
    currentEntries: ({ cfg, accountId }) =>
      Object.keys(
        resolveIrcAccount({
          cfg,
          accountId,
        }).config.groups ?? {},
      ),
    updatePrompt: ({ cfg, accountId }) =>
      Boolean(
        resolveIrcAccount({
          cfg,
          accountId,
        }).config.groups,
      ),
    setPolicy: ({ cfg, accountId, policy }) =>
      setIrcGroupAccess(cfg, accountId, policy, [], normalizeGroupEntry),
    resolveAllowlist: async ({ entries }) => [
      ...new Set(entries.map((entry) => normalizeGroupEntry(entry)).filter(Boolean)),
    ],
    applyAllowlist: ({ cfg, accountId, resolved }) =>
      setIrcGroupAccess(cfg, accountId, "allowlist", resolved, normalizeGroupEntry),
  },
  allowFrom: createAllowFromSection({
    helpTitle: "IRC allowlist",
    helpLines: [
      "Allowlist IRC DMs by sender.",
      "Examples:",
      "- alice",
      "- alice!ident@example.org",
      "Multiple entries: comma-separated.",
    ],
    message: "IRC allowFrom (nick or nick!user@host)",
    placeholder: "alice, bob!ident@example.org",
    invalidWithoutCredentialNote: "Use an IRC nick or nick!user@host entry.",
    parseId: (raw) => {
      return normalizeIrcAllowEntry(raw) || null;
    },
    apply: async ({ cfg, allowFrom }) => setIrcAllowFrom(cfg, allowFrom),
  }),
  finalize: async ({ cfg, accountId, prompter }) => {
    let next = cfg;
    const resolvedAfterGroups = resolveIrcAccount({
      cfg: next,
      accountId,
    });
    if (resolvedAfterGroups.config.groupPolicy === "allowlist") {
      if (Object.keys(resolvedAfterGroups.config.groups ?? {}).length > 0) {
        if (
          !(await prompter.confirm({
            message: "Require @mention to reply in IRC channels?",
            initialValue: true,
          }))
        ) {
          const groups = resolvedAfterGroups.config.groups ?? {};
          const patched = Object.fromEntries(
            Object.entries(groups).map(([key, value]) => [
              key,
              {
                ...value,
                requireMention: false,
              },
            ]),
          );
          next = updateIrcAccountConfig(next, accountId, { groups: patched });
        }
      }
    }
    next = await promptIrcNickServConfig({
      cfg: next,
      prompter,
      accountId,
    });
    return { cfg: next };
  },
  completionNote: {
    title: "IRC next steps",
    lines: [
      "Next: restart gateway and verify status.",
      "Command: openclaw channels status --probe",
      `Docs: ${formatDocsLink("/channels/irc", "channels/irc")}`,
    ],
  },
  dmPolicy: ircDmPolicy,
  disable: (cfg) => setSetupChannelEnabled(cfg, channel$7, false),
};
//#endregion
//#region extensions/irc/src/config-schema.ts
const IrcGroupSchema = z
  .object({
    requireMention: z.boolean().optional(),
    tools: ToolPolicySchema$1,
    toolsBySender: z.record(z.string(), ToolPolicySchema$1).optional(),
    skills: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
    allowFrom: z.array(z.union([z.string(), z.number()])).optional(),
    systemPrompt: z.string().optional(),
  })
  .strict();
const IrcNickServSchema = z
  .object({
    enabled: z.boolean().optional(),
    service: z.string().optional(),
    password: z.string().optional(),
    passwordFile: z.string().optional(),
    register: z.boolean().optional(),
    registerEmail: z.string().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.register && !value.registerEmail?.trim())
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["registerEmail"],
        message: "channels.irc.nickserv.register=true requires channels.irc.nickserv.registerEmail",
      });
  });
const IrcAccountSchemaBase = z
  .object({
    name: z.string().optional(),
    enabled: z.boolean().optional(),
    dangerouslyAllowNameMatching: z.boolean().optional(),
    host: z.string().optional(),
    port: z.number().int().min(1).max(65535).optional(),
    tls: z.boolean().optional(),
    nick: z.string().optional(),
    username: z.string().optional(),
    realname: z.string().optional(),
    password: z.string().optional(),
    passwordFile: z.string().optional(),
    nickserv: IrcNickServSchema.optional(),
    dmPolicy: DmPolicySchema$1.optional().default("pairing"),
    allowFrom: z.array(z.union([z.string(), z.number()])).optional(),
    groupPolicy: GroupPolicySchema$1.optional().default("allowlist"),
    groupAllowFrom: z.array(z.union([z.string(), z.number()])).optional(),
    groups: z.record(z.string(), IrcGroupSchema.optional()).optional(),
    channels: z.array(z.string()).optional(),
    mentionPatterns: z.array(z.string()).optional(),
    markdown: MarkdownConfigSchema$1,
    ...ReplyRuntimeConfigSchemaShape,
  })
  .strict();
const IrcAccountSchema = IrcAccountSchemaBase.superRefine((value, ctx) => {
  requireChannelOpenAllowFrom({
    channel: "irc",
    policy: value.dmPolicy,
    allowFrom: value.allowFrom,
    ctx,
    requireOpenAllowFrom,
  });
});
const IrcConfigSchema = IrcAccountSchemaBase.extend({
  accounts: z.record(z.string(), IrcAccountSchema.optional()).optional(),
  defaultAccount: z.string().optional(),
}).superRefine((value, ctx) => {
  requireChannelOpenAllowFrom({
    channel: "irc",
    policy: value.dmPolicy,
    allowFrom: value.allowFrom,
    ctx,
    requireOpenAllowFrom,
  });
});
//#endregion
//#region extensions/irc/src/protocol.ts
const IRC_TARGET_PATTERN = /^[^\s:]+$/u;
function parseIrcLine(line) {
  const raw = line.replace(/[\r\n]+/g, "").trim();
  if (!raw) return null;
  let cursor = raw;
  let prefix;
  if (cursor.startsWith(":")) {
    const idx = cursor.indexOf(" ");
    if (idx <= 1) return null;
    prefix = cursor.slice(1, idx);
    cursor = cursor.slice(idx + 1).trimStart();
  }
  if (!cursor) return null;
  const firstSpace = cursor.indexOf(" ");
  const command = (firstSpace === -1 ? cursor : cursor.slice(0, firstSpace)).trim();
  if (!command) return null;
  cursor = firstSpace === -1 ? "" : cursor.slice(firstSpace + 1);
  const params = [];
  let trailing;
  while (cursor.length > 0) {
    cursor = cursor.trimStart();
    if (!cursor) break;
    if (cursor.startsWith(":")) {
      trailing = cursor.slice(1);
      break;
    }
    const spaceIdx = cursor.indexOf(" ");
    if (spaceIdx === -1) {
      params.push(cursor);
      break;
    }
    params.push(cursor.slice(0, spaceIdx));
    cursor = cursor.slice(spaceIdx + 1);
  }
  return {
    raw,
    prefix,
    command: command.toUpperCase(),
    params,
    trailing,
  };
}
function parseIrcPrefix(prefix) {
  if (!prefix) return {};
  const nickPart = prefix.match(/^([^!@]+)!([^@]+)@(.+)$/);
  if (nickPart)
    return {
      nick: nickPart[1],
      user: nickPart[2],
      host: nickPart[3],
    };
  const nickHostPart = prefix.match(/^([^@]+)@(.+)$/);
  if (nickHostPart)
    return {
      nick: nickHostPart[1],
      host: nickHostPart[2],
    };
  if (prefix.includes("!")) {
    const [nick, user] = prefix.split("!", 2);
    return {
      nick,
      user,
    };
  }
  if (prefix.includes(".")) return { server: prefix };
  return { nick: prefix };
}
function decodeLiteralEscapes(input) {
  return input
    .replace(/\\r/g, "\r")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "	")
    .replace(/\\0/g, "\0")
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}
function sanitizeIrcOutboundText(text) {
  return stripIrcControlChars(decodeLiteralEscapes(text).replace(/\r?\n/g, " ")).trim();
}
function sanitizeIrcTarget(raw) {
  const decoded = decodeLiteralEscapes(raw);
  if (!decoded) throw new Error("IRC target is required");
  if (decoded !== decoded.trim()) throw new Error(`Invalid IRC target: ${raw}`);
  if (hasIrcControlChars(decoded)) throw new Error(`Invalid IRC target: ${raw}`);
  if (!IRC_TARGET_PATTERN.test(decoded)) throw new Error(`Invalid IRC target: ${raw}`);
  return decoded;
}
function makeIrcMessageId() {
  return randomUUID();
}
//#endregion
//#region extensions/irc/src/client.ts
const IRC_ERROR_CODES = new Set(["432", "464", "465"]);
const IRC_NICK_COLLISION_CODES = new Set(["433", "436"]);
function toError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : JSON.stringify(err));
}
function withTimeout(promise, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(/* @__PURE__ */ new Error(`${label} timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
function buildFallbackNick(nick) {
  const base = nick.replace(/\s+/g, "").replace(/[^A-Za-z0-9_\-\[\]\\`^{}|]/g, "") || "openclaw";
  const suffix = "_";
  const maxNickLen = 30;
  if (base.length >= maxNickLen) return `${base.slice(0, maxNickLen - 1)}${suffix}`;
  return `${base}${suffix}`;
}
function buildIrcNickServCommands(options) {
  if (!options || options.enabled === false) return [];
  const password = sanitizeIrcOutboundText(options.password ?? "");
  if (!password) return [];
  const service = sanitizeIrcTarget(options.service?.trim() || "NickServ");
  const commands = [`PRIVMSG ${service} :IDENTIFY ${password}`];
  if (options.register) {
    const registerEmail = sanitizeIrcOutboundText(options.registerEmail ?? "");
    if (!registerEmail) throw new Error("IRC NickServ register requires registerEmail");
    commands.push(`PRIVMSG ${service} :REGISTER ${password} ${registerEmail}`);
  }
  return commands;
}
async function connectIrcClient(options) {
  const timeoutMs = options.connectTimeoutMs != null ? options.connectTimeoutMs : 15e3;
  const messageChunkMaxChars =
    options.messageChunkMaxChars != null ? options.messageChunkMaxChars : 350;
  if (!options.host.trim()) throw new Error("IRC host is required");
  if (!options.nick.trim()) throw new Error("IRC nick is required");
  const desiredNick = options.nick.trim();
  let currentNick = desiredNick;
  let ready = false;
  let closed = false;
  let nickServRecoverAttempted = false;
  let fallbackNickAttempted = false;
  const socket = options.tls
    ? tls.connect({
        host: options.host,
        port: options.port,
        servername: options.host,
      })
    : net.connect({
        host: options.host,
        port: options.port,
      });
  socket.setEncoding("utf8");
  let resolveReady = null;
  let rejectReady = null;
  const readyPromise = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const fail = (err) => {
    const error = toError(err);
    if (options.onError) options.onError(error);
    if (!ready && rejectReady) {
      rejectReady(error);
      rejectReady = null;
      resolveReady = null;
    }
  };
  const sendRaw = (line) => {
    const cleaned = line.replace(/[\r\n]+/g, "").trim();
    if (!cleaned) throw new Error("IRC command cannot be empty");
    socket.write(`${cleaned}\r\n`);
  };
  const tryRecoverNickCollision = () => {
    const nickServEnabled = options.nickserv?.enabled !== false;
    const nickservPassword = sanitizeIrcOutboundText(options.nickserv?.password ?? "");
    if (nickServEnabled && !nickServRecoverAttempted && nickservPassword) {
      nickServRecoverAttempted = true;
      try {
        sendRaw(
          `PRIVMSG ${sanitizeIrcTarget(options.nickserv?.service?.trim() || "NickServ")} :GHOST ${desiredNick} ${nickservPassword}`,
        );
        sendRaw(`NICK ${desiredNick}`);
        return true;
      } catch (err) {
        fail(err);
      }
    }
    if (!fallbackNickAttempted) {
      fallbackNickAttempted = true;
      const fallbackNick = buildFallbackNick(desiredNick);
      if (fallbackNick.toLowerCase() !== currentNick.toLowerCase())
        try {
          sendRaw(`NICK ${fallbackNick}`);
          currentNick = fallbackNick;
          return true;
        } catch (err) {
          fail(err);
        }
    }
    return false;
  };
  const join = (channel) => {
    const target = sanitizeIrcTarget(channel);
    if (!target.startsWith("#") && !target.startsWith("&"))
      throw new Error(`IRC JOIN target must be a channel: ${channel}`);
    sendRaw(`JOIN ${target}`);
  };
  const sendPrivmsg = (target, text) => {
    const normalizedTarget = sanitizeIrcTarget(target);
    const cleaned = sanitizeIrcOutboundText(text);
    if (!cleaned) return;
    let remaining = cleaned;
    while (remaining.length > 0) {
      let chunk = remaining;
      if (chunk.length > messageChunkMaxChars) {
        let splitAt = chunk.lastIndexOf(" ", messageChunkMaxChars);
        if (splitAt < Math.floor(messageChunkMaxChars / 2)) splitAt = messageChunkMaxChars;
        chunk = chunk.slice(0, splitAt).trim();
      }
      if (!chunk) break;
      sendRaw(`PRIVMSG ${normalizedTarget} :${chunk}`);
      remaining = remaining.slice(chunk.length).trimStart();
    }
  };
  const quit = (reason) => {
    if (closed) return;
    closed = true;
    const safeReason = sanitizeIrcOutboundText(reason != null ? reason : "bye");
    try {
      if (safeReason) sendRaw(`QUIT :${safeReason}`);
      else sendRaw("QUIT");
    } catch {}
    socket.end();
  };
  const close = () => {
    if (closed) return;
    closed = true;
    socket.destroy();
  };
  let buffer = "";
  socket.on("data", (chunk) => {
    buffer += chunk;
    let idx = buffer.indexOf("\n");
    while (idx !== -1) {
      const rawLine = buffer.slice(0, idx).replace(/\r$/, "");
      buffer = buffer.slice(idx + 1);
      idx = buffer.indexOf("\n");
      if (!rawLine) continue;
      if (options.onLine) options.onLine(rawLine);
      const line = parseIrcLine(rawLine);
      if (!line) continue;
      if (line.command === "PING") {
        sendRaw(
          `PONG :${line.trailing != null ? line.trailing : line.params[0] != null ? line.params[0] : ""}`,
        );
        continue;
      }
      if (line.command === "NICK") {
        const prefix = parseIrcPrefix(line.prefix);
        if (prefix.nick && prefix.nick.toLowerCase() === currentNick.toLowerCase()) {
          const next =
            line.trailing != null
              ? line.trailing
              : line.params[0] != null
                ? line.params[0]
                : currentNick;
          currentNick = String(next).trim();
        }
        continue;
      }
      if (!ready && IRC_NICK_COLLISION_CODES.has(line.command)) {
        if (tryRecoverNickCollision()) continue;
        const detail =
          line.trailing != null ? line.trailing : line.params.join(" ") || "nickname in use";
        fail(/* @__PURE__ */ new Error(`IRC login failed (${line.command}): ${detail}`));
        close();
        return;
      }
      if (!ready && IRC_ERROR_CODES.has(line.command)) {
        const detail =
          line.trailing != null ? line.trailing : line.params.join(" ") || "login rejected";
        fail(/* @__PURE__ */ new Error(`IRC login failed (${line.command}): ${detail}`));
        close();
        return;
      }
      if (line.command === "001") {
        ready = true;
        const nickParam = line.params[0];
        if (nickParam && nickParam.trim()) currentNick = nickParam.trim();
        try {
          const nickServCommands = buildIrcNickServCommands(options.nickserv);
          for (const command of nickServCommands) sendRaw(command);
        } catch (err) {
          fail(err);
        }
        for (const channel of options.channels || []) {
          const trimmed = channel.trim();
          if (!trimmed) continue;
          try {
            join(trimmed);
          } catch (err) {
            fail(err);
          }
        }
        if (resolveReady) resolveReady();
        resolveReady = null;
        rejectReady = null;
        continue;
      }
      if (line.command === "NOTICE") {
        if (options.onNotice)
          options.onNotice(line.trailing != null ? line.trailing : "", line.params[0]);
        continue;
      }
      if (line.command === "PRIVMSG") {
        const targetParam = line.params[0];
        const target = targetParam ? targetParam.trim() : "";
        const text = line.trailing != null ? line.trailing : "";
        const prefix = parseIrcPrefix(line.prefix);
        const senderNick = prefix.nick ? prefix.nick.trim() : "";
        if (!target || !senderNick || !text.trim()) continue;
        if (options.onPrivmsg)
          Promise.resolve(
            options.onPrivmsg({
              senderNick,
              senderUser: prefix.user ? prefix.user.trim() : void 0,
              senderHost: prefix.host ? prefix.host.trim() : void 0,
              target,
              text,
              rawLine,
            }),
          ).catch((error) => {
            fail(error);
          });
      }
    }
  });
  socket.once("connect", () => {
    try {
      if (options.password && options.password.trim()) sendRaw(`PASS ${options.password.trim()}`);
      sendRaw(`NICK ${options.nick.trim()}`);
      sendRaw(`USER ${options.username.trim()} 0 * :${sanitizeIrcOutboundText(options.realname)}`);
    } catch (err) {
      fail(err);
      close();
    }
  });
  socket.once("error", (err) => {
    fail(err);
  });
  socket.once("close", () => {
    if (!closed) {
      closed = true;
      if (!ready) fail(/* @__PURE__ */ new Error("IRC connection closed before ready"));
    }
  });
  if (options.abortSignal) {
    const abort = () => {
      quit("shutdown");
    };
    if (options.abortSignal.aborted) abort();
    else options.abortSignal.addEventListener("abort", abort, { once: true });
  }
  await withTimeout(readyPromise, timeoutMs, "IRC connect");
  return {
    get nick() {
      return currentNick;
    },
    isReady: () => ready && !closed,
    sendRaw,
    join,
    sendPrivmsg,
    quit,
    close,
  };
}
//#endregion
//#region extensions/irc/src/connect-options.ts
function buildIrcConnectOptions(account, overrides = {}) {
  return {
    host: account.host,
    port: account.port,
    tls: account.tls,
    nick: account.nick,
    username: account.username,
    realname: account.realname,
    password: account.password,
    nickserv: {
      enabled: account.config.nickserv?.enabled,
      service: account.config.nickserv?.service,
      password: account.config.nickserv?.password,
      register: account.config.nickserv?.register,
      registerEmail: account.config.nickserv?.registerEmail,
    },
    ...overrides,
  };
}
//#endregion
//#region extensions/irc/src/policy.ts
function resolveIrcGroupMatch(params) {
  const groups = params.groups ?? {};
  const hasConfiguredGroups = Object.keys(groups).length > 0;
  const direct = groups[params.target];
  if (direct)
    return {
      allowed: true,
      groupConfig: direct,
      wildcardConfig: groups["*"],
      hasConfiguredGroups,
    };
  const targetLower = params.target.toLowerCase();
  const directKey = Object.keys(groups).find((key) => key.toLowerCase() === targetLower);
  if (directKey) {
    const matched = groups[directKey];
    if (matched)
      return {
        allowed: true,
        groupConfig: matched,
        wildcardConfig: groups["*"],
        hasConfiguredGroups,
      };
  }
  const wildcard = groups["*"];
  if (wildcard)
    return {
      allowed: true,
      wildcardConfig: wildcard,
      hasConfiguredGroups,
    };
  return {
    allowed: false,
    hasConfiguredGroups,
  };
}
function resolveIrcGroupAccessGate(params) {
  const policy = params.groupPolicy ?? "allowlist";
  if (policy === "disabled")
    return {
      allowed: false,
      reason: "groupPolicy=disabled",
    };
  if (policy === "allowlist") {
    if (!params.groupMatch.hasConfiguredGroups)
      return {
        allowed: false,
        reason: "groupPolicy=allowlist and no groups configured",
      };
    if (!params.groupMatch.allowed)
      return {
        allowed: false,
        reason: "not allowlisted",
      };
  }
  if (
    params.groupMatch.groupConfig?.enabled === false ||
    params.groupMatch.wildcardConfig?.enabled === false
  )
    return {
      allowed: false,
      reason: "disabled",
    };
  return {
    allowed: true,
    reason: policy === "open" ? "open" : "allowlisted",
  };
}
function resolveIrcRequireMention(params) {
  if (params.groupConfig?.requireMention !== void 0) return params.groupConfig.requireMention;
  if (params.wildcardConfig?.requireMention !== void 0) return params.wildcardConfig.requireMention;
  return true;
}
function resolveIrcMentionGate(params) {
  if (!params.isGroup)
    return {
      shouldSkip: false,
      reason: "direct",
    };
  if (!params.requireMention)
    return {
      shouldSkip: false,
      reason: "mention-not-required",
    };
  if (params.wasMentioned)
    return {
      shouldSkip: false,
      reason: "mentioned",
    };
  if (params.hasControlCommand && params.allowTextCommands && params.commandAuthorized)
    return {
      shouldSkip: false,
      reason: "authorized-command",
    };
  return {
    shouldSkip: true,
    reason: "missing-mention",
  };
}
function resolveIrcGroupSenderAllowed(params) {
  const policy = params.groupPolicy ?? "allowlist";
  const inner = normalizeIrcAllowlist(params.innerAllowFrom);
  const outer = normalizeIrcAllowlist(params.outerAllowFrom);
  if (inner.length > 0)
    return resolveIrcAllowlistMatch({
      allowFrom: inner,
      message: params.message,
      allowNameMatching: params.allowNameMatching,
    }).allowed;
  if (outer.length > 0)
    return resolveIrcAllowlistMatch({
      allowFrom: outer,
      message: params.message,
      allowNameMatching: params.allowNameMatching,
    }).allowed;
  return policy === "open";
}
//#endregion
//#region extensions/irc/src/runtime.ts
const { setRuntime: setIrcRuntime, getRuntime: getIrcRuntime } = createPluginRuntimeStore(
  "IRC runtime not initialized",
);
//#endregion
//#region extensions/irc/src/send.ts
function resolveTarget(to, opts) {
  const fromArg = normalizeIrcMessagingTarget(to);
  if (fromArg) return fromArg;
  const fromOpt = normalizeIrcMessagingTarget(opts?.target ?? "");
  if (fromOpt) return fromOpt;
  throw new Error(`Invalid IRC target: ${to}`);
}
async function sendMessageIrc(to, text, opts = {}) {
  const runtime = getIrcRuntime();
  const cfg = opts.cfg ?? runtime.config.loadConfig();
  const account = resolveIrcAccount({
    cfg,
    accountId: opts.accountId,
  });
  if (!account.configured)
    throw new Error(
      `IRC is not configured for account "${account.accountId}" (need host and nick in channels.irc).`,
    );
  const target = resolveTarget(to, opts);
  const tableMode = runtime.channel.text.resolveMarkdownTableMode({
    cfg,
    channel: "irc",
    accountId: account.accountId,
  });
  const prepared = runtime.channel.text.convertMarkdownTables(text.trim(), tableMode);
  const payload = opts.replyTo ? `${prepared}\n\n[reply:${opts.replyTo}]` : prepared;
  if (!payload.trim()) throw new Error("Message must be non-empty for IRC sends");
  const client = opts.client;
  if (client?.isReady()) client.sendPrivmsg(target, payload);
  else {
    const transient = await connectIrcClient(
      buildIrcConnectOptions(account, { connectTimeoutMs: 12e3 }),
    );
    transient.sendPrivmsg(target, payload);
    transient.quit("sent");
  }
  runtime.channel.activity.record({
    channel: "irc",
    accountId: account.accountId,
    direction: "outbound",
  });
  return {
    messageId: makeIrcMessageId(),
    target,
  };
}
//#endregion
//#region extensions/irc/src/inbound.ts
const CHANNEL_ID$6 = "irc";
const escapeIrcRegexLiteral = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function resolveIrcEffectiveAllowlists(params) {
  const { effectiveAllowFrom, effectiveGroupAllowFrom } = resolveEffectiveAllowFromLists({
    allowFrom: params.configAllowFrom,
    groupAllowFrom: params.configGroupAllowFrom,
    storeAllowFrom: params.storeAllowList,
    dmPolicy: params.dmPolicy,
    groupAllowFromFallbackToAllowFrom: false,
  });
  return {
    effectiveAllowFrom,
    effectiveGroupAllowFrom,
  };
}
async function deliverIrcReply(params) {
  if (
    !(await deliverFormattedTextWithAttachments({
      payload: params.payload,
      send: async ({ text, replyToId }) => {
        if (params.sendReply) await params.sendReply(params.target, text, replyToId);
        else
          await sendMessageIrc(params.target, text, {
            accountId: params.accountId,
            replyTo: replyToId,
          });
        params.statusSink?.({ lastOutboundAt: Date.now() });
      },
    }))
  )
    return;
}
async function handleIrcInbound(params) {
  const { message, account, config, runtime, connectedNick, statusSink } = params;
  const core = getIrcRuntime();
  const pairing = createChannelPairingController({
    core,
    channel: CHANNEL_ID$6,
    accountId: account.accountId,
  });
  const rawBody = message.text?.trim() ?? "";
  if (!rawBody) return;
  statusSink?.({ lastInboundAt: message.timestamp });
  const senderDisplay = message.senderHost
    ? `${message.senderNick}!${message.senderUser ?? "?"}@${message.senderHost}`
    : message.senderNick;
  const allowNameMatching = isDangerousNameMatchingEnabled(account.config);
  const dmPolicy = account.config.dmPolicy ?? "pairing";
  const defaultGroupPolicy = resolveDefaultGroupPolicy(config);
  const { groupPolicy, providerMissingFallbackApplied } =
    resolveAllowlistProviderRuntimeGroupPolicy({
      providerConfigPresent: config.channels?.irc !== void 0,
      groupPolicy: account.config.groupPolicy,
      defaultGroupPolicy,
    });
  warnMissingProviderGroupPolicyFallbackOnce({
    providerMissingFallbackApplied,
    providerKey: "irc",
    accountId: account.accountId,
    blockedLabel: GROUP_POLICY_BLOCKED_LABEL.channel,
    log: (message) => runtime.log?.(message),
  });
  const configAllowFrom = normalizeIrcAllowlist(account.config.allowFrom);
  const configGroupAllowFrom = normalizeIrcAllowlist(account.config.groupAllowFrom);
  const storeAllowList = normalizeIrcAllowlist(
    await readStoreAllowFromForDmPolicy({
      provider: CHANNEL_ID$6,
      accountId: account.accountId,
      dmPolicy,
      readStore: pairing.readStoreForDmPolicy,
    }),
  );
  const groupMatch = resolveIrcGroupMatch({
    groups: account.config.groups,
    target: message.target,
  });
  if (message.isGroup) {
    const groupAccess = resolveIrcGroupAccessGate({
      groupPolicy,
      groupMatch,
    });
    if (!groupAccess.allowed) {
      runtime.log?.(`irc: drop channel ${message.target} (${groupAccess.reason})`);
      return;
    }
  }
  const directGroupAllowFrom = normalizeIrcAllowlist(groupMatch.groupConfig?.allowFrom);
  const wildcardGroupAllowFrom = normalizeIrcAllowlist(groupMatch.wildcardConfig?.allowFrom);
  const groupAllowFrom =
    directGroupAllowFrom.length > 0 ? directGroupAllowFrom : wildcardGroupAllowFrom;
  const { effectiveAllowFrom, effectiveGroupAllowFrom } = resolveIrcEffectiveAllowlists({
    configAllowFrom,
    configGroupAllowFrom,
    storeAllowList,
    dmPolicy,
  });
  const allowTextCommands = core.channel.commands.shouldHandleTextCommands({
    cfg: config,
    surface: CHANNEL_ID$6,
  });
  const useAccessGroups = config.commands?.useAccessGroups !== false;
  const senderAllowedForCommands = resolveIrcAllowlistMatch({
    allowFrom: message.isGroup ? effectiveGroupAllowFrom : effectiveAllowFrom,
    message,
    allowNameMatching,
  }).allowed;
  const hasControlCommand = core.channel.text.hasControlCommand(rawBody, config);
  const commandGate = resolveControlCommandGate({
    useAccessGroups,
    authorizers: [
      {
        configured: (message.isGroup ? effectiveGroupAllowFrom : effectiveAllowFrom).length > 0,
        allowed: senderAllowedForCommands,
      },
    ],
    allowTextCommands,
    hasControlCommand,
  });
  const commandAuthorized = commandGate.commandAuthorized;
  if (message.isGroup) {
    if (
      !resolveIrcGroupSenderAllowed({
        groupPolicy,
        message,
        outerAllowFrom: effectiveGroupAllowFrom,
        innerAllowFrom: groupAllowFrom,
        allowNameMatching,
      })
    ) {
      runtime.log?.(`irc: drop group sender ${senderDisplay} (policy=${groupPolicy})`);
      return;
    }
  } else {
    if (dmPolicy === "disabled") {
      runtime.log?.(`irc: drop DM sender=${senderDisplay} (dmPolicy=disabled)`);
      return;
    }
    if (dmPolicy !== "open") {
      if (
        !resolveIrcAllowlistMatch({
          allowFrom: effectiveAllowFrom,
          message,
          allowNameMatching,
        }).allowed
      ) {
        if (dmPolicy === "pairing")
          await pairing.issueChallenge({
            senderId: senderDisplay.toLowerCase(),
            senderIdLine: `Your IRC id: ${senderDisplay}`,
            meta: { name: message.senderNick || void 0 },
            sendPairingReply: async (text) => {
              await deliverIrcReply({
                payload: { text },
                target: message.senderNick,
                accountId: account.accountId,
                sendReply: params.sendReply,
                statusSink,
              });
            },
            onReplyError: (err) => {
              runtime.error?.(`irc: pairing reply failed for ${senderDisplay}: ${String(err)}`);
            },
          });
        runtime.log?.(`irc: drop DM sender ${senderDisplay} (dmPolicy=${dmPolicy})`);
        return;
      }
    }
  }
  if (message.isGroup && commandGate.shouldBlock) {
    logInboundDrop({
      log: (line) => runtime.log?.(line),
      channel: CHANNEL_ID$6,
      reason: "control command (unauthorized)",
      target: senderDisplay,
    });
    return;
  }
  const mentionRegexes = core.channel.mentions.buildMentionRegexes(config);
  const mentionNick = connectedNick?.trim() || account.nick;
  const explicitMentionRegex = mentionNick
    ? new RegExp(`\\b${escapeIrcRegexLiteral(mentionNick)}\\b[:,]?`, "i")
    : null;
  const wasMentioned =
    core.channel.mentions.matchesMentionPatterns(rawBody, mentionRegexes) ||
    (explicitMentionRegex ? explicitMentionRegex.test(rawBody) : false);
  const requireMention = message.isGroup
    ? resolveIrcRequireMention({
        groupConfig: groupMatch.groupConfig,
        wildcardConfig: groupMatch.wildcardConfig,
      })
    : false;
  const mentionGate = resolveIrcMentionGate({
    isGroup: message.isGroup,
    requireMention,
    wasMentioned,
    hasControlCommand,
    allowTextCommands,
    commandAuthorized,
  });
  if (mentionGate.shouldSkip) {
    runtime.log?.(`irc: drop channel ${message.target} (${mentionGate.reason})`);
    return;
  }
  const peerId = message.isGroup ? message.target : message.senderNick;
  const route = core.channel.routing.resolveAgentRoute({
    cfg: config,
    channel: CHANNEL_ID$6,
    accountId: account.accountId,
    peer: {
      kind: message.isGroup ? "group" : "direct",
      id: peerId,
    },
  });
  const fromLabel = message.isGroup ? message.target : senderDisplay;
  const storePath = core.channel.session.resolveStorePath(config.session?.store, {
    agentId: route.agentId,
  });
  const envelopeOptions = core.channel.reply.resolveEnvelopeFormatOptions(config);
  const previousTimestamp = core.channel.session.readSessionUpdatedAt({
    storePath,
    sessionKey: route.sessionKey,
  });
  const body = core.channel.reply.formatAgentEnvelope({
    channel: "IRC",
    from: fromLabel,
    timestamp: message.timestamp,
    previousTimestamp,
    envelope: envelopeOptions,
    body: rawBody,
  });
  const groupSystemPrompt = groupMatch.groupConfig?.systemPrompt?.trim() || void 0;
  const ctxPayload = core.channel.reply.finalizeInboundContext({
    Body: body,
    RawBody: rawBody,
    CommandBody: rawBody,
    From: message.isGroup ? `irc:channel:${message.target}` : `irc:${senderDisplay}`,
    To: `irc:${peerId}`,
    SessionKey: route.sessionKey,
    AccountId: route.accountId,
    ChatType: message.isGroup ? "group" : "direct",
    ConversationLabel: fromLabel,
    SenderName: message.senderNick || void 0,
    SenderId: senderDisplay,
    GroupSubject: message.isGroup ? message.target : void 0,
    GroupSystemPrompt: message.isGroup ? groupSystemPrompt : void 0,
    Provider: CHANNEL_ID$6,
    Surface: CHANNEL_ID$6,
    WasMentioned: message.isGroup ? wasMentioned : void 0,
    MessageSid: message.messageId,
    Timestamp: message.timestamp,
    OriginatingChannel: CHANNEL_ID$6,
    OriginatingTo: `irc:${peerId}`,
    CommandAuthorized: commandAuthorized,
  });
  await dispatchInboundReplyWithBase({
    cfg: config,
    channel: CHANNEL_ID$6,
    accountId: account.accountId,
    route,
    storePath,
    ctxPayload,
    core,
    deliver: async (payload) => {
      await deliverIrcReply({
        payload,
        target: peerId,
        accountId: account.accountId,
        sendReply: params.sendReply,
        statusSink,
      });
    },
    onRecordError: (err) => {
      runtime.error?.(`irc: failed updating session meta: ${String(err)}`);
    },
    onDispatchError: (err, info) => {
      runtime.error?.(`irc ${info.kind} reply failed: ${String(err)}`);
    },
    replyOptions: {
      skillFilter: groupMatch.groupConfig?.skills,
      disableBlockStreaming:
        typeof account.config.blockStreaming === "boolean"
          ? !account.config.blockStreaming
          : void 0,
    },
  });
}
//#endregion
//#region extensions/irc/src/monitor.ts
function resolveIrcInboundTarget(params) {
  const rawTarget = params.target;
  if (isChannelTarget(rawTarget))
    return {
      isGroup: true,
      target: rawTarget,
      rawTarget,
    };
  return {
    isGroup: false,
    target: params.senderNick.trim() || rawTarget,
    rawTarget,
  };
}
async function monitorIrcProvider(opts) {
  const core = getIrcRuntime();
  const cfg = opts.config ?? core.config.loadConfig();
  const account = resolveIrcAccount({
    cfg,
    accountId: opts.accountId,
  });
  const runtime = resolveLoggerBackedRuntime(opts.runtime, core.logging.getChildLogger());
  if (!account.configured)
    throw new Error(
      `IRC is not configured for account "${account.accountId}" (need host and nick in channels.irc).`,
    );
  const logger = core.logging.getChildLogger({
    channel: "irc",
    accountId: account.accountId,
  });
  let client = null;
  client = await connectIrcClient(
    buildIrcConnectOptions(account, {
      channels: account.config.channels,
      abortSignal: opts.abortSignal,
      onLine: (line) => {
        if (core.logging.shouldLogVerbose()) logger.debug?.(`[${account.accountId}] << ${line}`);
      },
      onNotice: (text, target) => {
        if (core.logging.shouldLogVerbose())
          logger.debug?.(`[${account.accountId}] notice ${target ?? ""}: ${text}`);
      },
      onError: (error) => {
        logger.error(`[${account.accountId}] IRC error: ${error.message}`);
      },
      onPrivmsg: async (event) => {
        if (!client) return;
        if (event.senderNick.toLowerCase() === client.nick.toLowerCase()) return;
        const inboundTarget = resolveIrcInboundTarget({
          target: event.target,
          senderNick: event.senderNick,
        });
        const message = {
          messageId: makeIrcMessageId(),
          target: inboundTarget.target,
          rawTarget: inboundTarget.rawTarget,
          senderNick: event.senderNick,
          senderUser: event.senderUser,
          senderHost: event.senderHost,
          text: event.text,
          timestamp: Date.now(),
          isGroup: inboundTarget.isGroup,
        };
        core.channel.activity.record({
          channel: "irc",
          accountId: account.accountId,
          direction: "inbound",
          at: message.timestamp,
        });
        if (opts.onMessage) {
          await opts.onMessage(message, client);
          return;
        }
        await handleIrcInbound({
          message,
          account,
          config: cfg,
          runtime,
          connectedNick: client.nick,
          sendReply: async (target, text) => {
            client?.sendPrivmsg(target, text);
            opts.statusSink?.({ lastOutboundAt: Date.now() });
            core.channel.activity.record({
              channel: "irc",
              accountId: account.accountId,
              direction: "outbound",
            });
          },
          statusSink: opts.statusSink,
        });
      },
    }),
  );
  logger.info(
    `[${account.accountId}] connected to ${account.host}:${account.port}${account.tls ? " (tls)" : ""} as ${client.nick}`,
  );
  return {
    stop: () => {
      client?.quit("shutdown");
      client = null;
    },
  };
}
//#endregion
//#region extensions/irc/src/probe.ts
function formatError$1(err) {
  if (err instanceof Error) return err.message;
  return typeof err === "string" ? err : JSON.stringify(err);
}
async function probeIrc(cfg, opts) {
  const account = resolveIrcAccount({
    cfg,
    accountId: opts?.accountId,
  });
  const base = {
    ok: false,
    host: account.host,
    port: account.port,
    tls: account.tls,
    nick: account.nick,
  };
  if (!account.configured)
    return {
      ...base,
      error: "missing host or nick",
    };
  const started = Date.now();
  try {
    const client = await connectIrcClient(
      buildIrcConnectOptions(account, { connectTimeoutMs: opts?.timeoutMs ?? 8e3 }),
    );
    const elapsed = Date.now() - started;
    client.quit("probe");
    return {
      ...base,
      ok: true,
      latencyMs: elapsed,
    };
  } catch (err) {
    return {
      ...base,
      error: formatError$1(err),
    };
  }
}
//#endregion
//#region extensions/irc/src/channel.ts
const meta$3 = getChatChannelMeta("irc");
function normalizePairingTarget(raw) {
  const normalized = normalizeIrcAllowEntry(raw);
  if (!normalized) return "";
  return normalized.split(/[!@]/, 1)[0]?.trim() ?? "";
}
const ircConfigAdapter = createScopedChannelConfigAdapter({
  sectionKey: "irc",
  listAccountIds: listIrcAccountIds,
  resolveAccount: adaptScopedAccountAccessor(resolveIrcAccount),
  defaultAccountId: resolveDefaultIrcAccountId,
  clearBaseFields: [
    "name",
    "host",
    "port",
    "tls",
    "nick",
    "username",
    "realname",
    "password",
    "passwordFile",
    "channels",
  ],
  resolveAllowFrom: (account) => account.config.allowFrom,
  formatAllowFrom: (allowFrom) =>
    formatNormalizedAllowFromEntries({
      allowFrom,
      normalizeEntry: normalizeIrcAllowEntry,
    }),
  resolveDefaultTo: (account) => account.config.defaultTo,
});
const resolveIrcDmPolicy = createScopedDmSecurityResolver({
  channelKey: "irc",
  resolvePolicy: (account) => account.config.dmPolicy,
  resolveAllowFrom: (account) => account.config.allowFrom,
  policyPathSuffix: "dmPolicy",
  normalizeEntry: (raw) => normalizeIrcAllowEntry(raw),
});
const collectIrcSecurityWarnings = composeAccountWarningCollectors(
  createAllowlistProviderOpenWarningCollector({
    providerConfigPresent: (cfg) => cfg.channels?.irc !== void 0,
    resolveGroupPolicy: (account) => account.config.groupPolicy,
    buildOpenWarning: {
      surface: "IRC channels",
      openBehavior: "allows all channels and senders (mention-gated)",
      remediation: 'Prefer channels.irc.groupPolicy="allowlist" with channels.irc.groups',
    },
  }),
  (account) =>
    !account.config.tls &&
    "- IRC TLS is disabled (channels.irc.tls=false); traffic and credentials are plaintext.",
  (account) =>
    account.config.nickserv?.register &&
    '- IRC NickServ registration is enabled (channels.irc.nickserv.register=true); this sends "REGISTER" on every connect. Disable after first successful registration.',
  (account) =>
    account.config.nickserv?.register &&
    !account.config.nickserv.password?.trim() &&
    "- IRC NickServ registration is enabled but no NickServ password is resolved; set channels.irc.nickserv.password, channels.irc.nickserv.passwordFile, or IRC_NICKSERV_PASSWORD.",
);
const ircPlugin = createChatChannelPlugin({
  base: {
    id: "irc",
    meta: {
      ...meta$3,
      quickstartAllowFrom: true,
    },
    setup: ircSetupAdapter,
    setupWizard: ircSetupWizard,
    capabilities: {
      chatTypes: ["direct", "group"],
      media: true,
      blockStreaming: true,
    },
    reload: { configPrefixes: ["channels.irc"] },
    configSchema: buildChannelConfigSchema(IrcConfigSchema),
    config: {
      ...ircConfigAdapter,
      isConfigured: (account) => account.configured,
      describeAccount: (account) =>
        describeAccountSnapshot({
          account,
          configured: account.configured,
          extra: {
            host: account.host,
            port: account.port,
            tls: account.tls,
            nick: account.nick,
            passwordSource: account.passwordSource,
          },
        }),
    },
    groups: {
      resolveRequireMention: ({ cfg, accountId, groupId }) => {
        const account = resolveIrcAccount({
          cfg,
          accountId,
        });
        if (!groupId) return true;
        const match = resolveIrcGroupMatch({
          groups: account.config.groups,
          target: groupId,
        });
        return resolveIrcRequireMention({
          groupConfig: match.groupConfig,
          wildcardConfig: match.wildcardConfig,
        });
      },
      resolveToolPolicy: ({ cfg, accountId, groupId }) => {
        const account = resolveIrcAccount({
          cfg,
          accountId,
        });
        if (!groupId) return;
        const match = resolveIrcGroupMatch({
          groups: account.config.groups,
          target: groupId,
        });
        return match.groupConfig?.tools ?? match.wildcardConfig?.tools;
      },
    },
    messaging: {
      normalizeTarget: normalizeIrcMessagingTarget,
      targetResolver: {
        looksLikeId: looksLikeIrcTargetId,
        hint: "<#channel|nick>",
      },
    },
    resolver: {
      resolveTargets: async ({ inputs, kind }) => {
        return inputs.map((input) => {
          const normalized = normalizeIrcMessagingTarget(input);
          if (!normalized)
            return {
              input,
              resolved: false,
              note: "invalid IRC target",
            };
          if (kind === "group") {
            const groupId = isChannelTarget(normalized) ? normalized : `#${normalized}`;
            return {
              input,
              resolved: true,
              id: groupId,
              name: groupId,
            };
          }
          if (isChannelTarget(normalized))
            return {
              input,
              resolved: false,
              note: "expected user target",
            };
          return {
            input,
            resolved: true,
            id: normalized,
            name: normalized,
          };
        });
      },
    },
    directory: createChannelDirectoryAdapter({
      listPeers: async (params) =>
        listResolvedDirectoryEntriesFromSources({
          ...params,
          kind: "user",
          resolveAccount: adaptScopedAccountAccessor(resolveIrcAccount),
          resolveSources: (account) => [
            account.config.allowFrom ?? [],
            account.config.groupAllowFrom ?? [],
            ...Object.values(account.config.groups ?? {}).map((group) => group.allowFrom ?? []),
          ],
          normalizeId: (entry) => normalizePairingTarget(entry) || null,
        }),
      listGroups: async (params) => {
        return listResolvedDirectoryEntriesFromSources({
          ...params,
          kind: "group",
          resolveAccount: adaptScopedAccountAccessor(resolveIrcAccount),
          resolveSources: (account) => [
            account.config.channels ?? [],
            Object.keys(account.config.groups ?? {}),
          ],
          normalizeId: (entry) => {
            const normalized = normalizeIrcMessagingTarget(entry);
            return normalized && isChannelTarget(normalized) ? normalized : null;
          },
        }).map((entry) => ({
          ...entry,
          name: entry.id,
        }));
      },
    }),
    status: createComputedAccountStatusAdapter({
      defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID),
      buildChannelSummary: ({ account, snapshot }) => ({
        ...buildBaseChannelStatusSummary(snapshot),
        host: account.host,
        port: snapshot.port,
        tls: account.tls,
        nick: account.nick,
        probe: snapshot.probe,
        lastProbeAt: snapshot.lastProbeAt ?? null,
      }),
      probeAccount: async ({ cfg, account, timeoutMs }) =>
        probeIrc(cfg, {
          accountId: account.accountId,
          timeoutMs,
        }),
      resolveAccountSnapshot: ({ account }) => ({
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured: account.configured,
        extra: {
          host: account.host,
          port: account.port,
          tls: account.tls,
          nick: account.nick,
          passwordSource: account.passwordSource,
        },
      }),
    }),
    gateway: {
      startAccount: async (ctx) => {
        const account = ctx.account;
        const statusSink = createAccountStatusSink({
          accountId: ctx.accountId,
          setStatus: ctx.setStatus,
        });
        if (!account.configured)
          throw new Error(
            `IRC is not configured for account "${account.accountId}" (need host and nick in channels.irc).`,
          );
        ctx.log?.info(
          `[${account.accountId}] starting IRC provider (${account.host}:${account.port}${account.tls ? " tls" : ""})`,
        );
        await runStoppablePassiveMonitor({
          abortSignal: ctx.abortSignal,
          start: async () =>
            await monitorIrcProvider({
              accountId: account.accountId,
              config: ctx.cfg,
              runtime: ctx.runtime,
              abortSignal: ctx.abortSignal,
              statusSink,
            }),
        });
      },
    },
  },
  pairing: {
    text: {
      idLabel: "ircUser",
      message: PAIRING_APPROVED_MESSAGE,
      normalizeAllowEntry: (entry) => normalizeIrcAllowEntry(entry),
      notify: async ({ id, message }) => {
        const target = normalizePairingTarget(id);
        if (!target) throw new Error(`invalid IRC pairing id: ${id}`);
        await sendMessageIrc(target, message);
      },
    },
  },
  security: {
    resolveDmPolicy: resolveIrcDmPolicy,
    collectWarnings: collectIrcSecurityWarnings,
  },
  outbound: {
    base: {
      deliveryMode: "direct",
      chunker: (text, limit) => getIrcRuntime().channel.text.chunkMarkdownText(text, limit),
      chunkerMode: "markdown",
      textChunkLimit: 350,
    },
    attachedResults: {
      channel: "irc",
      sendText: async ({ cfg, to, text, accountId, replyToId }) =>
        await sendMessageIrc(to, text, {
          cfg,
          accountId: accountId ?? void 0,
          replyTo: replyToId ?? void 0,
        }),
      sendMedia: async ({ cfg, to, text, mediaUrl, accountId, replyToId }) =>
        await sendMessageIrc(to, mediaUrl ? `${text}\n\nAttachment: ${mediaUrl}` : text, {
          cfg,
          accountId: accountId ?? void 0,
          replyTo: replyToId ?? void 0,
        }),
    },
  },
});
defineChannelPluginEntry({
  id: "irc",
  name: "IRC",
  description: "IRC channel plugin",
  plugin: ircPlugin,
  setRuntime: setIrcRuntime,
});
//#endregion
//#region extensions/line/src/config-adapter.ts
function normalizeLineAllowFrom(entry) {
  return entry.replace(/^line:(?:user:)?/i, "");
}
const lineChannelPluginCommon = {
  meta: {
    id: "line",
    label: "LINE",
    selectionLabel: "LINE (Messaging API)",
    detailLabel: "LINE Bot",
    docsPath: "/channels/line",
    docsLabel: "line",
    blurb: "LINE Messaging API bot for Japan/Taiwan/Thailand markets.",
    systemImage: "message.fill",
    quickstartAllowFrom: true,
  },
  capabilities: {
    chatTypes: ["direct", "group"],
    reactions: false,
    threads: false,
    media: true,
    nativeCommands: false,
    blockStreaming: true,
  },
  reload: { configPrefixes: ["channels.line"] },
  configSchema: LineChannelConfigSchema,
  config: {
    ...createScopedChannelConfigAdapter({
      sectionKey: "line",
      listAccountIds: listLineAccountIds,
      resolveAccount: (cfg, accountId) =>
        resolveLineAccount({
          cfg,
          accountId: accountId ?? void 0,
        }),
      defaultAccountId: resolveDefaultLineAccountId,
      clearBaseFields: ["channelSecret", "tokenFile", "secretFile"],
      resolveAllowFrom: (account) => account.config.allowFrom,
      formatAllowFrom: (allowFrom) =>
        allowFrom
          .map((entry) => String(entry).trim())
          .filter(Boolean)
          .map(normalizeLineAllowFrom),
    }),
    isConfigured: (account) =>
      Boolean(account.channelAccessToken?.trim() && account.channelSecret?.trim()),
    describeAccount: (account) => ({
      accountId: account.accountId,
      name: account.name,
      enabled: account.enabled,
      configured: Boolean(account.channelAccessToken?.trim() && account.channelSecret?.trim()),
      tokenSource: account.tokenSource ?? void 0,
    }),
  },
};
//#endregion
//#region extensions/line/src/group-policy.ts
function resolveLineGroupRequireMention(params) {
  const exactGroupId = resolveExactLineGroupConfigKey({
    cfg: params.cfg,
    accountId: params.accountId,
    groupId: params.groupId,
  });
  return resolveChannelGroupRequireMention({
    cfg: params.cfg,
    channel: "line",
    groupId: exactGroupId ?? params.groupId,
    accountId: params.accountId,
  });
}
//#endregion
//#region extensions/line/src/runtime.ts
const { setRuntime: setLineRuntime, getRuntime: getLineRuntime } = createPluginRuntimeStore(
  "LINE runtime not initialized - plugin not registered",
);
//#endregion
//#region extensions/line/src/channel.ts
const lineSecurityAdapter = createRestrictSendersChannelSecurity({
  channelKey: "line",
  resolveDmPolicy: (account) => account.config.dmPolicy,
  resolveDmAllowFrom: (account) => account.config.allowFrom,
  resolveGroupPolicy: (account) => account.config.groupPolicy,
  surface: "LINE groups",
  openScope: "any member in groups",
  groupPolicyPath: "channels.line.groupPolicy",
  groupAllowFromPath: "channels.line.groupAllowFrom",
  mentionGated: false,
  policyPathSuffix: "dmPolicy",
  approveHint: "openclaw pairing approve line <code>",
  normalizeDmEntry: (raw) => raw.replace(/^line:(?:user:)?/i, ""),
});
const linePlugin = createChatChannelPlugin({
  base: {
    id: "line",
    ...lineChannelPluginCommon,
    setupWizard: lineSetupWizard,
    groups: { resolveRequireMention: resolveLineGroupRequireMention },
    messaging: {
      normalizeTarget: (target) => {
        const trimmed = target.trim();
        if (!trimmed) return;
        return trimmed.replace(/^line:(group|room|user):/i, "").replace(/^line:/i, "");
      },
      targetResolver: {
        looksLikeId: (id) => {
          const trimmed = id?.trim();
          if (!trimmed) return false;
          return /^[UCR][a-f0-9]{32}$/i.test(trimmed) || /^line:/i.test(trimmed);
        },
        hint: "<userId|groupId|roomId>",
      },
    },
    directory: createEmptyChannelDirectoryAdapter(),
    setup: lineSetupAdapter,
    status: createComputedAccountStatusAdapter({
      defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID),
      collectStatusIssues: (accounts) => {
        const issues = [];
        for (const account of accounts) {
          const accountId = account.accountId ?? "default";
          if (!account.channelAccessToken?.trim())
            issues.push({
              channel: "line",
              accountId,
              kind: "config",
              message: "LINE channel access token not configured",
            });
          if (!account.channelSecret?.trim())
            issues.push({
              channel: "line",
              accountId,
              kind: "config",
              message: "LINE channel secret not configured",
            });
        }
        return issues;
      },
      buildChannelSummary: ({ snapshot }) => buildTokenChannelStatusSummary(snapshot),
      probeAccount: async ({ account, timeoutMs }) =>
        getLineRuntime().channel.line.probeLineBot(account.channelAccessToken, timeoutMs),
      resolveAccountSnapshot: ({ account }) => {
        const configured = Boolean(
          account.channelAccessToken?.trim() && account.channelSecret?.trim(),
        );
        return {
          accountId: account.accountId,
          name: account.name,
          enabled: account.enabled,
          configured,
          extra: {
            tokenSource: account.tokenSource,
            mode: "webhook",
          },
        };
      },
    }),
    gateway: {
      startAccount: async (ctx) => {
        const account = ctx.account;
        const token = account.channelAccessToken.trim();
        const secret = account.channelSecret.trim();
        if (!token)
          throw new Error(
            `LINE webhook mode requires a non-empty channel access token for account "${account.accountId}".`,
          );
        if (!secret)
          throw new Error(
            `LINE webhook mode requires a non-empty channel secret for account "${account.accountId}".`,
          );
        let lineBotLabel = "";
        try {
          const probe = await getLineRuntime().channel.line.probeLineBot(token, 2500);
          const displayName = probe.ok ? probe.bot?.displayName?.trim() : null;
          if (displayName) lineBotLabel = ` (${displayName})`;
        } catch (err) {
          if (getLineRuntime().logging.shouldLogVerbose())
            ctx.log?.debug?.(`[${account.accountId}] bot probe failed: ${String(err)}`);
        }
        ctx.log?.info(`[${account.accountId}] starting LINE provider${lineBotLabel}`);
        return await getLineRuntime().channel.line.monitorLineProvider({
          channelAccessToken: token,
          channelSecret: secret,
          accountId: account.accountId,
          config: ctx.cfg,
          runtime: ctx.runtime,
          abortSignal: ctx.abortSignal,
          webhookPath: account.config.webhookPath,
        });
      },
      logoutAccount: async ({ accountId, cfg }) => {
        const envToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() ?? "";
        const nextCfg = { ...cfg };
        const nextLine = { ...(cfg.channels?.line ?? {}) };
        let cleared = false;
        let changed = false;
        if (accountId === "default") {
          if (
            nextLine.channelAccessToken ||
            nextLine.channelSecret ||
            nextLine.tokenFile ||
            nextLine.secretFile
          ) {
            delete nextLine.channelAccessToken;
            delete nextLine.channelSecret;
            delete nextLine.tokenFile;
            delete nextLine.secretFile;
            cleared = true;
            changed = true;
          }
        }
        const accountCleanup = clearAccountEntryFields({
          accounts: nextLine.accounts,
          accountId,
          fields: ["channelAccessToken", "channelSecret", "tokenFile", "secretFile"],
          markClearedOnFieldPresence: true,
        });
        if (accountCleanup.changed) {
          changed = true;
          if (accountCleanup.cleared) cleared = true;
          if (accountCleanup.nextAccounts) nextLine.accounts = accountCleanup.nextAccounts;
          else delete nextLine.accounts;
        }
        if (changed) {
          if (Object.keys(nextLine).length > 0)
            nextCfg.channels = {
              ...nextCfg.channels,
              line: nextLine,
            };
          else {
            const nextChannels = { ...nextCfg.channels };
            delete nextChannels.line;
            if (Object.keys(nextChannels).length > 0) nextCfg.channels = nextChannels;
            else delete nextCfg.channels;
          }
          await getLineRuntime().config.writeConfigFile(nextCfg);
        }
        const loggedOut =
          getLineRuntime().channel.line.resolveLineAccount({
            cfg: changed ? nextCfg : cfg,
            accountId,
          }).tokenSource === "none";
        return {
          cleared,
          envToken: Boolean(envToken),
          loggedOut,
        };
      },
    },
    agentPrompt: {
      messageToolHints: () => [
        "",
        "### LINE Rich Messages",
        "LINE supports rich visual messages. Use these directives in your reply when appropriate:",
        "",
        "**Quick Replies** (bottom button suggestions):",
        "  [[quick_replies: Option 1, Option 2, Option 3]]",
        "",
        "**Location** (map pin):",
        "  [[location: Place Name | Address | latitude | longitude]]",
        "",
        "**Confirm Dialog** (yes/no prompt):",
        "  [[confirm: Question text? | Yes Label | No Label]]",
        "",
        "**Button Menu** (title + text + buttons):",
        "  [[buttons: Title | Description | Btn1:action1, Btn2:https://url.com]]",
        "",
        "**Media Player Card** (music status):",
        "  [[media_player: Song Title | Artist Name | Source | https://albumart.url | playing]]",
        "  - Status: 'playing' or 'paused' (optional)",
        "",
        "**Event Card** (calendar events, meetings):",
        "  [[event: Event Title | Date | Time | Location | Description]]",
        "  - Time, Location, Description are optional",
        "",
        "**Agenda Card** (multiple events/schedule):",
        "  [[agenda: Schedule Title | Event1:9:00 AM, Event2:12:00 PM, Event3:3:00 PM]]",
        "",
        "**Device Control Card** (smart devices, TVs, etc.):",
        "  [[device: Device Name | Device Type | Status | Control1:data1, Control2:data2]]",
        "",
        "**Apple TV Remote** (full D-pad + transport):",
        "  [[appletv_remote: Apple TV | Playing]]",
        "",
        "**Auto-converted**: Markdown tables become Flex cards, code blocks become styled cards.",
        "",
        "When to use rich messages:",
        "- Use [[quick_replies:...]] when offering 2-4 clear options",
        "- Use [[confirm:...]] for yes/no decisions",
        "- Use [[buttons:...]] for menus with actions/links",
        "- Use [[location:...]] when sharing a place",
        "- Use [[media_player:...]] when showing what's playing",
        "- Use [[event:...]] for calendar event details",
        "- Use [[agenda:...]] for a day's schedule or event list",
        "- Use [[device:...]] for smart device status/controls",
        "- Tables/code in your response auto-convert to visual cards",
      ],
    },
  },
  pairing: {
    text: {
      idLabel: "lineUserId",
      message: "OpenClaw: your access has been approved.",
      normalizeAllowEntry: createPairingPrefixStripper(/^line:(?:user:)?/i),
      notify: async ({ cfg, id, message }) => {
        const line = getLineRuntime().channel.line;
        const account = line.resolveLineAccount({ cfg });
        if (!account.channelAccessToken)
          throw new Error("LINE channel access token not configured");
        await line.pushMessageLine(id, message, { channelAccessToken: account.channelAccessToken });
      },
    },
  },
  security: lineSecurityAdapter,
  outbound: {
    deliveryMode: "direct",
    chunker: (text, limit) => getLineRuntime().channel.text.chunkMarkdownText(text, limit),
    textChunkLimit: 5e3,
    sendPayload: async ({ to, payload, accountId, cfg }) => {
      const runtime = getLineRuntime();
      const lineData = payload.channelData?.line ?? {};
      const sendText = runtime.channel.line.pushMessageLine;
      const sendBatch = runtime.channel.line.pushMessagesLine;
      const sendFlex = runtime.channel.line.pushFlexMessage;
      const sendTemplate = runtime.channel.line.pushTemplateMessage;
      const sendLocation = runtime.channel.line.pushLocationMessage;
      const sendQuickReplies = runtime.channel.line.pushTextMessageWithQuickReplies;
      const buildTemplate = runtime.channel.line.buildTemplateMessageFromPayload;
      const createQuickReplyItems = runtime.channel.line.createQuickReplyItems;
      let lastResult = null;
      const quickReplies = lineData.quickReplies ?? [];
      const hasQuickReplies = quickReplies.length > 0;
      const quickReply = hasQuickReplies ? createQuickReplyItems(quickReplies) : void 0;
      const sendMessageBatch = async (messages) => {
        if (messages.length === 0) return;
        for (let i = 0; i < messages.length; i += 5) {
          const result = await sendBatch(to, messages.slice(i, i + 5), {
            verbose: false,
            cfg,
            accountId: accountId ?? void 0,
          });
          lastResult = {
            messageId: result.messageId,
            chatId: result.chatId,
          };
        }
      };
      const processed = payload.text
        ? processLineMessage(payload.text)
        : {
            text: "",
            flexMessages: [],
          };
      const chunkLimit =
        runtime.channel.text.resolveTextChunkLimit?.(cfg, "line", accountId ?? void 0, {
          fallbackLimit: 5e3,
        }) ?? 5e3;
      const chunks = processed.text
        ? runtime.channel.text.chunkMarkdownText(processed.text, chunkLimit)
        : [];
      const mediaUrls = resolveOutboundMediaUrls(payload);
      const shouldSendQuickRepliesInline = chunks.length === 0 && hasQuickReplies;
      const sendMediaMessages = async () => {
        for (const url of mediaUrls)
          lastResult = await runtime.channel.line.sendMessageLine(to, "", {
            verbose: false,
            mediaUrl: url,
            cfg,
            accountId: accountId ?? void 0,
          });
      };
      if (!shouldSendQuickRepliesInline) {
        if (lineData.flexMessage) {
          const flexContents = lineData.flexMessage.contents;
          lastResult = await sendFlex(to, lineData.flexMessage.altText, flexContents, {
            verbose: false,
            cfg,
            accountId: accountId ?? void 0,
          });
        }
        if (lineData.templateMessage) {
          const template = buildTemplate(lineData.templateMessage);
          if (template)
            lastResult = await sendTemplate(to, template, {
              verbose: false,
              cfg,
              accountId: accountId ?? void 0,
            });
        }
        if (lineData.location)
          lastResult = await sendLocation(to, lineData.location, {
            verbose: false,
            cfg,
            accountId: accountId ?? void 0,
          });
        for (const flexMsg of processed.flexMessages) {
          const flexContents = flexMsg.contents;
          lastResult = await sendFlex(to, flexMsg.altText, flexContents, {
            verbose: false,
            cfg,
            accountId: accountId ?? void 0,
          });
        }
      }
      const sendMediaAfterText = !(hasQuickReplies && chunks.length > 0);
      if (mediaUrls.length > 0 && !shouldSendQuickRepliesInline && !sendMediaAfterText)
        await sendMediaMessages();
      if (chunks.length > 0)
        for (let i = 0; i < chunks.length; i += 1)
          if (i === chunks.length - 1 && hasQuickReplies)
            lastResult = await sendQuickReplies(to, chunks[i], quickReplies, {
              verbose: false,
              cfg,
              accountId: accountId ?? void 0,
            });
          else
            lastResult = await sendText(to, chunks[i], {
              verbose: false,
              cfg,
              accountId: accountId ?? void 0,
            });
      else if (shouldSendQuickRepliesInline) {
        const quickReplyMessages = [];
        if (lineData.flexMessage)
          quickReplyMessages.push({
            type: "flex",
            altText: lineData.flexMessage.altText.slice(0, 400),
            contents: lineData.flexMessage.contents,
          });
        if (lineData.templateMessage) {
          const template = buildTemplate(lineData.templateMessage);
          if (template) quickReplyMessages.push(template);
        }
        if (lineData.location)
          quickReplyMessages.push({
            type: "location",
            title: lineData.location.title.slice(0, 100),
            address: lineData.location.address.slice(0, 100),
            latitude: lineData.location.latitude,
            longitude: lineData.location.longitude,
          });
        for (const flexMsg of processed.flexMessages)
          quickReplyMessages.push({
            type: "flex",
            altText: flexMsg.altText.slice(0, 400),
            contents: flexMsg.contents,
          });
        for (const url of mediaUrls) {
          const trimmed = url?.trim();
          if (!trimmed) continue;
          quickReplyMessages.push({
            type: "image",
            originalContentUrl: trimmed,
            previewImageUrl: trimmed,
          });
        }
        if (quickReplyMessages.length > 0 && quickReply) {
          const lastIndex = quickReplyMessages.length - 1;
          quickReplyMessages[lastIndex] = {
            ...quickReplyMessages[lastIndex],
            quickReply,
          };
          await sendMessageBatch(quickReplyMessages);
        }
      }
      if (mediaUrls.length > 0 && !shouldSendQuickRepliesInline && sendMediaAfterText)
        await sendMediaMessages();
      if (lastResult) return createEmptyChannelResult("line", { ...lastResult });
      return createEmptyChannelResult("line", {
        messageId: "empty",
        chatId: to,
      });
    },
    ...createAttachedChannelResultAdapter({
      channel: "line",
      sendText: async ({ cfg, to, text, accountId }) => {
        const runtime = getLineRuntime();
        const sendText = runtime.channel.line.pushMessageLine;
        const sendFlex = runtime.channel.line.pushFlexMessage;
        const processed = processLineMessage(text);
        let result;
        if (processed.text.trim())
          result = await sendText(to, processed.text, {
            verbose: false,
            cfg,
            accountId: accountId ?? void 0,
          });
        else
          result = {
            messageId: "processed",
            chatId: to,
          };
        for (const flexMsg of processed.flexMessages) {
          const flexContents = flexMsg.contents;
          await sendFlex(to, flexMsg.altText, flexContents, {
            verbose: false,
            cfg,
            accountId: accountId ?? void 0,
          });
        }
        return result;
      },
      sendMedia: async ({ cfg, to, text, mediaUrl, accountId }) =>
        await getLineRuntime().channel.line.sendMessageLine(to, text, {
          verbose: false,
          mediaUrl,
          cfg,
          accountId: accountId ?? void 0,
        }),
    }),
  },
});
emptyPluginConfigSchema();
//#endregion
//#region extensions/line/src/channel.setup.ts
const lineSetupPlugin = {
  id: "line",
  ...lineChannelPluginCommon,
  setupWizard: lineSetupWizard,
  setup: lineSetupAdapter,
};
defineSetupPluginEntry(lineSetupPlugin);
//#endregion
//#region src/plugin-sdk/outbound-media.ts
/** Load outbound media from a remote URL or approved local path using the shared web-media policy. */
async function loadOutboundMediaFromUrl(mediaUrl, options = {}) {
  return await loadWebMedia(mediaUrl, {
    maxBytes: options.maxBytes,
    localRoots: options.mediaLocalRoots,
  });
}
//#endregion
//#region extensions/mattermost/src/config-schema.ts
const DmChannelRetrySchema = z
  .object({
    maxRetries: z.number().int().min(0).max(10).optional(),
    initialDelayMs: z.number().int().min(100).max(6e4).optional(),
    maxDelayMs: z.number().int().min(1e3).max(6e4).optional(),
    timeoutMs: z.number().int().min(5e3).max(12e4).optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.initialDelayMs !== void 0 && data.maxDelayMs !== void 0)
        return data.initialDelayMs <= data.maxDelayMs;
      return true;
    },
    {
      message: "initialDelayMs must be less than or equal to maxDelayMs",
      path: ["initialDelayMs"],
    },
  )
  .optional();
const MattermostSlashCommandsSchema = z
  .object({
    native: z.union([z.boolean(), z.literal("auto")]).optional(),
    nativeSkills: z.union([z.boolean(), z.literal("auto")]).optional(),
    callbackPath: z.string().optional(),
    callbackUrl: z.string().optional(),
  })
  .strict()
  .optional();
const MattermostAccountSchemaBase = z
  .object({
    name: z.string().optional(),
    capabilities: z.array(z.string()).optional(),
    dangerouslyAllowNameMatching: z.boolean().optional(),
    markdown: MarkdownConfigSchema$1,
    enabled: z.boolean().optional(),
    configWrites: z.boolean().optional(),
    botToken: buildSecretInputSchema().optional(),
    baseUrl: z.string().optional(),
    chatmode: z.enum(["oncall", "onmessage", "onchar"]).optional(),
    oncharPrefixes: z.array(z.string()).optional(),
    requireMention: z.boolean().optional(),
    dmPolicy: DmPolicySchema$1.optional().default("pairing"),
    allowFrom: z.array(z.union([z.string(), z.number()])).optional(),
    groupAllowFrom: z.array(z.union([z.string(), z.number()])).optional(),
    groupPolicy: GroupPolicySchema$1.optional().default("allowlist"),
    textChunkLimit: z.number().int().positive().optional(),
    chunkMode: z.enum(["length", "newline"]).optional(),
    blockStreaming: z.boolean().optional(),
    blockStreamingCoalesce: BlockStreamingCoalesceSchema$1.optional(),
    replyToMode: z.enum(["off", "first", "all"]).optional(),
    responsePrefix: z.string().optional(),
    actions: z.object({ reactions: z.boolean().optional() }).optional(),
    commands: MattermostSlashCommandsSchema,
    interactions: z
      .object({
        callbackBaseUrl: z.string().optional(),
        allowedSourceIps: z.array(z.string()).optional(),
      })
      .optional(),
    dmChannelRetry: DmChannelRetrySchema,
  })
  .strict();
const MattermostAccountSchema = MattermostAccountSchemaBase.superRefine((value, ctx) => {
  requireChannelOpenAllowFrom({
    channel: "mattermost",
    policy: value.dmPolicy,
    allowFrom: value.allowFrom,
    ctx,
    requireOpenAllowFrom,
  });
});
const MattermostConfigSchema = MattermostAccountSchemaBase.extend({
  accounts: z.record(z.string(), MattermostAccountSchema.optional()).optional(),
  defaultAccount: z.string().optional(),
}).superRefine((value, ctx) => {
  requireChannelOpenAllowFrom({
    channel: "mattermost",
    policy: value.dmPolicy,
    allowFrom: value.allowFrom,
    ctx,
    requireOpenAllowFrom,
  });
});
//#endregion
//#region extensions/mattermost/src/mattermost/client.ts
function normalizeMattermostBaseUrl(raw) {
  const trimmed = raw?.trim();
  if (!trimmed) return;
  return trimmed.replace(/\/+$/, "").replace(/\/api\/v4$/i, "");
}
function buildMattermostApiUrl(baseUrl, path) {
  const normalized = normalizeMattermostBaseUrl(baseUrl);
  if (!normalized) throw new Error("Mattermost baseUrl is required");
  return `${normalized}/api/v4${path.startsWith("/") ? path : `/${path}`}`;
}
async function readMattermostError(res) {
  if ((res.headers.get("content-type") ?? "").includes("application/json")) {
    const data = await res.json();
    if (data?.message) return data.message;
    return JSON.stringify(data);
  }
  return await res.text();
}
function createMattermostClient(params) {
  const baseUrl = normalizeMattermostBaseUrl(params.baseUrl);
  if (!baseUrl) throw new Error("Mattermost baseUrl is required");
  const apiBaseUrl = `${baseUrl}/api/v4`;
  const token = params.botToken.trim();
  const fetchImpl = params.fetchImpl ?? fetch;
  const request = async (path, init) => {
    const url = buildMattermostApiUrl(baseUrl, path);
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (typeof init?.body === "string" && !headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
    const res = await fetchImpl(url, {
      ...init,
      headers,
    });
    if (!res.ok) {
      const detail = await readMattermostError(res);
      throw new Error(
        `Mattermost API ${res.status} ${res.statusText}: ${detail || "unknown error"}`,
      );
    }
    if (res.status === 204) return;
    if ((res.headers.get("content-type") ?? "").includes("application/json"))
      return await res.json();
    return await res.text();
  };
  return {
    baseUrl,
    apiBaseUrl,
    token,
    request,
  };
}
async function fetchMattermostMe(client) {
  return await client.request("/users/me");
}
async function fetchMattermostUser(client, userId) {
  return await client.request(`/users/${userId}`);
}
async function fetchMattermostUserByUsername(client, username) {
  return await client.request(`/users/username/${encodeURIComponent(username)}`);
}
async function fetchMattermostChannel(client, channelId) {
  return await client.request(`/channels/${channelId}`);
}
async function fetchMattermostChannelByName(client, teamId, channelName) {
  return await client.request(`/teams/${teamId}/channels/name/${encodeURIComponent(channelName)}`);
}
async function sendMattermostTyping(client, params) {
  const payload = { channel_id: params.channelId };
  const parentId = params.parentId?.trim();
  if (parentId) payload.parent_id = parentId;
  await client.request("/users/me/typing", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
async function createMattermostDirectChannel(client, userIds, signal) {
  return await client.request("/channels/direct", {
    method: "POST",
    body: JSON.stringify(userIds),
    signal,
  });
}
const RETRYABLE_NETWORK_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ESOCKETTIMEDOUT",
  "ECONNABORTED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPIPE",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_DNS_RESOLVE_FAILED",
  "UND_ERR_CONNECT",
  "UND_ERR_SOCKET",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
]);
const RETRYABLE_NETWORK_ERROR_NAMES = new Set([
  "AbortError",
  "TimeoutError",
  "ConnectTimeoutError",
  "HeadersTimeoutError",
  "BodyTimeoutError",
]);
const RETRYABLE_NETWORK_MESSAGE_SNIPPETS = [
  "network error",
  "timeout",
  "timed out",
  "abort",
  "connection refused",
  "econnreset",
  "econnrefused",
  "etimedout",
  "enotfound",
  "socket hang up",
  "getaddrinfo",
];
/**
 * Creates a Mattermost DM channel with exponential backoff retry logic.
 * Retries on transient errors (429, 5xx, network errors) but not on
 * client errors (4xx except 429) or permanent failures.
 */
async function createMattermostDirectChannelWithRetry(client, userIds, options = {}) {
  const {
    maxRetries = 3,
    initialDelayMs = 1e3,
    maxDelayMs = 1e4,
    timeoutMs = 3e4,
    onRetry,
  } = options;
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await createMattermostDirectChannel(client, userIds, controller.signal);
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt >= maxRetries) break;
      if (!isRetryableError(lastError)) throw lastError;
      const exponentialDelay = initialDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * exponentialDelay;
      const delayMs = Math.min(exponentialDelay + jitter, maxDelayMs);
      if (onRetry) onRetry(attempt + 1, delayMs, lastError);
      await sleep$1(delayMs);
    }
  throw lastError ?? /* @__PURE__ */ new Error("Failed to create DM channel after retries");
}
function isRetryableError(error) {
  const candidates = collectErrorCandidates(error);
  const messages = candidates
    .map((candidate) => readErrorMessage(candidate)?.toLowerCase())
    .filter((message) => Boolean(message));
  if (messages.some((message) => /mattermost api 5\d{2}\b/.test(message))) return true;
  if (
    messages.some(
      (message) => /mattermost api 429\b/.test(message) || message.includes("too many requests"),
    )
  )
    return true;
  for (const message of messages) {
    const clientErrorMatch = message.match(/mattermost api (4\d{2})\b/);
    if (!clientErrorMatch) continue;
    const statusCode = parseInt(clientErrorMatch[1], 10);
    if (statusCode >= 400 && statusCode < 500) return false;
  }
  if (messages.some((message) => /mattermost api \d{3}\b/.test(message))) return false;
  if (
    candidates
      .map((candidate) => readErrorCode(candidate))
      .filter((code) => Boolean(code))
      .some((code) => RETRYABLE_NETWORK_ERROR_CODES.has(code))
  )
    return true;
  if (
    candidates
      .map((candidate) => readErrorName(candidate))
      .filter((name) => Boolean(name))
      .some((name) => RETRYABLE_NETWORK_ERROR_NAMES.has(name))
  )
    return true;
  return messages.some((message) =>
    RETRYABLE_NETWORK_MESSAGE_SNIPPETS.some((pattern) => message.includes(pattern)),
  );
}
function collectErrorCandidates(error) {
  const queue = [error];
  const seen = /* @__PURE__ */ new Set();
  const candidates = [];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    candidates.push(current);
    if (typeof current !== "object") continue;
    const nested = current;
    queue.push(nested.cause, nested.reason);
    if (Array.isArray(nested.errors)) queue.push(...nested.errors);
  }
  return candidates;
}
function readErrorMessage(error) {
  if (!error || typeof error !== "object") return;
  const message = error.message;
  return typeof message === "string" && message.trim() ? message : void 0;
}
function readErrorName(error) {
  if (!error || typeof error !== "object") return;
  const name = error.name;
  return typeof name === "string" && name.trim() ? name : void 0;
}
function readErrorCode(error) {
  if (!error || typeof error !== "object") return;
  const { code, errno } = error;
  const raw = typeof code === "string" && code.trim() ? code : errno;
  if (typeof raw === "string" && raw.trim()) return raw.trim().toUpperCase();
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
}
function sleep$1(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function createMattermostPost(client, params) {
  const payload = {
    channel_id: params.channelId,
    message: params.message,
  };
  if (params.rootId) payload.root_id = params.rootId;
  if (params.fileIds?.length) payload.file_ids = params.fileIds;
  if (params.props) payload.props = params.props;
  return await client.request("/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
async function fetchMattermostUserTeams(client, userId) {
  return await client.request(`/users/${userId}/teams`);
}
async function updateMattermostPost(client, postId, params) {
  const payload = { id: postId };
  if (params.message !== void 0) payload.message = params.message;
  if (params.props !== void 0) payload.props = params.props;
  return await client.request(`/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
async function uploadMattermostFile(client, params) {
  const form = new FormData();
  const fileName = params.fileName?.trim() || "upload";
  const bytes = Uint8Array.from(params.buffer);
  const blob = params.contentType
    ? new Blob([bytes], { type: params.contentType })
    : new Blob([bytes]);
  form.append("files", blob, fileName);
  form.append("channel_id", params.channelId);
  const res = await fetch(`${client.apiBaseUrl}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${client.token}` },
    body: form,
  });
  if (!res.ok) {
    const detail = await readMattermostError(res);
    throw new Error(`Mattermost API ${res.status} ${res.statusText}: ${detail || "unknown error"}`);
  }
  const info = (await res.json()).file_infos?.[0];
  if (!info?.id) throw new Error("Mattermost file upload failed");
  return info;
}
//#endregion
//#region extensions/mattermost/src/mattermost/accounts.ts
const {
  listAccountIds: listMattermostAccountIds,
  resolveDefaultAccountId: resolveDefaultMattermostAccountId,
} = createAccountListHelpers("mattermost");
function mergeMattermostAccountConfig(cfg, accountId) {
  return resolveMergedAccountConfig({
    channelConfig: cfg.channels?.mattermost,
    accounts: cfg.channels?.mattermost?.accounts,
    accountId,
    omitKeys: ["defaultAccount"],
    nestedObjectKeys: ["commands"],
  });
}
function resolveMattermostRequireMention(config) {
  if (config.chatmode === "oncall") return true;
  if (config.chatmode === "onmessage") return false;
  if (config.chatmode === "onchar") return true;
  return config.requireMention;
}
function resolveMattermostAccount(params) {
  const accountId = normalizeAccountId(params.accountId);
  const baseEnabled = params.cfg.channels?.mattermost?.enabled !== false;
  const merged = mergeMattermostAccountConfig(params.cfg, accountId);
  const accountEnabled = merged.enabled !== false;
  const enabled = baseEnabled && accountEnabled;
  const allowEnv = accountId === DEFAULT_ACCOUNT_ID;
  const envToken = allowEnv ? process.env.MATTERMOST_BOT_TOKEN?.trim() : void 0;
  const envUrl = allowEnv ? process.env.MATTERMOST_URL?.trim() : void 0;
  const configToken = params.allowUnresolvedSecretRef
    ? normalizeSecretInputString(merged.botToken)
    : normalizeResolvedSecretInputString({
        value: merged.botToken,
        path: `channels.mattermost.accounts.${accountId}.botToken`,
      });
  const configUrl = merged.baseUrl?.trim();
  const botToken = configToken || envToken;
  const baseUrl = normalizeMattermostBaseUrl(configUrl || envUrl);
  const requireMention = resolveMattermostRequireMention(merged);
  const botTokenSource = configToken ? "config" : envToken ? "env" : "none";
  const baseUrlSource = configUrl ? "config" : envUrl ? "env" : "none";
  return {
    accountId,
    enabled,
    name: merged.name?.trim() || void 0,
    botToken,
    baseUrl,
    botTokenSource,
    baseUrlSource,
    config: merged,
    chatmode: merged.chatmode,
    oncharPrefixes: merged.oncharPrefixes,
    requireMention,
    textChunkLimit: merged.textChunkLimit,
    blockStreaming: merged.blockStreaming,
    blockStreamingCoalesce: merged.blockStreamingCoalesce,
  };
}
/**
 * Resolve the effective replyToMode for a given chat type.
 * Mattermost auto-threading only applies to channel and group messages.
 */
function resolveMattermostReplyToMode(account, kind) {
  if (kind === "direct") return "off";
  return account.config.replyToMode ?? "off";
}
//#endregion
//#region extensions/mattermost/src/group-mentions.ts
function resolveMattermostGroupRequireMention(params) {
  const account = resolveMattermostAccount({
    cfg: params.cfg,
    accountId: params.accountId,
  });
  const requireMentionOverride =
    typeof params.requireMentionOverride === "boolean"
      ? params.requireMentionOverride
      : account.requireMention;
  return resolveChannelGroupRequireMention({
    cfg: params.cfg,
    channel: "mattermost",
    groupId: params.groupId,
    accountId: params.accountId,
    requireMentionOverride,
  });
}
//#endregion
//#region extensions/mattermost/src/mattermost/directory.ts
function buildClient(params) {
  const account = resolveMattermostAccount({
    cfg: params.cfg,
    accountId: params.accountId,
  });
  if (!account.enabled || !account.botToken || !account.baseUrl) return null;
  return createMattermostClient({
    baseUrl: account.baseUrl,
    botToken: account.botToken,
  });
}
/**
 * Build clients from ALL enabled accounts (deduplicated by token).
 *
 * We always scan every account because:
 * - Private channels are only visible to bots that are members
 * - The requesting agent's account may have an expired/invalid token
 *
 * This means a single healthy bot token is enough for directory discovery.
 */
function buildClients(params) {
  const accountIds = listMattermostAccountIds(params.cfg);
  const seen = /* @__PURE__ */ new Set();
  const clients = [];
  for (const id of accountIds) {
    const client = buildClient({
      cfg: params.cfg,
      accountId: id,
    });
    if (client && !seen.has(client.token)) {
      seen.add(client.token);
      clients.push(client);
    }
  }
  return clients;
}
/**
 * List channels (public + private) visible to any configured bot account.
 *
 * NOTE: Uses per_page=200 which covers most instances. Mattermost does not
 * return a "has more" indicator, so very large instances (200+ channels per bot)
 * may see incomplete results. Pagination can be added if needed.
 */
async function listMattermostDirectoryGroups(params) {
  const clients = buildClients(params);
  if (!clients.length) return [];
  const q = params.query?.trim().toLowerCase() || "";
  const seenIds = /* @__PURE__ */ new Set();
  const entries = [];
  for (const client of clients)
    try {
      const me = await fetchMattermostMe(client);
      const channels = await client.request(`/users/${me.id}/channels?per_page=200`);
      for (const ch of channels) {
        if (ch.type !== "O" && ch.type !== "P") continue;
        if (seenIds.has(ch.id)) continue;
        if (q) {
          const name = (ch.name ?? "").toLowerCase();
          const display = (ch.display_name ?? "").toLowerCase();
          if (!name.includes(q) && !display.includes(q)) continue;
        }
        seenIds.add(ch.id);
        entries.push({
          kind: "group",
          id: `channel:${ch.id}`,
          name: ch.name ?? void 0,
          handle: ch.display_name ?? void 0,
        });
      }
    } catch (err) {
      console.debug?.("[mattermost-directory] listGroups: skipping account:", err?.message);
      continue;
    }
  return params.limit && params.limit > 0 ? entries.slice(0, params.limit) : entries;
}
/**
 * List team members as peer directory entries.
 *
 * Uses only the first available client since all bots in a team see the same
 * user list (unlike channels where membership varies). Uses the first team
 * returned — multi-team setups will only see members from that team.
 *
 * NOTE: per_page=200 for member listing; same pagination caveat as groups.
 */
async function listMattermostDirectoryPeers(params) {
  const clients = buildClients(params);
  if (!clients.length) return [];
  const client = clients[0];
  try {
    const me = await fetchMattermostMe(client);
    const teams = await client.request("/users/me/teams");
    if (!teams.length) return [];
    const teamId = teams[0].id;
    const q = params.query?.trim().toLowerCase() || "";
    let users;
    if (q)
      users = await client.request("/users/search", {
        method: "POST",
        body: JSON.stringify({
          term: q,
          team_id: teamId,
        }),
      });
    else {
      const userIds = (await client.request(`/teams/${teamId}/members?per_page=200`))
        .map((m) => m.user_id)
        .filter((id) => id !== me.id);
      if (!userIds.length) return [];
      users = await client.request("/users/ids", {
        method: "POST",
        body: JSON.stringify(userIds),
      });
    }
    const entries = users
      .filter((u) => u.id !== me.id)
      .map((u) => ({
        kind: "user",
        id: `user:${u.id}`,
        name: u.username ?? void 0,
        handle:
          [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.nickname || void 0,
      }));
    return params.limit && params.limit > 0 ? entries.slice(0, params.limit) : entries;
  } catch (err) {
    console.debug?.("[mattermost-directory] listPeers failed:", err?.message);
    return [];
  }
}
//#endregion
//#region extensions/mattermost/src/runtime.ts
const { setRuntime: setMattermostRuntime, getRuntime: getMattermostRuntime } =
  createPluginRuntimeStore("Mattermost runtime not initialized");
//#endregion
//#region extensions/mattermost/src/mattermost/interactions.ts
const INTERACTION_MAX_BODY_BYTES = 64 * 1024;
const INTERACTION_BODY_TIMEOUT_MS = 1e4;
const SIGNED_CHANNEL_ID_CONTEXT_KEY = "__openclaw_channel_id";
const callbackUrls = /* @__PURE__ */ new Map();
function setInteractionCallbackUrl(accountId, url) {
  callbackUrls.set(accountId, url);
}
function resolveInteractionCallbackPath(accountId) {
  return `/mattermost/interactions/${accountId}`;
}
function isWildcardBindHost(rawHost) {
  const trimmed = rawHost.trim();
  if (!trimmed) return false;
  const host = trimmed.startsWith("[") && trimmed.endsWith("]") ? trimmed.slice(1, -1) : trimmed;
  return host === "0.0.0.0" || host === "::" || host === "0:0:0:0:0:0:0:0" || host === "::0";
}
function normalizeCallbackBaseUrl(baseUrl) {
  return baseUrl.trim().replace(/\/+$/, "");
}
function headerValue$1(value) {
  if (Array.isArray(value)) return value[0]?.trim() || void 0;
  return value?.trim() || void 0;
}
function isAllowedInteractionSource(params) {
  const { allowedSourceIps } = params;
  if (!allowedSourceIps?.length) return true;
  return isTrustedProxyAddress(
    resolveClientIp({
      remoteAddr: params.req.socket?.remoteAddress,
      forwardedFor: headerValue$1(params.req.headers["x-forwarded-for"]),
      realIp: headerValue$1(params.req.headers["x-real-ip"]),
      trustedProxies: params.trustedProxies,
      allowRealIpFallback: params.allowRealIpFallback,
    }),
    allowedSourceIps,
  );
}
/**
 * Resolve the interaction callback URL for an account.
 * Falls back to computing it from interactions.callbackBaseUrl or gateway host config.
 */
function computeInteractionCallbackUrl(accountId, cfg) {
  const path = resolveInteractionCallbackPath(accountId);
  const callbackBaseUrl =
    cfg?.interactions?.callbackBaseUrl?.trim() ??
    cfg?.channels?.mattermost?.interactions?.callbackBaseUrl?.trim();
  if (callbackBaseUrl) return `${normalizeCallbackBaseUrl(callbackBaseUrl)}${path}`;
  const port = typeof cfg?.gateway?.port === "number" ? cfg.gateway.port : 18789;
  let host =
    cfg?.gateway?.customBindHost && !isWildcardBindHost(cfg.gateway.customBindHost)
      ? cfg.gateway.customBindHost.trim()
      : "localhost";
  if (host.includes(":") && !(host.startsWith("[") && host.endsWith("]"))) host = `[${host}]`;
  return `http://${host}:${port}${path}`;
}
/**
 * Resolve the interaction callback URL for an account.
 * Prefers the in-memory registered URL (set by the gateway monitor) so callers outside the
 * monitor lifecycle can reuse the runtime-validated callback destination.
 */
function resolveInteractionCallbackUrl(accountId, cfg) {
  const cached = callbackUrls.get(accountId);
  if (cached) return cached;
  return computeInteractionCallbackUrl(accountId, cfg);
}
const interactionSecrets = /* @__PURE__ */ new Map();
let defaultInteractionSecret;
function deriveInteractionSecret(botToken) {
  return createHmac("sha256", "openclaw-mattermost-interactions").update(botToken).digest("hex");
}
function setInteractionSecret(accountIdOrBotToken, botToken) {
  if (typeof botToken === "string") {
    interactionSecrets.set(accountIdOrBotToken, deriveInteractionSecret(botToken));
    return;
  }
  defaultInteractionSecret = deriveInteractionSecret(accountIdOrBotToken);
}
function getInteractionSecret(accountId) {
  const scoped = accountId ? interactionSecrets.get(accountId) : void 0;
  if (scoped) return scoped;
  if (defaultInteractionSecret) return defaultInteractionSecret;
  if (interactionSecrets.size === 1) {
    const first = interactionSecrets.values().next().value;
    if (typeof first === "string") return first;
  }
  throw new Error(
    "Interaction secret not initialized — call setInteractionSecret(accountId, botToken) first",
  );
}
function canonicalizeInteractionContext(value) {
  if (Array.isArray(value)) return value.map((item) => canonicalizeInteractionContext(item));
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== void 0)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, canonicalizeInteractionContext(entryValue)]);
    return Object.fromEntries(entries);
  }
  return value;
}
function generateInteractionToken(context, accountId) {
  const secret = getInteractionSecret(accountId);
  const payload = JSON.stringify(canonicalizeInteractionContext(context));
  return createHmac("sha256", secret).update(payload).digest("hex");
}
function verifyInteractionToken(context, token, accountId) {
  const expected = generateInteractionToken(context, accountId);
  if (expected.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
/**
 * Build Mattermost `props.attachments` with interactive buttons.
 *
 * Each button includes an HMAC token in its integration context so the
 * callback handler can verify the request originated from a legitimate
 * button click (Mattermost's recommended security pattern).
 */
/**
 * Sanitize a button ID so Mattermost's action router can match it.
 * Mattermost uses the action ID in the URL path `/api/v4/posts/{id}/actions/{actionId}`
 * and IDs containing hyphens or underscores break the server-side routing.
 * See: https://github.com/mattermost/mattermost/issues/25747
 */
function sanitizeActionId(id) {
  return id.replace(/[-_]/g, "");
}
function buildButtonAttachments(params) {
  const actions = params.buttons.map((btn) => {
    const safeId = sanitizeActionId(btn.id);
    const context = {
      action_id: safeId,
      ...btn.context,
    };
    const token = generateInteractionToken(context, params.accountId);
    return {
      id: safeId,
      type: "button",
      name: btn.name,
      style: btn.style,
      integration: {
        url: params.callbackUrl,
        context: {
          ...context,
          _token: token,
        },
      },
    };
  });
  return [
    {
      text: params.text ?? "",
      actions,
    },
  ];
}
function buildButtonProps(params) {
  const buttons = params.buttons
    .flatMap((item) => (Array.isArray(item) ? item : [item]))
    .map((btn) => ({
      id: String(btn.id ?? btn.callback_data ?? "").trim(),
      name: String(btn.text ?? btn.name ?? btn.label ?? "").trim(),
      style: btn.style ?? "default",
      context:
        typeof btn.context === "object" && btn.context !== null
          ? {
              ...btn.context,
              [SIGNED_CHANNEL_ID_CONTEXT_KEY]: params.channelId,
            }
          : { [SIGNED_CHANNEL_ID_CONTEXT_KEY]: params.channelId },
    }))
    .filter((btn) => btn.id && btn.name);
  if (buttons.length === 0) return;
  return {
    attachments: buildButtonAttachments({
      callbackUrl: params.callbackUrl,
      accountId: params.accountId,
      buttons,
      text: params.text,
    }),
  };
}
function readInteractionBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    const timer = setTimeout(() => {
      req.destroy();
      reject(/* @__PURE__ */ new Error("Request body read timeout"));
    }, INTERACTION_BODY_TIMEOUT_MS);
    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > INTERACTION_MAX_BODY_BYTES) {
        req.destroy();
        clearTimeout(timer);
        reject(/* @__PURE__ */ new Error("Request body too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
function createMattermostInteractionHandler(params) {
  const { client, accountId, log } = params;
  const core = getMattermostRuntime();
  return async (req, res) => {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Allow", "POST");
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Method Not Allowed" }));
      return;
    }
    if (
      !isAllowedInteractionSource({
        req,
        allowedSourceIps: params.allowedSourceIps,
        trustedProxies: params.trustedProxies,
        allowRealIpFallback: params.allowRealIpFallback,
      })
    ) {
      log?.(
        `mattermost interaction: rejected callback source remote=${req.socket?.remoteAddress ?? "?"}`,
      );
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Forbidden origin" }));
      return;
    }
    let payload;
    try {
      const raw = await readInteractionBody(req);
      payload = JSON.parse(raw);
    } catch (err) {
      log?.(`mattermost interaction: failed to parse body: ${String(err)}`);
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid request body" }));
      return;
    }
    const context = payload.context;
    if (!context) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing context" }));
      return;
    }
    const token = context._token;
    if (typeof token !== "string") {
      log?.("mattermost interaction: missing _token in context");
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing token" }));
      return;
    }
    const { _token, ...contextWithoutToken } = context;
    if (!verifyInteractionToken(contextWithoutToken, token, accountId)) {
      log?.("mattermost interaction: invalid _token");
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid token" }));
      return;
    }
    const actionId = context.action_id;
    if (typeof actionId !== "string") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing action_id in context" }));
      return;
    }
    const signedChannelId =
      typeof contextWithoutToken[SIGNED_CHANNEL_ID_CONTEXT_KEY] === "string"
        ? contextWithoutToken[SIGNED_CHANNEL_ID_CONTEXT_KEY].trim()
        : "";
    if (signedChannelId && signedChannelId !== payload.channel_id) {
      log?.(
        `mattermost interaction: signed channel mismatch payload=${payload.channel_id} signed=${signedChannelId}`,
      );
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Channel mismatch" }));
      return;
    }
    const userName = payload.user_name ?? payload.user_id;
    let originalMessage = "";
    let originalPost = null;
    let clickedButtonName = null;
    try {
      originalPost = await client.request(`/posts/${payload.post_id}`);
      const postChannelId = originalPost.channel_id?.trim();
      if (!postChannelId || postChannelId !== payload.channel_id) {
        log?.(
          `mattermost interaction: post channel mismatch payload=${payload.channel_id} post=${postChannelId ?? "<missing>"}`,
        );
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Post/channel mismatch" }));
        return;
      }
      originalMessage = originalPost.message ?? "";
      const postAttachments = Array.isArray(originalPost?.props?.attachments)
        ? originalPost.props.attachments
        : [];
      for (const att of postAttachments) {
        const match = att.actions?.find((a) => a.id === actionId);
        if (match?.name) {
          clickedButtonName = match.name;
          break;
        }
      }
      if (clickedButtonName === null) {
        log?.(`mattermost interaction: action ${actionId} not found in post ${payload.post_id}`);
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Unknown action" }));
        return;
      }
    } catch (err) {
      log?.(`mattermost interaction: failed to validate post ${payload.post_id}: ${String(err)}`);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Failed to validate interaction" }));
      return;
    }
    if (!originalPost) {
      log?.(`mattermost interaction: missing fetched post ${payload.post_id}`);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Failed to load interaction post" }));
      return;
    }
    log?.(
      `mattermost interaction: action=${actionId} user=${payload.user_name ?? payload.user_id} post=${payload.post_id} channel=${payload.channel_id}`,
    );
    if (params.authorizeButtonClick)
      try {
        const authorization = await params.authorizeButtonClick({
          payload,
          post: originalPost,
        });
        if (!authorization.ok) {
          res.statusCode = authorization.statusCode ?? 200;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify(
              authorization.response ?? {
                ephemeral_text: "You are not allowed to use this action here.",
              },
            ),
          );
          return;
        }
      } catch (err) {
        log?.(`mattermost interaction: authorization failed: ${String(err)}`);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Interaction authorization failed" }));
        return;
      }
    if (params.handleInteraction)
      try {
        const response = await params.handleInteraction({
          payload,
          userName,
          actionId,
          actionName: clickedButtonName,
          originalMessage,
          context: contextWithoutToken,
          post: originalPost,
        });
        if (response !== null) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(response));
          return;
        }
      } catch (err) {
        log?.(`mattermost interaction: custom handler failed: ${String(err)}`);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Interaction handler failed" }));
        return;
      }
    try {
      const eventLabel = `Mattermost button click: action="${actionId}" by ${payload.user_name ?? payload.user_id} in channel ${payload.channel_id}`;
      const sessionKey = params.resolveSessionKey
        ? await params.resolveSessionKey({
            channelId: payload.channel_id,
            userId: payload.user_id,
            post: originalPost,
          })
        : `agent:main:mattermost:${accountId}:${payload.channel_id}`;
      core.system.enqueueSystemEvent(eventLabel, {
        sessionKey,
        contextKey: `mattermost:interaction:${payload.post_id}:${actionId}`,
      });
    } catch (err) {
      log?.(`mattermost interaction: system event dispatch failed: ${String(err)}`);
    }
    try {
      await updateMattermostPost(client, payload.post_id, {
        message: originalMessage,
        props: { attachments: [{ text: `✓ **${clickedButtonName}** selected by @${userName}` }] },
      });
    } catch (err) {
      log?.(`mattermost interaction: failed to update post ${payload.post_id}: ${String(err)}`);
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end("{}");
    if (params.dispatchButtonClick)
      try {
        await params.dispatchButtonClick({
          channelId: payload.channel_id,
          userId: payload.user_id,
          userName,
          actionId,
          actionName: clickedButtonName,
          postId: payload.post_id,
          post: originalPost,
        });
      } catch (err) {
        log?.(`mattermost interaction: dispatchButtonClick failed: ${String(err)}`);
      }
  };
}
//#endregion
//#region extensions/mattermost/src/mattermost/model-picker.ts
const MATTERMOST_MODEL_PICKER_CONTEXT_KEY = "oc_model_picker";
const MODELS_PAGE_SIZE = 8;
const ACTION_IDS = {
  providers: "mdlprov",
  list: "mdllist",
  select: "mdlsel",
  back: "mdlback",
};
function splitModelRef(modelRef) {
  const match = modelRef?.trim()?.match(/^([^/]+)\/(.+)$/u);
  if (!match) return null;
  const provider = normalizeProviderId(match[1]);
  const model = match[2].trim();
  if (!provider || !model) return null;
  return {
    provider,
    model,
  };
}
function normalizePage(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}
function paginateItems(items, page, pageSize = MODELS_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.max(1, Math.min(normalizePage(page), totalPages));
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    totalItems: items.length,
  };
}
function buildContext(state) {
  return {
    [MATTERMOST_MODEL_PICKER_CONTEXT_KEY]: true,
    ...state,
  };
}
function buildButtonId(state) {
  const digest = createHash("sha256").update(JSON.stringify(state)).digest("hex").slice(0, 12);
  return `${ACTION_IDS[state.action]}${digest}`;
}
function buildButton(params) {
  const baseState =
    params.action === "providers" || params.action === "back"
      ? {
          action: params.action,
          ownerUserId: params.ownerUserId,
        }
      : params.action === "list"
        ? {
            action: "list",
            ownerUserId: params.ownerUserId,
            provider: normalizeProviderId(params.provider ?? ""),
            page: normalizePage(params.page),
          }
        : {
            action: "select",
            ownerUserId: params.ownerUserId,
            provider: normalizeProviderId(params.provider ?? ""),
            page: normalizePage(params.page),
            model: String(params.model ?? "").trim(),
          };
  return {
    id: buildButtonId(baseState),
    text: params.text,
    ...(params.style ? { style: params.style } : {}),
    context: buildContext(baseState),
  };
}
function getProviderModels(data, provider) {
  return [
    ...(data.byProvider.get(normalizeProviderId(provider)) ?? /* @__PURE__ */ new Set()),
  ].toSorted();
}
function formatCurrentModelLine(currentModel) {
  const parsed = splitModelRef(currentModel);
  if (!parsed) return "Current: default";
  return `Current: ${parsed.provider}/${parsed.model}`;
}
function resolveMattermostModelPickerEntry(commandText) {
  const normalized = commandText.trim().replace(/\s+/g, " ");
  if (/^\/model$/i.test(normalized)) return { kind: "summary" };
  if (/^\/models$/i.test(normalized)) return { kind: "providers" };
  const providerMatch = normalized.match(/^\/models\s+(\S+)$/i);
  if (!providerMatch?.[1]) return null;
  return {
    kind: "models",
    provider: normalizeProviderId(providerMatch[1]),
  };
}
function parseMattermostModelPickerContext(context) {
  if (!context || context[MATTERMOST_MODEL_PICKER_CONTEXT_KEY] !== true) return null;
  const ownerUserId = String(context.ownerUserId ?? "").trim();
  const action = String(context.action ?? "").trim();
  if (!ownerUserId) return null;
  if (action === "providers" || action === "back")
    return {
      action,
      ownerUserId,
    };
  const provider = normalizeProviderId(String(context.provider ?? ""));
  const page = Number.parseInt(String(context.page ?? "1"), 10);
  if (!provider) return null;
  if (action === "list")
    return {
      action,
      ownerUserId,
      provider,
      page: normalizePage(page),
    };
  if (action === "select") {
    const model = String(context.model ?? "").trim();
    if (!model) return null;
    return {
      action,
      ownerUserId,
      provider,
      page: normalizePage(page),
      model,
    };
  }
  return null;
}
function buildMattermostAllowedModelRefs(data) {
  const refs = /* @__PURE__ */ new Set();
  for (const provider of data.providers)
    for (const model of data.byProvider.get(provider) ?? []) refs.add(`${provider}/${model}`);
  return refs;
}
function resolveMattermostModelPickerCurrentModel(params) {
  const fallback = `${params.data.resolvedDefault.provider}/${params.data.resolvedDefault.model}`;
  try {
    const storePath = resolveStorePath(params.cfg.session?.store, {
      agentId: params.route.agentId,
    });
    const sessionStore = params.skipCache
      ? loadSessionStore(storePath, { skipCache: true })
      : loadSessionStore(storePath);
    const sessionEntry = sessionStore[params.route.sessionKey];
    const override = resolveStoredModelOverride({
      sessionEntry,
      sessionStore,
      sessionKey: params.route.sessionKey,
    });
    if (!override?.model) return fallback;
    const provider = (override.provider || params.data.resolvedDefault.provider).trim();
    return provider ? `${provider}/${override.model}` : fallback;
  } catch {
    return fallback;
  }
}
function renderMattermostModelSummaryView(params) {
  return {
    text: [
      formatCurrentModelLine(params.currentModel),
      "",
      "Tap below to browse models, or use:",
      "/oc_model <provider/model> to switch",
      "/oc_model status for details",
    ].join("\n"),
    buttons: [
      [
        buildButton({
          action: "providers",
          ownerUserId: params.ownerUserId,
          text: "Browse providers",
          style: "primary",
        }),
      ],
    ],
  };
}
function renderMattermostProviderPickerView(params) {
  const currentProvider = splitModelRef(params.currentModel)?.provider;
  const rows = params.data.providers.map((provider) => [
    buildButton({
      action: "list",
      ownerUserId: params.ownerUserId,
      text: `${provider} (${params.data.byProvider.get(provider)?.size ?? 0})`,
      provider,
      page: 1,
      style: provider === currentProvider ? "primary" : "default",
    }),
  ]);
  return {
    text: [formatCurrentModelLine(params.currentModel), "", "Select a provider:"].join("\n"),
    buttons: rows,
  };
}
function renderMattermostModelsPickerView(params) {
  const provider = normalizeProviderId(params.provider);
  const models = getProviderModels(params.data, provider);
  const current = splitModelRef(params.currentModel);
  if (models.length === 0)
    return {
      text: [formatCurrentModelLine(params.currentModel), "", `Unknown provider: ${provider}`].join(
        "\n",
      ),
      buttons: [
        [
          buildButton({
            action: "back",
            ownerUserId: params.ownerUserId,
            text: "Back to providers",
          }),
        ],
      ],
    };
  const page = paginateItems(models, params.page);
  const rows = page.items.map((model) => {
    const isCurrent = current?.provider === provider && current.model === model;
    return [
      buildButton({
        action: "select",
        ownerUserId: params.ownerUserId,
        text: isCurrent ? `${model} [current]` : model,
        provider,
        model,
        page: page.page,
        style: isCurrent ? "primary" : "default",
      }),
    ];
  });
  const navRow = [];
  if (page.hasPrev)
    navRow.push(
      buildButton({
        action: "list",
        ownerUserId: params.ownerUserId,
        text: "Prev",
        provider,
        page: page.page - 1,
      }),
    );
  if (page.hasNext)
    navRow.push(
      buildButton({
        action: "list",
        ownerUserId: params.ownerUserId,
        text: "Next",
        provider,
        page: page.page + 1,
      }),
    );
  if (navRow.length > 0) rows.push(navRow);
  rows.push([
    buildButton({
      action: "back",
      ownerUserId: params.ownerUserId,
      text: "Back to providers",
    }),
  ]);
  return {
    text: [
      `Models (${provider}) - ${page.totalItems} available`,
      formatCurrentModelLine(params.currentModel),
      `Page ${page.page}/${page.totalPages}`,
      "Select a model to switch immediately.",
    ].join("\n"),
    buttons: rows,
  };
}
//#endregion
//#region extensions/mattermost/src/mattermost/monitor-auth.ts
function normalizeMattermostAllowEntry(entry) {
  const trimmed = entry.trim();
  if (!trimmed) return "";
  if (trimmed === "*") return "*";
  return trimmed
    .replace(/^(mattermost|user):/i, "")
    .replace(/^@/, "")
    .toLowerCase();
}
function normalizeMattermostAllowList(entries) {
  const normalized = entries
    .map((entry) => normalizeMattermostAllowEntry(String(entry)))
    .filter(Boolean);
  return Array.from(new Set(normalized));
}
function resolveMattermostEffectiveAllowFromLists(params) {
  return resolveEffectiveAllowFromLists({
    allowFrom: normalizeMattermostAllowList(params.allowFrom ?? []),
    groupAllowFrom: normalizeMattermostAllowList(params.groupAllowFrom ?? []),
    storeAllowFrom: normalizeMattermostAllowList(params.storeAllowFrom ?? []),
    dmPolicy: params.dmPolicy,
  });
}
function isMattermostSenderAllowed(params) {
  const allowFrom = normalizeMattermostAllowList(params.allowFrom);
  if (allowFrom.length === 0) return false;
  return resolveAllowlistMatchSimple({
    allowFrom,
    senderId: normalizeMattermostAllowEntry(params.senderId),
    senderName: params.senderName ? normalizeMattermostAllowEntry(params.senderName) : void 0,
    allowNameMatching: params.allowNameMatching,
  }).allowed;
}
function mapMattermostChannelKind(channelType) {
  const normalized = channelType?.trim().toUpperCase();
  if (normalized === "D") return "direct";
  if (normalized === "G" || normalized === "P") return "group";
  return "channel";
}
function authorizeMattermostCommandInvocation(params) {
  const {
    account,
    cfg,
    senderId,
    senderName,
    channelId,
    channelInfo,
    storeAllowFrom,
    allowTextCommands,
    hasControlCommand,
  } = params;
  if (!channelInfo)
    return {
      ok: false,
      denyReason: "unknown-channel",
      commandAuthorized: false,
      channelInfo: null,
      kind: "channel",
      chatType: "channel",
      channelName: "",
      channelDisplay: "",
      roomLabel: `#${channelId}`,
    };
  const kind = mapMattermostChannelKind(channelInfo.type);
  const chatType = kind;
  const channelName = channelInfo.name ?? "";
  const channelDisplay = channelInfo.display_name ?? channelName;
  const roomLabel = channelName ? `#${channelName}` : channelDisplay || `#${channelId}`;
  const dmPolicy = account.config.dmPolicy ?? "pairing";
  const defaultGroupPolicy = cfg.channels?.defaults?.groupPolicy;
  const groupPolicy = account.config.groupPolicy ?? defaultGroupPolicy ?? "allowlist";
  const allowNameMatching = isDangerousNameMatchingEnabled(account.config);
  const configAllowFrom = normalizeMattermostAllowList(account.config.allowFrom ?? []);
  const configGroupAllowFrom = normalizeMattermostAllowList(account.config.groupAllowFrom ?? []);
  const { effectiveAllowFrom, effectiveGroupAllowFrom } = resolveMattermostEffectiveAllowFromLists({
    allowFrom: configAllowFrom,
    groupAllowFrom: configGroupAllowFrom,
    storeAllowFrom: normalizeMattermostAllowList(storeAllowFrom ?? []),
    dmPolicy,
  });
  const useAccessGroups = cfg.commands?.useAccessGroups !== false;
  const commandDmAllowFrom = kind === "direct" ? effectiveAllowFrom : configAllowFrom;
  const commandGroupAllowFrom =
    kind === "direct"
      ? effectiveGroupAllowFrom
      : configGroupAllowFrom.length > 0
        ? configGroupAllowFrom
        : configAllowFrom;
  const senderAllowedForCommands = isMattermostSenderAllowed({
    senderId,
    senderName,
    allowFrom: commandDmAllowFrom,
    allowNameMatching,
  });
  const groupAllowedForCommands = isMattermostSenderAllowed({
    senderId,
    senderName,
    allowFrom: commandGroupAllowFrom,
    allowNameMatching,
  });
  const commandGate = resolveControlCommandGate({
    useAccessGroups,
    authorizers: [
      {
        configured: commandDmAllowFrom.length > 0,
        allowed: senderAllowedForCommands,
      },
      {
        configured: commandGroupAllowFrom.length > 0,
        allowed: groupAllowedForCommands,
      },
    ],
    allowTextCommands,
    hasControlCommand: allowTextCommands && hasControlCommand,
  });
  const commandAuthorized =
    kind === "direct"
      ? dmPolicy === "open" || senderAllowedForCommands
      : commandGate.commandAuthorized;
  if (kind === "direct") {
    if (dmPolicy === "disabled")
      return {
        ok: false,
        denyReason: "dm-disabled",
        commandAuthorized: false,
        channelInfo,
        kind,
        chatType,
        channelName,
        channelDisplay,
        roomLabel,
      };
    if (dmPolicy !== "open" && !senderAllowedForCommands)
      return {
        ok: false,
        denyReason: dmPolicy === "pairing" ? "dm-pairing" : "unauthorized",
        commandAuthorized: false,
        channelInfo,
        kind,
        chatType,
        channelName,
        channelDisplay,
        roomLabel,
      };
  } else {
    const senderGroupAccess = evaluateSenderGroupAccessForPolicy({
      groupPolicy,
      groupAllowFrom: effectiveGroupAllowFrom,
      senderId,
      isSenderAllowed: (_senderId, allowFrom) =>
        isMattermostSenderAllowed({
          senderId,
          senderName,
          allowFrom,
          allowNameMatching,
        }),
    });
    if (!senderGroupAccess.allowed && senderGroupAccess.reason === "disabled")
      return {
        ok: false,
        denyReason: "channels-disabled",
        commandAuthorized: false,
        channelInfo,
        kind,
        chatType,
        channelName,
        channelDisplay,
        roomLabel,
      };
    if (!senderGroupAccess.allowed && senderGroupAccess.reason === "empty_allowlist")
      return {
        ok: false,
        denyReason: "channel-no-allowlist",
        commandAuthorized: false,
        channelInfo,
        kind,
        chatType,
        channelName,
        channelDisplay,
        roomLabel,
      };
    if (!senderGroupAccess.allowed && senderGroupAccess.reason === "sender_not_allowlisted")
      return {
        ok: false,
        denyReason: "unauthorized",
        commandAuthorized: false,
        channelInfo,
        kind,
        chatType,
        channelName,
        channelDisplay,
        roomLabel,
      };
    if (commandGate.shouldBlock)
      return {
        ok: false,
        denyReason: "unauthorized",
        commandAuthorized: false,
        channelInfo,
        kind,
        chatType,
        channelName,
        channelDisplay,
        roomLabel,
      };
  }
  return {
    ok: true,
    commandAuthorized,
    channelInfo,
    kind,
    chatType,
    channelName,
    channelDisplay,
    roomLabel,
  };
}
//#endregion
//#region extensions/mattermost/src/mattermost/monitor-gating.ts
function mapMattermostChannelTypeToChatType(channelType) {
  if (!channelType) return "channel";
  const normalized = channelType.trim().toUpperCase();
  if (normalized === "D") return "direct";
  if (normalized === "G" || normalized === "P") return "group";
  return "channel";
}
function evaluateMattermostMentionGate(params) {
  const shouldRequireMention =
    params.kind !== "direct" &&
    params.resolveRequireMention({
      cfg: params.cfg,
      channel: "mattermost",
      accountId: params.accountId,
      groupId: params.channelId,
      requireMentionOverride: params.requireMentionOverride,
    });
  const shouldBypassMention =
    params.isControlCommand &&
    shouldRequireMention &&
    !params.wasMentioned &&
    params.commandAuthorized;
  const effectiveWasMentioned =
    params.wasMentioned || shouldBypassMention || params.oncharTriggered;
  if (
    params.oncharEnabled &&
    !params.oncharTriggered &&
    !params.wasMentioned &&
    !params.isControlCommand
  )
    return {
      shouldRequireMention,
      shouldBypassMention,
      effectiveWasMentioned,
      dropReason: "onchar-not-triggered",
    };
  if (
    params.kind !== "direct" &&
    shouldRequireMention &&
    params.canDetectMention &&
    !effectiveWasMentioned
  )
    return {
      shouldRequireMention,
      shouldBypassMention,
      effectiveWasMentioned,
      dropReason: "missing-mention",
    };
  return {
    shouldRequireMention,
    shouldBypassMention,
    effectiveWasMentioned,
    dropReason: null,
  };
}
//#endregion
//#region extensions/mattermost/src/mattermost/monitor-helpers.ts
const formatInboundFromLabel = formatInboundFromLabel$1;
function resolveThreadSessionKeys(params) {
  return resolveThreadSessionKeys$1({
    ...params,
    normalizeThreadId: (threadId) => threadId,
  });
}
/**
 * Strip bot mention from message text while preserving newlines and
 * block-level Markdown formatting (headings, lists, blockquotes).
 */
function normalizeMention(text, mention) {
  if (!mention) return text.trim();
  const escaped = mention.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hasMentionRe = new RegExp(`@${escaped}\\b`, "i");
  const leadingMentionRe = new RegExp(`^([\\t ]*)@${escaped}\\b[\\t ]*`, "i");
  const trailingMentionRe = new RegExp(`[\\t ]*@${escaped}\\b[\\t ]*$`, "i");
  const normalizedLines = text.split("\n").map((line) => {
    const hadMention = hasMentionRe.test(line);
    const normalizedLine = line
      .replace(leadingMentionRe, "$1")
      .replace(trailingMentionRe, "")
      .replace(new RegExp(`@${escaped}\\b`, "gi"), "")
      .replace(/(\S)[ \t]{2,}/g, "$1 ");
    return {
      text: normalizedLine,
      mentionOnlyBlank: hadMention && normalizedLine.trim() === "",
    };
  });
  while (normalizedLines[0]?.mentionOnlyBlank) normalizedLines.shift();
  while (normalizedLines.at(-1)?.text.trim() === "") normalizedLines.pop();
  return normalizedLines.map((line) => line.text).join("\n");
}
//#endregion
//#region extensions/mattermost/src/mattermost/monitor-onchar.ts
const DEFAULT_ONCHAR_PREFIXES = [">", "!"];
function resolveOncharPrefixes(prefixes) {
  const cleaned = prefixes?.map((entry) => entry.trim()).filter(Boolean) ?? DEFAULT_ONCHAR_PREFIXES;
  return cleaned.length > 0 ? cleaned : DEFAULT_ONCHAR_PREFIXES;
}
function stripOncharPrefix(text, prefixes) {
  const trimmed = text.trimStart();
  for (const prefix of prefixes) {
    if (!prefix) continue;
    if (trimmed.startsWith(prefix))
      return {
        triggered: true,
        stripped: trimmed.slice(prefix.length).trimStart(),
      };
  }
  return {
    triggered: false,
    stripped: text,
  };
}
//#endregion
//#region extensions/mattermost/src/mattermost/monitor-resources.ts
const CHANNEL_CACHE_TTL_MS = 5 * 6e4;
const USER_CACHE_TTL_MS = 10 * 6e4;
function createMattermostMonitorResources(params) {
  const {
    accountId,
    callbackUrl,
    client,
    logger,
    mediaMaxBytes,
    fetchRemoteMedia,
    saveMediaBuffer,
    mediaKindFromMime,
  } = params;
  const channelCache = /* @__PURE__ */ new Map();
  const userCache = /* @__PURE__ */ new Map();
  const resolveMattermostMedia = async (fileIds) => {
    const ids = (fileIds ?? []).map((id) => id?.trim()).filter(Boolean);
    if (ids.length === 0) return [];
    const out = [];
    for (const fileId of ids)
      try {
        const fetched = await fetchRemoteMedia({
          url: `${client.apiBaseUrl}/files/${fileId}`,
          requestInit: { headers: { Authorization: `Bearer ${client.token}` } },
          filePathHint: fileId,
          maxBytes: mediaMaxBytes,
          ssrfPolicy: { allowedHostnames: [new URL(client.baseUrl).hostname] },
        });
        const saved = await saveMediaBuffer(
          Buffer.from(fetched.buffer),
          fetched.contentType ?? void 0,
          "inbound",
          mediaMaxBytes,
        );
        const contentType = saved.contentType ?? fetched.contentType ?? void 0;
        out.push({
          path: saved.path,
          contentType,
          kind: mediaKindFromMime(contentType) ?? "unknown",
        });
      } catch (err) {
        logger.debug?.(`mattermost: failed to download file ${fileId}: ${String(err)}`);
      }
    return out;
  };
  const sendTypingIndicator = async (channelId, parentId) => {
    await sendMattermostTyping(client, {
      channelId,
      parentId,
    });
  };
  const resolveChannelInfo = async (channelId) => {
    const cached = channelCache.get(channelId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    try {
      const info = await fetchMattermostChannel(client, channelId);
      channelCache.set(channelId, {
        value: info,
        expiresAt: Date.now() + CHANNEL_CACHE_TTL_MS,
      });
      return info;
    } catch (err) {
      logger.debug?.(`mattermost: channel lookup failed: ${String(err)}`);
      channelCache.set(channelId, {
        value: null,
        expiresAt: Date.now() + CHANNEL_CACHE_TTL_MS,
      });
      return null;
    }
  };
  const resolveUserInfo = async (userId) => {
    const cached = userCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    try {
      const info = await fetchMattermostUser(client, userId);
      userCache.set(userId, {
        value: info,
        expiresAt: Date.now() + USER_CACHE_TTL_MS,
      });
      return info;
    } catch (err) {
      logger.debug?.(`mattermost: user lookup failed: ${String(err)}`);
      userCache.set(userId, {
        value: null,
        expiresAt: Date.now() + USER_CACHE_TTL_MS,
      });
      return null;
    }
  };
  const buildModelPickerProps = (channelId, buttons) =>
    buildButtonProps({
      callbackUrl,
      accountId,
      channelId,
      buttons,
    });
  const updateModelPickerPost = async (params) => {
    const props = buildModelPickerProps(params.channelId, params.buttons ?? []) ?? {
      attachments: [],
    };
    await updateMattermostPost(client, params.postId, {
      message: params.message,
      props,
    });
    return {};
  };
  return {
    resolveMattermostMedia,
    sendTypingIndicator,
    resolveChannelInfo,
    resolveUserInfo,
    updateModelPickerPost,
  };
}
//#endregion
//#region extensions/mattermost/src/mattermost/slash-commands.ts
/**
 * Built-in OpenClaw commands to register as native slash commands.
 * These mirror the text-based commands already handled by the gateway.
 */
const DEFAULT_COMMAND_SPECS = [
  {
    trigger: "oc_status",
    originalName: "status",
    description: "Show session status (model, usage, uptime)",
    autoComplete: true,
  },
  {
    trigger: "oc_model",
    originalName: "model",
    description: "View or change the current model",
    autoComplete: true,
    autoCompleteHint: "[model-name]",
  },
  {
    trigger: "oc_models",
    originalName: "models",
    description: "Browse available models",
    autoComplete: true,
    autoCompleteHint: "[provider]",
  },
  {
    trigger: "oc_new",
    originalName: "new",
    description: "Start a new conversation session",
    autoComplete: true,
  },
  {
    trigger: "oc_help",
    originalName: "help",
    description: "Show available commands",
    autoComplete: true,
  },
  {
    trigger: "oc_think",
    originalName: "think",
    description: "Set thinking/reasoning level",
    autoComplete: true,
    autoCompleteHint: "[off|low|medium|high]",
  },
  {
    trigger: "oc_reasoning",
    originalName: "reasoning",
    description: "Toggle reasoning mode",
    autoComplete: true,
    autoCompleteHint: "[on|off]",
  },
  {
    trigger: "oc_verbose",
    originalName: "verbose",
    description: "Toggle verbose mode",
    autoComplete: true,
    autoCompleteHint: "[on|off]",
  },
];
/**
 * List existing custom slash commands for a team.
 */
async function listMattermostCommands(client, teamId) {
  return await client.request(`/commands?team_id=${encodeURIComponent(teamId)}&custom_only=true`);
}
/**
 * Create a custom slash command on a Mattermost team.
 */
async function createMattermostCommand(client, params) {
  return await client.request("/commands", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
/**
 * Delete a custom slash command.
 */
async function deleteMattermostCommand(client, commandId) {
  await client.request(`/commands/${encodeURIComponent(commandId)}`, { method: "DELETE" });
}
/**
 * Update an existing custom slash command.
 */
async function updateMattermostCommand(client, params) {
  return await client.request(`/commands/${encodeURIComponent(params.id)}`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
}
/**
 * Register all OpenClaw slash commands for a given team.
 * Skips commands that are already registered with the same trigger + callback URL.
 * Returns the list of newly created command IDs.
 */
async function registerSlashCommands(params) {
  const { client, teamId, creatorUserId, callbackUrl, commands, log } = params;
  const normalizedCreatorUserId = creatorUserId.trim();
  if (!normalizedCreatorUserId)
    throw new Error("creatorUserId is required for slash command reconciliation");
  let existing = [];
  try {
    existing = await listMattermostCommands(client, teamId);
  } catch (err) {
    log?.(`mattermost: failed to list existing commands: ${String(err)}`);
    throw err;
  }
  const existingByTrigger = /* @__PURE__ */ new Map();
  for (const cmd of existing) {
    const list = existingByTrigger.get(cmd.trigger) ?? [];
    list.push(cmd);
    existingByTrigger.set(cmd.trigger, list);
  }
  const registered = [];
  for (const spec of commands) {
    const existingForTrigger = existingByTrigger.get(spec.trigger) ?? [];
    const ownedCommands = existingForTrigger.filter(
      (cmd) => cmd.creator_id?.trim() === normalizedCreatorUserId,
    );
    const foreignCommands = existingForTrigger.filter(
      (cmd) => cmd.creator_id?.trim() !== normalizedCreatorUserId,
    );
    if (ownedCommands.length === 0 && foreignCommands.length > 0) {
      log?.(
        `mattermost: trigger /${spec.trigger} already used by non-OpenClaw command(s); skipping to avoid mutating external integrations`,
      );
      continue;
    }
    if (ownedCommands.length > 1)
      log?.(
        `mattermost: multiple owned commands found for /${spec.trigger}; using the first and leaving extras untouched`,
      );
    const existingCmd = ownedCommands[0];
    if (existingCmd && existingCmd.url === callbackUrl) {
      log?.(`mattermost: command /${spec.trigger} already registered (id=${existingCmd.id})`);
      registered.push({
        id: existingCmd.id,
        trigger: spec.trigger,
        teamId,
        token: existingCmd.token,
        managed: false,
      });
      continue;
    }
    if (existingCmd && existingCmd.url !== callbackUrl) {
      log?.(
        `mattermost: command /${spec.trigger} exists with different callback URL; updating (id=${existingCmd.id})`,
      );
      try {
        const updated = await updateMattermostCommand(client, {
          id: existingCmd.id,
          team_id: teamId,
          trigger: spec.trigger,
          method: "P",
          url: callbackUrl,
          description: spec.description,
          auto_complete: spec.autoComplete,
          auto_complete_desc: spec.description,
          auto_complete_hint: spec.autoCompleteHint,
        });
        registered.push({
          id: updated.id,
          trigger: spec.trigger,
          teamId,
          token: updated.token,
          managed: false,
        });
        continue;
      } catch (err) {
        log?.(
          `mattermost: failed to update command /${spec.trigger} (id=${existingCmd.id}): ${String(err)}`,
        );
        try {
          await deleteMattermostCommand(client, existingCmd.id);
          log?.(`mattermost: deleted stale command /${spec.trigger} (id=${existingCmd.id})`);
        } catch (deleteErr) {
          log?.(
            `mattermost: failed to delete stale command /${spec.trigger} (id=${existingCmd.id}): ${String(deleteErr)}`,
          );
          continue;
        }
      }
    }
    try {
      const created = await createMattermostCommand(client, {
        team_id: teamId,
        trigger: spec.trigger,
        method: "P",
        url: callbackUrl,
        description: spec.description,
        auto_complete: spec.autoComplete,
        auto_complete_desc: spec.description,
        auto_complete_hint: spec.autoCompleteHint,
      });
      log?.(`mattermost: registered command /${spec.trigger} (id=${created.id})`);
      registered.push({
        id: created.id,
        trigger: spec.trigger,
        teamId,
        token: created.token,
        managed: true,
      });
    } catch (err) {
      log?.(`mattermost: failed to register command /${spec.trigger}: ${String(err)}`);
    }
  }
  return registered;
}
/**
 * Clean up all registered slash commands.
 */
async function cleanupSlashCommands(params) {
  const { client, commands, log } = params;
  for (const cmd of commands) {
    if (!cmd.managed) continue;
    try {
      await deleteMattermostCommand(client, cmd.id);
      log?.(`mattermost: deleted command /${cmd.trigger} (id=${cmd.id})`);
    } catch (err) {
      log?.(`mattermost: failed to delete command /${cmd.trigger}: ${String(err)}`);
    }
  }
}
/**
 * Parse a Mattermost slash command callback payload from a URL-encoded or JSON body.
 */
function parseSlashCommandPayload(body, contentType) {
  if (!body) return null;
  try {
    if (contentType?.includes("application/json")) {
      const parsed = JSON.parse(body);
      const token = typeof parsed.token === "string" ? parsed.token : "";
      const teamId = typeof parsed.team_id === "string" ? parsed.team_id : "";
      const channelId = typeof parsed.channel_id === "string" ? parsed.channel_id : "";
      const userId = typeof parsed.user_id === "string" ? parsed.user_id : "";
      const command = typeof parsed.command === "string" ? parsed.command : "";
      if (!token || !teamId || !channelId || !userId || !command) return null;
      return {
        token,
        team_id: teamId,
        team_domain: typeof parsed.team_domain === "string" ? parsed.team_domain : void 0,
        channel_id: channelId,
        channel_name: typeof parsed.channel_name === "string" ? parsed.channel_name : void 0,
        user_id: userId,
        user_name: typeof parsed.user_name === "string" ? parsed.user_name : void 0,
        command,
        text: typeof parsed.text === "string" ? parsed.text : "",
        trigger_id: typeof parsed.trigger_id === "string" ? parsed.trigger_id : void 0,
        response_url: typeof parsed.response_url === "string" ? parsed.response_url : void 0,
      };
    }
    const params = new URLSearchParams(body);
    const token = params.get("token");
    const teamId = params.get("team_id");
    const channelId = params.get("channel_id");
    const userId = params.get("user_id");
    const command = params.get("command");
    if (!token || !teamId || !channelId || !userId || !command) return null;
    return {
      token,
      team_id: teamId,
      team_domain: params.get("team_domain") ?? void 0,
      channel_id: channelId,
      channel_name: params.get("channel_name") ?? void 0,
      user_id: userId,
      user_name: params.get("user_name") ?? void 0,
      command,
      text: params.get("text") ?? "",
      trigger_id: params.get("trigger_id") ?? void 0,
      response_url: params.get("response_url") ?? void 0,
    };
  } catch {
    return null;
  }
}
/**
 * Map the trigger word back to the original OpenClaw command name.
 * e.g. "oc_status" -> "/status", "oc_model" -> "/model"
 */
function resolveCommandText(trigger, text, triggerMap) {
  const commandName =
    triggerMap?.get(trigger) ?? (trigger.startsWith("oc_") ? trigger.slice(3) : trigger);
  const args = text.trim();
  return args ? `/${commandName} ${args}` : `/${commandName}`;
}
const DEFAULT_CALLBACK_PATH = "/api/channels/mattermost/command";
/**
 * Ensure the callback path starts with a leading `/` to prevent
 * malformed URLs like `http://host:portapi/...`.
 */
function normalizeCallbackPath(path) {
  const trimmed = path.trim();
  if (!trimmed) return DEFAULT_CALLBACK_PATH;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
function resolveSlashCommandConfig(raw) {
  return {
    native: raw?.native ?? "auto",
    nativeSkills: raw?.nativeSkills ?? "auto",
    callbackPath: normalizeCallbackPath(raw?.callbackPath ?? DEFAULT_CALLBACK_PATH),
    callbackUrl: raw?.callbackUrl?.trim() || void 0,
  };
}
function isSlashCommandsEnabled(config) {
  if (config.native === true) return true;
  if (config.native === false) return false;
  return false;
}
/**
 * Build the callback URL that Mattermost will POST to when a command is invoked.
 */
function resolveCallbackUrl(params) {
  if (params.config.callbackUrl) return params.config.callbackUrl;
  const isWildcardBindHost = (rawHost) => {
    const trimmed = rawHost.trim();
    if (!trimmed) return false;
    const host = trimmed.startsWith("[") && trimmed.endsWith("]") ? trimmed.slice(1, -1) : trimmed;
    return host === "0.0.0.0" || host === "::" || host === "0:0:0:0:0:0:0:0" || host === "::0";
  };
  let host =
    params.gatewayHost && !isWildcardBindHost(params.gatewayHost)
      ? params.gatewayHost
      : "localhost";
  const path = normalizeCallbackPath(params.config.callbackPath);
  if (host.includes(":") && !(host.startsWith("[") && host.endsWith("]"))) host = `[${host}]`;
  return `http://${host}:${params.gatewayPort}${path}`;
}
//#endregion
//#region extensions/mattermost/src/mattermost/reply-delivery.ts
async function deliverMattermostReplyPayload(params) {
  const reply = resolveSendableOutboundReplyParts(params.payload, {
    text: params.core.channel.text.convertMarkdownTables(
      params.payload.text ?? "",
      params.tableMode,
    ),
  });
  const mediaLocalRoots = getAgentScopedMediaLocalRoots(params.cfg, params.agentId);
  const chunkMode = params.core.channel.text.resolveChunkMode(
    params.cfg,
    "mattermost",
    params.accountId,
  );
  await deliverTextOrMediaReply({
    payload: params.payload,
    text: reply.text,
    chunkText: (value) =>
      params.core.channel.text.chunkMarkdownTextWithMode(value, params.textLimit, chunkMode),
    sendText: async (chunk) => {
      await params.sendMessage(params.to, chunk, {
        accountId: params.accountId,
        replyToId: params.replyToId,
      });
    },
    sendMedia: async ({ mediaUrl, caption }) => {
      await params.sendMessage(params.to, caption ?? "", {
        accountId: params.accountId,
        mediaUrl,
        mediaLocalRoots,
        replyToId: params.replyToId,
      });
    },
  });
}
//#endregion
//#region extensions/mattermost/src/mattermost/target-resolution.ts
const mattermostOpaqueTargetCache = /* @__PURE__ */ new Map();
function cacheKey$1(baseUrl, token, id) {
  return `${baseUrl}::${token}::${id}`;
}
/** Mattermost IDs are 26-character lowercase alphanumeric strings. */
function isMattermostId(value) {
  return /^[a-z0-9]{26}$/.test(value);
}
function isExplicitMattermostTarget(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return (
    /^(channel|user|mattermost):/i.test(trimmed) ||
    trimmed.startsWith("@") ||
    trimmed.startsWith("#")
  );
}
function parseMattermostApiStatus(err) {
  if (!err || typeof err !== "object") return;
  const msg = "message" in err ? String(err.message ?? "") : "";
  const match = /Mattermost API (\d{3})\b/.exec(msg);
  if (!match) return;
  const code = Number(match[1]);
  return Number.isFinite(code) ? code : void 0;
}
async function resolveMattermostOpaqueTarget(params) {
  const input = params.input.trim();
  if (!input || isExplicitMattermostTarget(input) || !isMattermostId(input)) return null;
  const account =
    params.cfg && (!params.token || !params.baseUrl)
      ? resolveMattermostAccount({
          cfg: params.cfg,
          accountId: params.accountId,
        })
      : null;
  const token = params.token?.trim() || account?.botToken?.trim();
  const baseUrl = normalizeMattermostBaseUrl(params.baseUrl ?? account?.baseUrl);
  if (!token || !baseUrl) return null;
  const key = cacheKey$1(baseUrl, token, input);
  const cached = mattermostOpaqueTargetCache.get(key);
  if (cached === true)
    return {
      kind: "user",
      id: input,
      to: `user:${input}`,
    };
  if (cached === false)
    return {
      kind: "channel",
      id: input,
      to: `channel:${input}`,
    };
  const client = createMattermostClient({
    baseUrl,
    botToken: token,
  });
  try {
    await fetchMattermostUser(client, input);
    mattermostOpaqueTargetCache.set(key, true);
    return {
      kind: "user",
      id: input,
      to: `user:${input}`,
    };
  } catch (err) {
    if (parseMattermostApiStatus(err) === 404) mattermostOpaqueTargetCache.set(key, false);
    return {
      kind: "channel",
      id: input,
      to: `channel:${input}`,
    };
  }
}
//#endregion
//#region extensions/mattermost/src/mattermost/send.ts
const botUserCache = /* @__PURE__ */ new Map();
const userByNameCache = /* @__PURE__ */ new Map();
const channelByNameCache = /* @__PURE__ */ new Map();
const dmChannelCache = /* @__PURE__ */ new Map();
const getCore = () => getMattermostRuntime();
function cacheKey(baseUrl, token) {
  return `${baseUrl}::${token}`;
}
function normalizeMessage(text, mediaUrl) {
  return [text.trim(), mediaUrl?.trim()].filter(Boolean).join("\n");
}
function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}
function parseMattermostTarget(raw) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Recipient is required for Mattermost sends");
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("channel:")) {
    const id = trimmed.slice(8).trim();
    if (!id) throw new Error("Channel id is required for Mattermost sends");
    if (id.startsWith("#")) {
      const name = id.slice(1).trim();
      if (!name) throw new Error("Channel name is required for Mattermost sends");
      return {
        kind: "channel-name",
        name,
      };
    }
    if (!isMattermostId(id))
      return {
        kind: "channel-name",
        name: id,
      };
    return {
      kind: "channel",
      id,
    };
  }
  if (lower.startsWith("user:")) {
    const id = trimmed.slice(5).trim();
    if (!id) throw new Error("User id is required for Mattermost sends");
    return {
      kind: "user",
      id,
    };
  }
  if (lower.startsWith("mattermost:")) {
    const id = trimmed.slice(11).trim();
    if (!id) throw new Error("User id is required for Mattermost sends");
    return {
      kind: "user",
      id,
    };
  }
  if (trimmed.startsWith("@")) {
    const username = trimmed.slice(1).trim();
    if (!username) throw new Error("Username is required for Mattermost sends");
    return {
      kind: "user",
      username,
    };
  }
  if (trimmed.startsWith("#")) {
    const name = trimmed.slice(1).trim();
    if (!name) throw new Error("Channel name is required for Mattermost sends");
    return {
      kind: "channel-name",
      name,
    };
  }
  if (!isMattermostId(trimmed))
    return {
      kind: "channel-name",
      name: trimmed,
    };
  return {
    kind: "channel",
    id: trimmed,
  };
}
async function resolveBotUser(baseUrl, token) {
  const key = cacheKey(baseUrl, token);
  const cached = botUserCache.get(key);
  if (cached) return cached;
  const user = await fetchMattermostMe(
    createMattermostClient({
      baseUrl,
      botToken: token,
    }),
  );
  botUserCache.set(key, user);
  return user;
}
async function resolveUserIdByUsername(params) {
  const { baseUrl, token, username } = params;
  const key = `${cacheKey(baseUrl, token)}::${username.toLowerCase()}`;
  const cached = userByNameCache.get(key);
  if (cached?.id) return cached.id;
  const user = await fetchMattermostUserByUsername(
    createMattermostClient({
      baseUrl,
      botToken: token,
    }),
    username,
  );
  userByNameCache.set(key, user);
  return user.id;
}
async function resolveChannelIdByName(params) {
  const { baseUrl, token, name } = params;
  const key = `${cacheKey(baseUrl, token)}::channel::${name.toLowerCase()}`;
  const cached = channelByNameCache.get(key);
  if (cached) return cached;
  const client = createMattermostClient({
    baseUrl,
    botToken: token,
  });
  const teams = await fetchMattermostUserTeams(client, (await fetchMattermostMe(client)).id);
  for (const team of teams)
    try {
      const channel = await fetchMattermostChannelByName(client, team.id, name);
      if (channel?.id) {
        channelByNameCache.set(key, channel.id);
        return channel.id;
      }
    } catch {}
  throw new Error(`Mattermost channel "#${name}" not found in any team the bot belongs to`);
}
function mergeDmRetryOptions(base, override) {
  const merged = {
    maxRetries: override?.maxRetries ?? base?.maxRetries,
    initialDelayMs: override?.initialDelayMs ?? base?.initialDelayMs,
    maxDelayMs: override?.maxDelayMs ?? base?.maxDelayMs,
    timeoutMs: override?.timeoutMs ?? base?.timeoutMs,
    onRetry: override?.onRetry,
  };
  if (
    merged.maxRetries === void 0 &&
    merged.initialDelayMs === void 0 &&
    merged.maxDelayMs === void 0 &&
    merged.timeoutMs === void 0 &&
    merged.onRetry === void 0
  )
    return;
  return merged;
}
async function resolveTargetChannelId(params) {
  if (params.target.kind === "channel") return params.target.id;
  if (params.target.kind === "channel-name")
    return await resolveChannelIdByName({
      baseUrl: params.baseUrl,
      token: params.token,
      name: params.target.name,
    });
  const userId = params.target.id
    ? params.target.id
    : await resolveUserIdByUsername({
        baseUrl: params.baseUrl,
        token: params.token,
        username: params.target.username ?? "",
      });
  const dmKey = `${cacheKey(params.baseUrl, params.token)}::dm::${userId}`;
  const cachedDm = dmChannelCache.get(dmKey);
  if (cachedDm) return cachedDm;
  const botUser = await resolveBotUser(params.baseUrl, params.token);
  const channel = await createMattermostDirectChannelWithRetry(
    createMattermostClient({
      baseUrl: params.baseUrl,
      botToken: params.token,
    }),
    [botUser.id, userId],
    {
      ...params.dmRetryOptions,
      onRetry: (attempt, delayMs, error) => {
        params.dmRetryOptions?.onRetry?.(attempt, delayMs, error);
        if (params.logger)
          params.logger.warn?.(
            `DM channel creation retry ${attempt} after ${delayMs}ms: ${error.message}`,
          );
      },
    },
  );
  dmChannelCache.set(dmKey, channel.id);
  return channel.id;
}
async function resolveMattermostSendContext(to, opts = {}) {
  const core = getCore();
  const logger = core.logging.getChildLogger({ module: "mattermost" });
  const cfg = opts.cfg ?? core.config.loadConfig();
  const account = resolveMattermostAccount({
    cfg,
    accountId: opts.accountId,
  });
  const token = opts.botToken?.trim() || account.botToken?.trim();
  if (!token)
    throw new Error(
      `Mattermost bot token missing for account "${account.accountId}" (set channels.mattermost.accounts.${account.accountId}.botToken or MATTERMOST_BOT_TOKEN for default).`,
    );
  const baseUrl = normalizeMattermostBaseUrl(opts.baseUrl ?? account.baseUrl);
  if (!baseUrl)
    throw new Error(
      `Mattermost baseUrl missing for account "${account.accountId}" (set channels.mattermost.accounts.${account.accountId}.baseUrl or MATTERMOST_URL for default).`,
    );
  const trimmedTo = to?.trim() ?? "";
  const opaqueTarget = await resolveMattermostOpaqueTarget({
    input: trimmedTo,
    token,
    baseUrl,
  });
  const channelId = await resolveTargetChannelId({
    target:
      opaqueTarget?.kind === "user"
        ? {
            kind: "user",
            id: opaqueTarget.id,
          }
        : opaqueTarget?.kind === "channel"
          ? {
              kind: "channel",
              id: opaqueTarget.id,
            }
          : parseMattermostTarget(trimmedTo),
    baseUrl,
    token,
    dmRetryOptions: mergeDmRetryOptions(
      account.config.dmChannelRetry
        ? {
            maxRetries: account.config.dmChannelRetry.maxRetries,
            initialDelayMs: account.config.dmChannelRetry.initialDelayMs,
            maxDelayMs: account.config.dmChannelRetry.maxDelayMs,
            timeoutMs: account.config.dmChannelRetry.timeoutMs,
          }
        : void 0,
      opts.dmRetryOptions,
    ),
    logger: core.logging.shouldLogVerbose() ? logger : void 0,
  });
  return {
    cfg,
    accountId: account.accountId,
    token,
    baseUrl,
    channelId,
  };
}
async function sendMessageMattermost(to, text, opts = {}) {
  const core = getCore();
  const logger = core.logging.getChildLogger({ module: "mattermost" });
  const { cfg, accountId, token, baseUrl, channelId } = await resolveMattermostSendContext(
    to,
    opts,
  );
  const client = createMattermostClient({
    baseUrl,
    botToken: token,
  });
  let props = opts.props;
  if (!props && Array.isArray(opts.buttons) && opts.buttons.length > 0) {
    setInteractionSecret(accountId, token);
    props = buildButtonProps({
      callbackUrl: resolveInteractionCallbackUrl(accountId, {
        gateway: cfg.gateway,
        interactions: resolveMattermostAccount({
          cfg,
          accountId,
        }).config?.interactions,
      }),
      accountId,
      channelId,
      buttons: opts.buttons,
      text: opts.attachmentText,
    });
  }
  let message = text?.trim() ?? "";
  let fileIds;
  let uploadError;
  const mediaUrl = opts.mediaUrl?.trim();
  if (mediaUrl)
    try {
      const media = await loadOutboundMediaFromUrl(mediaUrl, {
        mediaLocalRoots: opts.mediaLocalRoots,
      });
      fileIds = [
        (
          await uploadMattermostFile(client, {
            channelId,
            buffer: media.buffer,
            fileName: media.fileName ?? "upload",
            contentType: media.contentType ?? void 0,
          })
        ).id,
      ];
    } catch (err) {
      uploadError = err instanceof Error ? err : new Error(String(err));
      if (core.logging.shouldLogVerbose())
        logger.debug?.(
          `mattermost send: media upload failed, falling back to URL text: ${String(err)}`,
        );
      message = normalizeMessage(message, isHttpUrl(mediaUrl) ? mediaUrl : "");
    }
  if (message) {
    const tableMode = core.channel.text.resolveMarkdownTableMode({
      cfg,
      channel: "mattermost",
      accountId,
    });
    message = core.channel.text.convertMarkdownTables(message, tableMode);
  }
  if (!message && (!fileIds || fileIds.length === 0)) {
    if (uploadError) throw new Error(`Mattermost media upload failed: ${uploadError.message}`);
    throw new Error("Mattermost message is empty");
  }
  const post = await createMattermostPost(client, {
    channelId,
    message,
    rootId: opts.replyToId,
    fileIds,
    props,
  });
  core.channel.activity.record({
    channel: "mattermost",
    accountId,
    direction: "outbound",
  });
  return {
    messageId: post.id ?? "unknown",
    channelId,
  };
}
//#endregion
//#region extensions/mattermost/src/mattermost/slash-http.ts
const MAX_BODY_BYTES = 64 * 1024;
const BODY_READ_TIMEOUT_MS = 5e3;
/**
 * Read the full request body as a string.
 */
function readBody$1(req, maxBytes) {
  return readRequestBodyWithLimit(req, {
    maxBytes,
    timeoutMs: BODY_READ_TIMEOUT_MS,
  });
}
function sendJsonResponse(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}
async function authorizeSlashInvocation(params) {
  const { account, cfg, client, commandText, channelId, senderId, senderName, log } = params;
  const core = getMattermostRuntime();
  let channelInfo = null;
  try {
    channelInfo = await fetchMattermostChannel(client, channelId);
  } catch (err) {
    log?.(`mattermost: slash channel lookup failed for ${channelId}: ${String(err)}`);
  }
  if (!channelInfo)
    return {
      ok: false,
      denyResponse: {
        response_type: "ephemeral",
        text: "Temporary error: unable to determine channel type. Please try again.",
      },
      commandAuthorized: false,
      channelInfo: null,
      kind: "channel",
      chatType: "channel",
      channelName: "",
      channelDisplay: "",
      roomLabel: `#${channelId}`,
    };
  const allowTextCommands = core.channel.commands.shouldHandleTextCommands({
    cfg,
    surface: "mattermost",
  });
  const hasControlCommand = core.channel.text.hasControlCommand(commandText, cfg);
  const storeAllowFrom = normalizeMattermostAllowList(
    await core.channel.pairing
      .readAllowFromStore({
        channel: "mattermost",
        accountId: account.accountId,
      })
      .catch(() => []),
  );
  const decision = authorizeMattermostCommandInvocation({
    account,
    cfg,
    senderId,
    senderName,
    channelId,
    channelInfo,
    storeAllowFrom,
    allowTextCommands,
    hasControlCommand,
  });
  if (!decision.ok) {
    if (decision.denyReason === "dm-pairing") {
      const { code } = await core.channel.pairing.upsertPairingRequest({
        channel: "mattermost",
        accountId: account.accountId,
        id: senderId,
        meta: { name: senderName },
      });
      return {
        ...decision,
        denyResponse: {
          response_type: "ephemeral",
          text: core.channel.pairing.buildPairingReply({
            channel: "mattermost",
            idLine: `Your Mattermost user id: ${senderId}`,
            code,
          }),
        },
      };
    }
    const denyText =
      decision.denyReason === "unknown-channel"
        ? "Temporary error: unable to determine channel type. Please try again."
        : decision.denyReason === "dm-disabled"
          ? "This bot is not accepting direct messages."
          : decision.denyReason === "channels-disabled"
            ? "Slash commands are disabled in channels."
            : decision.denyReason === "channel-no-allowlist"
              ? "Slash commands are not configured for this channel (no allowlist)."
              : "Unauthorized.";
    return {
      ...decision,
      denyResponse: {
        response_type: "ephemeral",
        text: denyText,
      },
    };
  }
  return {
    ...decision,
    denyResponse: void 0,
  };
}
/**
 * Create the HTTP request handler for Mattermost slash command callbacks.
 *
 * This handler is registered as a plugin HTTP route and receives POSTs
 * from the Mattermost server when a user invokes a registered slash command.
 */
function createSlashCommandHttpHandler(params) {
  const { account, cfg, runtime, commandTokens, triggerMap, log } = params;
  return async (req, res) => {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Allow", "POST");
      res.end("Method Not Allowed");
      return;
    }
    let body;
    try {
      body = await readBody$1(req, MAX_BODY_BYTES);
    } catch (error) {
      if (isRequestBodyLimitError(error, "REQUEST_BODY_TIMEOUT")) {
        res.statusCode = 408;
        res.end("Request body timeout");
        return;
      }
      res.statusCode = 413;
      res.end("Payload Too Large");
      return;
    }
    const contentType = req.headers["content-type"] ?? "";
    const payload = parseSlashCommandPayload(body, contentType);
    if (!payload) {
      sendJsonResponse(res, 400, {
        response_type: "ephemeral",
        text: "Invalid slash command payload.",
      });
      return;
    }
    if (commandTokens.size === 0 || !commandTokens.has(payload.token)) {
      sendJsonResponse(res, 401, {
        response_type: "ephemeral",
        text: "Unauthorized: invalid command token.",
      });
      return;
    }
    const trigger = payload.command.replace(/^\//, "").trim();
    const commandText = resolveCommandText(trigger, payload.text, triggerMap);
    const channelId = payload.channel_id;
    const senderId = payload.user_id;
    const senderName = payload.user_name ?? senderId;
    const client = createMattermostClient({
      baseUrl: account.baseUrl ?? "",
      botToken: account.botToken ?? "",
    });
    const auth = await authorizeSlashInvocation({
      account,
      cfg,
      client,
      commandText,
      channelId,
      senderId,
      senderName,
      log,
    });
    if (!auth.ok) {
      sendJsonResponse(
        res,
        200,
        auth.denyResponse ?? {
          response_type: "ephemeral",
          text: "Unauthorized.",
        },
      );
      return;
    }
    log?.(`mattermost: slash command /${trigger} from ${senderName} in ${channelId}`);
    sendJsonResponse(res, 200, {
      response_type: "ephemeral",
      text: "Processing...",
    });
    try {
      await handleSlashCommandAsync({
        account,
        cfg,
        runtime,
        client,
        commandText,
        channelId,
        senderId,
        senderName,
        teamId: payload.team_id,
        triggerId: payload.trigger_id,
        kind: auth.kind,
        chatType: auth.chatType,
        channelName: auth.channelName,
        channelDisplay: auth.channelDisplay,
        roomLabel: auth.roomLabel,
        commandAuthorized: auth.commandAuthorized,
        log,
      });
    } catch (err) {
      log?.(`mattermost: slash command handler error: ${String(err)}`);
      try {
        await sendMessageMattermost(
          `channel:${channelId}`,
          "Sorry, something went wrong processing that command.",
          { accountId: account.accountId },
        );
      } catch {}
    }
  };
}
async function handleSlashCommandAsync(params) {
  const {
    account,
    cfg,
    runtime,
    client,
    commandText,
    channelId,
    senderId,
    senderName,
    teamId,
    kind,
    chatType,
    channelName,
    channelDisplay,
    roomLabel,
    commandAuthorized,
    triggerId,
    log,
  } = params;
  const core = getMattermostRuntime();
  const route = core.channel.routing.resolveAgentRoute({
    cfg,
    channel: "mattermost",
    accountId: account.accountId,
    teamId,
    peer: {
      kind,
      id: kind === "direct" ? senderId : channelId,
    },
  });
  const fromLabel =
    kind === "direct"
      ? `Mattermost DM from ${senderName}`
      : `Mattermost message in ${roomLabel} from ${senderName}`;
  const to = kind === "direct" ? `user:${senderId}` : `channel:${channelId}`;
  const pickerEntry = resolveMattermostModelPickerEntry(commandText);
  if (pickerEntry) {
    const data = await buildModelsProviderData(cfg, route.agentId);
    if (data.providers.length === 0) {
      await sendMessageMattermost(to, "No models available.", { accountId: account.accountId });
      return;
    }
    const currentModel = resolveMattermostModelPickerCurrentModel({
      cfg,
      route,
      data,
    });
    const view =
      pickerEntry.kind === "summary"
        ? renderMattermostModelSummaryView({
            ownerUserId: senderId,
            currentModel,
          })
        : pickerEntry.kind === "providers"
          ? renderMattermostProviderPickerView({
              ownerUserId: senderId,
              data,
              currentModel,
            })
          : renderMattermostModelsPickerView({
              ownerUserId: senderId,
              data,
              provider: pickerEntry.provider,
              page: 1,
              currentModel,
            });
    await sendMessageMattermost(to, view.text, {
      accountId: account.accountId,
      buttons: view.buttons,
    });
    runtime.log?.(`delivered model picker to ${to}`);
    return;
  }
  const ctxPayload = core.channel.reply.finalizeInboundContext({
    Body: commandText,
    BodyForAgent: commandText,
    RawBody: commandText,
    CommandBody: commandText,
    From:
      kind === "direct"
        ? `mattermost:${senderId}`
        : kind === "group"
          ? `mattermost:group:${channelId}`
          : `mattermost:channel:${channelId}`,
    To: to,
    SessionKey: route.sessionKey,
    AccountId: route.accountId,
    ChatType: chatType,
    ConversationLabel: fromLabel,
    GroupSubject: kind !== "direct" ? channelDisplay || roomLabel : void 0,
    SenderName: senderName,
    SenderId: senderId,
    Provider: "mattermost",
    Surface: "mattermost",
    MessageSid: triggerId ?? `slash-${Date.now()}`,
    Timestamp: Date.now(),
    WasMentioned: true,
    CommandAuthorized: commandAuthorized,
    CommandSource: "native",
    OriginatingChannel: "mattermost",
    OriginatingTo: to,
  });
  const textLimit = core.channel.text.resolveTextChunkLimit(cfg, "mattermost", account.accountId, {
    fallbackLimit: account.textChunkLimit ?? 4e3,
  });
  const tableMode = core.channel.text.resolveMarkdownTableMode({
    cfg,
    channel: "mattermost",
    accountId: account.accountId,
  });
  const { onModelSelected, typingCallbacks, ...replyPipeline } = createChannelReplyPipeline({
    cfg,
    agentId: route.agentId,
    channel: "mattermost",
    accountId: account.accountId,
    typing: {
      start: () => sendMattermostTyping(client, { channelId }),
      onStartError: (err) => {
        logTypingFailure({
          log: (message) => log?.(message),
          channel: "mattermost",
          target: channelId,
          error: err,
        });
      },
    },
  });
  const humanDelay = core.channel.reply.resolveHumanDelayConfig(cfg, route.agentId);
  const { dispatcher, replyOptions, markDispatchIdle } =
    core.channel.reply.createReplyDispatcherWithTyping({
      ...replyPipeline,
      humanDelay,
      deliver: async (payload) => {
        await deliverMattermostReplyPayload({
          core,
          cfg,
          payload,
          to,
          accountId: account.accountId,
          agentId: route.agentId,
          textLimit,
          tableMode,
          sendMessage: sendMessageMattermost,
        });
        runtime.log?.(`delivered slash reply to ${to}`);
      },
      onError: (err, info) => {
        runtime.error?.(`mattermost slash ${info.kind} reply failed: ${String(err)}`);
      },
      onReplyStart: typingCallbacks?.onReplyStart,
    });
  await core.channel.reply.withReplyDispatcher({
    dispatcher,
    onSettled: () => {
      markDispatchIdle();
    },
    run: () =>
      core.channel.reply.dispatchReplyFromConfig({
        ctx: ctxPayload,
        cfg,
        dispatcher,
        replyOptions: {
          ...replyOptions,
          disableBlockStreaming:
            typeof account.blockStreaming === "boolean" ? !account.blockStreaming : void 0,
          onModelSelected,
        },
      }),
  });
}
//#endregion
//#region extensions/mattermost/src/mattermost/slash-state.ts
/** Map from accountId → per-account slash command state. */
const accountStates = /* @__PURE__ */ new Map();
function resolveSlashHandlerForToken(token) {
  const matches = [];
  for (const [accountId, state] of accountStates)
    if (state.commandTokens.has(token) && state.handler)
      matches.push({
        accountId,
        handler: state.handler,
      });
  if (matches.length === 0) return { kind: "none" };
  if (matches.length === 1)
    return {
      kind: "single",
      handler: matches[0].handler,
      accountIds: [matches[0].accountId],
    };
  return {
    kind: "ambiguous",
    accountIds: matches.map((entry) => entry.accountId),
  };
}
/**
 * Get the slash command state for a specific account, or null if not activated.
 */
function getSlashCommandState(accountId) {
  return accountStates.get(accountId) ?? null;
}
/**
 * Activate slash commands for a specific account.
 * Called from the monitor after bot connects.
 */
function activateSlashCommands(params) {
  const { account, commandTokens, registeredCommands, triggerMap, api, log } = params;
  const accountId = account.accountId;
  const tokenSet = new Set(commandTokens);
  const handler = createSlashCommandHttpHandler({
    account,
    cfg: api.cfg,
    runtime: api.runtime,
    commandTokens: tokenSet,
    triggerMap,
    log,
  });
  accountStates.set(accountId, {
    commandTokens: tokenSet,
    registeredCommands,
    handler,
    account,
    triggerMap: triggerMap ?? /* @__PURE__ */ new Map(),
  });
  log?.(
    `mattermost: slash commands activated for account ${accountId} (${registeredCommands.length} commands)`,
  );
}
/**
 * Deactivate slash commands for a specific account (on shutdown/disconnect).
 */
function deactivateSlashCommands(accountId) {
  if (accountId) {
    const state = accountStates.get(accountId);
    if (state) {
      state.commandTokens.clear();
      state.registeredCommands = [];
      state.handler = null;
      accountStates.delete(accountId);
    }
  } else {
    for (const [, state] of accountStates) {
      state.commandTokens.clear();
      state.registeredCommands = [];
      state.handler = null;
    }
    accountStates.clear();
  }
}
/**
 * Register the HTTP route for slash command callbacks.
 * Called during plugin registration.
 *
 * The single HTTP route dispatches to the correct per-account handler
 * by matching the inbound token against each account's registered tokens.
 */
function registerSlashCommandRoute(api) {
  const mmConfig = api.config.channels?.mattermost;
  const callbackPaths = /* @__PURE__ */ new Set();
  const addCallbackPaths = (raw) => {
    const resolved = resolveSlashCommandConfig(raw);
    callbackPaths.add(resolved.callbackPath);
    if (resolved.callbackUrl)
      try {
        const urlPath = new URL(resolved.callbackUrl).pathname;
        if (urlPath && urlPath !== resolved.callbackPath) callbackPaths.add(urlPath);
      } catch {}
  };
  const commandsRaw = mmConfig?.commands;
  addCallbackPaths(commandsRaw);
  const accountsRaw = mmConfig?.accounts ?? {};
  for (const accountId of Object.keys(accountsRaw)) {
    const accountCommandsRaw = accountsRaw[accountId]?.commands;
    addCallbackPaths(accountCommandsRaw);
  }
  const routeHandler = async (req, res) => {
    if (accountStates.size === 0) {
      res.statusCode = 503;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          response_type: "ephemeral",
          text: "Slash commands are not yet initialized. Please try again in a moment.",
        }),
      );
      return;
    }
    if (accountStates.size === 1) {
      const [, state] = [...accountStates.entries()][0];
      if (!state.handler) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(
          JSON.stringify({
            response_type: "ephemeral",
            text: "Slash commands are not yet initialized. Please try again in a moment.",
          }),
        );
        return;
      }
      await state.handler(req, res);
      return;
    }
    const chunks = [];
    const MAX_BODY = 64 * 1024;
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY) {
        res.statusCode = 413;
        res.end("Payload Too Large");
        return;
      }
      chunks.push(chunk);
    }
    const bodyStr = Buffer.concat(chunks).toString("utf8");
    let token = null;
    const ct = req.headers["content-type"] ?? "";
    try {
      if (ct.includes("application/json")) token = JSON.parse(bodyStr).token ?? null;
      else token = new URLSearchParams(bodyStr).get("token");
    } catch {}
    const match = token ? resolveSlashHandlerForToken(token) : { kind: "none" };
    if (match.kind === "none") {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          response_type: "ephemeral",
          text: "Unauthorized: invalid command token.",
        }),
      );
      return;
    }
    if (match.kind === "ambiguous") {
      api.logger.warn?.(
        `mattermost: slash callback token matched multiple accounts (${match.accountIds?.join(", ")})`,
      );
      res.statusCode = 409;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          response_type: "ephemeral",
          text: "Conflict: command token is not unique across accounts.",
        }),
      );
      return;
    }
    const matchedHandler = match.handler;
    const { Readable } = await import("node:stream");
    const syntheticReq = new Readable({
      read() {
        this.push(Buffer.from(bodyStr, "utf8"));
        this.push(null);
      },
    });
    syntheticReq.method = req.method;
    syntheticReq.url = req.url;
    syntheticReq.headers = req.headers;
    await matchedHandler(syntheticReq, res);
  };
  for (const callbackPath of callbackPaths) {
    api.registerHttpRoute({
      path: callbackPath,
      auth: "plugin",
      handler: routeHandler,
    });
    api.logger.info?.(`mattermost: registered slash command callback at ${callbackPath}`);
  }
}
//#endregion
//#region extensions/mattermost/src/mattermost/monitor-slash.ts
function isLoopbackHost$1(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
function buildSlashCommands(params) {
  const commandsToRegister = [...DEFAULT_COMMAND_SPECS];
  if (!params.nativeSkills) return commandsToRegister;
  try {
    const skillCommands = listSkillCommandsForAgents({ cfg: params.cfg });
    for (const spec of skillCommands) {
      const name = typeof spec.name === "string" ? spec.name.trim() : "";
      if (!name) continue;
      const trigger = name.startsWith("oc_") ? name : `oc_${name}`;
      commandsToRegister.push({
        trigger,
        description: spec.description || `Run skill ${name}`,
        autoComplete: true,
        autoCompleteHint: "[args]",
        originalName: name,
      });
    }
  } catch (err) {
    params.runtime.error?.(`mattermost: failed to list skill commands: ${String(err)}`);
  }
  return commandsToRegister;
}
function dedupeSlashCommands(commands) {
  const seen = /* @__PURE__ */ new Set();
  return commands.filter((cmd) => {
    const key = cmd.trigger.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function buildTriggerMap(commands) {
  const triggerMap = /* @__PURE__ */ new Map();
  for (const cmd of commands) if (cmd.originalName) triggerMap.set(cmd.trigger, cmd.originalName);
  return triggerMap;
}
function warnOnSuspiciousCallbackUrl(params) {
  try {
    const mmHost = new URL(normalizeMattermostBaseUrl(params.baseUrl) ?? params.baseUrl).hostname;
    const callbackHost = new URL(params.callbackUrl).hostname;
    if (isLoopbackHost$1(callbackHost) && !isLoopbackHost$1(mmHost))
      params.runtime.error?.(
        `mattermost: slash commands callbackUrl resolved to ${params.callbackUrl} (loopback) while baseUrl is ${params.baseUrl}. This MAY be unreachable depending on your deployment. If native slash commands don't work, set channels.mattermost.commands.callbackUrl to a URL reachable from the Mattermost server (e.g. your public reverse proxy URL).`,
      );
  } catch {}
}
async function registerSlashCommandsAcrossTeams(params) {
  const registered = [];
  let teamRegistrationFailures = 0;
  for (const team of params.teams)
    try {
      const created = await registerSlashCommands({
        client: params.client,
        teamId: team.id,
        creatorUserId: params.botUserId,
        callbackUrl: params.callbackUrl,
        commands: params.commands,
        log: (msg) => params.runtime.log?.(msg),
      });
      registered.push(...created);
    } catch (err) {
      teamRegistrationFailures += 1;
      params.runtime.error?.(
        `mattermost: failed to register slash commands for team ${team.id}: ${String(err)}`,
      );
    }
  return {
    registered,
    teamRegistrationFailures,
  };
}
async function registerMattermostMonitorSlashCommands(params) {
  const commandsRaw = params.account.config.commands;
  const slashConfig = resolveSlashCommandConfig(commandsRaw);
  if (!isSlashCommandsEnabled(slashConfig)) return;
  try {
    const teams = await fetchMattermostUserTeams(params.client, params.botUserId);
    const slashCallbackUrl = resolveCallbackUrl({
      config: slashConfig,
      gatewayPort:
        parseStrictPositiveInteger(process.env.OPENCLAW_GATEWAY_PORT?.trim()) ??
        params.cfg.gateway?.port ??
        18789,
      gatewayHost: params.cfg.gateway?.customBindHost ?? void 0,
    });
    warnOnSuspiciousCallbackUrl({
      runtime: params.runtime,
      baseUrl: params.baseUrl,
      callbackUrl: slashCallbackUrl,
    });
    const dedupedCommands = dedupeSlashCommands(
      buildSlashCommands({
        cfg: params.cfg,
        runtime: params.runtime,
        nativeSkills: slashConfig.nativeSkills === true,
      }),
    );
    const { registered, teamRegistrationFailures } = await registerSlashCommandsAcrossTeams({
      client: params.client,
      teams,
      botUserId: params.botUserId,
      callbackUrl: slashCallbackUrl,
      commands: dedupedCommands,
      runtime: params.runtime,
    });
    if (registered.length === 0) {
      params.runtime.error?.(
        "mattermost: native slash commands enabled but no commands could be registered; keeping slash callbacks inactive",
      );
      return;
    }
    if (teamRegistrationFailures > 0)
      params.runtime.error?.(
        `mattermost: slash command registration completed with ${teamRegistrationFailures} team error(s)`,
      );
    activateSlashCommands({
      account: params.account,
      commandTokens: registered.map((cmd) => cmd.token).filter(Boolean),
      registeredCommands: registered,
      triggerMap: buildTriggerMap(dedupedCommands),
      api: {
        cfg: params.cfg,
        runtime: params.runtime,
      },
      log: (msg) => params.runtime.log?.(msg),
    });
    params.runtime.log?.(
      `mattermost: slash commands registered (${registered.length} commands across ${teams.length} teams, callback=${slashCallbackUrl})`,
    );
  } catch (err) {
    params.runtime.error?.(`mattermost: failed to register slash commands: ${String(err)}`);
  }
}
//#endregion
//#region extensions/mattermost/src/mattermost/monitor-websocket.ts
var WebSocketClosedBeforeOpenError = class extends Error {
  constructor(code, reason) {
    super(`websocket closed before open (code ${code})`);
    this.code = code;
    this.reason = reason;
    this.name = "WebSocketClosedBeforeOpenError";
  }
};
const defaultMattermostWebSocketFactory = (url) => new WebSocket(url);
function parsePostedPayload(payload) {
  if (payload.event !== "posted") return null;
  const postData = payload.data?.post;
  if (!postData) return null;
  let post = null;
  if (typeof postData === "string")
    try {
      post = JSON.parse(postData);
    } catch {
      return null;
    }
  else if (typeof postData === "object") post = postData;
  if (!post) return null;
  return {
    payload,
    post,
  };
}
function createMattermostConnectOnce(opts) {
  const webSocketFactory = opts.webSocketFactory ?? defaultMattermostWebSocketFactory;
  return async () => {
    const ws = webSocketFactory(opts.wsUrl);
    const onAbort = () => ws.terminate();
    opts.abortSignal?.addEventListener("abort", onAbort, { once: true });
    try {
      return await new Promise((resolve, reject) => {
        let opened = false;
        let settled = false;
        const resolveOnce = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        const rejectOnce = (error) => {
          if (settled) return;
          settled = true;
          reject(error);
        };
        ws.on("open", () => {
          opened = true;
          opts.statusSink?.({
            connected: true,
            lastConnectedAt: Date.now(),
            lastError: null,
          });
          ws.send(
            JSON.stringify({
              seq: opts.nextSeq(),
              action: "authentication_challenge",
              data: { token: opts.botToken },
            }),
          );
        });
        ws.on("message", async (data) => {
          const raw = rawDataToString(data);
          let payload;
          try {
            payload = JSON.parse(raw);
          } catch {
            return;
          }
          if (payload.event === "reaction_added" || payload.event === "reaction_removed") {
            if (!opts.onReaction) return;
            try {
              await opts.onReaction(payload);
            } catch (err) {
              opts.runtime.error?.(`mattermost reaction handler failed: ${String(err)}`);
            }
            return;
          }
          if (payload.event !== "posted") return;
          const parsed = parsePostedPayload(payload);
          if (!parsed) return;
          try {
            await opts.onPosted(parsed.post, parsed.payload);
          } catch (err) {
            opts.runtime.error?.(`mattermost handler failed: ${String(err)}`);
          }
        });
        ws.on("close", (code, reason) => {
          const message = reasonToString(reason);
          opts.statusSink?.({
            connected: false,
            lastDisconnect: {
              at: Date.now(),
              status: code,
              error: message || void 0,
            },
          });
          if (opened) {
            resolveOnce();
            return;
          }
          rejectOnce(new WebSocketClosedBeforeOpenError(code, message || void 0));
        });
        ws.on("error", (err) => {
          opts.runtime.error?.(`mattermost websocket error: ${String(err)}`);
          opts.statusSink?.({ lastError: String(err) });
          try {
            ws.close();
          } catch {}
        });
      });
    } finally {
      opts.abortSignal?.removeEventListener("abort", onAbort);
    }
  };
}
function reasonToString(reason) {
  if (!reason) return "";
  if (typeof reason === "string") return reason;
  return reason.length > 0 ? reason.toString("utf8") : "";
}
//#endregion
//#region extensions/mattermost/src/mattermost/reconnect.ts
/**
 * Reconnection loop with exponential backoff.
 *
 * Calls `connectFn` in a while loop. On normal resolve (connection closed),
 * the backoff resets. On thrown error (connection failed), the current delay is
 * used, then doubled for the next retry.
 * The loop exits when `abortSignal` fires.
 */
async function runWithReconnect(connectFn, opts = {}) {
  const { initialDelayMs = 2e3, maxDelayMs = 6e4 } = opts;
  const jitterRatio = Math.max(0, opts.jitterRatio ?? 0);
  const random = opts.random ?? Math.random;
  let retryDelay = initialDelayMs;
  let attempt = 0;
  while (!opts.abortSignal?.aborted) {
    let shouldIncreaseDelay = false;
    let outcome = "resolved";
    let error;
    try {
      await connectFn();
      retryDelay = initialDelayMs;
    } catch (err) {
      if (opts.abortSignal?.aborted) return;
      outcome = "rejected";
      error = err;
      opts.onError?.(err);
      shouldIncreaseDelay = true;
    }
    if (opts.abortSignal?.aborted) return;
    const delayMs = withJitter(retryDelay, jitterRatio, random);
    if (
      !(
        opts.shouldReconnect?.({
          attempt,
          delayMs,
          outcome,
          error,
        }) ?? true
      )
    )
      return;
    opts.onReconnect?.(delayMs);
    await sleepAbortable(delayMs, opts.abortSignal);
    if (shouldIncreaseDelay) retryDelay = Math.min(retryDelay * 2, maxDelayMs);
    attempt++;
  }
}
function withJitter(baseMs, jitterRatio, random) {
  if (jitterRatio <= 0) return baseMs;
  const normalized = Math.max(0, Math.min(1, random()));
  const spread = baseMs * jitterRatio;
  return Math.max(1, Math.round(baseMs - spread + normalized * spread * 2));
}
function sleepAbortable(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
//#endregion
//#region extensions/mattermost/src/mattermost/monitor.ts
const RECENT_MATTERMOST_MESSAGE_TTL_MS = 5 * 6e4;
const RECENT_MATTERMOST_MESSAGE_MAX = 2e3;
function isLoopbackHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
function normalizeInteractionSourceIps(values) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}
const recentInboundMessages = createDedupeCache({
  ttlMs: RECENT_MATTERMOST_MESSAGE_TTL_MS,
  maxSize: RECENT_MATTERMOST_MESSAGE_MAX,
});
function resolveRuntime(opts) {
  return (
    opts.runtime ?? {
      log: console.log,
      error: console.error,
      exit: (code) => {
        throw new Error(`exit ${code}`);
      },
    }
  );
}
function isSystemPost(post) {
  const type = post.type?.trim();
  return Boolean(type);
}
function channelChatType(kind) {
  if (kind === "direct") return "direct";
  if (kind === "group") return "group";
  return "channel";
}
function resolveMattermostReplyRootId(params) {
  const threadRootId = params.threadRootId?.trim();
  if (threadRootId) return threadRootId;
  return params.replyToId?.trim() || void 0;
}
function resolveMattermostEffectiveReplyToId(params) {
  const threadRootId = params.threadRootId?.trim();
  if (threadRootId && params.replyToMode !== "off") return threadRootId;
  if (params.kind === "direct") return;
  const postId = params.postId?.trim();
  if (!postId) return;
  return params.replyToMode === "all" || params.replyToMode === "first" ? postId : void 0;
}
function resolveMattermostThreadSessionContext(params) {
  const effectiveReplyToId = resolveMattermostEffectiveReplyToId({
    kind: params.kind,
    postId: params.postId,
    replyToMode: params.replyToMode,
    threadRootId: params.threadRootId,
  });
  const threadKeys = resolveThreadSessionKeys({
    baseSessionKey: params.baseSessionKey,
    threadId: effectiveReplyToId,
    parentSessionKey: effectiveReplyToId ? params.baseSessionKey : void 0,
  });
  return {
    effectiveReplyToId,
    sessionKey: threadKeys.sessionKey,
    parentSessionKey: threadKeys.parentSessionKey,
  };
}
function buildMattermostAttachmentPlaceholder(mediaList) {
  if (mediaList.length === 0) return "";
  if (mediaList.length === 1)
    return `<media:${mediaList[0].kind === "unknown" ? "document" : mediaList[0].kind}>`;
  const allImages = mediaList.every((media) => media.kind === "image");
  const label = allImages ? "image" : "file";
  const suffix = mediaList.length === 1 ? label : `${label}s`;
  return `${allImages ? "<media:image>" : "<media:document>"} (${mediaList.length} ${suffix})`;
}
function buildMattermostWsUrl(baseUrl) {
  const normalized = normalizeMattermostBaseUrl(baseUrl);
  if (!normalized) throw new Error("Mattermost baseUrl is required");
  return `${normalized.replace(/^http/i, "ws")}/api/v4/websocket`;
}
async function monitorMattermostProvider(opts = {}) {
  const core = getMattermostRuntime();
  const runtime = resolveRuntime(opts);
  const cfg = opts.config ?? core.config.loadConfig();
  const account = resolveMattermostAccount({
    cfg,
    accountId: opts.accountId,
  });
  const pairing = createChannelPairingController({
    core,
    channel: "mattermost",
    accountId: account.accountId,
  });
  const allowNameMatching = isDangerousNameMatchingEnabled(account.config);
  const botToken = opts.botToken?.trim() || account.botToken?.trim();
  if (!botToken)
    throw new Error(
      `Mattermost bot token missing for account "${account.accountId}" (set channels.mattermost.accounts.${account.accountId}.botToken or MATTERMOST_BOT_TOKEN for default).`,
    );
  const baseUrl = normalizeMattermostBaseUrl(opts.baseUrl ?? account.baseUrl);
  if (!baseUrl)
    throw new Error(
      `Mattermost baseUrl missing for account "${account.accountId}" (set channels.mattermost.accounts.${account.accountId}.baseUrl or MATTERMOST_URL for default).`,
    );
  const client = createMattermostClient({
    baseUrl,
    botToken,
  });
  const botUser = await fetchMattermostMe(client);
  const botUserId = botUser.id;
  const botUsername = botUser.username?.trim() || void 0;
  runtime.log?.(`mattermost connected as ${botUsername ? `@${botUsername}` : botUserId}`);
  await registerMattermostMonitorSlashCommands({
    client,
    cfg,
    runtime,
    account,
    baseUrl,
    botUserId,
  });
  const slashEnabled = getSlashCommandState(account.accountId) != null;
  setInteractionSecret(account.accountId, botToken);
  const interactionPath = resolveInteractionCallbackPath(account.accountId);
  const callbackUrl = computeInteractionCallbackUrl(account.accountId, {
    gateway: cfg.gateway,
    interactions: account.config.interactions,
  });
  setInteractionCallbackUrl(account.accountId, callbackUrl);
  const allowedInteractionSourceIps = normalizeInteractionSourceIps(
    account.config.interactions?.allowedSourceIps,
  );
  try {
    const mmHost = new URL(baseUrl).hostname;
    const callbackHost = new URL(callbackUrl).hostname;
    if (isLoopbackHost(callbackHost) && !isLoopbackHost(mmHost))
      runtime.error?.(
        `mattermost: interactions callbackUrl resolved to ${callbackUrl} (loopback) while baseUrl is ${baseUrl}. This MAY be unreachable depending on your deployment. If button clicks don't work, set channels.mattermost.interactions.callbackBaseUrl to a URL reachable from the Mattermost server (e.g. your public reverse proxy URL).`,
      );
    if (!isLoopbackHost(callbackHost) && allowedInteractionSourceIps.length === 0)
      runtime.error?.(
        `mattermost: interactions callbackUrl resolved to ${callbackUrl} without channels.mattermost.interactions.allowedSourceIps. For safety, non-loopback callback sources will be rejected until you allowlist the Mattermost server or trusted ingress IPs.`,
      );
  } catch {}
  const effectiveInteractionSourceIps =
    allowedInteractionSourceIps.length > 0 ? allowedInteractionSourceIps : ["127.0.0.1", "::1"];
  const unregisterInteractions = registerPluginHttpRoute({
    path: interactionPath,
    fallbackPath: "/mattermost/interactions/default",
    auth: "plugin",
    handler: createMattermostInteractionHandler({
      client,
      botUserId,
      accountId: account.accountId,
      allowedSourceIps: effectiveInteractionSourceIps,
      trustedProxies: cfg.gateway?.trustedProxies,
      allowRealIpFallback: cfg.gateway?.allowRealIpFallback === true,
      handleInteraction: handleModelPickerInteraction,
      authorizeButtonClick: async ({ payload, post }) => {
        const channelInfo = await resolveChannelInfo(payload.channel_id);
        const isDirect = channelInfo?.type?.trim().toUpperCase() === "D";
        const allowTextCommands = core.channel.commands.shouldHandleTextCommands({
          cfg,
          surface: "mattermost",
        });
        const decision = authorizeMattermostCommandInvocation({
          account,
          cfg,
          senderId: payload.user_id,
          senderName: payload.user_name ?? "",
          channelId: payload.channel_id,
          channelInfo,
          storeAllowFrom: isDirect
            ? await readStoreAllowFromForDmPolicy({
                provider: "mattermost",
                accountId: account.accountId,
                dmPolicy: account.config.dmPolicy ?? "pairing",
                readStore: pairing.readStoreForDmPolicy,
              })
            : void 0,
          allowTextCommands,
          hasControlCommand: false,
        });
        if (decision.ok) return { ok: true };
        return {
          ok: false,
          response: {
            update: {
              message: post.message ?? "",
              props: post.props,
            },
            ephemeral_text: `OpenClaw ignored this action for ${decision.roomLabel}.`,
          },
        };
      },
      resolveSessionKey: async ({ channelId, userId, post }) => {
        const channelInfo = await resolveChannelInfo(channelId);
        const kind = mapMattermostChannelTypeToChatType(channelInfo?.type);
        const teamId = channelInfo?.team_id ?? void 0;
        const route = core.channel.routing.resolveAgentRoute({
          cfg,
          channel: "mattermost",
          accountId: account.accountId,
          teamId,
          peer: {
            kind,
            id: kind === "direct" ? userId : channelId,
          },
        });
        const replyToMode = resolveMattermostReplyToMode(account, kind);
        return resolveMattermostThreadSessionContext({
          baseSessionKey: route.sessionKey,
          kind,
          postId: post.id || void 0,
          replyToMode,
          threadRootId: post.root_id,
        }).sessionKey;
      },
      dispatchButtonClick: async (opts) => {
        const channelInfo = await resolveChannelInfo(opts.channelId);
        const kind = mapMattermostChannelTypeToChatType(channelInfo?.type);
        const chatType = channelChatType(kind);
        const teamId = channelInfo?.team_id ?? void 0;
        const channelName = channelInfo?.name ?? void 0;
        const channelDisplay = channelInfo?.display_name ?? channelName ?? opts.channelId;
        const route = core.channel.routing.resolveAgentRoute({
          cfg,
          channel: "mattermost",
          accountId: account.accountId,
          teamId,
          peer: {
            kind,
            id: kind === "direct" ? opts.userId : opts.channelId,
          },
        });
        const replyToMode = resolveMattermostReplyToMode(account, kind);
        const threadContext = resolveMattermostThreadSessionContext({
          baseSessionKey: route.sessionKey,
          kind,
          postId: opts.post.id || opts.postId,
          replyToMode,
          threadRootId: opts.post.root_id,
        });
        const to = kind === "direct" ? `user:${opts.userId}` : `channel:${opts.channelId}`;
        const bodyText = `[Button click: user @${opts.userName} selected "${opts.actionName}"]`;
        const ctxPayload = core.channel.reply.finalizeInboundContext({
          Body: bodyText,
          BodyForAgent: bodyText,
          RawBody: bodyText,
          CommandBody: bodyText,
          From:
            kind === "direct"
              ? `mattermost:${opts.userId}`
              : kind === "group"
                ? `mattermost:group:${opts.channelId}`
                : `mattermost:channel:${opts.channelId}`,
          To: to,
          SessionKey: threadContext.sessionKey,
          ParentSessionKey: threadContext.parentSessionKey,
          AccountId: route.accountId,
          ChatType: chatType,
          ConversationLabel: `mattermost:${opts.userName}`,
          GroupSubject: kind !== "direct" ? channelDisplay : void 0,
          GroupChannel: channelName ? `#${channelName}` : void 0,
          GroupSpace: teamId,
          SenderName: opts.userName,
          SenderId: opts.userId,
          Provider: "mattermost",
          Surface: "mattermost",
          MessageSid: `interaction:${opts.postId}:${opts.actionId}`,
          ReplyToId: threadContext.effectiveReplyToId,
          MessageThreadId: threadContext.effectiveReplyToId,
          WasMentioned: true,
          CommandAuthorized: false,
          OriginatingChannel: "mattermost",
          OriginatingTo: to,
        });
        const textLimit = core.channel.text.resolveTextChunkLimit(
          cfg,
          "mattermost",
          account.accountId,
          { fallbackLimit: account.textChunkLimit ?? 4e3 },
        );
        const tableMode = core.channel.text.resolveMarkdownTableMode({
          cfg,
          channel: "mattermost",
          accountId: account.accountId,
        });
        const { onModelSelected, typingCallbacks, ...replyPipeline } = createChannelReplyPipeline({
          cfg,
          agentId: route.agentId,
          channel: "mattermost",
          accountId: account.accountId,
          typing: {
            start: () => sendTypingIndicator(opts.channelId, threadContext.effectiveReplyToId),
            onStartError: (err) => {
              logTypingFailure({
                log: (message) => logger.debug?.(message),
                channel: "mattermost",
                target: opts.channelId,
                error: err,
              });
            },
          },
        });
        const { dispatcher, replyOptions, markDispatchIdle } =
          core.channel.reply.createReplyDispatcherWithTyping({
            ...replyPipeline,
            humanDelay: core.channel.reply.resolveHumanDelayConfig(cfg, route.agentId),
            deliver: async (payload) => {
              await deliverMattermostReplyPayload({
                core,
                cfg,
                payload,
                to,
                accountId: account.accountId,
                agentId: route.agentId,
                replyToId: resolveMattermostReplyRootId({
                  threadRootId: threadContext.effectiveReplyToId,
                  replyToId: payload.replyToId,
                }),
                textLimit,
                tableMode,
                sendMessage: sendMessageMattermost,
              });
              runtime.log?.(`delivered button-click reply to ${to}`);
            },
            onError: (err, info) => {
              runtime.error?.(`mattermost button-click ${info.kind} reply failed: ${String(err)}`);
            },
            onReplyStart: typingCallbacks?.onReplyStart,
          });
        await core.channel.reply.dispatchReplyFromConfig({
          ctx: ctxPayload,
          cfg,
          dispatcher,
          replyOptions: {
            ...replyOptions,
            disableBlockStreaming:
              typeof account.blockStreaming === "boolean" ? !account.blockStreaming : void 0,
            onModelSelected,
          },
        });
        markDispatchIdle();
      },
      log: (msg) => runtime.log?.(msg),
    }),
    pluginId: "mattermost",
    source: "mattermost-interactions",
    accountId: account.accountId,
    log: (msg) => runtime.log?.(msg),
  });
  const logger = core.logging.getChildLogger({ module: "mattermost" });
  const logVerboseMessage = (message) => {
    if (!core.logging.shouldLogVerbose()) return;
    logger.debug?.(message);
  };
  const mediaMaxBytes =
    resolveChannelMediaMaxBytes({
      cfg,
      resolveChannelLimitMb: () => void 0,
      accountId: account.accountId,
    }) ?? 8 * 1024 * 1024;
  const historyLimit = Math.max(0, cfg.messages?.groupChat?.historyLimit ?? 50);
  const channelHistories = /* @__PURE__ */ new Map();
  const defaultGroupPolicy = resolveDefaultGroupPolicy(cfg);
  const { groupPolicy, providerMissingFallbackApplied } =
    resolveAllowlistProviderRuntimeGroupPolicy({
      providerConfigPresent: cfg.channels?.mattermost !== void 0,
      groupPolicy: account.config.groupPolicy,
      defaultGroupPolicy,
    });
  warnMissingProviderGroupPolicyFallbackOnce({
    providerMissingFallbackApplied,
    providerKey: "mattermost",
    accountId: account.accountId,
    log: (message) => logVerboseMessage(message),
  });
  const {
    resolveMattermostMedia,
    sendTypingIndicator,
    resolveChannelInfo,
    resolveUserInfo,
    updateModelPickerPost,
  } = createMattermostMonitorResources({
    accountId: account.accountId,
    callbackUrl,
    client,
    logger: { debug: (message) => logger.debug?.(String(message)) },
    mediaMaxBytes,
    fetchRemoteMedia: (params) => core.channel.media.fetchRemoteMedia(params),
    saveMediaBuffer: (buffer, contentType, direction, maxBytes) =>
      core.channel.media.saveMediaBuffer(Buffer.from(buffer), contentType, direction, maxBytes),
    mediaKindFromMime: (contentType) => core.media.mediaKindFromMime(contentType),
  });
  const runModelPickerCommand = async (params) => {
    const to = params.kind === "direct" ? `user:${params.senderId}` : `channel:${params.channelId}`;
    const fromLabel =
      params.kind === "direct"
        ? `Mattermost DM from ${params.senderName}`
        : `Mattermost message in ${params.roomLabel} from ${params.senderName}`;
    const ctxPayload = core.channel.reply.finalizeInboundContext({
      Body: params.commandText,
      BodyForAgent: params.commandText,
      RawBody: params.commandText,
      CommandBody: params.commandText,
      From:
        params.kind === "direct"
          ? `mattermost:${params.senderId}`
          : params.kind === "group"
            ? `mattermost:group:${params.channelId}`
            : `mattermost:channel:${params.channelId}`,
      To: to,
      SessionKey: params.sessionKey,
      ParentSessionKey: params.parentSessionKey,
      AccountId: params.route.accountId,
      ChatType: params.chatType,
      ConversationLabel: fromLabel,
      GroupSubject: params.kind !== "direct" ? params.channelDisplay || params.roomLabel : void 0,
      GroupChannel: params.channelName ? `#${params.channelName}` : void 0,
      GroupSpace: params.teamId,
      SenderName: params.senderName,
      SenderId: params.senderId,
      Provider: "mattermost",
      Surface: "mattermost",
      MessageSid: `interaction:${params.postId}:${Date.now()}`,
      ReplyToId: params.effectiveReplyToId,
      MessageThreadId: params.effectiveReplyToId,
      Timestamp: Date.now(),
      WasMentioned: true,
      CommandAuthorized: params.commandAuthorized,
      CommandSource: "native",
      OriginatingChannel: "mattermost",
      OriginatingTo: to,
    });
    const tableMode = core.channel.text.resolveMarkdownTableMode({
      cfg,
      channel: "mattermost",
      accountId: account.accountId,
    });
    const textLimit = core.channel.text.resolveTextChunkLimit(
      cfg,
      "mattermost",
      account.accountId,
      { fallbackLimit: account.textChunkLimit ?? 4e3 },
    );
    const shouldDeliverReplies = params.deliverReplies === true;
    const { onModelSelected, typingCallbacks, ...replyPipeline } = createChannelReplyPipeline({
      cfg,
      agentId: params.route.agentId,
      channel: "mattermost",
      accountId: account.accountId,
      typing: shouldDeliverReplies
        ? {
            start: () => sendTypingIndicator(params.channelId, params.effectiveReplyToId),
            onStartError: (err) => {
              logTypingFailure({
                log: (message) => logger.debug?.(message),
                channel: "mattermost",
                target: params.channelId,
                error: err,
              });
            },
          }
        : void 0,
    });
    const capturedTexts = [];
    const { dispatcher, replyOptions, markDispatchIdle } =
      core.channel.reply.createReplyDispatcherWithTyping({
        ...replyPipeline,
        deliver: async (payload) => {
          const trimmedPayload = {
            ...payload,
            text: core.channel.text.convertMarkdownTables(payload.text ?? "", tableMode).trim(),
          };
          if (!shouldDeliverReplies) {
            if (trimmedPayload.text) capturedTexts.push(trimmedPayload.text);
            return;
          }
          await deliverMattermostReplyPayload({
            core,
            cfg,
            payload: trimmedPayload,
            to,
            accountId: account.accountId,
            agentId: params.route.agentId,
            replyToId: resolveMattermostReplyRootId({
              threadRootId: params.effectiveReplyToId,
              replyToId: trimmedPayload.replyToId,
            }),
            textLimit,
            tableMode: "off",
            sendMessage: sendMessageMattermost,
          });
        },
        onError: (err, info) => {
          runtime.error?.(`mattermost model picker ${info.kind} reply failed: ${String(err)}`);
        },
        onReplyStart: typingCallbacks?.onReplyStart,
      });
    await core.channel.reply.withReplyDispatcher({
      dispatcher,
      onSettled: () => {
        markDispatchIdle();
      },
      run: () =>
        core.channel.reply.dispatchReplyFromConfig({
          ctx: ctxPayload,
          cfg,
          dispatcher,
          replyOptions: {
            ...replyOptions,
            disableBlockStreaming:
              typeof account.blockStreaming === "boolean" ? !account.blockStreaming : void 0,
            onModelSelected,
          },
        }),
    });
    return capturedTexts.join("\n\n").trim();
  };
  async function handleModelPickerInteraction(params) {
    const pickerState = parseMattermostModelPickerContext(params.context);
    if (!pickerState) return null;
    if (pickerState.ownerUserId !== params.payload.user_id)
      return { ephemeral_text: "Only the person who opened this picker can use it." };
    const channelInfo = await resolveChannelInfo(params.payload.channel_id);
    const pickerCommandText =
      pickerState.action === "select"
        ? `/model ${pickerState.provider}/${pickerState.model}`
        : pickerState.action === "list"
          ? `/models ${pickerState.provider}`
          : "/models";
    const allowTextCommands = core.channel.commands.shouldHandleTextCommands({
      cfg,
      surface: "mattermost",
    });
    const hasControlCommand = core.channel.text.hasControlCommand(pickerCommandText, cfg);
    const dmPolicy = account.config.dmPolicy ?? "pairing";
    const storeAllowFrom = normalizeMattermostAllowList(
      await readStoreAllowFromForDmPolicy({
        provider: "mattermost",
        accountId: account.accountId,
        dmPolicy,
        readStore: pairing.readStoreForDmPolicy,
      }),
    );
    const auth = authorizeMattermostCommandInvocation({
      account,
      cfg,
      senderId: params.payload.user_id,
      senderName: params.userName,
      channelId: params.payload.channel_id,
      channelInfo,
      storeAllowFrom,
      allowTextCommands,
      hasControlCommand,
    });
    if (!auth.ok) {
      if (auth.denyReason === "dm-pairing") {
        const { code } = await pairing.upsertPairingRequest({
          id: params.payload.user_id,
          meta: { name: params.userName },
        });
        return {
          ephemeral_text: core.channel.pairing.buildPairingReply({
            channel: "mattermost",
            idLine: `Your Mattermost user id: ${params.payload.user_id}`,
            code,
          }),
        };
      }
      return {
        ephemeral_text:
          auth.denyReason === "unknown-channel"
            ? "Temporary error: unable to determine channel type. Please try again."
            : auth.denyReason === "dm-disabled"
              ? "This bot is not accepting direct messages."
              : auth.denyReason === "channels-disabled"
                ? "Model picker actions are disabled in channels."
                : auth.denyReason === "channel-no-allowlist"
                  ? "Model picker actions are not configured for this channel."
                  : "Unauthorized.",
      };
    }
    const kind = auth.kind;
    const chatType = auth.chatType;
    const teamId = auth.channelInfo.team_id ?? params.payload.team_id ?? void 0;
    const channelName = auth.channelName || void 0;
    const channelDisplay = auth.channelDisplay || auth.channelName || params.payload.channel_id;
    const roomLabel = auth.roomLabel;
    const route = core.channel.routing.resolveAgentRoute({
      cfg,
      channel: "mattermost",
      accountId: account.accountId,
      teamId,
      peer: {
        kind,
        id: kind === "direct" ? params.payload.user_id : params.payload.channel_id,
      },
    });
    const replyToMode = resolveMattermostReplyToMode(account, kind);
    const threadContext = resolveMattermostThreadSessionContext({
      baseSessionKey: route.sessionKey,
      kind,
      postId: params.post.id || params.payload.post_id,
      replyToMode,
      threadRootId: params.post.root_id,
    });
    const modelSessionRoute = {
      agentId: route.agentId,
      sessionKey: threadContext.sessionKey,
    };
    const data = await buildModelsProviderData(cfg, route.agentId);
    if (data.providers.length === 0)
      return await updateModelPickerPost({
        channelId: params.payload.channel_id,
        postId: params.payload.post_id,
        message: "No models available.",
      });
    if (pickerState.action === "providers" || pickerState.action === "back") {
      const currentModel = resolveMattermostModelPickerCurrentModel({
        cfg,
        route: modelSessionRoute,
        data,
      });
      const view = renderMattermostProviderPickerView({
        ownerUserId: pickerState.ownerUserId,
        data,
        currentModel,
      });
      return await updateModelPickerPost({
        channelId: params.payload.channel_id,
        postId: params.payload.post_id,
        message: view.text,
        buttons: view.buttons,
      });
    }
    if (pickerState.action === "list") {
      const currentModel = resolveMattermostModelPickerCurrentModel({
        cfg,
        route: modelSessionRoute,
        data,
      });
      const view = renderMattermostModelsPickerView({
        ownerUserId: pickerState.ownerUserId,
        data,
        provider: pickerState.provider,
        page: pickerState.page,
        currentModel,
      });
      return await updateModelPickerPost({
        channelId: params.payload.channel_id,
        postId: params.payload.post_id,
        message: view.text,
        buttons: view.buttons,
      });
    }
    const targetModelRef = `${pickerState.provider}/${pickerState.model}`;
    if (!buildMattermostAllowedModelRefs(data).has(targetModelRef))
      return { ephemeral_text: `That model is no longer available: ${targetModelRef}` };
    (async () => {
      try {
        await runModelPickerCommand({
          commandText: `/model ${targetModelRef}`,
          commandAuthorized: auth.commandAuthorized,
          route,
          sessionKey: threadContext.sessionKey,
          parentSessionKey: threadContext.parentSessionKey,
          channelId: params.payload.channel_id,
          senderId: params.payload.user_id,
          senderName: params.userName,
          kind,
          chatType,
          channelName,
          channelDisplay,
          roomLabel,
          teamId,
          postId: params.payload.post_id,
          effectiveReplyToId: threadContext.effectiveReplyToId,
          deliverReplies: true,
        });
        const updatedModel = resolveMattermostModelPickerCurrentModel({
          cfg,
          route: modelSessionRoute,
          data,
          skipCache: true,
        });
        const view = renderMattermostModelsPickerView({
          ownerUserId: pickerState.ownerUserId,
          data,
          provider: pickerState.provider,
          page: pickerState.page,
          currentModel: updatedModel,
        });
        await updateModelPickerPost({
          channelId: params.payload.channel_id,
          postId: params.payload.post_id,
          message: view.text,
          buttons: view.buttons,
        });
      } catch (err) {
        runtime.error?.(`mattermost model picker select failed: ${String(err)}`);
      }
    })();
    return {};
  }
  const handlePost = async (post, payload, messageIds) => {
    const channelId = post.channel_id ?? payload.data?.channel_id ?? payload.broadcast?.channel_id;
    if (!channelId) {
      logVerboseMessage("mattermost: drop post (missing channel id)");
      return;
    }
    const allMessageIds = messageIds?.length ? messageIds : post.id ? [post.id] : [];
    if (allMessageIds.length === 0) {
      logVerboseMessage("mattermost: drop post (missing message id)");
      return;
    }
    const dedupeEntries = allMessageIds.map((id) =>
      recentInboundMessages.check(`${account.accountId}:${id}`),
    );
    if (dedupeEntries.length > 0 && dedupeEntries.every(Boolean)) {
      logVerboseMessage(
        `mattermost: drop post (dedupe account=${account.accountId} ids=${allMessageIds.length})`,
      );
      return;
    }
    const senderId = post.user_id ?? payload.broadcast?.user_id;
    if (!senderId) {
      logVerboseMessage("mattermost: drop post (missing sender id)");
      return;
    }
    if (senderId === botUserId) {
      logVerboseMessage(`mattermost: drop post (self sender=${senderId})`);
      return;
    }
    if (isSystemPost(post)) {
      logVerboseMessage(`mattermost: drop post (system post type=${post.type ?? "unknown"})`);
      return;
    }
    const channelInfo = await resolveChannelInfo(channelId);
    const kind = mapMattermostChannelTypeToChatType(
      payload.data?.channel_type ?? channelInfo?.type ?? void 0,
    );
    const chatType = channelChatType(kind);
    const senderName =
      payload.data?.sender_name?.trim() ||
      (await resolveUserInfo(senderId))?.username?.trim() ||
      senderId;
    const rawText = post.message?.trim() || "";
    const dmPolicy = account.config.dmPolicy ?? "pairing";
    const normalizedAllowFrom = normalizeMattermostAllowList(account.config.allowFrom ?? []);
    const normalizedGroupAllowFrom = normalizeMattermostAllowList(
      account.config.groupAllowFrom ?? [],
    );
    const storeAllowFrom = normalizeMattermostAllowList(
      await readStoreAllowFromForDmPolicy({
        provider: "mattermost",
        accountId: account.accountId,
        dmPolicy,
        readStore: pairing.readStoreForDmPolicy,
      }),
    );
    const accessDecision = resolveDmGroupAccessWithLists({
      isGroup: kind !== "direct",
      dmPolicy,
      groupPolicy,
      allowFrom: normalizedAllowFrom,
      groupAllowFrom: normalizedGroupAllowFrom,
      storeAllowFrom,
      isSenderAllowed: (allowFrom) =>
        isMattermostSenderAllowed({
          senderId,
          senderName,
          allowFrom,
          allowNameMatching,
        }),
    });
    const effectiveAllowFrom = accessDecision.effectiveAllowFrom;
    const effectiveGroupAllowFrom = accessDecision.effectiveGroupAllowFrom;
    const allowTextCommands = core.channel.commands.shouldHandleTextCommands({
      cfg,
      surface: "mattermost",
    });
    const hasControlCommand = core.channel.text.hasControlCommand(rawText, cfg);
    const isControlCommand = allowTextCommands && hasControlCommand;
    const useAccessGroups = cfg.commands?.useAccessGroups !== false;
    const commandDmAllowFrom = kind === "direct" ? effectiveAllowFrom : normalizedAllowFrom;
    const senderAllowedForCommands = isMattermostSenderAllowed({
      senderId,
      senderName,
      allowFrom: commandDmAllowFrom,
      allowNameMatching,
    });
    const groupAllowedForCommands = isMattermostSenderAllowed({
      senderId,
      senderName,
      allowFrom: effectiveGroupAllowFrom,
      allowNameMatching,
    });
    const commandGate = resolveControlCommandGate({
      useAccessGroups,
      authorizers: [
        {
          configured: commandDmAllowFrom.length > 0,
          allowed: senderAllowedForCommands,
        },
        {
          configured: effectiveGroupAllowFrom.length > 0,
          allowed: groupAllowedForCommands,
        },
      ],
      allowTextCommands,
      hasControlCommand,
    });
    const commandAuthorized = commandGate.commandAuthorized;
    if (accessDecision.decision !== "allow") {
      if (kind === "direct") {
        if (accessDecision.reasonCode === DM_GROUP_ACCESS_REASON.DM_POLICY_DISABLED) {
          logVerboseMessage(`mattermost: drop dm (dmPolicy=disabled sender=${senderId})`);
          return;
        }
        if (accessDecision.decision === "pairing") {
          const { code, created } = await pairing.upsertPairingRequest({
            id: senderId,
            meta: { name: senderName },
          });
          logVerboseMessage(`mattermost: pairing request sender=${senderId} created=${created}`);
          if (created)
            try {
              await sendMessageMattermost(
                `user:${senderId}`,
                core.channel.pairing.buildPairingReply({
                  channel: "mattermost",
                  idLine: `Your Mattermost user id: ${senderId}`,
                  code,
                }),
                { accountId: account.accountId },
              );
              opts.statusSink?.({ lastOutboundAt: Date.now() });
            } catch (err) {
              logVerboseMessage(`mattermost: pairing reply failed for ${senderId}: ${String(err)}`);
            }
          return;
        }
        logVerboseMessage(`mattermost: drop dm sender=${senderId} (dmPolicy=${dmPolicy})`);
        return;
      }
      if (accessDecision.reasonCode === DM_GROUP_ACCESS_REASON.GROUP_POLICY_DISABLED) {
        logVerboseMessage("mattermost: drop group message (groupPolicy=disabled)");
        return;
      }
      if (accessDecision.reasonCode === DM_GROUP_ACCESS_REASON.GROUP_POLICY_EMPTY_ALLOWLIST) {
        logVerboseMessage("mattermost: drop group message (no group allowlist)");
        return;
      }
      if (accessDecision.reasonCode === DM_GROUP_ACCESS_REASON.GROUP_POLICY_NOT_ALLOWLISTED) {
        logVerboseMessage(`mattermost: drop group sender=${senderId} (not in groupAllowFrom)`);
        return;
      }
      logVerboseMessage(
        `mattermost: drop group message (groupPolicy=${groupPolicy} reason=${accessDecision.reason})`,
      );
      return;
    }
    if (kind !== "direct" && commandGate.shouldBlock) {
      logInboundDrop({
        log: logVerboseMessage,
        channel: "mattermost",
        reason: "control command (unauthorized)",
        target: senderId,
      });
      return;
    }
    const teamId = payload.data?.team_id ?? channelInfo?.team_id ?? void 0;
    const channelName = payload.data?.channel_name ?? channelInfo?.name ?? "";
    const channelDisplay =
      payload.data?.channel_display_name ?? channelInfo?.display_name ?? channelName;
    const roomLabel = channelName ? `#${channelName}` : channelDisplay || `#${channelId}`;
    const route = core.channel.routing.resolveAgentRoute({
      cfg,
      channel: "mattermost",
      accountId: account.accountId,
      teamId,
      peer: {
        kind,
        id: kind === "direct" ? senderId : channelId,
      },
    });
    const baseSessionKey = route.sessionKey;
    const threadRootId = post.root_id?.trim() || void 0;
    const replyToMode = resolveMattermostReplyToMode(account, kind);
    const { effectiveReplyToId, sessionKey, parentSessionKey } =
      resolveMattermostThreadSessionContext({
        baseSessionKey,
        kind,
        postId: post.id,
        replyToMode,
        threadRootId,
      });
    const historyKey = kind === "direct" ? null : sessionKey;
    const mentionRegexes = core.channel.mentions.buildMentionRegexes(cfg, route.agentId);
    const wasMentioned =
      kind !== "direct" &&
      ((botUsername ? rawText.toLowerCase().includes(`@${botUsername.toLowerCase()}`) : false) ||
        core.channel.mentions.matchesMentionPatterns(rawText, mentionRegexes));
    const pendingBody =
      rawText ||
      (post.file_ids?.length
        ? `[Mattermost ${post.file_ids.length === 1 ? "file" : "files"}]`
        : "");
    const pendingSender = senderName;
    const recordPendingHistory = () => {
      const trimmed = pendingBody.trim();
      recordPendingHistoryEntryIfEnabled({
        historyMap: channelHistories,
        limit: historyLimit,
        historyKey: historyKey ?? "",
        entry:
          historyKey && trimmed
            ? {
                sender: pendingSender,
                body: trimmed,
                timestamp: typeof post.create_at === "number" ? post.create_at : void 0,
                messageId: post.id ?? void 0,
              }
            : null,
      });
    };
    const oncharEnabled = account.chatmode === "onchar" && kind !== "direct";
    const oncharPrefixes = oncharEnabled ? resolveOncharPrefixes(account.oncharPrefixes) : [];
    const oncharResult = oncharEnabled
      ? stripOncharPrefix(rawText, oncharPrefixes)
      : {
          triggered: false,
          stripped: rawText,
        };
    const oncharTriggered = oncharResult.triggered;
    const canDetectMention = Boolean(botUsername) || mentionRegexes.length > 0;
    const mentionDecision = evaluateMattermostMentionGate({
      kind,
      cfg,
      accountId: account.accountId,
      channelId,
      threadRootId,
      requireMentionOverride: account.requireMention,
      resolveRequireMention: core.channel.groups.resolveRequireMention,
      wasMentioned,
      isControlCommand,
      commandAuthorized,
      oncharEnabled,
      oncharTriggered,
      canDetectMention,
    });
    const { shouldRequireMention, shouldBypassMention } = mentionDecision;
    if (mentionDecision.dropReason === "onchar-not-triggered") {
      logVerboseMessage(
        `mattermost: drop group message (onchar not triggered channel=${channelId} sender=${senderId})`,
      );
      recordPendingHistory();
      return;
    }
    if (mentionDecision.dropReason === "missing-mention") {
      logVerboseMessage(
        `mattermost: drop group message (missing mention channel=${channelId} sender=${senderId} requireMention=${shouldRequireMention} bypass=${shouldBypassMention} canDetectMention=${canDetectMention})`,
      );
      recordPendingHistory();
      return;
    }
    const mediaList = await resolveMattermostMedia(post.file_ids);
    const mediaPlaceholder = buildMattermostAttachmentPlaceholder(mediaList);
    const bodyText = normalizeMention(
      [oncharTriggered ? oncharResult.stripped : rawText, mediaPlaceholder]
        .filter(Boolean)
        .join("\n")
        .trim(),
      botUsername,
    );
    if (!bodyText) {
      logVerboseMessage(
        `mattermost: drop group message (empty body after normalization channel=${channelId} sender=${senderId})`,
      );
      return;
    }
    core.channel.activity.record({
      channel: "mattermost",
      accountId: account.accountId,
      direction: "inbound",
    });
    const fromLabel = formatInboundFromLabel({
      isGroup: kind !== "direct",
      groupLabel: channelDisplay || roomLabel,
      groupId: channelId,
      groupFallback: roomLabel || "Channel",
      directLabel: senderName,
      directId: senderId,
    });
    const preview = bodyText.replace(/\s+/g, " ").slice(0, 160);
    const inboundLabel =
      kind === "direct"
        ? `Mattermost DM from ${senderName}`
        : `Mattermost message in ${roomLabel} from ${senderName}`;
    core.system.enqueueSystemEvent(`${inboundLabel}: ${preview}`, {
      sessionKey,
      contextKey: `mattermost:message:${channelId}:${post.id ?? "unknown"}`,
    });
    const textWithId = `${bodyText}\n[mattermost message id: ${post.id ?? "unknown"} channel: ${channelId}]`;
    let combinedBody = core.channel.reply.formatInboundEnvelope({
      channel: "Mattermost",
      from: fromLabel,
      timestamp: typeof post.create_at === "number" ? post.create_at : void 0,
      body: textWithId,
      chatType,
      sender: {
        name: senderName,
        id: senderId,
      },
    });
    if (historyKey)
      combinedBody = buildPendingHistoryContextFromMap({
        historyMap: channelHistories,
        historyKey,
        limit: historyLimit,
        currentMessage: combinedBody,
        formatEntry: (entry) =>
          core.channel.reply.formatInboundEnvelope({
            channel: "Mattermost",
            from: fromLabel,
            timestamp: entry.timestamp,
            body: `${entry.body}${entry.messageId ? ` [id:${entry.messageId} channel:${channelId}]` : ""}`,
            chatType,
            senderLabel: entry.sender,
          }),
      });
    const to = kind === "direct" ? `user:${senderId}` : `channel:${channelId}`;
    const mediaPayload = buildAgentMediaPayload(mediaList);
    const commandBody = rawText.trim();
    const inboundHistory =
      historyKey && historyLimit > 0
        ? (channelHistories.get(historyKey) ?? []).map((entry) => ({
            sender: entry.sender,
            body: entry.body,
            timestamp: entry.timestamp,
          }))
        : void 0;
    const ctxPayload = core.channel.reply.finalizeInboundContext({
      Body: combinedBody,
      BodyForAgent: bodyText,
      InboundHistory: inboundHistory,
      RawBody: bodyText,
      CommandBody: commandBody,
      BodyForCommands: commandBody,
      From:
        kind === "direct"
          ? `mattermost:${senderId}`
          : kind === "group"
            ? `mattermost:group:${channelId}`
            : `mattermost:channel:${channelId}`,
      To: to,
      SessionKey: sessionKey,
      ParentSessionKey: parentSessionKey,
      AccountId: route.accountId,
      ChatType: chatType,
      ConversationLabel: fromLabel,
      GroupSubject: kind !== "direct" ? channelDisplay || roomLabel : void 0,
      GroupChannel: channelName ? `#${channelName}` : void 0,
      GroupSpace: teamId,
      SenderName: senderName,
      SenderId: senderId,
      Provider: "mattermost",
      Surface: "mattermost",
      MessageSid: post.id ?? void 0,
      MessageSids: allMessageIds.length > 1 ? allMessageIds : void 0,
      MessageSidFirst: allMessageIds.length > 1 ? allMessageIds[0] : void 0,
      MessageSidLast: allMessageIds.length > 1 ? allMessageIds[allMessageIds.length - 1] : void 0,
      ReplyToId: effectiveReplyToId,
      MessageThreadId: effectiveReplyToId,
      Timestamp: typeof post.create_at === "number" ? post.create_at : void 0,
      WasMentioned: kind !== "direct" ? mentionDecision.effectiveWasMentioned : void 0,
      CommandAuthorized: commandAuthorized,
      OriginatingChannel: "mattermost",
      OriginatingTo: to,
      ...mediaPayload,
    });
    if (kind === "direct") {
      const sessionCfg = cfg.session;
      const storePath = core.channel.session.resolveStorePath(sessionCfg?.store, {
        agentId: route.agentId,
      });
      await core.channel.session.updateLastRoute({
        storePath,
        sessionKey: route.mainSessionKey,
        deliveryContext: {
          channel: "mattermost",
          to,
          accountId: route.accountId,
        },
      });
    }
    const previewLine = bodyText.slice(0, 200).replace(/\n/g, "\\n");
    logVerboseMessage(
      `mattermost inbound: from=${ctxPayload.From} len=${bodyText.length} preview="${previewLine}"`,
    );
    const textLimit = core.channel.text.resolveTextChunkLimit(
      cfg,
      "mattermost",
      account.accountId,
      { fallbackLimit: account.textChunkLimit ?? 4e3 },
    );
    const tableMode = core.channel.text.resolveMarkdownTableMode({
      cfg,
      channel: "mattermost",
      accountId: account.accountId,
    });
    const { onModelSelected, typingCallbacks, ...replyPipeline } = createChannelReplyPipeline({
      cfg,
      agentId: route.agentId,
      channel: "mattermost",
      accountId: account.accountId,
      typing: {
        start: () => sendTypingIndicator(channelId, effectiveReplyToId),
        onStartError: (err) => {
          logTypingFailure({
            log: (message) => logger.debug?.(message),
            channel: "mattermost",
            target: channelId,
            error: err,
          });
        },
      },
    });
    const { dispatcher, replyOptions, markDispatchIdle } =
      core.channel.reply.createReplyDispatcherWithTyping({
        ...replyPipeline,
        humanDelay: core.channel.reply.resolveHumanDelayConfig(cfg, route.agentId),
        typingCallbacks,
        deliver: async (payload) => {
          await deliverMattermostReplyPayload({
            core,
            cfg,
            payload,
            to,
            accountId: account.accountId,
            agentId: route.agentId,
            replyToId: resolveMattermostReplyRootId({
              threadRootId: effectiveReplyToId,
              replyToId: payload.replyToId,
            }),
            textLimit,
            tableMode,
            sendMessage: sendMessageMattermost,
          });
          runtime.log?.(`delivered reply to ${to}`);
        },
        onError: (err, info) => {
          runtime.error?.(`mattermost ${info.kind} reply failed: ${String(err)}`);
        },
      });
    await core.channel.reply.withReplyDispatcher({
      dispatcher,
      onSettled: () => {
        markDispatchIdle();
      },
      run: () =>
        core.channel.reply.dispatchReplyFromConfig({
          ctx: ctxPayload,
          cfg,
          dispatcher,
          replyOptions: {
            ...replyOptions,
            disableBlockStreaming:
              typeof account.blockStreaming === "boolean" ? !account.blockStreaming : void 0,
            onModelSelected,
          },
        }),
    });
    if (historyKey)
      clearHistoryEntriesIfEnabled({
        historyMap: channelHistories,
        historyKey,
        limit: historyLimit,
      });
  };
  const handleReactionEvent = async (payload) => {
    const reactionData = payload.data?.reaction;
    if (!reactionData) return;
    let reaction = null;
    if (typeof reactionData === "string")
      try {
        reaction = JSON.parse(reactionData);
      } catch {
        return;
      }
    else if (typeof reactionData === "object") reaction = reactionData;
    if (!reaction) return;
    const userId = reaction.user_id?.trim();
    const postId = reaction.post_id?.trim();
    const emojiName = reaction.emoji_name?.trim();
    if (!userId || !postId || !emojiName) return;
    if (userId === botUserId) return;
    const action = payload.event === "reaction_removed" ? "removed" : "added";
    const senderName = (await resolveUserInfo(userId))?.username?.trim() || userId;
    const channelId = payload.broadcast?.channel_id;
    if (!channelId) {
      logVerboseMessage(
        `mattermost: drop reaction (no channel_id in broadcast, cannot enforce policy)`,
      );
      return;
    }
    const channelInfo = await resolveChannelInfo(channelId);
    if (!channelInfo?.type) {
      logVerboseMessage(`mattermost: drop reaction (cannot resolve channel type for ${channelId})`);
      return;
    }
    const kind = mapMattermostChannelTypeToChatType(channelInfo.type);
    const dmPolicy = account.config.dmPolicy ?? "pairing";
    const storeAllowFrom = normalizeMattermostAllowList(
      await readStoreAllowFromForDmPolicy({
        provider: "mattermost",
        accountId: account.accountId,
        dmPolicy,
        readStore: pairing.readStoreForDmPolicy,
      }),
    );
    const reactionAccess = resolveDmGroupAccessWithLists({
      isGroup: kind !== "direct",
      dmPolicy,
      groupPolicy,
      allowFrom: normalizeMattermostAllowList(account.config.allowFrom ?? []),
      groupAllowFrom: normalizeMattermostAllowList(account.config.groupAllowFrom ?? []),
      storeAllowFrom,
      isSenderAllowed: (allowFrom) =>
        isMattermostSenderAllowed({
          senderId: userId,
          senderName,
          allowFrom,
          allowNameMatching,
        }),
    });
    if (reactionAccess.decision !== "allow") {
      if (kind === "direct")
        logVerboseMessage(
          `mattermost: drop reaction (dmPolicy=${dmPolicy} sender=${userId} reason=${reactionAccess.reason})`,
        );
      else
        logVerboseMessage(
          `mattermost: drop reaction (groupPolicy=${groupPolicy} sender=${userId} reason=${reactionAccess.reason} channel=${channelId})`,
        );
      return;
    }
    const teamId = channelInfo?.team_id ?? void 0;
    const sessionKey = core.channel.routing.resolveAgentRoute({
      cfg,
      channel: "mattermost",
      accountId: account.accountId,
      teamId,
      peer: {
        kind,
        id: kind === "direct" ? userId : channelId,
      },
    }).sessionKey;
    const eventText = `Mattermost reaction ${action}: :${emojiName}: by @${senderName} on post ${postId} in channel ${channelId}`;
    core.system.enqueueSystemEvent(eventText, {
      sessionKey,
      contextKey: `mattermost:reaction:${postId}:${emojiName}:${userId}:${action}`,
    });
    logVerboseMessage(
      `mattermost reaction: ${action} :${emojiName}: by ${senderName} on ${postId}`,
    );
  };
  const inboundDebounceMs = core.channel.debounce.resolveInboundDebounceMs({
    cfg,
    channel: "mattermost",
  });
  const debouncer = core.channel.debounce.createInboundDebouncer({
    debounceMs: inboundDebounceMs,
    buildKey: (entry) => {
      const channelId =
        entry.post.channel_id ??
        entry.payload.data?.channel_id ??
        entry.payload.broadcast?.channel_id;
      if (!channelId) return null;
      const threadId = entry.post.root_id?.trim();
      const threadKey = threadId ? `thread:${threadId}` : "channel";
      return `mattermost:${account.accountId}:${channelId}:${threadKey}`;
    },
    shouldDebounce: (entry) => {
      if (entry.post.file_ids && entry.post.file_ids.length > 0) return false;
      const text = entry.post.message?.trim() ?? "";
      if (!text) return false;
      return !core.channel.text.hasControlCommand(text, cfg);
    },
    onFlush: async (entries) => {
      const last = entries.at(-1);
      if (!last) return;
      if (entries.length === 1) {
        await handlePost(last.post, last.payload);
        return;
      }
      const combinedText = entries
        .map((entry) => entry.post.message?.trim() ?? "")
        .filter(Boolean)
        .join("\n");
      const mergedPost = {
        ...last.post,
        message: combinedText,
        file_ids: [],
      };
      const ids = entries.map((entry) => entry.post.id).filter(Boolean);
      await handlePost(mergedPost, last.payload, ids.length > 0 ? ids : void 0);
    },
    onError: (err) => {
      runtime.error?.(`mattermost debounce flush failed: ${String(err)}`);
    },
  });
  const wsUrl = buildMattermostWsUrl(baseUrl);
  let seq = 1;
  const connectOnce = createMattermostConnectOnce({
    wsUrl,
    botToken,
    abortSignal: opts.abortSignal,
    statusSink: opts.statusSink,
    runtime,
    webSocketFactory: opts.webSocketFactory,
    nextSeq: () => seq++,
    onPosted: async (post, payload) => {
      await debouncer.enqueue({
        post,
        payload,
      });
    },
    onReaction: async (payload) => {
      await handleReactionEvent(payload);
    },
  });
  let slashShutdownCleanup = null;
  if (slashEnabled) {
    const runAbortCleanup = () => {
      if (slashShutdownCleanup) return;
      const commands = getSlashCommandState(account.accountId)?.registeredCommands ?? [];
      deactivateSlashCommands(account.accountId);
      slashShutdownCleanup = cleanupSlashCommands({
        client,
        commands,
        log: (msg) => runtime.log?.(msg),
      }).catch((err) => {
        runtime.error?.(`mattermost: slash cleanup failed: ${String(err)}`);
      });
    };
    if (opts.abortSignal?.aborted) runAbortCleanup();
    else opts.abortSignal?.addEventListener("abort", runAbortCleanup, { once: true });
  }
  try {
    await runWithReconnect(connectOnce, {
      abortSignal: opts.abortSignal,
      jitterRatio: 0.2,
      onError: (err) => {
        runtime.error?.(`mattermost connection failed: ${String(err)}`);
        opts.statusSink?.({
          lastError: String(err),
          connected: false,
        });
      },
      onReconnect: (delayMs) => {
        runtime.log?.(`mattermost reconnecting in ${Math.round(delayMs / 1e3)}s`);
      },
    });
  } finally {
    unregisterInteractions?.();
  }
  if (slashShutdownCleanup) await slashShutdownCleanup;
}
//#endregion
//#region extensions/mattermost/src/mattermost/probe.ts
async function probeMattermost(baseUrl, botToken, timeoutMs = 2500) {
  const normalized = normalizeMattermostBaseUrl(baseUrl);
  if (!normalized)
    return {
      ok: false,
      error: "baseUrl missing",
    };
  const url = `${normalized}/api/v4/users/me`;
  const start = Date.now();
  const controller = timeoutMs > 0 ? new AbortController() : void 0;
  let timer = null;
  if (controller) timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${botToken}` },
      signal: controller?.signal,
    });
    const elapsedMs = Date.now() - start;
    if (!res.ok) {
      const detail = await readMattermostError(res);
      return {
        ok: false,
        status: res.status,
        error: detail || res.statusText,
        elapsedMs,
      };
    }
    const bot = await res.json();
    return {
      ok: true,
      status: res.status,
      elapsedMs,
      bot,
    };
  } catch (err) {
    return {
      ok: false,
      status: null,
      error: err instanceof Error ? err.message : String(err),
      elapsedMs: Date.now() - start,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
//#endregion
//#region extensions/mattermost/src/mattermost/reactions.ts
const BOT_USER_CACHE_TTL_MS = 10 * 6e4;
const botUserIdCache = /* @__PURE__ */ new Map();
async function resolveBotUserId(client, cacheKey) {
  const cached = botUserIdCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.userId;
  const userId = (await fetchMattermostMe(client))?.id?.trim();
  if (!userId) return null;
  botUserIdCache.set(cacheKey, {
    userId,
    expiresAt: Date.now() + BOT_USER_CACHE_TTL_MS,
  });
  return userId;
}
async function addMattermostReaction(params) {
  return runMattermostReaction(params, {
    action: "add",
    mutation: createReaction,
  });
}
async function removeMattermostReaction(params) {
  return runMattermostReaction(params, {
    action: "remove",
    mutation: deleteReaction,
  });
}
async function runMattermostReaction(params, options) {
  const resolved = resolveMattermostAccount({
    cfg: params.cfg,
    accountId: params.accountId,
  });
  const baseUrl = resolved.baseUrl?.trim();
  const botToken = resolved.botToken?.trim();
  if (!baseUrl || !botToken)
    return {
      ok: false,
      error: "Mattermost botToken/baseUrl missing.",
    };
  const client = createMattermostClient({
    baseUrl,
    botToken,
    fetchImpl: params.fetchImpl,
  });
  const userId = await resolveBotUserId(client, `${baseUrl}:${botToken}`);
  if (!userId)
    return {
      ok: false,
      error: "Mattermost reactions failed: could not resolve bot user id.",
    };
  try {
    await options.mutation(client, {
      userId,
      postId: params.postId,
      emojiName: params.emojiName,
    });
  } catch (err) {
    return {
      ok: false,
      error: `Mattermost ${options.action} reaction failed: ${String(err)}`,
    };
  }
  return { ok: true };
}
async function createReaction(client, params) {
  await client.request("/reactions", {
    method: "POST",
    body: JSON.stringify({
      user_id: params.userId,
      post_id: params.postId,
      emoji_name: params.emojiName,
    }),
  });
}
async function deleteReaction(client, params) {
  const emoji = encodeURIComponent(params.emojiName);
  await client.request(`/users/${params.userId}/posts/${params.postId}/reactions/${emoji}`, {
    method: "DELETE",
  });
}
//#endregion
//#region extensions/mattermost/src/normalize.ts
function normalizeMattermostMessagingTarget(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("channel:")) {
    const id = trimmed.slice(8).trim();
    return id ? `channel:${id}` : void 0;
  }
  if (lower.startsWith("group:")) {
    const id = trimmed.slice(6).trim();
    return id ? `channel:${id}` : void 0;
  }
  if (lower.startsWith("user:")) {
    const id = trimmed.slice(5).trim();
    return id ? `user:${id}` : void 0;
  }
  if (lower.startsWith("mattermost:")) {
    const id = trimmed.slice(11).trim();
    return id ? `user:${id}` : void 0;
  }
  if (trimmed.startsWith("@")) {
    const id = trimmed.slice(1).trim();
    return id ? `@${id}` : void 0;
  }
  if (trimmed.startsWith("#")) return;
}
function looksLikeMattermostTargetId(raw, normalized) {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^(user|channel|group|mattermost):/i.test(trimmed)) return true;
  if (trimmed.startsWith("@")) return true;
  return /^[a-z0-9]{26}$/i.test(trimmed) || /^[a-z0-9]{26}__[a-z0-9]{26}$/i.test(trimmed);
}
//#endregion
//#region extensions/mattermost/src/session-route.ts
function resolveMattermostOutboundSessionRoute(params) {
  let trimmed = stripChannelTargetPrefix(params.target, "mattermost");
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const resolvedKind = params.resolvedTarget?.kind;
  const isUser =
    resolvedKind === "user" ||
    (resolvedKind !== "channel" &&
      resolvedKind !== "group" &&
      (lower.startsWith("user:") || trimmed.startsWith("@")));
  if (trimmed.startsWith("@")) trimmed = trimmed.slice(1).trim();
  const rawId = stripTargetKindPrefix(trimmed);
  if (!rawId) return null;
  const baseRoute = buildChannelOutboundSessionRoute({
    cfg: params.cfg,
    agentId: params.agentId,
    channel: "mattermost",
    accountId: params.accountId,
    peer: {
      kind: isUser ? "direct" : "channel",
      id: rawId,
    },
    chatType: isUser ? "direct" : "channel",
    from: isUser ? `mattermost:${rawId}` : `mattermost:channel:${rawId}`,
    to: isUser ? `user:${rawId}` : `channel:${rawId}`,
  });
  const threadId = normalizeOutboundThreadId(params.replyToId ?? params.threadId);
  const threadKeys = resolveThreadSessionKeys$1({
    baseSessionKey: baseRoute.baseSessionKey,
    threadId,
  });
  return {
    ...baseRoute,
    sessionKey: threadKeys.sessionKey,
    ...(threadId !== void 0 ? { threadId } : {}),
  };
}
//#endregion
//#region extensions/mattermost/src/setup-core.ts
const channel$6 = "mattermost";
function isMattermostConfigured(account) {
  return (
    (Boolean(account.botToken?.trim()) || hasConfiguredSecretInput(account.config.botToken)) &&
    Boolean(account.baseUrl)
  );
}
function resolveMattermostAccountWithSecrets(cfg, accountId) {
  return resolveMattermostAccount({
    cfg,
    accountId,
    allowUnresolvedSecretRef: true,
  });
}
const mattermostSetupAdapter = {
  resolveAccountId: ({ accountId }) => normalizeAccountId(accountId),
  applyAccountName: ({ cfg, accountId, name }) =>
    applyAccountNameToChannelSection({
      cfg,
      channelKey: channel$6,
      accountId,
      name,
    }),
  validateInput: ({ accountId, input }) => {
    const token = input.botToken ?? input.token;
    const baseUrl = normalizeMattermostBaseUrl(input.httpUrl);
    if (input.useEnv && accountId !== "default")
      return "Mattermost env vars can only be used for the default account.";
    if (!input.useEnv && (!token || !baseUrl))
      return "Mattermost requires --bot-token and --http-url (or --use-env).";
    if (input.httpUrl && !baseUrl) return "Mattermost --http-url must include a valid base URL.";
    return null;
  },
  applyAccountConfig: ({ cfg, accountId, input }) => {
    const token = input.botToken ?? input.token;
    const baseUrl = normalizeMattermostBaseUrl(input.httpUrl);
    const namedConfig = applyAccountNameToChannelSection({
      cfg,
      channelKey: channel$6,
      accountId,
      name: input.name,
    });
    return applySetupAccountConfigPatch({
      cfg:
        accountId !== "default"
          ? migrateBaseNameToDefaultAccount({
              cfg: namedConfig,
              channelKey: channel$6,
            })
          : namedConfig,
      channelKey: channel$6,
      accountId,
      patch: input.useEnv
        ? {}
        : {
            ...(token ? { botToken: token } : {}),
            ...(baseUrl ? { baseUrl } : {}),
          },
    });
  },
};
//#endregion
//#region extensions/mattermost/src/setup-surface.ts
const channel$5 = "mattermost";
const mattermostSetupWizard = {
  channel: channel$5,
  status: createStandardChannelSetupStatus({
    channelLabel: "Mattermost",
    configuredLabel: "configured",
    unconfiguredLabel: "needs token + url",
    configuredHint: "configured",
    unconfiguredHint: "needs setup",
    configuredScore: 2,
    unconfiguredScore: 1,
    resolveConfigured: ({ cfg }) =>
      listMattermostAccountIds(cfg).some((accountId) =>
        isMattermostConfigured(resolveMattermostAccountWithSecrets(cfg, accountId)),
      ),
  }),
  introNote: {
    title: "Mattermost bot token",
    lines: [
      "1) Mattermost System Console -> Integrations -> Bot Accounts",
      "2) Create a bot + copy its token",
      "3) Use your server base URL (e.g., https://chat.example.com)",
      "Tip: the bot must be a member of any channel you want it to monitor.",
      `Docs: ${formatDocsLink("/mattermost", "mattermost")}`,
    ],
    shouldShow: ({ cfg, accountId }) =>
      !isMattermostConfigured(resolveMattermostAccountWithSecrets(cfg, accountId)),
  },
  envShortcut: {
    prompt: "MATTERMOST_BOT_TOKEN + MATTERMOST_URL detected. Use env vars?",
    preferredEnvVar: "MATTERMOST_BOT_TOKEN",
    isAvailable: ({ cfg, accountId }) => {
      if (accountId !== "default") return false;
      const resolvedAccount = resolveMattermostAccountWithSecrets(cfg, accountId);
      const hasConfigValues =
        hasConfiguredSecretInput(resolvedAccount.config.botToken) ||
        Boolean(resolvedAccount.config.baseUrl?.trim());
      return Boolean(
        process.env.MATTERMOST_BOT_TOKEN?.trim() &&
        process.env.MATTERMOST_URL?.trim() &&
        !hasConfigValues,
      );
    },
    apply: ({ cfg, accountId }) =>
      applySetupAccountConfigPatch({
        cfg,
        channelKey: channel$5,
        accountId,
        patch: {},
      }),
  },
  credentials: [
    {
      inputKey: "botToken",
      providerHint: channel$5,
      credentialLabel: "bot token",
      preferredEnvVar: "MATTERMOST_BOT_TOKEN",
      envPrompt: "MATTERMOST_BOT_TOKEN + MATTERMOST_URL detected. Use env vars?",
      keepPrompt: "Mattermost bot token already configured. Keep it?",
      inputPrompt: "Enter Mattermost bot token",
      inspect: ({ cfg, accountId }) => {
        const resolvedAccount = resolveMattermostAccountWithSecrets(cfg, accountId);
        return {
          accountConfigured: isMattermostConfigured(resolvedAccount),
          hasConfiguredValue: hasConfiguredSecretInput(resolvedAccount.config.botToken),
        };
      },
    },
  ],
  textInputs: [
    {
      inputKey: "httpUrl",
      message: "Enter Mattermost base URL",
      confirmCurrentValue: false,
      currentValue: ({ cfg, accountId }) =>
        resolveMattermostAccountWithSecrets(cfg, accountId).baseUrl ??
        process.env.MATTERMOST_URL?.trim(),
      initialValue: ({ cfg, accountId }) =>
        resolveMattermostAccountWithSecrets(cfg, accountId).baseUrl ??
        process.env.MATTERMOST_URL?.trim(),
      shouldPrompt: ({ cfg, accountId, credentialValues, currentValue }) => {
        const resolvedAccount = resolveMattermostAccountWithSecrets(cfg, accountId);
        const tokenConfigured =
          Boolean(resolvedAccount.botToken?.trim()) ||
          hasConfiguredSecretInput(resolvedAccount.config.botToken);
        return Boolean(credentialValues.botToken) || !tokenConfigured || !currentValue;
      },
      validate: ({ value }) =>
        normalizeMattermostBaseUrl(value)
          ? void 0
          : "Mattermost base URL must include a valid base URL.",
      normalizeValue: ({ value }) => normalizeMattermostBaseUrl(value) ?? value.trim(),
    },
  ],
  disable: (cfg) => ({
    ...cfg,
    channels: {
      ...cfg.channels,
      mattermost: {
        ...cfg.channels?.mattermost,
        enabled: false,
      },
    },
  }),
};
//#endregion
//#region extensions/mattermost/src/channel.ts
const mattermostSecurityAdapter = createRestrictSendersChannelSecurity({
  channelKey: "mattermost",
  resolveDmPolicy: (account) => account.config.dmPolicy,
  resolveDmAllowFrom: (account) => account.config.allowFrom,
  resolveGroupPolicy: (account) => account.config.groupPolicy,
  surface: "Mattermost channels",
  openScope: "any member",
  groupPolicyPath: "channels.mattermost.groupPolicy",
  groupAllowFromPath: "channels.mattermost.groupAllowFrom",
  policyPathSuffix: "dmPolicy",
  normalizeDmEntry: (raw) => normalizeAllowEntry$1(raw),
});
function describeMattermostMessageTool({ cfg }) {
  const enabledAccounts = listMattermostAccountIds(cfg)
    .map((accountId) =>
      resolveMattermostAccount({
        cfg,
        accountId,
      }),
    )
    .filter((account) => account.enabled)
    .filter((account) => Boolean(account.botToken?.trim() && account.baseUrl?.trim()));
  const actions = [];
  if (enabledAccounts.length > 0) actions.push("send");
  const baseReactions = cfg.channels?.mattermost?.actions?.reactions;
  if (
    enabledAccounts.some((account) => {
      return (account.config.actions?.reactions ?? baseReactions ?? true) !== false;
    })
  )
    actions.push("react");
  return {
    actions,
    capabilities: enabledAccounts.length > 0 ? ["buttons"] : [],
    schema:
      enabledAccounts.length > 0
        ? { properties: { buttons: Type.Optional(createMessageToolButtonsSchema()) } }
        : null,
  };
}
const mattermostMessageActions = {
  describeMessageTool: describeMattermostMessageTool,
  supportsAction: ({ action }) => {
    return action === "send" || action === "react";
  },
  handleAction: async ({ action, params, cfg, accountId }) => {
    if (action === "react") {
      const mmBase = cfg?.channels?.mattermost;
      const accounts = mmBase?.accounts;
      const resolvedAccountId = accountId ?? resolveDefaultMattermostAccountId(cfg);
      const acctActions = accounts?.[resolvedAccountId]?.actions;
      const baseActions = mmBase?.actions;
      if (!(acctActions?.reactions ?? baseActions?.reactions ?? true))
        throw new Error("Mattermost reactions are disabled in config");
      const postId = (
        typeof params?.messageId === "string"
          ? params.messageId
          : typeof params?.postId === "string"
            ? params.postId
            : ""
      ).trim();
      if (!postId) throw new Error("Mattermost react requires messageId (post id)");
      const emojiName = (typeof params?.emoji === "string" ? params.emoji : "")
        .trim()
        .replace(/^:+|:+$/g, "");
      if (!emojiName) throw new Error("Mattermost react requires emoji");
      if (params?.remove === true) {
        const result = await removeMattermostReaction({
          cfg,
          postId,
          emojiName,
          accountId: resolvedAccountId,
        });
        if (!result.ok) throw new Error(result.error);
        return {
          content: [
            {
              type: "text",
              text: `Removed reaction :${emojiName}: from ${postId}`,
            },
          ],
          details: {},
        };
      }
      const result = await addMattermostReaction({
        cfg,
        postId,
        emojiName,
        accountId: resolvedAccountId,
      });
      if (!result.ok) throw new Error(result.error);
      return {
        content: [
          {
            type: "text",
            text: `Reacted with :${emojiName}: on ${postId}`,
          },
        ],
        details: {},
      };
    }
    if (action !== "send") throw new Error(`Unsupported Mattermost action: ${action}`);
    const to =
      typeof params.to === "string"
        ? params.to.trim()
        : typeof params.target === "string"
          ? params.target.trim()
          : "";
    if (!to) throw new Error("Mattermost send requires a target (to).");
    const message = typeof params.message === "string" ? params.message : "";
    const replyToId = readMattermostReplyToId(params);
    const resolvedAccountId = accountId || void 0;
    const mediaUrl = typeof params.media === "string" ? params.media.trim() || void 0 : void 0;
    const result = await sendMessageMattermost(to, message, {
      accountId: resolvedAccountId,
      replyToId,
      buttons: Array.isArray(params.buttons) ? params.buttons : void 0,
      attachmentText: typeof params.attachmentText === "string" ? params.attachmentText : void 0,
      mediaUrl,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            ok: true,
            channel: "mattermost",
            messageId: result.messageId,
            channelId: result.channelId,
          }),
        },
      ],
      details: {},
    };
  },
};
const meta$2 = {
  id: "mattermost",
  label: "Mattermost",
  selectionLabel: "Mattermost (plugin)",
  detailLabel: "Mattermost Bot",
  docsPath: "/channels/mattermost",
  docsLabel: "mattermost",
  blurb: "self-hosted Slack-style chat; install the plugin to enable.",
  systemImage: "bubble.left.and.bubble.right",
  order: 65,
  quickstartAllowFrom: true,
};
function readMattermostReplyToId(params) {
  const readNormalizedValue = (value) => {
    if (typeof value !== "string") return;
    return value.trim() || void 0;
  };
  return readNormalizedValue(params.replyToId) ?? readNormalizedValue(params.replyTo);
}
function normalizeAllowEntry$1(entry) {
  return entry
    .trim()
    .replace(/^(mattermost|user):/i, "")
    .replace(/^@/, "")
    .toLowerCase();
}
function formatAllowEntry(entry) {
  const trimmed = entry.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("@")) {
    const username = trimmed.slice(1).trim();
    return username ? `@${username.toLowerCase()}` : "";
  }
  return trimmed.replace(/^(mattermost|user):/i, "").toLowerCase();
}
const mattermostConfigAdapter = createScopedChannelConfigAdapter({
  sectionKey: "mattermost",
  listAccountIds: listMattermostAccountIds,
  resolveAccount: adaptScopedAccountAccessor(resolveMattermostAccount),
  defaultAccountId: resolveDefaultMattermostAccountId,
  clearBaseFields: ["botToken", "baseUrl", "name"],
  resolveAllowFrom: (account) => account.config.allowFrom,
  formatAllowFrom: (allowFrom) =>
    formatNormalizedAllowFromEntries({
      allowFrom,
      normalizeEntry: formatAllowEntry,
    }),
});
const mattermostPlugin = createChatChannelPlugin({
  base: {
    id: "mattermost",
    meta: { ...meta$2 },
    setup: mattermostSetupAdapter,
    setupWizard: mattermostSetupWizard,
    capabilities: {
      chatTypes: ["direct", "channel", "group", "thread"],
      reactions: true,
      threads: true,
      media: true,
      nativeCommands: true,
    },
    streaming: {
      blockStreamingCoalesceDefaults: {
        minChars: 1500,
        idleMs: 1e3,
      },
    },
    reload: { configPrefixes: ["channels.mattermost"] },
    configSchema: buildChannelConfigSchema(MattermostConfigSchema),
    config: {
      ...mattermostConfigAdapter,
      isConfigured: (account) => Boolean(account.botToken && account.baseUrl),
      describeAccount: (account) =>
        describeAccountSnapshot({
          account,
          configured: Boolean(account.botToken && account.baseUrl),
          extra: {
            botTokenSource: account.botTokenSource,
            baseUrl: account.baseUrl,
          },
        }),
    },
    groups: { resolveRequireMention: resolveMattermostGroupRequireMention },
    actions: mattermostMessageActions,
    directory: createChannelDirectoryAdapter({
      listGroups: async (params) => listMattermostDirectoryGroups(params),
      listGroupsLive: async (params) => listMattermostDirectoryGroups(params),
      listPeers: async (params) => listMattermostDirectoryPeers(params),
      listPeersLive: async (params) => listMattermostDirectoryPeers(params),
    }),
    messaging: {
      normalizeTarget: normalizeMattermostMessagingTarget,
      resolveOutboundSessionRoute: (params) => resolveMattermostOutboundSessionRoute(params),
      targetResolver: {
        looksLikeId: looksLikeMattermostTargetId,
        hint: "<channelId|user:ID|channel:ID>",
        resolveTarget: async ({ cfg, accountId, input }) => {
          const resolved = await resolveMattermostOpaqueTarget({
            input,
            cfg,
            accountId,
          });
          if (!resolved) return null;
          return {
            to: resolved.to,
            kind: resolved.kind,
            source: "directory",
          };
        },
      },
    },
    status: createComputedAccountStatusAdapter({
      defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID, {
        connected: false,
        lastConnectedAt: null,
        lastDisconnect: null,
      }),
      buildChannelSummary: ({ snapshot }) =>
        buildPassiveProbedChannelStatusSummary(snapshot, {
          botTokenSource: snapshot.botTokenSource ?? "none",
          connected: snapshot.connected ?? false,
          baseUrl: snapshot.baseUrl ?? null,
        }),
      probeAccount: async ({ account, timeoutMs }) => {
        const token = account.botToken?.trim();
        const baseUrl = account.baseUrl?.trim();
        if (!token || !baseUrl)
          return {
            ok: false,
            error: "bot token or baseUrl missing",
          };
        return await probeMattermost(baseUrl, token, timeoutMs);
      },
      resolveAccountSnapshot: ({ account, runtime }) => ({
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured: Boolean(account.botToken && account.baseUrl),
        extra: {
          botTokenSource: account.botTokenSource,
          baseUrl: account.baseUrl,
          connected: runtime?.connected ?? false,
          lastConnectedAt: runtime?.lastConnectedAt ?? null,
          lastDisconnect: runtime?.lastDisconnect ?? null,
        },
      }),
    }),
    gateway: {
      startAccount: async (ctx) => {
        const account = ctx.account;
        const statusSink = createAccountStatusSink({
          accountId: ctx.accountId,
          setStatus: ctx.setStatus,
        });
        statusSink({
          baseUrl: account.baseUrl,
          botTokenSource: account.botTokenSource,
        });
        ctx.log?.info(`[${account.accountId}] starting channel`);
        return monitorMattermostProvider({
          botToken: account.botToken ?? void 0,
          baseUrl: account.baseUrl ?? void 0,
          accountId: account.accountId,
          config: ctx.cfg,
          runtime: ctx.runtime,
          abortSignal: ctx.abortSignal,
          statusSink,
        });
      },
    },
  },
  pairing: {
    text: {
      idLabel: "mattermostUserId",
      message: "OpenClaw: your access has been approved.",
      normalizeAllowEntry: (entry) => normalizeAllowEntry$1(entry),
      notify: createLoggedPairingApprovalNotifier(
        ({ id }) => `[mattermost] User ${id} approved for pairing`,
      ),
    },
  },
  threading: {
    scopedAccountReplyToMode: {
      resolveAccount: (cfg, accountId) =>
        resolveMattermostAccount({
          cfg,
          accountId: accountId ?? "default",
        }),
      resolveReplyToMode: (account, chatType) =>
        resolveMattermostReplyToMode(
          account,
          chatType === "direct" || chatType === "group" || chatType === "channel"
            ? chatType
            : "channel",
        ),
    },
  },
  security: mattermostSecurityAdapter,
  outbound: {
    base: {
      deliveryMode: "direct",
      chunker: (text, limit) => getMattermostRuntime().channel.text.chunkMarkdownText(text, limit),
      chunkerMode: "markdown",
      textChunkLimit: 4e3,
      resolveTarget: ({ to }) => {
        const trimmed = to?.trim();
        if (!trimmed)
          return {
            ok: false,
            error: /* @__PURE__ */ new Error(
              "Delivering to Mattermost requires --to <channelId|@username|user:ID|channel:ID>",
            ),
          };
        return {
          ok: true,
          to: trimmed,
        };
      },
    },
    attachedResults: {
      channel: "mattermost",
      sendText: async ({ cfg, to, text, accountId, replyToId, threadId }) =>
        await sendMessageMattermost(to, text, {
          cfg,
          accountId: accountId ?? void 0,
          replyToId: replyToId ?? (threadId != null ? String(threadId) : void 0),
        }),
      sendMedia: async ({
        cfg,
        to,
        text,
        mediaUrl,
        mediaLocalRoots,
        accountId,
        replyToId,
        threadId,
      }) =>
        await sendMessageMattermost(to, text, {
          cfg,
          accountId: accountId ?? void 0,
          mediaUrl,
          mediaLocalRoots,
          replyToId: replyToId ?? (threadId != null ? String(threadId) : void 0),
        }),
    },
  },
});
defineChannelPluginEntry({
  id: "mattermost",
  name: "Mattermost",
  description: "Mattermost channel plugin",
  plugin: mattermostPlugin,
  setRuntime: setMattermostRuntime,
  registerFull(api) {
    registerSlashCommandRoute(api);
  },
});
//#endregion
//#region extensions/nextcloud-talk/src/accounts.ts
function isTruthyEnvValue(value) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
}
const debugAccounts = (...args) => {
  if (isTruthyEnvValue(process.env.OPENCLAW_DEBUG_NEXTCLOUD_TALK_ACCOUNTS))
    console.warn("[nextcloud-talk:accounts]", ...args);
};
const {
  listAccountIds: listNextcloudTalkAccountIdsInternal,
  resolveDefaultAccountId: resolveDefaultNextcloudTalkAccountId,
} = createAccountListHelpers("nextcloud-talk", { normalizeAccountId });
function listNextcloudTalkAccountIds(cfg) {
  const ids = listNextcloudTalkAccountIdsInternal(cfg);
  debugAccounts("listNextcloudTalkAccountIds", ids);
  return ids;
}
function mergeNextcloudTalkAccountConfig(cfg, accountId) {
  return resolveMergedAccountConfig({
    channelConfig: cfg.channels?.["nextcloud-talk"],
    accounts: cfg.channels?.["nextcloud-talk"]?.accounts,
    accountId,
    omitKeys: ["defaultAccount"],
    normalizeAccountId,
  });
}
function resolveNextcloudTalkSecret(cfg, opts) {
  const merged = mergeNextcloudTalkAccountConfig(cfg, opts.accountId ?? "default");
  const envSecret = process.env.NEXTCLOUD_TALK_BOT_SECRET?.trim();
  if (envSecret && (!opts.accountId || opts.accountId === "default"))
    return {
      secret: envSecret,
      source: "env",
    };
  if (merged.botSecretFile) {
    const fileSecret = tryReadSecretFileSync(
      merged.botSecretFile,
      "Nextcloud Talk bot secret file",
      { rejectSymlink: true },
    );
    if (fileSecret)
      return {
        secret: fileSecret,
        source: "secretFile",
      };
  }
  const inlineSecret = normalizeResolvedSecretInputString({
    value: merged.botSecret,
    path: `channels.nextcloud-talk.accounts.${opts.accountId ?? "default"}.botSecret`,
  });
  if (inlineSecret)
    return {
      secret: inlineSecret,
      source: "config",
    };
  return {
    secret: "",
    source: "none",
  };
}
function resolveNextcloudTalkAccount(params) {
  const baseEnabled = params.cfg.channels?.["nextcloud-talk"]?.enabled !== false;
  const resolve = (accountId) => {
    const merged = mergeNextcloudTalkAccountConfig(params.cfg, accountId);
    const accountEnabled = merged.enabled !== false;
    const enabled = baseEnabled && accountEnabled;
    const secretResolution = resolveNextcloudTalkSecret(params.cfg, { accountId });
    const baseUrl = merged.baseUrl?.trim()?.replace(/\/$/, "") ?? "";
    debugAccounts("resolve", {
      accountId,
      enabled,
      secretSource: secretResolution.source,
      baseUrl: baseUrl ? "[set]" : "[missing]",
    });
    return {
      accountId,
      enabled,
      name: merged.name?.trim() || void 0,
      baseUrl,
      secret: secretResolution.secret,
      secretSource: secretResolution.source,
      config: merged,
    };
  };
  return resolveAccountWithDefaultFallback({
    accountId: params.accountId,
    normalizeAccountId,
    resolvePrimary: resolve,
    hasCredential: (account) => account.secretSource !== "none",
    resolveDefaultAccountId: () => resolveDefaultNextcloudTalkAccountId(params.cfg),
  });
}
//#endregion
//#region extensions/nextcloud-talk/src/config-schema.ts
const NextcloudTalkRoomSchema = z
  .object({
    requireMention: z.boolean().optional(),
    tools: ToolPolicySchema$1,
    skills: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
    allowFrom: z.array(z.string()).optional(),
    systemPrompt: z.string().optional(),
  })
  .strict();
const NextcloudTalkAccountSchemaBase = z
  .object({
    name: z.string().optional(),
    enabled: z.boolean().optional(),
    markdown: MarkdownConfigSchema$1,
    baseUrl: z.string().optional(),
    botSecret: buildSecretInputSchema().optional(),
    botSecretFile: z.string().optional(),
    apiUser: z.string().optional(),
    apiPassword: buildSecretInputSchema().optional(),
    apiPasswordFile: z.string().optional(),
    dmPolicy: DmPolicySchema$1.optional().default("pairing"),
    webhookPort: z.number().int().positive().optional(),
    webhookHost: z.string().optional(),
    webhookPath: z.string().optional(),
    webhookPublicUrl: z.string().optional(),
    allowFrom: z.array(z.string()).optional(),
    groupAllowFrom: z.array(z.string()).optional(),
    groupPolicy: GroupPolicySchema$1.optional().default("allowlist"),
    rooms: z.record(z.string(), NextcloudTalkRoomSchema.optional()).optional(),
    ...ReplyRuntimeConfigSchemaShape,
  })
  .strict();
const NextcloudTalkAccountSchema = NextcloudTalkAccountSchemaBase.superRefine((value, ctx) => {
  requireChannelOpenAllowFrom({
    channel: "nextcloud-talk",
    policy: value.dmPolicy,
    allowFrom: value.allowFrom,
    ctx,
    requireOpenAllowFrom,
  });
});
const NextcloudTalkConfigSchema = NextcloudTalkAccountSchemaBase.extend({
  accounts: z.record(z.string(), NextcloudTalkAccountSchema.optional()).optional(),
  defaultAccount: z.string().optional(),
}).superRefine((value, ctx) => {
  requireChannelOpenAllowFrom({
    channel: "nextcloud-talk",
    policy: value.dmPolicy,
    allowFrom: value.allowFrom,
    ctx,
    requireOpenAllowFrom,
  });
});
//#endregion
//#region extensions/nextcloud-talk/src/policy.ts
function normalizeAllowEntry(raw) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^(nextcloud-talk|nc-talk|nc):/i, "");
}
function normalizeNextcloudTalkAllowlist(values) {
  return (values ?? []).map((value) => normalizeAllowEntry(String(value))).filter(Boolean);
}
function resolveNextcloudTalkAllowlistMatch(params) {
  const allowFrom = normalizeNextcloudTalkAllowlist(params.allowFrom);
  if (allowFrom.length === 0) return { allowed: false };
  if (allowFrom.includes("*"))
    return {
      allowed: true,
      matchKey: "*",
      matchSource: "wildcard",
    };
  const senderId = normalizeAllowEntry(params.senderId);
  if (allowFrom.includes(senderId))
    return {
      allowed: true,
      matchKey: senderId,
      matchSource: "id",
    };
  return { allowed: false };
}
function resolveNextcloudTalkRoomMatch(params) {
  const rooms = params.rooms ?? {};
  const allowlistConfigured = Object.keys(rooms).length > 0;
  const match = resolveChannelEntryMatchWithFallback({
    entries: rooms,
    keys: buildChannelKeyCandidates(params.roomToken),
    wildcardKey: "*",
    normalizeKey: normalizeChannelSlug,
  });
  const roomConfig = match.entry;
  const allowed = resolveNestedAllowlistDecision({
    outerConfigured: allowlistConfigured,
    outerMatched: Boolean(roomConfig),
    innerConfigured: false,
    innerMatched: false,
  });
  return {
    roomConfig,
    wildcardConfig: match.wildcardEntry,
    roomKey: match.matchKey ?? match.key,
    matchSource: match.matchSource,
    allowed,
    allowlistConfigured,
  };
}
function resolveNextcloudTalkGroupToolPolicy(params) {
  const cfg = params.cfg;
  const roomToken = params.groupId?.trim();
  if (!roomToken) return;
  const match = resolveNextcloudTalkRoomMatch({
    rooms: cfg.channels?.["nextcloud-talk"]?.rooms,
    roomToken,
  });
  return match.roomConfig?.tools ?? match.wildcardConfig?.tools;
}
function resolveNextcloudTalkRequireMention(params) {
  if (typeof params.roomConfig?.requireMention === "boolean")
    return params.roomConfig.requireMention;
  if (typeof params.wildcardConfig?.requireMention === "boolean")
    return params.wildcardConfig.requireMention;
  return true;
}
function resolveNextcloudTalkGroupAllow(params) {
  const outerAllow = normalizeNextcloudTalkAllowlist(params.outerAllowFrom);
  const innerAllow = normalizeNextcloudTalkAllowlist(params.innerAllowFrom);
  const outerMatch = resolveNextcloudTalkAllowlistMatch({
    allowFrom: params.outerAllowFrom,
    senderId: params.senderId,
  });
  const innerMatch = resolveNextcloudTalkAllowlistMatch({
    allowFrom: params.innerAllowFrom,
    senderId: params.senderId,
  });
  return {
    allowed: evaluateMatchedGroupAccessForPolicy({
      groupPolicy: params.groupPolicy,
      allowlistConfigured: outerAllow.length > 0 || innerAllow.length > 0,
      allowlistMatched: resolveNestedAllowlistDecision({
        outerConfigured: outerAllow.length > 0 || innerAllow.length > 0,
        outerMatched: outerAllow.length > 0 ? outerMatch.allowed : true,
        innerConfigured: innerAllow.length > 0,
        innerMatched: innerMatch.allowed,
      }),
    }).allowed,
    outerMatch:
      params.groupPolicy === "open"
        ? { allowed: true }
        : params.groupPolicy === "disabled"
          ? { allowed: false }
          : outerMatch,
    innerMatch:
      params.groupPolicy === "open"
        ? { allowed: true }
        : params.groupPolicy === "disabled"
          ? { allowed: false }
          : innerMatch,
  };
}
function resolveNextcloudTalkMentionGate(params) {
  const result = resolveMentionGatingWithBypass({
    isGroup: params.isGroup,
    requireMention: params.requireMention,
    canDetectMention: true,
    wasMentioned: params.wasMentioned,
    allowTextCommands: params.allowTextCommands,
    hasControlCommand: params.hasControlCommand,
    commandAuthorized: params.commandAuthorized,
  });
  return {
    shouldSkip: result.shouldSkip,
    shouldBypassMention: result.shouldBypassMention,
  };
}
//#endregion
//#region extensions/nextcloud-talk/src/room-info.ts
const ROOM_CACHE_TTL_MS = 300 * 1e3;
const ROOM_CACHE_ERROR_TTL_MS = 30 * 1e3;
const roomCache = /* @__PURE__ */ new Map();
function resolveRoomCacheKey(params) {
  return `${params.accountId}:${params.roomToken}`;
}
function readApiPassword(params) {
  const inlinePassword = normalizeResolvedSecretInputString({
    value: params.apiPassword,
    path: "channels.nextcloud-talk.apiPassword",
  });
  if (inlinePassword) return inlinePassword;
  if (!params.apiPasswordFile) return;
  try {
    return readFileSync(params.apiPasswordFile, "utf-8").trim() || void 0;
  } catch {
    return;
  }
}
function coerceRoomType(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : void 0;
  }
}
function resolveRoomKindFromType(type) {
  if (!type) return;
  if (type === 1 || type === 5 || type === 6) return "direct";
  return "group";
}
async function resolveNextcloudTalkRoomKind(params) {
  const { account, roomToken, runtime } = params;
  const key = resolveRoomCacheKey({
    accountId: account.accountId,
    roomToken,
  });
  const cached = roomCache.get(key);
  if (cached) {
    const age = Date.now() - cached.fetchedAt;
    if (cached.kind && age < ROOM_CACHE_TTL_MS) return cached.kind;
    if (cached.error && age < ROOM_CACHE_ERROR_TTL_MS) return;
  }
  const apiUser = account.config.apiUser?.trim();
  const apiPassword = readApiPassword({
    apiPassword: account.config.apiPassword,
    apiPasswordFile: account.config.apiPasswordFile,
  });
  if (!apiUser || !apiPassword) return;
  const baseUrl = account.baseUrl?.trim();
  if (!baseUrl) return;
  const url = `${baseUrl}/ocs/v2.php/apps/spreed/api/v4/room/${roomToken}`;
  const auth = Buffer.from(`${apiUser}:${apiPassword}`, "utf-8").toString("base64");
  try {
    const { response, release } = await fetchWithSsrFGuard({
      url,
      init: {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "OCS-APIRequest": "true",
          Accept: "application/json",
        },
      },
      auditContext: "nextcloud-talk.room-info",
    });
    try {
      if (!response.ok) {
        roomCache.set(key, {
          fetchedAt: Date.now(),
          error: `status:${response.status}`,
        });
        runtime?.log?.(
          `nextcloud-talk: room lookup failed (${response.status}) token=${roomToken}`,
        );
        return;
      }
      const kind = resolveRoomKindFromType(coerceRoomType((await response.json()).ocs?.data?.type));
      roomCache.set(key, {
        fetchedAt: Date.now(),
        kind,
      });
      return kind;
    } finally {
      await release();
    }
  } catch (err) {
    roomCache.set(key, {
      fetchedAt: Date.now(),
      error: err instanceof Error ? err.message : String(err),
    });
    runtime?.error?.(`nextcloud-talk: room lookup error: ${String(err)}`);
    return;
  }
}
//#endregion
//#region extensions/nextcloud-talk/src/runtime.ts
const { setRuntime: setNextcloudTalkRuntime, getRuntime: getNextcloudTalkRuntime } =
  createPluginRuntimeStore("Nextcloud Talk runtime not initialized");
//#endregion
//#region extensions/nextcloud-talk/src/normalize.ts
function stripNextcloudTalkTargetPrefix(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;
  let normalized = trimmed;
  if (normalized.startsWith("nextcloud-talk:")) normalized = normalized.slice(15).trim();
  else if (normalized.startsWith("nc-talk:")) normalized = normalized.slice(8).trim();
  else if (normalized.startsWith("nc:")) normalized = normalized.slice(3).trim();
  if (normalized.startsWith("room:")) normalized = normalized.slice(5).trim();
  if (!normalized) return;
  return normalized;
}
function normalizeNextcloudTalkMessagingTarget(raw) {
  const normalized = stripNextcloudTalkTargetPrefix(raw);
  return normalized ? `nextcloud-talk:${normalized}`.toLowerCase() : void 0;
}
function looksLikeNextcloudTalkTargetId(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^(nextcloud-talk|nc-talk|nc):/i.test(trimmed)) return true;
  return /^[a-z0-9]{8,}$/i.test(trimmed);
}
//#endregion
//#region extensions/nextcloud-talk/src/signature.ts
const SIGNATURE_HEADER = "x-nextcloud-talk-signature";
const RANDOM_HEADER = "x-nextcloud-talk-random";
const BACKEND_HEADER = "x-nextcloud-talk-backend";
/**
 * Verify the HMAC-SHA256 signature of an incoming webhook request.
 * Signature is calculated as: HMAC-SHA256(random + body, secret)
 */
function verifyNextcloudTalkSignature(params) {
  const { signature, random, body, secret } = params;
  if (!signature || !random || !secret) return false;
  const expected = createHmac("sha256", secret)
    .update(random + body)
    .digest("hex");
  if (signature.length !== expected.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++)
    result |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  return result === 0;
}
/**
 * Extract webhook headers from an incoming request.
 */
function extractNextcloudTalkHeaders(headers) {
  const getHeader = (name) => {
    const value = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  };
  const signature = getHeader(SIGNATURE_HEADER);
  const random = getHeader(RANDOM_HEADER);
  const backend = getHeader(BACKEND_HEADER);
  if (!signature || !random || !backend) return null;
  return {
    signature,
    random,
    backend,
  };
}
/**
 * Generate signature headers for an outbound request to Nextcloud Talk.
 */
function generateNextcloudTalkSignature(params) {
  const { body, secret } = params;
  const random = randomBytes(32).toString("hex");
  return {
    random,
    signature: createHmac("sha256", secret)
      .update(random + body)
      .digest("hex"),
  };
}
//#endregion
//#region extensions/nextcloud-talk/src/send.ts
function resolveCredentials(explicit, account) {
  const baseUrl = explicit.baseUrl?.trim() ?? account.baseUrl;
  const secret = explicit.secret?.trim() ?? account.secret;
  if (!baseUrl)
    throw new Error(
      `Nextcloud Talk baseUrl missing for account "${account.accountId}" (set channels.nextcloud-talk.baseUrl).`,
    );
  if (!secret)
    throw new Error(
      `Nextcloud Talk bot secret missing for account "${account.accountId}" (set channels.nextcloud-talk.botSecret/botSecretFile or NEXTCLOUD_TALK_BOT_SECRET for default).`,
    );
  return {
    baseUrl,
    secret,
  };
}
function normalizeRoomToken(to) {
  const normalized = stripNextcloudTalkTargetPrefix(to);
  if (!normalized) throw new Error("Room token is required for Nextcloud Talk sends");
  return normalized;
}
function resolveNextcloudTalkSendContext(opts) {
  const cfg = opts.cfg ?? getNextcloudTalkRuntime().config.loadConfig();
  const account = resolveNextcloudTalkAccount({
    cfg,
    accountId: opts.accountId,
  });
  const { baseUrl, secret } = resolveCredentials(
    {
      baseUrl: opts.baseUrl,
      secret: opts.secret,
    },
    account,
  );
  return {
    cfg,
    account,
    baseUrl,
    secret,
  };
}
async function sendMessageNextcloudTalk(to, text, opts = {}) {
  const { cfg, account, baseUrl, secret } = resolveNextcloudTalkSendContext(opts);
  const roomToken = normalizeRoomToken(to);
  if (!text?.trim()) throw new Error("Message must be non-empty for Nextcloud Talk sends");
  const tableMode = getNextcloudTalkRuntime().channel.text.resolveMarkdownTableMode({
    cfg,
    channel: "nextcloud-talk",
    accountId: account.accountId,
  });
  const message = getNextcloudTalkRuntime().channel.text.convertMarkdownTables(
    text.trim(),
    tableMode,
  );
  const body = { message };
  if (opts.replyTo) body.replyTo = opts.replyTo;
  const bodyStr = JSON.stringify(body);
  const { random, signature } = generateNextcloudTalkSignature({
    body: message,
    secret,
  });
  const url = `${baseUrl}/ocs/v2.php/apps/spreed/api/v1/bot/${roomToken}/message`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "OCS-APIRequest": "true",
      "X-Nextcloud-Talk-Bot-Random": random,
      "X-Nextcloud-Talk-Bot-Signature": signature,
    },
    body: bodyStr,
  });
  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    const status = response.status;
    let errorMsg = `Nextcloud Talk send failed (${status})`;
    if (status === 400)
      errorMsg = `Nextcloud Talk: bad request - ${errorBody || "invalid message format"}`;
    else if (status === 401) errorMsg = "Nextcloud Talk: authentication failed - check bot secret";
    else if (status === 403)
      errorMsg = "Nextcloud Talk: forbidden - bot may not have permission in this room";
    else if (status === 404) errorMsg = `Nextcloud Talk: room not found (token=${roomToken})`;
    else if (errorBody) errorMsg = `Nextcloud Talk send failed: ${errorBody}`;
    throw new Error(errorMsg);
  }
  let messageId = "unknown";
  let timestamp;
  try {
    const data = await response.json();
    if (data.ocs?.data?.id != null) messageId = String(data.ocs.data.id);
    if (typeof data.ocs?.data?.timestamp === "number") timestamp = data.ocs.data.timestamp;
  } catch {}
  if (opts.verbose) console.log(`[nextcloud-talk] Sent message ${messageId} to room ${roomToken}`);
  getNextcloudTalkRuntime().channel.activity.record({
    channel: "nextcloud-talk",
    accountId: account.accountId,
    direction: "outbound",
  });
  return {
    messageId,
    roomToken,
    timestamp,
  };
}
//#endregion
//#region extensions/nextcloud-talk/src/inbound.ts
const CHANNEL_ID$5 = "nextcloud-talk";
async function deliverNextcloudTalkReply(params) {
  const { payload, roomToken, accountId, statusSink } = params;
  await deliverFormattedTextWithAttachments({
    payload,
    send: async ({ text, replyToId }) => {
      await sendMessageNextcloudTalk(roomToken, text, {
        accountId,
        replyTo: replyToId,
      });
      statusSink?.({ lastOutboundAt: Date.now() });
    },
  });
}
async function handleNextcloudTalkInbound(params) {
  const { message, account, config, runtime, statusSink } = params;
  const core = getNextcloudTalkRuntime();
  const pairing = createChannelPairingController({
    core,
    channel: CHANNEL_ID$5,
    accountId: account.accountId,
  });
  const rawBody = message.text?.trim() ?? "";
  if (!rawBody) return;
  const roomKind = await resolveNextcloudTalkRoomKind({
    account,
    roomToken: message.roomToken,
    runtime,
  });
  const isGroup = roomKind === "direct" ? false : roomKind === "group" ? true : message.isGroupChat;
  const senderId = message.senderId;
  const senderName = message.senderName;
  const roomToken = message.roomToken;
  const roomName = message.roomName;
  statusSink?.({ lastInboundAt: message.timestamp });
  const dmPolicy = account.config.dmPolicy ?? "pairing";
  const defaultGroupPolicy = resolveDefaultGroupPolicy(config);
  const { groupPolicy, providerMissingFallbackApplied } =
    resolveAllowlistProviderRuntimeGroupPolicy({
      providerConfigPresent: (config.channels?.["nextcloud-talk"] ?? void 0) !== void 0,
      groupPolicy: account.config.groupPolicy,
      defaultGroupPolicy,
    });
  warnMissingProviderGroupPolicyFallbackOnce({
    providerMissingFallbackApplied,
    providerKey: "nextcloud-talk",
    accountId: account.accountId,
    blockedLabel: GROUP_POLICY_BLOCKED_LABEL.room,
    log: (message) => runtime.log?.(message),
  });
  const configAllowFrom = normalizeNextcloudTalkAllowlist(account.config.allowFrom);
  const configGroupAllowFrom = normalizeNextcloudTalkAllowlist(account.config.groupAllowFrom);
  const storeAllowList = normalizeNextcloudTalkAllowlist(
    await readStoreAllowFromForDmPolicy({
      provider: CHANNEL_ID$5,
      accountId: account.accountId,
      dmPolicy,
      readStore: pairing.readStoreForDmPolicy,
    }),
  );
  const roomMatch = resolveNextcloudTalkRoomMatch({
    rooms: account.config.rooms,
    roomToken,
  });
  const roomConfig = roomMatch.roomConfig;
  if (isGroup && !roomMatch.allowed) {
    runtime.log?.(`nextcloud-talk: drop room ${roomToken} (not allowlisted)`);
    return;
  }
  if (roomConfig?.enabled === false) {
    runtime.log?.(`nextcloud-talk: drop room ${roomToken} (disabled)`);
    return;
  }
  const roomAllowFrom = normalizeNextcloudTalkAllowlist(roomConfig?.allowFrom);
  const allowTextCommands = core.channel.commands.shouldHandleTextCommands({
    cfg: config,
    surface: CHANNEL_ID$5,
  });
  const useAccessGroups = config.commands?.useAccessGroups !== false;
  const hasControlCommand = core.channel.text.hasControlCommand(rawBody, config);
  const access = resolveDmGroupAccessWithCommandGate({
    isGroup,
    dmPolicy,
    groupPolicy,
    allowFrom: configAllowFrom,
    groupAllowFrom: configGroupAllowFrom,
    storeAllowFrom: storeAllowList,
    isSenderAllowed: (allowFrom) =>
      resolveNextcloudTalkAllowlistMatch({
        allowFrom,
        senderId,
      }).allowed,
    command: {
      useAccessGroups,
      allowTextCommands,
      hasControlCommand,
    },
  });
  const commandAuthorized = access.commandAuthorized;
  const effectiveGroupAllowFrom = access.effectiveGroupAllowFrom;
  if (isGroup) {
    if (access.decision !== "allow") {
      runtime.log?.(`nextcloud-talk: drop group sender ${senderId} (reason=${access.reason})`);
      return;
    }
    if (
      !resolveNextcloudTalkGroupAllow({
        groupPolicy,
        outerAllowFrom: effectiveGroupAllowFrom,
        innerAllowFrom: roomAllowFrom,
        senderId,
      }).allowed
    ) {
      runtime.log?.(`nextcloud-talk: drop group sender ${senderId} (policy=${groupPolicy})`);
      return;
    }
  } else if (access.decision !== "allow") {
    if (access.decision === "pairing")
      await pairing.issueChallenge({
        senderId,
        senderIdLine: `Your Nextcloud user id: ${senderId}`,
        meta: { name: senderName || void 0 },
        sendPairingReply: async (text) => {
          await sendMessageNextcloudTalk(roomToken, text, { accountId: account.accountId });
          statusSink?.({ lastOutboundAt: Date.now() });
        },
        onReplyError: (err) => {
          runtime.error?.(`nextcloud-talk: pairing reply failed for ${senderId}: ${String(err)}`);
        },
      });
    runtime.log?.(`nextcloud-talk: drop DM sender ${senderId} (reason=${access.reason})`);
    return;
  }
  if (access.shouldBlockControlCommand) {
    logInboundDrop({
      log: (message) => runtime.log?.(message),
      channel: CHANNEL_ID$5,
      reason: "control command (unauthorized)",
      target: senderId,
    });
    return;
  }
  const mentionRegexes = core.channel.mentions.buildMentionRegexes(config);
  const wasMentioned = mentionRegexes.length
    ? core.channel.mentions.matchesMentionPatterns(rawBody, mentionRegexes)
    : false;
  const mentionGate = resolveNextcloudTalkMentionGate({
    isGroup,
    requireMention: isGroup
      ? resolveNextcloudTalkRequireMention({
          roomConfig,
          wildcardConfig: roomMatch.wildcardConfig,
        })
      : false,
    wasMentioned,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  });
  if (isGroup && mentionGate.shouldSkip) {
    runtime.log?.(`nextcloud-talk: drop room ${roomToken} (no mention)`);
    return;
  }
  const route = core.channel.routing.resolveAgentRoute({
    cfg: config,
    channel: CHANNEL_ID$5,
    accountId: account.accountId,
    peer: {
      kind: isGroup ? "group" : "direct",
      id: isGroup ? roomToken : senderId,
    },
  });
  const fromLabel = isGroup ? `room:${roomName || roomToken}` : senderName || `user:${senderId}`;
  const storePath = core.channel.session.resolveStorePath(config.session?.store, {
    agentId: route.agentId,
  });
  const envelopeOptions = core.channel.reply.resolveEnvelopeFormatOptions(config);
  const previousTimestamp = core.channel.session.readSessionUpdatedAt({
    storePath,
    sessionKey: route.sessionKey,
  });
  const body = core.channel.reply.formatAgentEnvelope({
    channel: "Nextcloud Talk",
    from: fromLabel,
    timestamp: message.timestamp,
    previousTimestamp,
    envelope: envelopeOptions,
    body: rawBody,
  });
  const groupSystemPrompt = roomConfig?.systemPrompt?.trim() || void 0;
  const ctxPayload = core.channel.reply.finalizeInboundContext({
    Body: body,
    BodyForAgent: rawBody,
    RawBody: rawBody,
    CommandBody: rawBody,
    From: isGroup ? `nextcloud-talk:room:${roomToken}` : `nextcloud-talk:${senderId}`,
    To: `nextcloud-talk:${roomToken}`,
    SessionKey: route.sessionKey,
    AccountId: route.accountId,
    ChatType: isGroup ? "group" : "direct",
    ConversationLabel: fromLabel,
    SenderName: senderName || void 0,
    SenderId: senderId,
    GroupSubject: isGroup ? roomName || roomToken : void 0,
    GroupSystemPrompt: isGroup ? groupSystemPrompt : void 0,
    Provider: CHANNEL_ID$5,
    Surface: CHANNEL_ID$5,
    WasMentioned: isGroup ? wasMentioned : void 0,
    MessageSid: message.messageId,
    Timestamp: message.timestamp,
    OriginatingChannel: CHANNEL_ID$5,
    OriginatingTo: `nextcloud-talk:${roomToken}`,
    CommandAuthorized: commandAuthorized,
  });
  await dispatchInboundReplyWithBase({
    cfg: config,
    channel: CHANNEL_ID$5,
    accountId: account.accountId,
    route,
    storePath,
    ctxPayload,
    core,
    deliver: async (payload) => {
      await deliverNextcloudTalkReply({
        payload,
        roomToken,
        accountId: account.accountId,
        statusSink,
      });
    },
    onRecordError: (err) => {
      runtime.error?.(`nextcloud-talk: failed updating session meta: ${String(err)}`);
    },
    onDispatchError: (err, info) => {
      runtime.error?.(`nextcloud-talk ${info.kind} reply failed: ${String(err)}`);
    },
    replyOptions: {
      skillFilter: roomConfig?.skills,
      disableBlockStreaming:
        typeof account.config.blockStreaming === "boolean"
          ? !account.config.blockStreaming
          : void 0,
    },
  });
}
//#endregion
//#region extensions/nextcloud-talk/src/replay-guard.ts
const DEFAULT_REPLAY_TTL_MS = 1440 * 60 * 1e3;
const DEFAULT_MEMORY_MAX_SIZE = 1e3;
const DEFAULT_FILE_MAX_ENTRIES = 1e4;
function sanitizeSegment(value) {
  const trimmed = value.trim();
  if (!trimmed) return "default";
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "_");
}
function buildReplayKey(params) {
  const roomToken = params.roomToken.trim();
  const messageId = params.messageId.trim();
  if (!roomToken || !messageId) return null;
  return `${roomToken}:${messageId}`;
}
function createNextcloudTalkReplayGuard(options) {
  const stateDir = options.stateDir.trim();
  const persistentDedupe = createPersistentDedupe({
    ttlMs: options.ttlMs ?? DEFAULT_REPLAY_TTL_MS,
    memoryMaxSize: options.memoryMaxSize ?? DEFAULT_MEMORY_MAX_SIZE,
    fileMaxEntries: options.fileMaxEntries ?? DEFAULT_FILE_MAX_ENTRIES,
    resolveFilePath: (namespace) =>
      path.join(stateDir, "nextcloud-talk", "replay-dedupe", `${sanitizeSegment(namespace)}.json`),
  });
  return {
    shouldProcessMessage: async ({ accountId, roomToken, messageId }) => {
      const replayKey = buildReplayKey({
        roomToken,
        messageId,
      });
      if (!replayKey) return true;
      return await persistentDedupe.checkAndRecord(replayKey, {
        namespace: accountId,
        onDiskError: options.onDiskError,
      });
    },
  };
}
//#endregion
//#region extensions/nextcloud-talk/src/monitor.ts
const DEFAULT_WEBHOOK_PORT = 8788;
const DEFAULT_WEBHOOK_HOST = "0.0.0.0";
const DEFAULT_WEBHOOK_PATH$1 = "/nextcloud-talk-webhook";
const DEFAULT_WEBHOOK_MAX_BODY_BYTES = 1024 * 1024;
const PREAUTH_WEBHOOK_MAX_BODY_BYTES = 64 * 1024;
const PREAUTH_WEBHOOK_BODY_TIMEOUT_MS = 5e3;
const HEALTH_PATH = "/healthz";
const WEBHOOK_ERRORS = {
  missingSignatureHeaders: "Missing signature headers",
  invalidBackend: "Invalid backend",
  invalidSignature: "Invalid signature",
  invalidPayloadFormat: "Invalid payload format",
  payloadTooLarge: "Payload too large",
  internalServerError: "Internal server error",
};
function formatError(err) {
  if (err instanceof Error) return err.message;
  return typeof err === "string" ? err : JSON.stringify(err);
}
function normalizeOrigin(value) {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}
function parseWebhookPayload(body) {
  try {
    const data = JSON.parse(body);
    if (
      !data.type ||
      !data.actor?.type ||
      !data.actor?.id ||
      !data.object?.type ||
      !data.object?.id ||
      !data.target?.type ||
      !data.target?.id
    )
      return null;
    return data;
  } catch {
    return null;
  }
}
function writeJsonResponse(res, status, body) {
  if (body) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
    return;
  }
  res.writeHead(status);
  res.end();
}
function writeWebhookError(res, status, error) {
  if (res.headersSent) return;
  writeJsonResponse(res, status, { error });
}
function validateWebhookHeaders(params) {
  const headers = extractNextcloudTalkHeaders(params.req.headers);
  if (!headers) {
    writeWebhookError(params.res, 400, WEBHOOK_ERRORS.missingSignatureHeaders);
    return null;
  }
  if (params.isBackendAllowed && !params.isBackendAllowed(headers.backend)) {
    writeWebhookError(params.res, 401, WEBHOOK_ERRORS.invalidBackend);
    return null;
  }
  return headers;
}
function verifyWebhookSignature(params) {
  if (
    !verifyNextcloudTalkSignature({
      signature: params.headers.signature,
      random: params.headers.random,
      body: params.body,
      secret: params.secret,
    })
  ) {
    writeWebhookError(params.res, 401, WEBHOOK_ERRORS.invalidSignature);
    return false;
  }
  return true;
}
function decodeWebhookCreateMessage(params) {
  const payload = parseWebhookPayload(params.body);
  if (!payload) {
    writeWebhookError(params.res, 400, WEBHOOK_ERRORS.invalidPayloadFormat);
    return { kind: "invalid" };
  }
  if (payload.type !== "Create") return { kind: "ignore" };
  return {
    kind: "message",
    message: payloadToInboundMessage(payload),
  };
}
function payloadToInboundMessage(payload) {
  return {
    messageId: String(payload.object.id),
    roomToken: payload.target.id,
    roomName: payload.target.name,
    senderId: payload.actor.id,
    senderName: payload.actor.name ?? "",
    text: payload.object.content || payload.object.name || "",
    mediaType: payload.object.mediaType || "text/plain",
    timestamp: Date.now(),
    isGroupChat: true,
  };
}
function readNextcloudTalkWebhookBody(req, maxBodyBytes) {
  return readRequestBodyWithLimit(req, {
    maxBytes: Math.min(maxBodyBytes, PREAUTH_WEBHOOK_MAX_BODY_BYTES),
    timeoutMs: PREAUTH_WEBHOOK_BODY_TIMEOUT_MS,
  });
}
function createNextcloudTalkWebhookServer(opts) {
  const { port, host, path, secret, onMessage, onError, abortSignal } = opts;
  const maxBodyBytes =
    typeof opts.maxBodyBytes === "number" &&
    Number.isFinite(opts.maxBodyBytes) &&
    opts.maxBodyBytes > 0
      ? Math.floor(opts.maxBodyBytes)
      : DEFAULT_WEBHOOK_MAX_BODY_BYTES;
  const readBody = opts.readBody ?? readNextcloudTalkWebhookBody;
  const isBackendAllowed = opts.isBackendAllowed;
  const shouldProcessMessage = opts.shouldProcessMessage;
  const server = createServer$2(async (req, res) => {
    if (req.url === HEALTH_PATH) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }
    if (req.url !== path || req.method !== "POST") {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const headers = validateWebhookHeaders({
        req,
        res,
        isBackendAllowed,
      });
      if (!headers) return;
      const body = await readBody(req, maxBodyBytes);
      if (
        !verifyWebhookSignature({
          headers,
          body,
          secret,
          res,
        })
      )
        return;
      const decoded = decodeWebhookCreateMessage({
        body,
        res,
      });
      if (decoded.kind === "invalid") return;
      if (decoded.kind === "ignore") {
        writeJsonResponse(res, 200);
        return;
      }
      const message = decoded.message;
      if (shouldProcessMessage) {
        if (!(await shouldProcessMessage(message))) {
          writeJsonResponse(res, 200);
          return;
        }
      }
      writeJsonResponse(res, 200);
      try {
        await onMessage(message);
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error(formatError(err)));
      }
    } catch (err) {
      if (isRequestBodyLimitError(err, "PAYLOAD_TOO_LARGE")) {
        writeWebhookError(res, 413, WEBHOOK_ERRORS.payloadTooLarge);
        return;
      }
      if (isRequestBodyLimitError(err, "REQUEST_BODY_TIMEOUT")) {
        writeWebhookError(res, 408, requestBodyErrorToText("REQUEST_BODY_TIMEOUT"));
        return;
      }
      const error = err instanceof Error ? err : new Error(formatError(err));
      onError?.(error);
      writeWebhookError(res, 500, WEBHOOK_ERRORS.internalServerError);
    }
  });
  const start = () => {
    return new Promise((resolve) => {
      server.listen(port, host, () => resolve());
    });
  };
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      server.close();
    } catch {}
  };
  if (abortSignal)
    if (abortSignal.aborted) stop();
    else abortSignal.addEventListener("abort", stop, { once: true });
  return {
    server,
    start,
    stop,
  };
}
async function monitorNextcloudTalkProvider(opts) {
  const core = getNextcloudTalkRuntime();
  const cfg = opts.config ?? core.config.loadConfig();
  const account = resolveNextcloudTalkAccount({
    cfg,
    accountId: opts.accountId,
  });
  const runtime = resolveLoggerBackedRuntime(opts.runtime, core.logging.getChildLogger());
  if (!account.secret)
    throw new Error(`Nextcloud Talk bot secret not configured for account "${account.accountId}"`);
  const port = account.config.webhookPort ?? DEFAULT_WEBHOOK_PORT;
  const host = account.config.webhookHost ?? DEFAULT_WEBHOOK_HOST;
  const path = account.config.webhookPath ?? DEFAULT_WEBHOOK_PATH$1;
  const logger = core.logging.getChildLogger({
    channel: "nextcloud-talk",
    accountId: account.accountId,
  });
  const expectedBackendOrigin = normalizeOrigin(account.baseUrl);
  const replayGuard = createNextcloudTalkReplayGuard({
    stateDir: core.state.resolveStateDir(process.env, os.homedir),
    onDiskError: (error) => {
      logger.warn(
        `[nextcloud-talk:${account.accountId}] replay guard disk error: ${String(error)}`,
      );
    },
  });
  const { start, stop } = createNextcloudTalkWebhookServer({
    port,
    host,
    path,
    secret: account.secret,
    isBackendAllowed: (backend) => {
      if (!expectedBackendOrigin) return true;
      return normalizeOrigin(backend) === expectedBackendOrigin;
    },
    shouldProcessMessage: async (message) => {
      const shouldProcess = await replayGuard.shouldProcessMessage({
        accountId: account.accountId,
        roomToken: message.roomToken,
        messageId: message.messageId,
      });
      if (!shouldProcess)
        logger.warn(
          `[nextcloud-talk:${account.accountId}] replayed webhook ignored room=${message.roomToken} messageId=${message.messageId}`,
        );
      return shouldProcess;
    },
    onMessage: async (message) => {
      core.channel.activity.record({
        channel: "nextcloud-talk",
        accountId: account.accountId,
        direction: "inbound",
        at: message.timestamp,
      });
      if (opts.onMessage) {
        await opts.onMessage(message);
        return;
      }
      await handleNextcloudTalkInbound({
        message,
        account,
        config: cfg,
        runtime,
        statusSink: opts.statusSink,
      });
    },
    onError: (error) => {
      logger.error(`[nextcloud-talk:${account.accountId}] webhook error: ${error.message}`);
    },
    abortSignal: opts.abortSignal,
  });
  if (opts.abortSignal?.aborted) return { stop };
  await start();
  if (opts.abortSignal?.aborted) {
    stop();
    return { stop };
  }
  const publicUrl =
    account.config.webhookPublicUrl ??
    `http://${host === "0.0.0.0" ? "localhost" : host}:${port}${path}`;
  logger.info(`[nextcloud-talk:${account.accountId}] webhook listening on ${publicUrl}`);
  return { stop };
}
//#endregion
//#region extensions/nextcloud-talk/src/session-route.ts
function resolveNextcloudTalkOutboundSessionRoute(params) {
  const roomId = stripNextcloudTalkTargetPrefix(params.target);
  if (!roomId) return null;
  return buildChannelOutboundSessionRoute({
    cfg: params.cfg,
    agentId: params.agentId,
    channel: "nextcloud-talk",
    accountId: params.accountId,
    peer: {
      kind: "group",
      id: roomId,
    },
    chatType: "group",
    from: `nextcloud-talk:room:${roomId}`,
    to: `nextcloud-talk:${roomId}`,
  });
}
//#endregion
//#region extensions/nextcloud-talk/src/setup-core.ts
const channel$4 = "nextcloud-talk";
function normalizeNextcloudTalkBaseUrl(value) {
  return value?.trim().replace(/\/+$/, "") ?? "";
}
function validateNextcloudTalkBaseUrl(value) {
  if (!value) return "Required";
  if (!value.startsWith("http://") && !value.startsWith("https://"))
    return "URL must start with http:// or https://";
}
function setNextcloudTalkAccountConfig(cfg, accountId, updates) {
  return patchScopedAccountConfig({
    cfg,
    channelKey: channel$4,
    accountId,
    patch: updates,
  });
}
function clearNextcloudTalkAccountFields(cfg, accountId, fields) {
  const section = cfg.channels?.["nextcloud-talk"];
  if (!section) return cfg;
  if (accountId === "default") {
    const nextSection = { ...section };
    for (const field of fields) delete nextSection[field];
    return {
      ...cfg,
      channels: {
        ...(cfg.channels ?? {}),
        "nextcloud-talk": nextSection,
      },
    };
  }
  const currentAccount = section.accounts?.[accountId];
  if (!currentAccount) return cfg;
  const nextAccount = { ...currentAccount };
  for (const field of fields) delete nextAccount[field];
  return {
    ...cfg,
    channels: {
      ...(cfg.channels ?? {}),
      "nextcloud-talk": {
        ...section,
        accounts: {
          ...section.accounts,
          [accountId]: nextAccount,
        },
      },
    },
  };
}
async function promptNextcloudTalkAllowFrom(params) {
  return await promptParsedAllowFromForAccount({
    cfg: params.cfg,
    accountId: params.accountId,
    defaultAccountId: params.accountId,
    prompter: params.prompter,
    noteTitle: "Nextcloud Talk user id",
    noteLines: [
      "1) Check the Nextcloud admin panel for user IDs",
      "2) Or look at the webhook payload logs when someone messages",
      "3) User IDs are typically lowercase usernames in Nextcloud",
      `Docs: ${formatDocsLink("/channels/nextcloud-talk", "nextcloud-talk")}`,
    ],
    message: "Nextcloud Talk allowFrom (user id)",
    placeholder: "username",
    parseEntries: (raw) => ({
      entries: String(raw)
        .split(/[\n,;]+/g)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    }),
    getExistingAllowFrom: ({ cfg, accountId }) =>
      resolveNextcloudTalkAccount({
        cfg,
        accountId,
      }).config.allowFrom ?? [],
    mergeEntries: ({ existing, parsed }) =>
      mergeAllowFromEntries(
        existing.map((value) => String(value).trim().toLowerCase()),
        parsed,
      ),
    applyAllowFrom: ({ cfg, accountId, allowFrom }) =>
      setNextcloudTalkAccountConfig(cfg, accountId, {
        dmPolicy: "allowlist",
        allowFrom,
      }),
  });
}
async function promptNextcloudTalkAllowFromForAccount(params) {
  const accountId = resolveSetupAccountId({
    accountId: params.accountId,
    defaultAccountId: resolveDefaultNextcloudTalkAccountId(params.cfg),
  });
  return await promptNextcloudTalkAllowFrom({
    cfg: params.cfg,
    prompter: params.prompter,
    accountId,
  });
}
const nextcloudTalkDmPolicy = createTopLevelChannelDmPolicy({
  label: "Nextcloud Talk",
  channel: channel$4,
  policyKey: "channels.nextcloud-talk.dmPolicy",
  allowFromKey: "channels.nextcloud-talk.allowFrom",
  getCurrent: (cfg) => cfg.channels?.["nextcloud-talk"]?.dmPolicy ?? "pairing",
  promptAllowFrom: promptNextcloudTalkAllowFromForAccount,
});
const nextcloudTalkSetupAdapter = {
  resolveAccountId: ({ accountId }) => normalizeAccountId(accountId),
  applyAccountName: ({ cfg, accountId, name }) =>
    applyAccountNameToChannelSection({
      cfg,
      channelKey: channel$4,
      accountId,
      name,
    }),
  validateInput: ({ accountId, input }) => {
    const setupInput = input;
    if (setupInput.useEnv && accountId !== "default")
      return "NEXTCLOUD_TALK_BOT_SECRET can only be used for the default account.";
    if (!setupInput.useEnv && !setupInput.secret && !setupInput.secretFile)
      return "Nextcloud Talk requires bot secret or --secret-file (or --use-env).";
    if (!setupInput.baseUrl) return "Nextcloud Talk requires --base-url.";
    return null;
  },
  applyAccountConfig: ({ cfg, accountId, input }) => {
    const setupInput = input;
    const namedConfig = applyAccountNameToChannelSection({
      cfg,
      channelKey: channel$4,
      accountId,
      name: setupInput.name,
    });
    return setNextcloudTalkAccountConfig(
      setupInput.useEnv
        ? clearNextcloudTalkAccountFields(namedConfig, accountId, ["botSecret", "botSecretFile"])
        : namedConfig,
      accountId,
      {
        baseUrl: normalizeNextcloudTalkBaseUrl(setupInput.baseUrl),
        ...(setupInput.useEnv
          ? {}
          : setupInput.secretFile
            ? { botSecretFile: setupInput.secretFile }
            : setupInput.secret
              ? { botSecret: setupInput.secret }
              : {}),
      },
    );
  },
};
//#endregion
//#region extensions/nextcloud-talk/src/setup-surface.ts
const channel$3 = "nextcloud-talk";
const CONFIGURE_API_FLAG = "__nextcloudTalkConfigureApiCredentials";
const nextcloudTalkSetupWizard = {
  channel: channel$3,
  stepOrder: "text-first",
  status: createStandardChannelSetupStatus({
    channelLabel: "Nextcloud Talk",
    configuredLabel: "configured",
    unconfiguredLabel: "needs setup",
    configuredHint: "configured",
    unconfiguredHint: "self-hosted chat",
    configuredScore: 1,
    unconfiguredScore: 5,
    resolveConfigured: ({ cfg }) =>
      listNextcloudTalkAccountIds(cfg).some((accountId) => {
        const account = resolveNextcloudTalkAccount({
          cfg,
          accountId,
        });
        return Boolean(account.secret && account.baseUrl);
      }),
  }),
  introNote: {
    title: "Nextcloud Talk bot setup",
    lines: [
      "1) SSH into your Nextcloud server",
      '2) Run: ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction',
      "3) Copy the shared secret you used in the command",
      "4) Enable the bot in your Nextcloud Talk room settings",
      "Tip: you can also set NEXTCLOUD_TALK_BOT_SECRET in your env.",
      `Docs: ${formatDocsLink("/channels/nextcloud-talk", "channels/nextcloud-talk")}`,
    ],
    shouldShow: ({ cfg, accountId }) => {
      const account = resolveNextcloudTalkAccount({
        cfg,
        accountId,
      });
      return !account.secret || !account.baseUrl;
    },
  },
  prepare: async ({ cfg, accountId, credentialValues, prompter }) => {
    const resolvedAccount = resolveNextcloudTalkAccount({
      cfg,
      accountId,
    });
    const hasApiCredentials = Boolean(
      resolvedAccount.config.apiUser?.trim() &&
      (hasConfiguredSecretInput(resolvedAccount.config.apiPassword) ||
        resolvedAccount.config.apiPasswordFile),
    );
    if (
      !(await prompter.confirm({
        message: "Configure optional Nextcloud Talk API credentials for room lookups?",
        initialValue: hasApiCredentials,
      }))
    )
      return;
    return {
      credentialValues: {
        ...credentialValues,
        [CONFIGURE_API_FLAG]: "1",
      },
    };
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: channel$3,
      credentialLabel: "bot secret",
      preferredEnvVar: "NEXTCLOUD_TALK_BOT_SECRET",
      envPrompt: "NEXTCLOUD_TALK_BOT_SECRET detected. Use env var?",
      keepPrompt: "Nextcloud Talk bot secret already configured. Keep it?",
      inputPrompt: "Enter Nextcloud Talk bot secret",
      allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
      inspect: ({ cfg, accountId }) => {
        const resolvedAccount = resolveNextcloudTalkAccount({
          cfg,
          accountId,
        });
        return {
          accountConfigured: Boolean(resolvedAccount.secret && resolvedAccount.baseUrl),
          hasConfiguredValue: Boolean(
            hasConfiguredSecretInput(resolvedAccount.config.botSecret) ||
            resolvedAccount.config.botSecretFile,
          ),
          resolvedValue: resolvedAccount.secret || void 0,
          envValue:
            accountId === "default"
              ? process.env.NEXTCLOUD_TALK_BOT_SECRET?.trim() || void 0
              : void 0,
        };
      },
      applyUseEnv: async (params) => {
        const resolvedAccount = resolveNextcloudTalkAccount({
          cfg: params.cfg,
          accountId: params.accountId,
        });
        return setNextcloudTalkAccountConfig(
          clearNextcloudTalkAccountFields(params.cfg, params.accountId, [
            "botSecret",
            "botSecretFile",
          ]),
          params.accountId,
          { baseUrl: resolvedAccount.baseUrl },
        );
      },
      applySet: async (params) =>
        setNextcloudTalkAccountConfig(
          clearNextcloudTalkAccountFields(params.cfg, params.accountId, [
            "botSecret",
            "botSecretFile",
          ]),
          params.accountId,
          { botSecret: params.value },
        ),
    },
    {
      inputKey: "password",
      providerHint: "nextcloud-talk-api",
      credentialLabel: "API password",
      preferredEnvVar: "NEXTCLOUD_TALK_API_PASSWORD",
      envPrompt: "",
      keepPrompt: "Nextcloud Talk API password already configured. Keep it?",
      inputPrompt: "Enter Nextcloud Talk API password",
      inspect: ({ cfg, accountId }) => {
        const resolvedAccount = resolveNextcloudTalkAccount({
          cfg,
          accountId,
        });
        const apiUser = resolvedAccount.config.apiUser?.trim();
        const apiPasswordConfigured = Boolean(
          hasConfiguredSecretInput(resolvedAccount.config.apiPassword) ||
          resolvedAccount.config.apiPasswordFile,
        );
        return {
          accountConfigured: Boolean(apiUser && apiPasswordConfigured),
          hasConfiguredValue: apiPasswordConfigured,
        };
      },
      shouldPrompt: ({ credentialValues }) => credentialValues[CONFIGURE_API_FLAG] === "1",
      applySet: async (params) =>
        setNextcloudTalkAccountConfig(
          clearNextcloudTalkAccountFields(params.cfg, params.accountId, [
            "apiPassword",
            "apiPasswordFile",
          ]),
          params.accountId,
          { apiPassword: params.value },
        ),
    },
  ],
  textInputs: [
    {
      inputKey: "httpUrl",
      message: "Enter Nextcloud instance URL (e.g., https://cloud.example.com)",
      currentValue: ({ cfg, accountId }) =>
        resolveNextcloudTalkAccount({
          cfg,
          accountId,
        }).baseUrl || void 0,
      shouldPrompt: ({ currentValue }) => !currentValue,
      validate: ({ value }) => validateNextcloudTalkBaseUrl(value),
      normalizeValue: ({ value }) => normalizeNextcloudTalkBaseUrl(value),
      applySet: async (params) =>
        setNextcloudTalkAccountConfig(params.cfg, params.accountId, { baseUrl: params.value }),
    },
    {
      inputKey: "userId",
      message: "Nextcloud Talk API user",
      currentValue: ({ cfg, accountId }) =>
        resolveNextcloudTalkAccount({
          cfg,
          accountId,
        }).config.apiUser?.trim() || void 0,
      shouldPrompt: ({ credentialValues }) => credentialValues[CONFIGURE_API_FLAG] === "1",
      validate: ({ value }) => (value ? void 0 : "Required"),
      applySet: async (params) =>
        setNextcloudTalkAccountConfig(params.cfg, params.accountId, { apiUser: params.value }),
    },
  ],
  dmPolicy: nextcloudTalkDmPolicy,
  disable: (cfg) => setSetupChannelEnabled(cfg, channel$3, false),
};
//#endregion
//#region extensions/nextcloud-talk/src/channel.ts
const meta$1 = {
  id: "nextcloud-talk",
  label: "Nextcloud Talk",
  selectionLabel: "Nextcloud Talk (self-hosted)",
  docsPath: "/channels/nextcloud-talk",
  docsLabel: "nextcloud-talk",
  blurb: "Self-hosted chat via Nextcloud Talk webhook bots.",
  aliases: ["nc-talk", "nc"],
  order: 65,
  quickstartAllowFrom: true,
};
const nextcloudTalkConfigAdapter = createScopedChannelConfigAdapter({
  sectionKey: "nextcloud-talk",
  listAccountIds: listNextcloudTalkAccountIds,
  resolveAccount: adaptScopedAccountAccessor(resolveNextcloudTalkAccount),
  defaultAccountId: resolveDefaultNextcloudTalkAccountId,
  clearBaseFields: ["botSecret", "botSecretFile", "baseUrl", "name"],
  resolveAllowFrom: (account) => account.config.allowFrom,
  formatAllowFrom: (allowFrom) =>
    formatAllowFromLowercase({
      allowFrom,
      stripPrefixRe: /^(nextcloud-talk|nc-talk|nc):/i,
    }),
});
const resolveNextcloudTalkDmPolicy = createScopedDmSecurityResolver({
  channelKey: "nextcloud-talk",
  resolvePolicy: (account) => account.config.dmPolicy,
  resolveAllowFrom: (account) => account.config.allowFrom,
  policyPathSuffix: "dmPolicy",
  normalizeEntry: (raw) =>
    raw
      .trim()
      .replace(/^(nextcloud-talk|nc-talk|nc):/i, "")
      .trim()
      .toLowerCase(),
});
const collectNextcloudTalkSecurityWarnings = createAllowlistProviderRouteAllowlistWarningCollector({
  providerConfigPresent: (cfg) => cfg.channels?.["nextcloud-talk"] !== void 0,
  resolveGroupPolicy: (account) => account.config.groupPolicy,
  resolveRouteAllowlistConfigured: (account) =>
    Boolean(account.config.rooms) && Object.keys(account.config.rooms ?? {}).length > 0,
  restrictSenders: {
    surface: "Nextcloud Talk rooms",
    openScope: "any member in allowed rooms",
    groupPolicyPath: "channels.nextcloud-talk.groupPolicy",
    groupAllowFromPath: "channels.nextcloud-talk.groupAllowFrom",
  },
  noRouteAllowlist: {
    surface: "Nextcloud Talk rooms",
    routeAllowlistPath: "channels.nextcloud-talk.rooms",
    routeScope: "room",
    groupPolicyPath: "channels.nextcloud-talk.groupPolicy",
    groupAllowFromPath: "channels.nextcloud-talk.groupAllowFrom",
  },
});
const nextcloudTalkPlugin = createChatChannelPlugin({
  base: {
    id: "nextcloud-talk",
    meta: meta$1,
    setupWizard: nextcloudTalkSetupWizard,
    capabilities: {
      chatTypes: ["direct", "group"],
      reactions: true,
      threads: false,
      media: true,
      nativeCommands: false,
      blockStreaming: true,
    },
    reload: { configPrefixes: ["channels.nextcloud-talk"] },
    configSchema: buildChannelConfigSchema(NextcloudTalkConfigSchema),
    config: {
      ...nextcloudTalkConfigAdapter,
      isConfigured: (account) => Boolean(account.secret?.trim() && account.baseUrl?.trim()),
      describeAccount: (account) =>
        describeAccountSnapshot({
          account,
          configured: Boolean(account.secret?.trim() && account.baseUrl?.trim()),
          extra: {
            secretSource: account.secretSource,
            baseUrl: account.baseUrl ? "[set]" : "[missing]",
          },
        }),
    },
    groups: {
      resolveRequireMention: ({ cfg, accountId, groupId }) => {
        const rooms = resolveNextcloudTalkAccount({
          cfg,
          accountId,
        }).config.rooms;
        if (!rooms || !groupId) return true;
        const roomConfig = rooms[groupId];
        if (roomConfig?.requireMention !== void 0) return roomConfig.requireMention;
        const wildcardConfig = rooms["*"];
        if (wildcardConfig?.requireMention !== void 0) return wildcardConfig.requireMention;
        return true;
      },
      resolveToolPolicy: resolveNextcloudTalkGroupToolPolicy,
    },
    messaging: {
      normalizeTarget: normalizeNextcloudTalkMessagingTarget,
      resolveOutboundSessionRoute: (params) => resolveNextcloudTalkOutboundSessionRoute(params),
      targetResolver: {
        looksLikeId: looksLikeNextcloudTalkTargetId,
        hint: "<roomToken>",
      },
    },
    setup: nextcloudTalkSetupAdapter,
    status: createComputedAccountStatusAdapter({
      defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID),
      buildChannelSummary: ({ snapshot }) =>
        buildBaseChannelStatusSummary(snapshot, {
          secretSource: snapshot.secretSource ?? "none",
          mode: "webhook",
        }),
      resolveAccountSnapshot: ({ account }) => ({
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured: Boolean(account.secret?.trim() && account.baseUrl?.trim()),
        extra: {
          secretSource: account.secretSource,
          baseUrl: account.baseUrl ? "[set]" : "[missing]",
          mode: "webhook",
        },
      }),
    }),
    gateway: {
      startAccount: async (ctx) => {
        const account = ctx.account;
        if (!account.secret || !account.baseUrl)
          throw new Error(
            `Nextcloud Talk not configured for account "${account.accountId}" (missing secret or baseUrl)`,
          );
        ctx.log?.info(`[${account.accountId}] starting Nextcloud Talk webhook server`);
        const statusSink = createAccountStatusSink({
          accountId: ctx.accountId,
          setStatus: ctx.setStatus,
        });
        await runStoppablePassiveMonitor({
          abortSignal: ctx.abortSignal,
          start: async () =>
            await monitorNextcloudTalkProvider({
              accountId: account.accountId,
              config: ctx.cfg,
              runtime: ctx.runtime,
              abortSignal: ctx.abortSignal,
              statusSink,
            }),
        });
      },
      logoutAccount: async ({ accountId, cfg }) => {
        const nextCfg = { ...cfg };
        const nextSection = cfg.channels?.["nextcloud-talk"]
          ? { ...cfg.channels["nextcloud-talk"] }
          : void 0;
        let cleared = false;
        let changed = false;
        if (nextSection) {
          if (accountId === "default" && nextSection.botSecret) {
            delete nextSection.botSecret;
            cleared = true;
            changed = true;
          }
          const accountCleanup = clearAccountEntryFields({
            accounts: nextSection.accounts,
            accountId,
            fields: ["botSecret"],
          });
          if (accountCleanup.changed) {
            changed = true;
            if (accountCleanup.cleared) cleared = true;
            if (accountCleanup.nextAccounts) nextSection.accounts = accountCleanup.nextAccounts;
            else delete nextSection.accounts;
          }
        }
        if (changed)
          if (nextSection && Object.keys(nextSection).length > 0)
            nextCfg.channels = {
              ...nextCfg.channels,
              "nextcloud-talk": nextSection,
            };
          else {
            const nextChannels = { ...nextCfg.channels };
            delete nextChannels["nextcloud-talk"];
            if (Object.keys(nextChannels).length > 0) nextCfg.channels = nextChannels;
            else delete nextCfg.channels;
          }
        const loggedOut =
          resolveNextcloudTalkAccount({
            cfg: changed ? nextCfg : cfg,
            accountId,
          }).secretSource === "none";
        if (changed) await getNextcloudTalkRuntime().config.writeConfigFile(nextCfg);
        return {
          cleared,
          envSecret: Boolean(process.env.NEXTCLOUD_TALK_BOT_SECRET?.trim()),
          loggedOut,
        };
      },
    },
  },
  pairing: {
    text: {
      idLabel: "nextcloudUserId",
      message: "OpenClaw: your access has been approved.",
      normalizeAllowEntry: createPairingPrefixStripper(/^(nextcloud-talk|nc-talk|nc):/i, (entry) =>
        entry.toLowerCase(),
      ),
      notify: createLoggedPairingApprovalNotifier(
        ({ id }) => `[nextcloud-talk] User ${id} approved for pairing`,
      ),
    },
  },
  security: {
    resolveDmPolicy: resolveNextcloudTalkDmPolicy,
    collectWarnings: collectNextcloudTalkSecurityWarnings,
  },
  outbound: {
    base: {
      deliveryMode: "direct",
      chunker: (text, limit) =>
        getNextcloudTalkRuntime().channel.text.chunkMarkdownText(text, limit),
      chunkerMode: "markdown",
      textChunkLimit: 4e3,
    },
    attachedResults: {
      channel: "nextcloud-talk",
      sendText: async ({ cfg, to, text, accountId, replyToId }) =>
        await sendMessageNextcloudTalk(to, text, {
          accountId: accountId ?? void 0,
          replyTo: replyToId ?? void 0,
          cfg,
        }),
      sendMedia: async ({ cfg, to, text, mediaUrl, accountId, replyToId }) =>
        await sendMessageNextcloudTalk(to, mediaUrl ? `${text}\n\nAttachment: ${mediaUrl}` : text, {
          accountId: accountId ?? void 0,
          replyTo: replyToId ?? void 0,
          cfg,
        }),
    },
  },
});
defineChannelPluginEntry({
  id: "nextcloud-talk",
  name: "Nextcloud Talk",
  description: "Nextcloud Talk channel plugin",
  plugin: nextcloudTalkPlugin,
  setRuntime: setNextcloudTalkRuntime,
});
//#endregion
//#region extensions/signal/src/runtime.ts
const { setRuntime: setSignalRuntime, getRuntime: getSignalRuntime } = createPluginRuntimeStore(
  "Signal runtime not initialized",
);
//#endregion
//#region extensions/signal/src/shared.ts
const SIGNAL_CHANNEL = "signal";
async function loadSignalChannelRuntime() {
  return await import("./channel.runtime-Da5oyM7e.js");
}
const signalSetupWizard = createSignalSetupWizardProxy(
  async () => (await loadSignalChannelRuntime()).signalSetupWizard,
);
const signalConfigAdapter = createScopedChannelConfigAdapter({
  sectionKey: SIGNAL_CHANNEL,
  listAccountIds: listSignalAccountIds,
  resolveAccount: adaptScopedAccountAccessor(resolveSignalAccount),
  defaultAccountId: resolveDefaultSignalAccountId,
  clearBaseFields: ["account", "httpUrl", "httpHost", "httpPort", "cliPath", "name"],
  resolveAllowFrom: (account) => account.config.allowFrom,
  formatAllowFrom: (allowFrom) =>
    allowFrom
      .map((entry) => String(entry).trim())
      .filter(Boolean)
      .map((entry) => (entry === "*" ? "*" : normalizeE164(entry.replace(/^signal:/i, ""))))
      .filter(Boolean),
  resolveDefaultTo: (account) => account.config.defaultTo,
});
const signalSecurityAdapter = createRestrictSendersChannelSecurity({
  channelKey: SIGNAL_CHANNEL,
  resolveDmPolicy: (account) => account.config.dmPolicy,
  resolveDmAllowFrom: (account) => account.config.allowFrom,
  resolveGroupPolicy: (account) => account.config.groupPolicy,
  surface: "Signal groups",
  openScope: "any member",
  groupPolicyPath: "channels.signal.groupPolicy",
  groupAllowFromPath: "channels.signal.groupAllowFrom",
  mentionGated: false,
  policyPathSuffix: "dmPolicy",
  normalizeDmEntry: (raw) => normalizeE164(raw.replace(/^signal:/i, "").trim()),
});
function createSignalPluginBase(params) {
  return createChannelPluginBase({
    id: SIGNAL_CHANNEL,
    meta: { ...getChatChannelMeta(SIGNAL_CHANNEL) },
    setupWizard: params.setupWizard,
    capabilities: {
      chatTypes: ["direct", "group"],
      media: true,
      reactions: true,
    },
    streaming: {
      blockStreamingCoalesceDefaults: {
        minChars: 1500,
        idleMs: 1e3,
      },
    },
    reload: { configPrefixes: ["channels.signal"] },
    configSchema: buildChannelConfigSchema(SignalConfigSchema),
    config: {
      ...signalConfigAdapter,
      isConfigured: (account) => account.configured,
      describeAccount: (account) =>
        describeAccountSnapshot({
          account,
          configured: account.configured,
          extra: { baseUrl: account.baseUrl },
        }),
    },
    security: signalSecurityAdapter,
    setup: params.setup,
  });
}
//#endregion
//#region extensions/signal/src/channel.ts
function resolveSignalSendContext(params) {
  return {
    send:
      resolveOutboundSendDep(params.deps, "signal") ??
      getSignalRuntime().channel.signal.sendMessageSignal,
    maxBytes: resolveChannelMediaMaxBytes({
      cfg: params.cfg,
      resolveChannelLimitMb: ({ cfg, accountId }) =>
        cfg.channels?.signal?.accounts?.[accountId]?.mediaMaxMb ?? cfg.channels?.signal?.mediaMaxMb,
      accountId: params.accountId,
    }),
  };
}
async function sendSignalOutbound(params) {
  const { send, maxBytes } = resolveSignalSendContext(params);
  return await send(params.to, params.text, {
    cfg: params.cfg,
    ...(params.mediaUrl ? { mediaUrl: params.mediaUrl } : {}),
    ...(params.mediaLocalRoots?.length ? { mediaLocalRoots: params.mediaLocalRoots } : {}),
    maxBytes,
    accountId: params.accountId ?? void 0,
  });
}
function inferSignalTargetChatType(rawTo) {
  let to = rawTo.trim();
  if (!to) return;
  if (/^signal:/i.test(to)) to = to.replace(/^signal:/i, "").trim();
  if (!to) return;
  const lower = to.toLowerCase();
  if (lower.startsWith("group:")) return "group";
  if (lower.startsWith("username:") || lower.startsWith("u:")) return "direct";
  return "direct";
}
function parseSignalExplicitTarget(raw) {
  const normalized = normalizeSignalMessagingTarget(raw);
  if (!normalized) return null;
  return {
    to: normalized,
    chatType: inferSignalTargetChatType(normalized),
  };
}
function buildSignalBaseSessionKey(params) {
  return buildOutboundBaseSessionKey({
    ...params,
    channel: "signal",
  });
}
function resolveSignalOutboundSessionRoute(params) {
  const stripped = params.target.replace(/^signal:/i, "").trim();
  const lowered = stripped.toLowerCase();
  if (lowered.startsWith("group:")) {
    const groupId = stripped.slice(6).trim();
    if (!groupId) return null;
    const peer = {
      kind: "group",
      id: groupId,
    };
    const baseSessionKey = buildSignalBaseSessionKey({
      cfg: params.cfg,
      agentId: params.agentId,
      accountId: params.accountId,
      peer,
    });
    return {
      sessionKey: baseSessionKey,
      baseSessionKey,
      peer,
      chatType: "group",
      from: `group:${groupId}`,
      to: `group:${groupId}`,
    };
  }
  let recipient = stripped.trim();
  if (lowered.startsWith("username:")) recipient = stripped.slice(9).trim();
  else if (lowered.startsWith("u:")) recipient = stripped.slice(2).trim();
  if (!recipient) return null;
  const uuidCandidate = recipient.toLowerCase().startsWith("uuid:")
    ? recipient.slice(5)
    : recipient;
  const sender = resolveSignalSender({
    sourceUuid: looksLikeUuid(uuidCandidate) ? uuidCandidate : null,
    sourceNumber: looksLikeUuid(uuidCandidate) ? null : recipient,
  });
  const peerId = sender ? resolveSignalPeerId(sender) : recipient;
  const displayRecipient = sender ? resolveSignalRecipient(sender) : recipient;
  const peer = {
    kind: "direct",
    id: peerId,
  };
  const baseSessionKey = buildSignalBaseSessionKey({
    cfg: params.cfg,
    agentId: params.agentId,
    accountId: params.accountId,
    peer,
  });
  return {
    sessionKey: baseSessionKey,
    baseSessionKey,
    peer,
    chatType: "direct",
    from: `signal:${displayRecipient}`,
    to: `signal:${displayRecipient}`,
  };
}
async function sendFormattedSignalText(ctx) {
  const { send, maxBytes } = resolveSignalSendContext({
    cfg: ctx.cfg,
    accountId: ctx.accountId ?? void 0,
    deps: ctx.deps,
  });
  const limit = resolveTextChunkLimit(ctx.cfg, "signal", ctx.accountId ?? void 0, {
    fallbackLimit: 4e3,
  });
  const tableMode = resolveMarkdownTableMode({
    cfg: ctx.cfg,
    channel: "signal",
    accountId: ctx.accountId ?? void 0,
  });
  let chunks =
    limit === void 0
      ? markdownToSignalTextChunks(ctx.text, Number.POSITIVE_INFINITY, { tableMode })
      : markdownToSignalTextChunks(ctx.text, limit, { tableMode });
  if (chunks.length === 0 && ctx.text)
    chunks = [
      {
        text: ctx.text,
        styles: [],
      },
    ];
  const results = [];
  for (const chunk of chunks) {
    ctx.abortSignal?.throwIfAborted();
    const result = await send(ctx.to, chunk.text, {
      cfg: ctx.cfg,
      maxBytes,
      accountId: ctx.accountId ?? void 0,
      textMode: "plain",
      textStyles: chunk.styles,
    });
    results.push(result);
  }
  return attachChannelToResults("signal", results);
}
async function sendFormattedSignalMedia(ctx) {
  ctx.abortSignal?.throwIfAborted();
  const { send, maxBytes } = resolveSignalSendContext({
    cfg: ctx.cfg,
    accountId: ctx.accountId ?? void 0,
    deps: ctx.deps,
  });
  const tableMode = resolveMarkdownTableMode({
    cfg: ctx.cfg,
    channel: "signal",
    accountId: ctx.accountId ?? void 0,
  });
  const formatted = markdownToSignalTextChunks(ctx.text, Number.POSITIVE_INFINITY, {
    tableMode,
  })[0] ?? {
    text: ctx.text,
    styles: [],
  };
  return attachChannelToResult(
    "signal",
    await send(ctx.to, formatted.text, {
      cfg: ctx.cfg,
      mediaUrl: ctx.mediaUrl,
      mediaLocalRoots: ctx.mediaLocalRoots,
      maxBytes,
      accountId: ctx.accountId ?? void 0,
      textMode: "plain",
      textStyles: formatted.styles,
    }),
  );
}
const signalPlugin = createChatChannelPlugin({
  base: {
    ...createSignalPluginBase({
      setupWizard: signalSetupWizard,
      setup: signalSetupAdapter,
    }),
    actions: signalMessageActions,
    allowlist: buildDmGroupAccountAllowlistAdapter({
      channelId: "signal",
      resolveAccount: resolveSignalAccount,
      normalize: ({ cfg, accountId, values }) =>
        signalConfigAdapter.formatAllowFrom({
          cfg,
          accountId,
          allowFrom: values,
        }),
      resolveDmAllowFrom: (account) => account.config.allowFrom,
      resolveGroupAllowFrom: (account) => account.config.groupAllowFrom,
      resolveDmPolicy: (account) => account.config.dmPolicy,
      resolveGroupPolicy: (account) => account.config.groupPolicy,
    }),
    messaging: {
      normalizeTarget: normalizeSignalMessagingTarget,
      parseExplicitTarget: ({ raw }) => parseSignalExplicitTarget(raw),
      inferTargetChatType: ({ to }) => inferSignalTargetChatType(to),
      resolveOutboundSessionRoute: (params) => resolveSignalOutboundSessionRoute(params),
      targetResolver: {
        looksLikeId: looksLikeSignalTargetId,
        hint: "<E.164|uuid:ID|group:ID|signal:group:ID|signal:+E.164>",
      },
    },
    status: createComputedAccountStatusAdapter({
      defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID),
      collectStatusIssues: (accounts) => collectStatusIssuesFromLastError("signal", accounts),
      buildChannelSummary: ({ snapshot }) =>
        buildBaseChannelStatusSummary(snapshot, {
          baseUrl: snapshot.baseUrl ?? null,
          probe: snapshot.probe,
          lastProbeAt: snapshot.lastProbeAt ?? null,
        }),
      probeAccount: async ({ account, timeoutMs }) => {
        const baseUrl = account.baseUrl;
        return await getSignalRuntime().channel.signal.probeSignal(baseUrl, timeoutMs);
      },
      formatCapabilitiesProbe: ({ probe }) =>
        probe?.version ? [{ text: `Signal daemon: ${probe.version}` }] : [],
      resolveAccountSnapshot: ({ account }) => ({
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured: account.configured,
        extra: { baseUrl: account.baseUrl },
      }),
    }),
    gateway: {
      startAccount: async (ctx) => {
        const account = ctx.account;
        ctx.setStatus({
          accountId: account.accountId,
          baseUrl: account.baseUrl,
        });
        ctx.log?.info(`[${account.accountId}] starting provider (${account.baseUrl})`);
        return getSignalRuntime().channel.signal.monitorSignalProvider({
          accountId: account.accountId,
          config: ctx.cfg,
          runtime: ctx.runtime,
          abortSignal: ctx.abortSignal,
          mediaMaxMb: account.config.mediaMaxMb,
        });
      },
    },
  },
  pairing: {
    text: {
      idLabel: "signalNumber",
      message: PAIRING_APPROVED_MESSAGE,
      normalizeAllowEntry: createPairingPrefixStripper(/^signal:/i),
      notify: async ({ id, message }) => {
        await getSignalRuntime().channel.signal.sendMessageSignal(id, message);
      },
    },
  },
  security: signalSecurityAdapter,
  outbound: {
    base: {
      deliveryMode: "direct",
      chunker: (text, limit) => getSignalRuntime().channel.text.chunkText(text, limit),
      chunkerMode: "text",
      textChunkLimit: 4e3,
      sendFormattedText: async ({ cfg, to, text, accountId, deps, abortSignal }) =>
        await sendFormattedSignalText({
          cfg,
          to,
          text,
          accountId,
          deps,
          abortSignal,
        }),
      sendFormattedMedia: async ({
        cfg,
        to,
        text,
        mediaUrl,
        mediaLocalRoots,
        accountId,
        deps,
        abortSignal,
      }) =>
        await sendFormattedSignalMedia({
          cfg,
          to,
          text,
          mediaUrl,
          mediaLocalRoots,
          accountId,
          deps,
          abortSignal,
        }),
    },
    attachedResults: {
      channel: "signal",
      sendText: async ({ cfg, to, text, accountId, deps }) =>
        await sendSignalOutbound({
          cfg,
          to,
          text,
          accountId: accountId ?? void 0,
          deps,
        }),
      sendMedia: async ({ cfg, to, text, mediaUrl, mediaLocalRoots, accountId, deps }) =>
        await sendSignalOutbound({
          cfg,
          to,
          text,
          mediaUrl,
          mediaLocalRoots,
          accountId: accountId ?? void 0,
          deps,
        }),
    },
  },
});
defineChannelPluginEntry({
  id: "signal",
  name: "Signal",
  description: "Signal channel plugin",
  plugin: signalPlugin,
  setRuntime: setSignalRuntime,
});
//#endregion
//#region extensions/signal/src/channel.setup.ts
const signalSetupPlugin = {
  ...createSignalPluginBase({
    setupWizard: signalSetupWizard,
    setup: signalSetupAdapter,
  }),
};
defineSetupPluginEntry(signalSetupPlugin);
//#endregion
//#region extensions/slack/src/message-action-dispatch.ts
function readSlackBlocksParam(actionParams) {
  return parseSlackBlocksInput(actionParams.blocks);
}
/** Translate generic channel action requests into Slack-specific tool invocations and payload shapes. */
async function handleSlackMessageAction(params) {
  const { providerId, ctx, invoke, normalizeChannelId, includeReadThreadId = false } = params;
  const { action, cfg, params: actionParams } = ctx;
  const accountId = ctx.accountId ?? void 0;
  const resolveChannelId = () => {
    const channelId =
      readStringParam(actionParams, "channelId") ??
      readStringParam(actionParams, "to", { required: true });
    return normalizeChannelId ? normalizeChannelId(channelId) : channelId;
  };
  if (action === "send") {
    const to = readStringParam(actionParams, "to", { required: true });
    const content = readStringParam(actionParams, "message", {
      required: false,
      allowEmpty: true,
    });
    const mediaUrl = readStringParam(actionParams, "media", { trim: false });
    const interactive = normalizeInteractiveReply(actionParams.interactive);
    const interactiveBlocks = interactive ? buildSlackInteractiveBlocks(interactive) : void 0;
    const blocks = readSlackBlocksParam(actionParams) ?? interactiveBlocks;
    if (!content && !mediaUrl && !blocks)
      throw new Error("Slack send requires message, blocks, or media.");
    if (mediaUrl && blocks) throw new Error("Slack send does not support blocks with media.");
    const threadId = readStringParam(actionParams, "threadId");
    const replyTo = readStringParam(actionParams, "replyTo");
    return await invoke(
      {
        action: "sendMessage",
        to,
        content: content ?? "",
        mediaUrl: mediaUrl ?? void 0,
        accountId,
        threadTs: threadId ?? replyTo ?? void 0,
        ...(blocks ? { blocks } : {}),
      },
      cfg,
      ctx.toolContext,
    );
  }
  if (action === "react") {
    const messageId = readStringParam(actionParams, "messageId", { required: true });
    const emoji = readStringParam(actionParams, "emoji", { allowEmpty: true });
    const remove = typeof actionParams.remove === "boolean" ? actionParams.remove : void 0;
    return await invoke(
      {
        action: "react",
        channelId: resolveChannelId(),
        messageId,
        emoji,
        remove,
        accountId,
      },
      cfg,
    );
  }
  if (action === "reactions") {
    const messageId = readStringParam(actionParams, "messageId", { required: true });
    const limit = readNumberParam(actionParams, "limit", { integer: true });
    return await invoke(
      {
        action: "reactions",
        channelId: resolveChannelId(),
        messageId,
        limit,
        accountId,
      },
      cfg,
    );
  }
  if (action === "read") {
    const limit = readNumberParam(actionParams, "limit", { integer: true });
    const readAction = {
      action: "readMessages",
      channelId: resolveChannelId(),
      limit,
      before: readStringParam(actionParams, "before"),
      after: readStringParam(actionParams, "after"),
      accountId,
    };
    if (includeReadThreadId) readAction.threadId = readStringParam(actionParams, "threadId");
    return await invoke(readAction, cfg);
  }
  if (action === "edit") {
    const messageId = readStringParam(actionParams, "messageId", { required: true });
    const content = readStringParam(actionParams, "message", { allowEmpty: true });
    const blocks = readSlackBlocksParam(actionParams);
    if (!content && !blocks) throw new Error("Slack edit requires message or blocks.");
    return await invoke(
      {
        action: "editMessage",
        channelId: resolveChannelId(),
        messageId,
        content: content ?? "",
        blocks,
        accountId,
      },
      cfg,
    );
  }
  if (action === "delete") {
    const messageId = readStringParam(actionParams, "messageId", { required: true });
    return await invoke(
      {
        action: "deleteMessage",
        channelId: resolveChannelId(),
        messageId,
        accountId,
      },
      cfg,
    );
  }
  if (action === "pin" || action === "unpin" || action === "list-pins") {
    const messageId =
      action === "list-pins"
        ? void 0
        : readStringParam(actionParams, "messageId", { required: true });
    return await invoke(
      {
        action: action === "pin" ? "pinMessage" : action === "unpin" ? "unpinMessage" : "listPins",
        channelId: resolveChannelId(),
        messageId,
        accountId,
      },
      cfg,
    );
  }
  if (action === "member-info")
    return await invoke(
      {
        action: "memberInfo",
        userId: readStringParam(actionParams, "userId", { required: true }),
        accountId,
      },
      cfg,
    );
  if (action === "emoji-list")
    return await invoke(
      {
        action: "emojiList",
        limit: readNumberParam(actionParams, "limit", { integer: true }),
        accountId,
      },
      cfg,
    );
  if (action === "download-file") {
    const fileId = readStringParam(actionParams, "fileId", { required: true });
    const channelId =
      readStringParam(actionParams, "channelId") ?? readStringParam(actionParams, "to");
    const threadId =
      readStringParam(actionParams, "threadId") ?? readStringParam(actionParams, "replyTo");
    return await invoke(
      {
        action: "downloadFile",
        fileId,
        channelId: channelId ?? void 0,
        threadId: threadId ?? void 0,
        accountId,
      },
      cfg,
    );
  }
  throw new Error(`Action ${action} is not supported for provider ${providerId}.`);
}
//#endregion
//#region extensions/slack/src/message-tool-schema.ts
function createSlackMessageToolBlocksSchema() {
  return Type.Array(
    Type.Object(
      {},
      {
        additionalProperties: true,
        description: "Slack Block Kit payload blocks (Slack only).",
      },
    ),
  );
}
//#endregion
//#region extensions/slack/src/channel-actions.ts
function createSlackActions(providerId, options) {
  function describeMessageTool({ cfg }) {
    const actions = listSlackMessageActions(cfg);
    const capabilities = /* @__PURE__ */ new Set();
    if (actions.includes("send")) capabilities.add("blocks");
    if (isSlackInteractiveRepliesEnabled({ cfg })) capabilities.add("interactive");
    return {
      actions,
      capabilities: Array.from(capabilities),
      schema: actions.includes("send")
        ? { properties: { blocks: Type.Optional(createSlackMessageToolBlocksSchema()) } }
        : null,
    };
  }
  return {
    describeMessageTool,
    extractToolSend: ({ args }) => extractSlackToolSend(args),
    handleAction: async (ctx) => {
      return await handleSlackMessageAction({
        providerId,
        ctx,
        normalizeChannelId: resolveSlackChannelId,
        includeReadThreadId: true,
        invoke: async (action, cfg, toolContext) =>
          await (options?.invoke
            ? options.invoke(action, cfg, toolContext)
            : handleSlackAction(action, cfg, {
                ...toolContext,
                mediaLocalRoots: ctx.mediaLocalRoots,
              })),
      });
    },
  };
}
//#endregion
//#region extensions/slack/src/runtime.ts
const { setRuntime: setSlackRuntime, getRuntime: getSlackRuntime } = createPluginRuntimeStore(
  "Slack runtime not initialized",
);
//#endregion
//#region extensions/slack/src/scopes.ts
function collectScopes(value, into) {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const entry of value)
      if (typeof entry === "string" && entry.trim()) into.push(entry.trim());
    return;
  }
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return;
    const parts = raw.split(/[,\s]+/).map((part) => part.trim());
    for (const part of parts) if (part) into.push(part);
    return;
  }
  if (!isRecord(value)) return;
  for (const entry of Object.values(value))
    if (Array.isArray(entry) || typeof entry === "string") collectScopes(entry, into);
}
function normalizeScopes(scopes) {
  return Array.from(new Set(scopes.map((scope) => scope.trim()).filter(Boolean))).toSorted();
}
function extractScopes(payload) {
  if (!isRecord(payload)) return [];
  const scopes = [];
  collectScopes(payload.scopes, scopes);
  collectScopes(payload.scope, scopes);
  if (isRecord(payload.info)) {
    collectScopes(payload.info.scopes, scopes);
    collectScopes(payload.info.scope, scopes);
    collectScopes(payload.info.user_scopes, scopes);
    collectScopes(payload.info.bot_scopes, scopes);
  }
  return normalizeScopes(scopes);
}
function readError(payload) {
  if (!isRecord(payload)) return;
  const error = payload.error;
  return typeof error === "string" && error.trim() ? error.trim() : void 0;
}
async function callSlack(client, method) {
  try {
    const result = await client.apiCall(method);
    return isRecord(result) ? result : null;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
async function fetchSlackScopes(token, timeoutMs) {
  const client = createSlackWebClient(token, { timeout: timeoutMs });
  const attempts = ["auth.scopes", "apps.permissions.info"];
  const errors = [];
  for (const method of attempts) {
    const result = await callSlack(client, method);
    const scopes = extractScopes(result);
    if (scopes.length > 0)
      return {
        ok: true,
        scopes,
        source: method,
      };
    const error = readError(result);
    if (error) errors.push(`${method}: ${error}`);
  }
  return {
    ok: false,
    error: errors.length > 0 ? errors.join(" | ") : "no scopes returned",
  };
}
//#endregion
//#region extensions/slack/src/shared.ts
const SLACK_CHANNEL = "slack";
function buildSlackManifest(botName) {
  const safeName = botName.trim() || "OpenClaw";
  const manifest = {
    display_information: {
      name: safeName,
      description: `${safeName} connector for OpenClaw`,
    },
    features: {
      bot_user: {
        display_name: safeName,
        always_online: false,
      },
      app_home: {
        messages_tab_enabled: true,
        messages_tab_read_only_enabled: false,
      },
      slash_commands: [
        {
          command: "/openclaw",
          description: "Send a message to OpenClaw",
          should_escape: false,
        },
      ],
    },
    oauth_config: {
      scopes: {
        bot: [
          "chat:write",
          "channels:history",
          "channels:read",
          "groups:history",
          "im:history",
          "mpim:history",
          "users:read",
          "app_mentions:read",
          "reactions:read",
          "reactions:write",
          "pins:read",
          "pins:write",
          "emoji:read",
          "commands",
          "files:read",
          "files:write",
        ],
      },
    },
    settings: {
      socket_mode_enabled: true,
      event_subscriptions: {
        bot_events: [
          "app_mention",
          "message.channels",
          "message.groups",
          "message.im",
          "message.mpim",
          "reaction_added",
          "reaction_removed",
          "member_joined_channel",
          "member_left_channel",
          "channel_rename",
          "pin_added",
          "pin_removed",
        ],
      },
    },
  };
  return JSON.stringify(manifest, null, 2);
}
function buildSlackSetupLines(botName = "OpenClaw") {
  return [
    "1) Slack API -> Create App -> From scratch or From manifest (with the JSON below)",
    "2) Add Socket Mode + enable it to get the app-level token (xapp-...)",
    "3) Install App to workspace to get the xoxb- bot token",
    "4) Enable Event Subscriptions (socket) for message events",
    "5) App Home -> enable the Messages tab for DMs",
    "Tip: set SLACK_BOT_TOKEN + SLACK_APP_TOKEN in your env.",
    `Docs: ${formatDocsLink("/slack", "slack")}`,
    "",
    "Manifest (JSON):",
    buildSlackManifest(botName),
  ];
}
function setSlackChannelAllowlist(cfg, accountId, channelKeys) {
  return patchChannelConfigForAccount({
    cfg,
    channel: SLACK_CHANNEL,
    accountId,
    patch: { channels: Object.fromEntries(channelKeys.map((key) => [key, { allow: true }])) },
  });
}
function isSlackPluginAccountConfigured(account) {
  const mode = account.config.mode ?? "socket";
  if (!Boolean(account.botToken?.trim())) return false;
  if (mode === "http") return Boolean(account.config.signingSecret?.trim());
  return Boolean(account.appToken?.trim());
}
function isSlackSetupAccountConfigured(account) {
  const hasConfiguredBotToken =
    Boolean(account.botToken?.trim()) || hasConfiguredSecretInput(account.config.botToken);
  const hasConfiguredAppToken =
    Boolean(account.appToken?.trim()) || hasConfiguredSecretInput(account.config.appToken);
  return hasConfiguredBotToken && hasConfiguredAppToken;
}
const slackConfigAdapter = createScopedChannelConfigAdapter({
  sectionKey: SLACK_CHANNEL,
  listAccountIds: listSlackAccountIds,
  resolveAccount: adaptScopedAccountAccessor(resolveSlackAccount),
  inspectAccount: adaptScopedAccountAccessor(inspectSlackAccount),
  defaultAccountId: resolveDefaultSlackAccountId,
  clearBaseFields: ["botToken", "appToken", "name"],
  resolveAllowFrom: (account) => account.dm?.allowFrom,
  formatAllowFrom: (allowFrom) => formatAllowFromLowercase({ allowFrom }),
  resolveDefaultTo: (account) => account.config.defaultTo,
});
function createSlackPluginBase(params) {
  return createChannelPluginBase({
    id: SLACK_CHANNEL,
    meta: {
      ...getChatChannelMeta(SLACK_CHANNEL),
      preferSessionLookupForAnnounceTarget: true,
    },
    setupWizard: params.setupWizard,
    capabilities: {
      chatTypes: ["direct", "channel", "thread"],
      reactions: true,
      threads: true,
      media: true,
      nativeCommands: true,
    },
    agentPrompt: {
      messageToolHints: ({ cfg, accountId }) =>
        isSlackInteractiveRepliesEnabled({
          cfg,
          accountId,
        })
          ? [
              "- Slack interactive replies: use `[[slack_buttons: Label:value, Other:other]]` to add action buttons that route clicks back as Slack interaction system events.",
              "- Slack selects: use `[[slack_select: Placeholder | Label:value, Other:other]]` to add a static select menu that routes the chosen value back as a Slack interaction system event.",
            ]
          : [
              "- Slack interactive replies are disabled. If needed, ask to set `channels.slack.capabilities.interactiveReplies=true` (or the same under `channels.slack.accounts.<account>.capabilities`).",
            ],
    },
    streaming: {
      blockStreamingCoalesceDefaults: {
        minChars: 1500,
        idleMs: 1e3,
      },
    },
    reload: { configPrefixes: ["channels.slack"] },
    configSchema: buildChannelConfigSchema(SlackConfigSchema),
    config: {
      ...slackConfigAdapter,
      isConfigured: (account) => isSlackPluginAccountConfigured(account),
      describeAccount: (account) =>
        describeAccountSnapshot({
          account,
          configured: isSlackPluginAccountConfigured(account),
          extra: {
            botTokenSource: account.botTokenSource,
            appTokenSource: account.appTokenSource,
          },
        }),
    },
    setup: params.setup,
  });
}
//#endregion
//#region extensions/slack/src/setup-core.ts
function enableSlackAccount(cfg, accountId) {
  return patchChannelConfigForAccount({
    cfg,
    channel: SLACK_CHANNEL,
    accountId,
    patch: { enabled: true },
  });
}
function createSlackTokenCredential(params) {
  return {
    inputKey: params.inputKey,
    providerHint: params.providerHint,
    credentialLabel: params.credentialLabel,
    preferredEnvVar: params.preferredEnvVar,
    envPrompt: `${params.preferredEnvVar} detected. Use env var?`,
    keepPrompt: params.keepPrompt,
    inputPrompt: params.inputPrompt,
    allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
    inspect: ({ cfg, accountId }) => {
      const resolved = resolveSlackAccount({
        cfg,
        accountId,
      });
      const configuredValue =
        params.inputKey === "botToken" ? resolved.config.botToken : resolved.config.appToken;
      const resolvedValue = params.inputKey === "botToken" ? resolved.botToken : resolved.appToken;
      return {
        accountConfigured: Boolean(resolvedValue) || hasConfiguredSecretInput(configuredValue),
        hasConfiguredValue: hasConfiguredSecretInput(configuredValue),
        resolvedValue: resolvedValue?.trim() || void 0,
        envValue: accountId === "default" ? process.env[params.preferredEnvVar]?.trim() : void 0,
      };
    },
    applyUseEnv: ({ cfg, accountId }) => enableSlackAccount(cfg, accountId),
    applySet: ({ cfg, accountId, value }) =>
      patchChannelConfigForAccount({
        cfg,
        channel: SLACK_CHANNEL,
        accountId,
        patch: {
          enabled: true,
          [params.inputKey]: value,
        },
      }),
  };
}
const slackSetupAdapter = createEnvPatchedAccountSetupAdapter({
  channelKey: SLACK_CHANNEL,
  defaultAccountOnlyEnvError: "Slack env tokens can only be used for the default account.",
  missingCredentialError: "Slack requires --bot-token and --app-token (or --use-env).",
  hasCredentials: (input) => Boolean(input.botToken && input.appToken),
  buildPatch: (input) => ({
    ...(input.botToken ? { botToken: input.botToken } : {}),
    ...(input.appToken ? { appToken: input.appToken } : {}),
  }),
});
function createSlackSetupWizardBase(handlers) {
  const slackDmPolicy = createLegacyCompatChannelDmPolicy({
    label: "Slack",
    channel: SLACK_CHANNEL,
    promptAllowFrom: handlers.promptAllowFrom,
  });
  return {
    channel: SLACK_CHANNEL,
    status: createStandardChannelSetupStatus({
      channelLabel: "Slack",
      configuredLabel: "configured",
      unconfiguredLabel: "needs tokens",
      configuredHint: "configured",
      unconfiguredHint: "needs tokens",
      configuredScore: 2,
      unconfiguredScore: 1,
      resolveConfigured: ({ cfg }) =>
        listSlackAccountIds(cfg).some((accountId) => {
          return inspectSlackAccount({
            cfg,
            accountId,
          }).configured;
        }),
    }),
    introNote: {
      title: "Slack socket mode tokens",
      lines: buildSlackSetupLines(),
      shouldShow: ({ cfg, accountId }) =>
        !isSlackSetupAccountConfigured(
          resolveSlackAccount({
            cfg,
            accountId,
          }),
        ),
    },
    envShortcut: {
      prompt: "SLACK_BOT_TOKEN + SLACK_APP_TOKEN detected. Use env vars?",
      preferredEnvVar: "SLACK_BOT_TOKEN",
      isAvailable: ({ cfg, accountId }) =>
        accountId === "default" &&
        Boolean(process.env.SLACK_BOT_TOKEN?.trim()) &&
        Boolean(process.env.SLACK_APP_TOKEN?.trim()) &&
        !isSlackSetupAccountConfigured(
          resolveSlackAccount({
            cfg,
            accountId,
          }),
        ),
      apply: ({ cfg, accountId }) => enableSlackAccount(cfg, accountId),
    },
    credentials: [
      createSlackTokenCredential({
        inputKey: "botToken",
        providerHint: "slack-bot",
        credentialLabel: "Slack bot token",
        preferredEnvVar: "SLACK_BOT_TOKEN",
        keepPrompt: "Slack bot token already configured. Keep it?",
        inputPrompt: "Enter Slack bot token (xoxb-...)",
      }),
      createSlackTokenCredential({
        inputKey: "appToken",
        providerHint: "slack-app",
        credentialLabel: "Slack app token",
        preferredEnvVar: "SLACK_APP_TOKEN",
        keepPrompt: "Slack app token already configured. Keep it?",
        inputPrompt: "Enter Slack app token (xapp-...)",
      }),
    ],
    dmPolicy: slackDmPolicy,
    allowFrom: createAccountScopedAllowFromSection({
      channel: SLACK_CHANNEL,
      credentialInputKey: "botToken",
      helpTitle: "Slack allowlist",
      helpLines: [
        "Allowlist Slack DMs by username (we resolve to user ids).",
        "Examples:",
        "- U12345678",
        "- @alice",
        "Multiple entries: comma-separated.",
        `Docs: ${formatDocsLink("/slack", "slack")}`,
      ],
      message: "Slack allowFrom (usernames or ids)",
      placeholder: "@alice, U12345678",
      invalidWithoutCredentialNote: "Slack token missing; use user ids (or mention form) only.",
      parseId: (value) =>
        parseMentionOrPrefixedId({
          value,
          mentionPattern: /^<@([A-Z0-9]+)>$/i,
          prefixPattern: /^(slack:|user:)/i,
          idPattern: /^[A-Z][A-Z0-9]+$/i,
          normalizeId: (id) => id.toUpperCase(),
        }),
      resolveEntries: handlers.resolveAllowFromEntries,
    }),
    groupAccess: createAccountScopedGroupAccessSection({
      channel: SLACK_CHANNEL,
      label: "Slack channels",
      placeholder: "#general, #private, C123",
      currentPolicy: ({ cfg, accountId }) =>
        resolveSlackAccount({
          cfg,
          accountId,
        }).config.groupPolicy ?? "allowlist",
      currentEntries: ({ cfg, accountId }) =>
        Object.entries(
          resolveSlackAccount({
            cfg,
            accountId,
          }).config.channels ?? {},
        )
          .filter(([, value]) => value?.allow !== false && value?.enabled !== false)
          .map(([key]) => key),
      updatePrompt: ({ cfg, accountId }) =>
        Boolean(
          resolveSlackAccount({
            cfg,
            accountId,
          }).config.channels,
        ),
      resolveAllowlist: handlers.resolveGroupAllowlist,
      fallbackResolved: (entries) => entries,
      applyAllowlist: ({ cfg, accountId, resolved }) =>
        setSlackChannelAllowlist(cfg, accountId, resolved),
    }),
    disable: (cfg) => setSetupChannelEnabled(cfg, SLACK_CHANNEL, false),
  };
}
//#endregion
//#region extensions/slack/src/setup-surface.ts
async function resolveSlackAllowFromEntries(params) {
  return await resolveEntriesWithOptionalToken({
    token: params.token,
    entries: params.entries,
    buildWithoutToken: (input) => ({
      input,
      resolved: false,
      id: null,
    }),
    resolveEntries: async ({ token, entries }) =>
      (
        await resolveSlackUserAllowlist({
          token,
          entries,
        })
      ).map((entry) => ({
        input: entry.input,
        resolved: entry.resolved,
        id: entry.id ?? null,
      })),
  });
}
async function promptSlackAllowFrom(params) {
  const parseId = (value) =>
    parseMentionOrPrefixedId({
      value,
      mentionPattern: /^<@([A-Z0-9]+)>$/i,
      prefixPattern: /^(slack:|user:)/i,
      idPattern: /^[A-Z][A-Z0-9]+$/i,
      normalizeId: (id) => id.toUpperCase(),
    });
  return await promptLegacyChannelAllowFromForAccount({
    cfg: params.cfg,
    channel: SLACK_CHANNEL,
    prompter: params.prompter,
    accountId: params.accountId,
    defaultAccountId: resolveDefaultSlackAccountId(params.cfg),
    resolveAccount: adaptScopedAccountAccessor(resolveSlackAccount),
    resolveExisting: (_account, cfg) =>
      cfg.channels?.slack?.allowFrom ?? cfg.channels?.slack?.dm?.allowFrom ?? [],
    resolveToken: (account) => account.userToken ?? account.botToken ?? "",
    noteTitle: "Slack allowlist",
    noteLines: [
      "Allowlist Slack DMs by username (we resolve to user ids).",
      "Examples:",
      "- U12345678",
      "- @alice",
      "Multiple entries: comma-separated.",
      `Docs: ${formatDocsLink("/slack", "slack")}`,
    ],
    message: "Slack allowFrom (usernames or ids)",
    placeholder: "@alice, U12345678",
    parseId,
    invalidWithoutTokenNote: "Slack token missing; use user ids (or mention form) only.",
    resolveEntries: async ({ token, entries }) =>
      (
        await resolveSlackUserAllowlist({
          token,
          entries,
        })
      ).map((entry) => ({
        input: entry.input,
        resolved: entry.resolved,
        id: entry.id ?? null,
      })),
  });
}
async function resolveSlackGroupAllowlist(params) {
  let keys = params.entries;
  const activeBotToken =
    resolveSlackAccount({
      cfg: params.cfg,
      accountId: params.accountId,
    }).botToken ||
    params.credentialValues.botToken ||
    "";
  if (params.entries.length > 0)
    try {
      const resolved = await resolveEntriesWithOptionalToken({
        token: activeBotToken,
        entries: params.entries,
        buildWithoutToken: (input) => ({
          input,
          resolved: false,
          id: void 0,
        }),
        resolveEntries: async ({ token, entries }) =>
          await resolveSlackChannelAllowlist({
            token,
            entries,
          }),
      });
      const resolvedKeys = resolved
        .filter((entry) => entry.resolved && entry.id)
        .map((entry) => entry.id);
      const unresolved = resolved.filter((entry) => !entry.resolved).map((entry) => entry.input);
      keys = [...resolvedKeys, ...unresolved.map((entry) => entry.trim()).filter(Boolean)];
      await noteChannelLookupSummary({
        prompter: params.prompter,
        label: "Slack channels",
        resolvedSections: [
          {
            title: "Resolved",
            values: resolvedKeys,
          },
        ],
        unresolved,
      });
    } catch (error) {
      await noteChannelLookupFailure({
        prompter: params.prompter,
        label: "Slack channels",
        error,
      });
    }
  return keys;
}
const slackSetupWizard = createSlackSetupWizardBase({
  promptAllowFrom: promptSlackAllowFrom,
  resolveAllowFromEntries: async ({ credentialValues, entries }) =>
    await resolveSlackAllowFromEntries({
      token: credentialValues.botToken,
      entries,
    }),
  resolveGroupAllowlist: async ({ cfg, accountId, credentialValues, entries, prompter }) =>
    await resolveSlackGroupAllowlist({
      cfg,
      accountId,
      credentialValues,
      entries,
      prompter,
    }),
});
//#endregion
//#region extensions/slack/src/channel.ts
const SLACK_CHANNEL_TYPE_CACHE = /* @__PURE__ */ new Map();
const resolveSlackDmPolicy = createScopedDmSecurityResolver({
  channelKey: "slack",
  resolvePolicy: (account) => account.dm?.policy,
  resolveAllowFrom: (account) => account.dm?.allowFrom,
  allowFromPathSuffix: "dm.",
  normalizeEntry: (raw) =>
    raw
      .trim()
      .replace(/^(slack|user):/i, "")
      .trim(),
});
function getTokenForOperation(account, operation) {
  const userToken = account.config.userToken?.trim() || void 0;
  const botToken = account.botToken?.trim();
  const allowUserWrites = account.config.userTokenReadOnly === false;
  if (operation === "read") return userToken ?? botToken;
  if (!allowUserWrites) return botToken;
  return botToken ?? userToken;
}
function resolveSlackSendContext(params) {
  const send =
    resolveOutboundSendDep(params.deps, "slack") ??
    getSlackRuntime().channel.slack.sendMessageSlack;
  const account = resolveSlackAccount({
    cfg: params.cfg,
    accountId: params.accountId,
  });
  const token = getTokenForOperation(account, "write");
  const botToken = account.botToken?.trim();
  const tokenOverride = token && token !== botToken ? token : void 0;
  return {
    send,
    threadTsValue: params.replyToId ?? params.threadId,
    tokenOverride,
  };
}
function resolveSlackAutoThreadId(params) {
  const context = params.toolContext;
  if (!context?.currentThreadTs || !context.currentChannelId) return;
  if (context.replyToMode !== "all" && context.replyToMode !== "first") return;
  const parsedTarget = parseSlackTarget(params.to, { defaultKind: "channel" });
  if (!parsedTarget || parsedTarget.kind !== "channel") return;
  if (parsedTarget.id.toLowerCase() !== context.currentChannelId.toLowerCase()) return;
  if (context.replyToMode === "first" && context.hasRepliedRef?.value) return;
  return context.currentThreadTs;
}
function parseSlackExplicitTarget(raw) {
  const target = parseSlackTarget(raw, { defaultKind: "channel" });
  if (!target) return null;
  return {
    to: target.id,
    chatType: target.kind === "user" ? "direct" : "channel",
  };
}
function buildSlackBaseSessionKey(params) {
  return buildOutboundBaseSessionKey({
    ...params,
    channel: "slack",
  });
}
async function resolveSlackChannelType(params) {
  const channelId = params.channelId.trim();
  if (!channelId) return "unknown";
  const cacheKey = `${params.accountId ?? "default"}:${channelId}`;
  const cached = SLACK_CHANNEL_TYPE_CACHE.get(cacheKey);
  if (cached) return cached;
  const account = resolveSlackAccount({
    cfg: params.cfg,
    accountId: params.accountId,
  });
  const groupChannels = normalizeAllowListLower(account.dm?.groupChannels);
  const channelIdLower = channelId.toLowerCase();
  if (
    groupChannels.includes(channelIdLower) ||
    groupChannels.includes(`slack:${channelIdLower}`) ||
    groupChannels.includes(`channel:${channelIdLower}`) ||
    groupChannels.includes(`group:${channelIdLower}`) ||
    groupChannels.includes(`mpim:${channelIdLower}`)
  ) {
    SLACK_CHANNEL_TYPE_CACHE.set(cacheKey, "group");
    return "group";
  }
  if (
    Object.keys(account.channels ?? {}).some((key) => {
      const normalized = key.trim().toLowerCase();
      return (
        normalized === channelIdLower ||
        normalized === `channel:${channelIdLower}` ||
        normalized.replace(/^#/, "") === channelIdLower
      );
    })
  ) {
    SLACK_CHANNEL_TYPE_CACHE.set(cacheKey, "channel");
    return "channel";
  }
  const token = account.botToken?.trim() || account.config.userToken?.trim() || "";
  if (!token) {
    SLACK_CHANNEL_TYPE_CACHE.set(cacheKey, "unknown");
    return "unknown";
  }
  try {
    const channel = (await createSlackWebClient(token).conversations.info({ channel: channelId }))
      .channel;
    const type = channel?.is_im ? "dm" : channel?.is_mpim ? "group" : "channel";
    SLACK_CHANNEL_TYPE_CACHE.set(cacheKey, type);
    return type;
  } catch {
    SLACK_CHANNEL_TYPE_CACHE.set(cacheKey, "unknown");
    return "unknown";
  }
}
async function resolveSlackOutboundSessionRoute(params) {
  const parsed = parseSlackTarget(params.target, { defaultKind: "channel" });
  if (!parsed) return null;
  const isDm = parsed.kind === "user";
  let peerKind = isDm ? "direct" : "channel";
  if (!isDm && /^G/i.test(parsed.id)) {
    const channelType = await resolveSlackChannelType({
      cfg: params.cfg,
      accountId: params.accountId,
      channelId: parsed.id,
    });
    if (channelType === "group") peerKind = "group";
    if (channelType === "dm") peerKind = "direct";
  }
  const peer = {
    kind: peerKind,
    id: parsed.id,
  };
  const baseSessionKey = buildSlackBaseSessionKey({
    cfg: params.cfg,
    agentId: params.agentId,
    accountId: params.accountId,
    peer,
  });
  const threadId = normalizeOutboundThreadId(params.threadId ?? params.replyToId);
  return {
    sessionKey: resolveThreadSessionKeys$1({
      baseSessionKey,
      threadId,
    }).sessionKey,
    baseSessionKey,
    peer,
    chatType: peerKind === "direct" ? "direct" : "channel",
    from:
      peerKind === "direct"
        ? `slack:${parsed.id}`
        : peerKind === "group"
          ? `slack:group:${parsed.id}`
          : `slack:channel:${parsed.id}`,
    to: peerKind === "direct" ? `user:${parsed.id}` : `channel:${parsed.id}`,
    threadId,
  };
}
function formatSlackScopeDiagnostic(params) {
  const source = params.result.source ? ` (${params.result.source})` : "";
  const label = params.tokenType === "user" ? "User scopes" : "Bot scopes";
  if (params.result.ok && params.result.scopes?.length)
    return { text: `${label}${source}: ${params.result.scopes.join(", ")}` };
  return {
    text: `${label}: ${params.result.error ?? "scope lookup failed"}`,
    tone: "error",
  };
}
const resolveSlackAllowlistGroupOverrides = createFlatAllowlistOverrideResolver({
  resolveRecord: (account) => account.channels,
  label: (key) => key,
  resolveEntries: (value) => value?.users,
});
const resolveSlackAllowlistNames = createAccountScopedAllowlistNameResolver({
  resolveAccount: resolveSlackAccount,
  resolveToken: (account) => account.config.userToken?.trim() || account.botToken?.trim(),
  resolveNames: ({ token, entries }) =>
    resolveSlackUserAllowlist({
      token,
      entries,
    }),
});
const collectSlackSecurityWarnings = createOpenProviderConfiguredRouteWarningCollector({
  providerConfigPresent: (cfg) => cfg.channels?.slack !== void 0,
  resolveGroupPolicy: (account) => account.config.groupPolicy,
  resolveRouteAllowlistConfigured: (account) =>
    Boolean(account.config.channels) && Object.keys(account.config.channels ?? {}).length > 0,
  configureRouteAllowlist: {
    surface: "Slack channels",
    openScope: "any channel not explicitly denied",
    groupPolicyPath: "channels.slack.groupPolicy",
    routeAllowlistPath: "channels.slack.channels",
  },
  missingRouteAllowlist: {
    surface: "Slack channels",
    openBehavior: "with no channel allowlist; any channel can trigger (mention-gated)",
    remediation: 'Set channels.slack.groupPolicy="allowlist" and configure channels.slack.channels',
  },
});
const slackPlugin = createChatChannelPlugin({
  base: {
    ...createSlackPluginBase({
      setupWizard: slackSetupWizard,
      setup: slackSetupAdapter,
    }),
    allowlist: {
      ...buildLegacyDmAccountAllowlistAdapter({
        channelId: "slack",
        resolveAccount: resolveSlackAccount,
        normalize: ({ cfg, accountId, values }) =>
          slackConfigAdapter.formatAllowFrom({
            cfg,
            accountId,
            allowFrom: values,
          }),
        resolveDmAllowFrom: (account) => account.config.allowFrom ?? account.config.dm?.allowFrom,
        resolveGroupPolicy: (account) => account.groupPolicy,
        resolveGroupOverrides: resolveSlackAllowlistGroupOverrides,
      }),
      resolveNames: resolveSlackAllowlistNames,
    },
    groups: {
      resolveRequireMention: resolveSlackGroupRequireMention,
      resolveToolPolicy: resolveSlackGroupToolPolicy,
    },
    messaging: {
      normalizeTarget: normalizeSlackMessagingTarget,
      resolveSessionTarget: ({ id }) => normalizeSlackMessagingTarget(`channel:${id}`),
      parseExplicitTarget: ({ raw }) => parseSlackExplicitTarget(raw),
      inferTargetChatType: ({ to }) => parseSlackExplicitTarget(to)?.chatType,
      resolveOutboundSessionRoute: async (params) => await resolveSlackOutboundSessionRoute(params),
      enableInteractiveReplies: ({ cfg, accountId }) =>
        isSlackInteractiveRepliesEnabled({
          cfg,
          accountId,
        }),
      hasStructuredReplyPayload: ({ payload }) => {
        const slackData = payload.channelData?.slack;
        if (!slackData || typeof slackData !== "object" || Array.isArray(slackData)) return false;
        try {
          return Boolean(parseSlackBlocksInput(slackData.blocks)?.length);
        } catch {
          return false;
        }
      },
      targetResolver: {
        looksLikeId: looksLikeSlackTargetId,
        hint: "<channelId|user:ID|channel:ID>",
        resolveTarget: async ({ input }) => {
          const parsed = parseSlackExplicitTarget(input);
          if (!parsed) return null;
          return {
            to: parsed.to,
            kind: parsed.chatType === "direct" ? "user" : "group",
            source: "normalized",
          };
        },
      },
    },
    directory: createChannelDirectoryAdapter({
      listPeers: async (params) => listSlackDirectoryPeersFromConfig(params),
      listGroups: async (params) => listSlackDirectoryGroupsFromConfig(params),
      ...createRuntimeDirectoryLiveAdapter({
        getRuntime: () => getSlackRuntime().channel.slack,
        listPeersLive: (runtime) => runtime.listDirectoryPeersLive,
        listGroupsLive: (runtime) => runtime.listDirectoryGroupsLive,
      }),
    }),
    resolver: {
      resolveTargets: async ({ cfg, accountId, inputs, kind }) => {
        const toResolvedTarget = (entry, note) => ({
          input: entry.input,
          resolved: entry.resolved,
          id: entry.id,
          name: entry.name,
          note,
        });
        const account = resolveSlackAccount({
          cfg,
          accountId,
        });
        if (kind === "group")
          return resolveTargetsWithOptionalToken({
            token: account.config.userToken?.trim() || account.botToken?.trim(),
            inputs,
            missingTokenNote: "missing Slack token",
            resolveWithToken: ({ token, inputs }) =>
              getSlackRuntime().channel.slack.resolveChannelAllowlist({
                token,
                entries: inputs,
              }),
            mapResolved: (entry) => toResolvedTarget(entry, entry.archived ? "archived" : void 0),
          });
        return resolveTargetsWithOptionalToken({
          token: account.config.userToken?.trim() || account.botToken?.trim(),
          inputs,
          missingTokenNote: "missing Slack token",
          resolveWithToken: ({ token, inputs }) =>
            getSlackRuntime().channel.slack.resolveUserAllowlist({
              token,
              entries: inputs,
            }),
          mapResolved: (entry) => toResolvedTarget(entry, entry.note),
        });
      },
    },
    actions: createSlackActions(SLACK_CHANNEL, {
      invoke: async (action, cfg, toolContext) =>
        await getSlackRuntime().channel.slack.handleSlackAction(action, cfg, toolContext),
    }),
    status: createComputedAccountStatusAdapter({
      defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID),
      buildChannelSummary: ({ snapshot }) =>
        buildPassiveProbedChannelStatusSummary(snapshot, {
          botTokenSource: snapshot.botTokenSource ?? "none",
          appTokenSource: snapshot.appTokenSource ?? "none",
        }),
      probeAccount: async ({ account, timeoutMs }) => {
        const token = account.botToken?.trim();
        if (!token)
          return {
            ok: false,
            error: "missing token",
          };
        return await getSlackRuntime().channel.slack.probeSlack(token, timeoutMs);
      },
      formatCapabilitiesProbe: ({ probe }) => {
        const slackProbe = probe;
        const lines = [];
        if (slackProbe?.bot?.name) lines.push({ text: `Bot: @${slackProbe.bot.name}` });
        if (slackProbe?.team?.name || slackProbe?.team?.id) {
          const id = slackProbe.team?.id ? ` (${slackProbe.team.id})` : "";
          lines.push({ text: `Team: ${slackProbe.team?.name ?? "unknown"}${id}` });
        }
        return lines;
      },
      buildCapabilitiesDiagnostics: async ({ account, timeoutMs }) => {
        const lines = [];
        const details = {};
        const botToken = account.botToken?.trim();
        const userToken = account.config.userToken?.trim();
        const botScopes = botToken
          ? await fetchSlackScopes(botToken, timeoutMs)
          : {
              ok: false,
              error: "Slack bot token missing.",
            };
        lines.push(
          formatSlackScopeDiagnostic({
            tokenType: "bot",
            result: botScopes,
          }),
        );
        details.botScopes = botScopes;
        if (userToken) {
          const userScopes = await fetchSlackScopes(userToken, timeoutMs);
          lines.push(
            formatSlackScopeDiagnostic({
              tokenType: "user",
              result: userScopes,
            }),
          );
          details.userScopes = userScopes;
        }
        return {
          lines,
          details,
        };
      },
      resolveAccountSnapshot: ({ account }) => {
        const configured =
          ((account.config.mode ?? "socket") === "http"
            ? resolveConfiguredFromRequiredCredentialStatuses(account, [
                "botTokenStatus",
                "signingSecretStatus",
              ])
            : resolveConfiguredFromRequiredCredentialStatuses(account, [
                "botTokenStatus",
                "appTokenStatus",
              ])) ?? isSlackPluginAccountConfigured(account);
        return {
          accountId: account.accountId,
          name: account.name,
          enabled: account.enabled,
          configured,
          extra: { ...projectCredentialSnapshotFields(account) },
        };
      },
    }),
    gateway: {
      startAccount: async (ctx) => {
        const account = ctx.account;
        const botToken = account.botToken?.trim();
        const appToken = account.appToken?.trim();
        ctx.log?.info(`[${account.accountId}] starting provider`);
        return getSlackRuntime().channel.slack.monitorSlackProvider({
          botToken: botToken ?? "",
          appToken: appToken ?? "",
          accountId: account.accountId,
          config: ctx.cfg,
          runtime: ctx.runtime,
          abortSignal: ctx.abortSignal,
          mediaMaxMb: account.config.mediaMaxMb,
          slashCommand: account.config.slashCommand,
          setStatus: ctx.setStatus,
          getStatus: ctx.getStatus,
        });
      },
    },
  },
  pairing: {
    text: {
      idLabel: "slackUserId",
      message: PAIRING_APPROVED_MESSAGE,
      normalizeAllowEntry: createPairingPrefixStripper(/^(slack|user):/i),
      notify: async ({ id, message }) => {
        const account = resolveSlackAccount({
          cfg: getSlackRuntime().config.loadConfig(),
          accountId: DEFAULT_ACCOUNT_ID,
        });
        const token = getTokenForOperation(account, "write");
        const botToken = account.botToken?.trim();
        const tokenOverride = token && token !== botToken ? token : void 0;
        if (tokenOverride)
          await getSlackRuntime().channel.slack.sendMessageSlack(`user:${id}`, message, {
            token: tokenOverride,
          });
        else await getSlackRuntime().channel.slack.sendMessageSlack(`user:${id}`, message);
      },
    },
  },
  security: {
    resolveDmPolicy: resolveSlackDmPolicy,
    collectWarnings: collectSlackSecurityWarnings,
  },
  threading: {
    scopedAccountReplyToMode: {
      resolveAccount: adaptScopedAccountAccessor(resolveSlackAccount),
      resolveReplyToMode: (account, chatType) => resolveSlackReplyToMode(account, chatType),
    },
    allowExplicitReplyTagsWhenOff: false,
    buildToolContext: (params) => buildSlackThreadingToolContext(params),
    resolveAutoThreadId: ({ cfg, accountId, to, toolContext, replyToId }) =>
      replyToId
        ? void 0
        : resolveSlackAutoThreadId({
            cfg,
            accountId,
            to,
            toolContext,
          }),
    resolveReplyTransport: ({ threadId, replyToId }) => ({
      replyToId: replyToId ?? (threadId != null && threadId !== "" ? String(threadId) : void 0),
      threadId: null,
    }),
  },
  outbound: {
    base: {
      deliveryMode: "direct",
      chunker: null,
      textChunkLimit: SLACK_TEXT_LIMIT,
    },
    attachedResults: {
      channel: "slack",
      sendText: async ({ to, text, accountId, deps, replyToId, threadId, cfg }) => {
        const { send, threadTsValue, tokenOverride } = resolveSlackSendContext({
          cfg,
          accountId: accountId ?? void 0,
          deps,
          replyToId,
          threadId,
        });
        return await send(to, text, {
          cfg,
          threadTs: threadTsValue != null ? String(threadTsValue) : void 0,
          accountId: accountId ?? void 0,
          ...(tokenOverride ? { token: tokenOverride } : {}),
        });
      },
      sendMedia: async ({
        to,
        text,
        mediaUrl,
        mediaLocalRoots,
        accountId,
        deps,
        replyToId,
        threadId,
        cfg,
      }) => {
        const { send, threadTsValue, tokenOverride } = resolveSlackSendContext({
          cfg,
          accountId: accountId ?? void 0,
          deps,
          replyToId,
          threadId,
        });
        return await send(to, text, {
          cfg,
          mediaUrl,
          mediaLocalRoots,
          threadTs: threadTsValue != null ? String(threadTsValue) : void 0,
          accountId: accountId ?? void 0,
          ...(tokenOverride ? { token: tokenOverride } : {}),
        });
      },
    },
  },
});
defineChannelPluginEntry({
  id: "slack",
  name: "Slack",
  description: "Slack channel plugin",
  plugin: slackPlugin,
  setRuntime: setSlackRuntime,
});
//#endregion
//#region extensions/slack/src/channel.setup.ts
const slackSetupPlugin = {
  ...createSlackPluginBase({
    setupWizard: slackSetupWizard,
    setup: slackSetupAdapter,
  }),
};
defineSetupPluginEntry(slackSetupPlugin);
//#endregion
//#region extensions/synology-chat/src/accounts.ts
/**
 * Account resolution: reads config from channels.synology-chat,
 * merges per-account overrides, falls back to environment variables.
 */
/** Extract the channel config from the full OpenClaw config object. */
function getChannelConfig$1(cfg) {
  return cfg?.channels?.["synology-chat"];
}
function resolveImplicitAccountId(channelCfg) {
  return channelCfg.token || process.env.SYNOLOGY_CHAT_TOKEN ? DEFAULT_ACCOUNT_ID : void 0;
}
function getRawAccountConfig$1(channelCfg, accountId) {
  if (accountId === "default") return channelCfg;
  return channelCfg.accounts?.[accountId] ?? {};
}
function hasExplicitWebhookPath(rawAccount) {
  return typeof rawAccount?.webhookPath === "string" && rawAccount.webhookPath.trim().length > 0;
}
function resolveWebhookPathSource(params) {
  if (hasExplicitWebhookPath(params.rawAccount)) return "explicit";
  if (params.accountId !== "default" && hasExplicitWebhookPath(params.channelCfg))
    return "inherited-base";
  return "default";
}
/** Parse allowedUserIds from string or array to string[]. */
function parseAllowedUserIds(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function parseRateLimitPerMinute(raw) {
  if (raw == null) return 30;
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) return 30;
  return Number.parseInt(trimmed, 10);
}
/**
 * List all configured account IDs for this channel.
 * Returns ["default"] if there's a base config, plus any named accounts.
 */
function listAccountIds(cfg) {
  const channelCfg = getChannelConfig$1(cfg);
  if (!channelCfg) return [];
  return listCombinedAccountIds({
    configuredAccountIds: Object.keys(channelCfg.accounts ?? {}),
    implicitAccountId: resolveImplicitAccountId(channelCfg),
  });
}
/**
 * Resolve a specific account by ID with full defaults applied.
 * Falls back to env vars for the "default" account.
 */
function resolveAccount(cfg, accountId) {
  const channelCfg = getChannelConfig$1(cfg) ?? {};
  const id = accountId || "default";
  const accountOverrides = id === "default" ? void 0 : (channelCfg.accounts?.[id] ?? void 0);
  const rawAccount = getRawAccountConfig$1(channelCfg, id);
  const merged = resolveMergedAccountConfig({
    channelConfig: channelCfg,
    accounts: channelCfg.accounts,
    accountId: id,
  });
  const envToken = process.env.SYNOLOGY_CHAT_TOKEN ?? "";
  const envIncomingUrl = process.env.SYNOLOGY_CHAT_INCOMING_URL ?? "";
  const envNasHost = process.env.SYNOLOGY_NAS_HOST ?? "localhost";
  const envAllowedUserIds = process.env.SYNOLOGY_ALLOWED_USER_IDS ?? "";
  const envRateLimitValue = parseRateLimitPerMinute(process.env.SYNOLOGY_RATE_LIMIT);
  const envBotName = process.env.OPENCLAW_BOT_NAME ?? "OpenClaw";
  const webhookPathSource = resolveWebhookPathSource({
    accountId: id,
    channelCfg,
    rawAccount,
  });
  const dangerouslyAllowInheritedWebhookPath =
    rawAccount.dangerouslyAllowInheritedWebhookPath ??
    channelCfg.dangerouslyAllowInheritedWebhookPath ??
    false;
  return {
    accountId: id,
    enabled: merged.enabled ?? true,
    token: merged.token ?? envToken,
    incomingUrl: merged.incomingUrl ?? envIncomingUrl,
    nasHost: merged.nasHost ?? envNasHost,
    webhookPath: merged.webhookPath ?? "/webhook/synology",
    webhookPathSource,
    dangerouslyAllowNameMatching: resolveDangerousNameMatchingEnabled({
      providerConfig: channelCfg,
      accountConfig: accountOverrides,
    }),
    dangerouslyAllowInheritedWebhookPath,
    dmPolicy: merged.dmPolicy ?? "allowlist",
    allowedUserIds: parseAllowedUserIds(merged.allowedUserIds ?? envAllowedUserIds),
    rateLimitPerMinute: merged.rateLimitPerMinute ?? envRateLimitValue,
    botName: merged.botName ?? envBotName,
    allowInsecureSsl: merged.allowInsecureSsl ?? false,
  };
}
//#endregion
//#region extensions/synology-chat/src/client.ts
/**
 * Synology Chat HTTP client.
 * Sends messages TO Synology Chat via the incoming webhook URL.
 */
const MIN_SEND_INTERVAL_MS = 500;
let lastSendTime = 0;
const chatUserCache = /* @__PURE__ */ new Map();
const CACHE_TTL_MS = 300 * 1e3;
/**
 * Send a text message to Synology Chat via the incoming webhook.
 *
 * @param incomingUrl - Synology Chat incoming webhook URL
 * @param text - Message text to send
 * @param userId - Optional user ID to mention with @
 * @returns true if sent successfully
 */
async function sendMessage(incomingUrl, text, userId, allowInsecureSsl = true) {
  const body = buildWebhookBody({ text }, userId);
  const elapsed = Date.now() - lastSendTime;
  if (elapsed < MIN_SEND_INTERVAL_MS) await sleep(MIN_SEND_INTERVAL_MS - elapsed);
  const maxRetries = 3;
  const baseDelay = 300;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const ok = await doPost(incomingUrl, body, allowInsecureSsl);
      lastSendTime = Date.now();
      if (ok) return true;
    } catch {}
    if (attempt < maxRetries - 1) await sleep(baseDelay * Math.pow(2, attempt));
  }
  return false;
}
/**
 * Send a file URL to Synology Chat.
 */
async function sendFileUrl(incomingUrl, fileUrl, userId, allowInsecureSsl = true) {
  const body = buildWebhookBody({ file_url: fileUrl }, userId);
  try {
    const ok = await doPost(incomingUrl, body, allowInsecureSsl);
    lastSendTime = Date.now();
    return ok;
  } catch {
    return false;
  }
}
/**
 * Fetch the list of Chat users visible to this bot via the user_list API.
 * Results are cached for CACHE_TTL_MS to avoid excessive API calls.
 *
 * The user_list endpoint uses the same base URL as the chatbot API but
 * with method=user_list instead of method=chatbot.
 */
async function fetchChatUsers(incomingUrl, allowInsecureSsl = true, log) {
  const now = Date.now();
  const listUrl = incomingUrl.replace(/method=\w+/, "method=user_list");
  const cached = chatUserCache.get(listUrl);
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) return cached.users;
  return new Promise((resolve) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(listUrl);
    } catch {
      log?.warn("fetchChatUsers: invalid user_list URL, using cached data");
      resolve(cached?.users ?? []);
      return;
    }
    (parsedUrl.protocol === "https:" ? https$1 : http$1)
      .get(listUrl, { rejectUnauthorized: !allowInsecureSsl }, (res) => {
        let data = "";
        res.on("data", (c) => {
          data += c.toString();
        });
        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            if (result.success && result.data?.users) {
              const users = result.data.users.map((u) => ({
                user_id: u.user_id,
                username: u.username || "",
                nickname: u.nickname || "",
              }));
              chatUserCache.set(listUrl, {
                users,
                cachedAt: now,
              });
              resolve(users);
            } else {
              log?.warn(
                `fetchChatUsers: API returned success=${result.success}, using cached data`,
              );
              resolve(cached?.users ?? []);
            }
          } catch {
            log?.warn("fetchChatUsers: failed to parse user_list response");
            resolve(cached?.users ?? []);
          }
        });
      })
      .on("error", (err) => {
        log?.warn(`fetchChatUsers: HTTP error — ${err instanceof Error ? err.message : err}`);
        resolve(cached?.users ?? []);
      });
  });
}
/**
 * Resolve a mutable webhook username/nickname to the correct Chat API user_id.
 *
 * Synology Chat outgoing webhooks send a user_id that may NOT match the
 * Chat-internal user_id needed by the chatbot API (method=chatbot).
 * The webhook's "username" field corresponds to the Chat user's "nickname".
 *
 * @returns The correct Chat user_id, or undefined if not found
 */
async function resolveLegacyWebhookNameToChatUserId(params) {
  const users = await fetchChatUsers(params.incomingUrl, params.allowInsecureSsl, params.log);
  const lower = params.mutableWebhookUsername.toLowerCase();
  const byNickname = users.find((u) => u.nickname.toLowerCase() === lower);
  if (byNickname) return byNickname.user_id;
  const byUsername = users.find((u) => u.username.toLowerCase() === lower);
  if (byUsername) return byUsername.user_id;
}
function buildWebhookBody(payload, userId) {
  const numericId = parseNumericUserId(userId);
  if (numericId !== void 0) payload.user_ids = [numericId];
  return `payload=${encodeURIComponent(JSON.stringify(payload))}`;
}
function parseNumericUserId(userId) {
  if (userId === void 0) return;
  const numericId = typeof userId === "number" ? userId : parseInt(userId, 10);
  return Number.isNaN(numericId) ? void 0 : numericId;
}
function doPost(url, body, allowInsecureSsl = true) {
  return new Promise((resolve, reject) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      reject(/* @__PURE__ */ new Error(`Invalid URL: ${url}`));
      return;
    }
    const req = (parsedUrl.protocol === "https:" ? https$1 : http$1).request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 3e4,
        rejectUnauthorized: !allowInsecureSsl,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          resolve(res.statusCode === 200);
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(/* @__PURE__ */ new Error("Request timeout"));
    });
    req.write(body);
    req.end();
  });
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
//#endregion
//#region extensions/synology-chat/src/config-schema.ts
const SynologyChatChannelConfigSchema = buildChannelConfigSchema(
  z
    .object({
      dangerouslyAllowNameMatching: z.boolean().optional(),
      dangerouslyAllowInheritedWebhookPath: z.boolean().optional(),
    })
    .passthrough(),
);
//#endregion
//#region extensions/synology-chat/src/inbound-context.ts
const CHANNEL_ID$4 = "synology-chat";
function buildSynologyChatInboundContext(params) {
  const { account, msg, sessionKey } = params;
  return params.finalizeInboundContext({
    Body: msg.body,
    RawBody: msg.body,
    CommandBody: msg.body,
    From: `synology-chat:${msg.from}`,
    To: `synology-chat:${msg.from}`,
    SessionKey: sessionKey,
    AccountId: account.accountId,
    OriginatingChannel: CHANNEL_ID$4,
    OriginatingTo: `synology-chat:${msg.from}`,
    ChatType: msg.chatType,
    SenderName: msg.senderName,
    SenderId: msg.from,
    Provider: CHANNEL_ID$4,
    Surface: CHANNEL_ID$4,
    ConversationLabel: msg.senderName || msg.from,
    Timestamp: Date.now(),
    CommandAuthorized: msg.commandAuthorized,
  });
}
//#endregion
//#region extensions/synology-chat/src/runtime.ts
const { setRuntime: setSynologyRuntime, getRuntime: getSynologyRuntime } = createPluginRuntimeStore(
  "Synology Chat runtime not initialized - plugin not registered",
);
//#endregion
//#region extensions/synology-chat/src/session-key.ts
const CHANNEL_ID$3 = "synology-chat";
function buildSynologyChatInboundSessionKey(params) {
  return buildAgentSessionKey({
    agentId: params.agentId,
    channel: CHANNEL_ID$3,
    accountId: params.accountId,
    peer: {
      kind: "direct",
      id: params.userId,
    },
    dmScope: "per-account-channel-peer",
    identityLinks: params.identityLinks,
  });
}
//#endregion
//#region extensions/synology-chat/src/inbound-turn.ts
const CHANNEL_ID$2 = "synology-chat";
function resolveSynologyChatInboundRoute(params) {
  const rt = getSynologyRuntime();
  const route = rt.channel.routing.resolveAgentRoute({
    cfg: params.cfg,
    channel: CHANNEL_ID$2,
    accountId: params.account.accountId,
    peer: {
      kind: "direct",
      id: params.userId,
    },
  });
  return {
    rt,
    route,
    sessionKey: buildSynologyChatInboundSessionKey({
      agentId: route.agentId,
      accountId: params.account.accountId,
      userId: params.userId,
      identityLinks: params.cfg.session?.identityLinks,
    }),
  };
}
async function deliverSynologyChatReply(params) {
  const text = params.payload.text ?? params.payload.body;
  if (!text) return;
  await sendMessage(
    params.account.incomingUrl,
    text,
    params.sendUserId,
    params.account.allowInsecureSsl,
  );
}
async function dispatchSynologyChatInboundTurn(params) {
  const currentCfg = await getSynologyRuntime().config.loadConfig();
  const sendUserId = params.msg.chatUserId ?? params.msg.from;
  const resolved = resolveSynologyChatInboundRoute({
    cfg: currentCfg,
    account: params.account,
    userId: params.msg.from,
  });
  const msgCtx = buildSynologyChatInboundContext({
    finalizeInboundContext: resolved.rt.channel.reply.finalizeInboundContext,
    account: params.account,
    msg: params.msg,
    sessionKey: resolved.sessionKey,
  });
  await resolved.rt.channel.reply.dispatchReplyWithBufferedBlockDispatcher({
    ctx: msgCtx,
    cfg: currentCfg,
    dispatcherOptions: {
      deliver: async (payload) => {
        await deliverSynologyChatReply({
          account: params.account,
          sendUserId,
          payload,
        });
      },
      onReplyStart: () => {
        params.log?.info?.(`Agent reply started for ${params.msg.from}`);
      },
    },
  });
  return null;
}
//#endregion
//#region extensions/synology-chat/src/security.ts
/**
 * Security module: token validation, rate limiting, input sanitization, user allowlist.
 */
/**
 * Validate webhook token using constant-time comparison.
 * Prevents timing attacks that could leak token bytes.
 */
function validateToken(received, expected) {
  if (!received || !expected) return false;
  const key = "openclaw-token-cmp";
  const a = crypto$1.createHmac("sha256", key).update(received).digest();
  const b = crypto$1.createHmac("sha256", key).update(expected).digest();
  return crypto$1.timingSafeEqual(a, b);
}
/**
 * Check if a user ID is in the allowed list.
 * Allowlist mode must be explicit; empty lists should not match any user.
 */
function checkUserAllowed(userId, allowedUserIds) {
  if (allowedUserIds.length === 0) return false;
  return allowedUserIds.includes(userId);
}
/**
 * Resolve DM authorization for a sender across all DM policy modes.
 * Keeps policy semantics in one place so webhook/startup behavior stays consistent.
 */
function authorizeUserForDm(userId, dmPolicy, allowedUserIds) {
  if (dmPolicy === "disabled")
    return {
      allowed: false,
      reason: "disabled",
    };
  if (dmPolicy === "open") return { allowed: true };
  if (allowedUserIds.length === 0)
    return {
      allowed: false,
      reason: "allowlist-empty",
    };
  if (!checkUserAllowed(userId, allowedUserIds))
    return {
      allowed: false,
      reason: "not-allowlisted",
    };
  return { allowed: true };
}
/**
 * Sanitize user input to prevent prompt injection attacks.
 * Filters known dangerous patterns and truncates long messages.
 */
function sanitizeInput(text) {
  const dangerousPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)/gi,
    /you\s+are\s+now\s+/gi,
    /system:\s*/gi,
    /<\|.*?\|>/g,
  ];
  let sanitized = text;
  for (const pattern of dangerousPatterns) sanitized = sanitized.replace(pattern, "[FILTERED]");
  const maxLength = 4e3;
  if (sanitized.length > maxLength) sanitized = sanitized.slice(0, maxLength) + "... [truncated]";
  return sanitized;
}
/**
 * Sliding window rate limiter per user ID.
 */
var RateLimiter = class {
  constructor(limit = 30, windowSeconds = 60, maxTrackedUsers = 5e3) {
    this.limit = limit;
    this.limiter = createFixedWindowRateLimiter({
      windowMs: Math.max(1, Math.floor(windowSeconds * 1e3)),
      maxRequests: Math.max(1, Math.floor(limit)),
      maxTrackedKeys: Math.max(1, Math.floor(maxTrackedUsers)),
    });
  }
  /** Returns true if the request is allowed, false if rate-limited. */
  check(userId) {
    return !this.limiter.isRateLimited(userId);
  }
  /** Exposed for tests and diagnostics. */
  size() {
    return this.limiter.size();
  }
  /** Exposed for tests and account lifecycle cleanup. */
  clear() {
    this.limiter.clear();
  }
  /** Exposed for tests. */
  maxRequests() {
    return this.limit;
  }
};
//#endregion
//#region extensions/synology-chat/src/webhook-handler.ts
const rateLimiters = /* @__PURE__ */ new Map();
const PREAUTH_MAX_BODY_BYTES = 64 * 1024;
const PREAUTH_BODY_TIMEOUT_MS = 5e3;
function getRateLimiter(account) {
  let rl = rateLimiters.get(account.accountId);
  if (!rl || rl.maxRequests() !== account.rateLimitPerMinute) {
    rl?.clear();
    rl = new RateLimiter(account.rateLimitPerMinute);
    rateLimiters.set(account.accountId, rl);
  }
  return rl;
}
/** Read the full request body as a string. */
async function readBody(req) {
  try {
    return {
      ok: true,
      body: await readRequestBodyWithLimit(req, {
        maxBytes: PREAUTH_MAX_BODY_BYTES,
        timeoutMs: PREAUTH_BODY_TIMEOUT_MS,
      }),
    };
  } catch (err) {
    if (isRequestBodyLimitError(err))
      return {
        ok: false,
        statusCode: err.statusCode,
        error: requestBodyErrorToText(err.code),
      };
    return {
      ok: false,
      statusCode: 400,
      error: "Invalid request body",
    };
  }
}
function firstNonEmptyString(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = firstNonEmptyString(item);
      if (normalized) return normalized;
    }
    return;
  }
  if (value === null || value === void 0) return void 0;
  const str = String(value).trim();
  return str.length > 0 ? str : void 0;
}
function pickAlias(record, aliases) {
  for (const alias of aliases) {
    const normalized = firstNonEmptyString(record[alias]);
    if (normalized) return normalized;
  }
}
function parseQueryParams(req) {
  try {
    const url = new URL(req.url ?? "", "http://localhost");
    const out = {};
    for (const [key, value] of url.searchParams.entries()) out[key] = value;
    return out;
  } catch {
    return {};
  }
}
function parseFormBody(body) {
  return querystring.parse(body);
}
function parseJsonBody(body) {
  if (!body.trim()) return {};
  const parsed = JSON.parse(body);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object")
    throw new Error("Invalid JSON body");
  return parsed;
}
function headerValue(header) {
  return firstNonEmptyString(header);
}
function extractTokenFromHeaders(req) {
  const explicit =
    headerValue(req.headers["x-synology-token"]) ??
    headerValue(req.headers["x-webhook-token"]) ??
    headerValue(req.headers["x-openclaw-token"]);
  if (explicit) return explicit;
  const auth = headerValue(req.headers.authorization);
  if (!auth) return void 0;
  const bearerMatch = auth.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch?.[1]) return bearerMatch[1].trim();
  return auth.trim();
}
/**
 * Parse/normalize incoming webhook payload.
 *
 * Supports:
 * - application/x-www-form-urlencoded
 * - application/json
 *
 * Token resolution order: body.token -> query.token -> headers
 * Field aliases:
 * - user_id <- user_id | userId | user
 * - text    <- text | message | content
 */
function parsePayload(req, body) {
  const contentType = String(req.headers["content-type"] ?? "").toLowerCase();
  let bodyFields = {};
  if (contentType.includes("application/json")) bodyFields = parseJsonBody(body);
  else if (contentType.includes("application/x-www-form-urlencoded"))
    bodyFields = parseFormBody(body);
  else
    try {
      bodyFields = parseJsonBody(body);
    } catch {
      bodyFields = parseFormBody(body);
    }
  const queryFields = parseQueryParams(req);
  const headerToken = extractTokenFromHeaders(req);
  const token =
    pickAlias(bodyFields, ["token"]) ?? pickAlias(queryFields, ["token"]) ?? headerToken;
  const userId =
    pickAlias(bodyFields, ["user_id", "userId", "user"]) ??
    pickAlias(queryFields, ["user_id", "userId", "user"]);
  const text =
    pickAlias(bodyFields, ["text", "message", "content"]) ??
    pickAlias(queryFields, ["text", "message", "content"]);
  if (!token || !userId || !text) return null;
  return {
    token,
    channel_id:
      pickAlias(bodyFields, ["channel_id"]) ?? pickAlias(queryFields, ["channel_id"]) ?? void 0,
    channel_name:
      pickAlias(bodyFields, ["channel_name"]) ?? pickAlias(queryFields, ["channel_name"]) ?? void 0,
    user_id: userId,
    username:
      pickAlias(bodyFields, ["username", "user_name", "name"]) ??
      pickAlias(queryFields, ["username", "user_name", "name"]) ??
      "unknown",
    post_id: pickAlias(bodyFields, ["post_id"]) ?? pickAlias(queryFields, ["post_id"]) ?? void 0,
    timestamp:
      pickAlias(bodyFields, ["timestamp"]) ?? pickAlias(queryFields, ["timestamp"]) ?? void 0,
    text,
    trigger_word:
      pickAlias(bodyFields, ["trigger_word", "triggerWord"]) ??
      pickAlias(queryFields, ["trigger_word", "triggerWord"]) ??
      void 0,
  };
}
/** Send a JSON response. */
function respondJson(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}
/** Send a no-content ACK. */
function respondNoContent(res) {
  res.writeHead(204);
  res.end();
}
async function parseWebhookPayloadRequest(params) {
  const bodyResult = await readBody(params.req);
  if (!bodyResult.ok) {
    params.log?.error("Failed to read request body", bodyResult.error);
    respondJson(params.res, bodyResult.statusCode, { error: bodyResult.error });
    return { ok: false };
  }
  let payload = null;
  try {
    payload = parsePayload(params.req, bodyResult.body);
  } catch (err) {
    params.log?.warn("Failed to parse webhook payload", err);
    respondJson(params.res, 400, { error: "Invalid request body" });
    return { ok: false };
  }
  if (!payload) {
    respondJson(params.res, 400, { error: "Missing required fields (token, user_id, text)" });
    return { ok: false };
  }
  return {
    ok: true,
    payload,
  };
}
function authorizeSynologyWebhook(params) {
  if (!validateToken(params.payload.token, params.account.token)) {
    params.log?.warn(`Invalid token from ${params.req.socket?.remoteAddress}`);
    return {
      ok: false,
      statusCode: 401,
      error: "Invalid token",
    };
  }
  const auth = authorizeUserForDm(
    params.payload.user_id,
    params.account.dmPolicy,
    params.account.allowedUserIds,
  );
  if (!auth.allowed) {
    if (auth.reason === "disabled")
      return {
        ok: false,
        statusCode: 403,
        error: "DMs are disabled",
      };
    if (auth.reason === "allowlist-empty") {
      params.log?.warn(
        "Synology Chat allowlist is empty while dmPolicy=allowlist; rejecting message",
      );
      return {
        ok: false,
        statusCode: 403,
        error: "Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.",
      };
    }
    params.log?.warn(`Unauthorized user: ${params.payload.user_id}`);
    return {
      ok: false,
      statusCode: 403,
      error: "User not authorized",
    };
  }
  if (!params.rateLimiter.check(params.payload.user_id)) {
    params.log?.warn(`Rate limit exceeded for user: ${params.payload.user_id}`);
    return {
      ok: false,
      statusCode: 429,
      error: "Rate limit exceeded",
    };
  }
  return {
    ok: true,
    commandAuthorized: auth.allowed,
  };
}
function sanitizeSynologyWebhookText(payload) {
  let cleanText = sanitizeInput(payload.text);
  if (payload.trigger_word && cleanText.startsWith(payload.trigger_word))
    cleanText = cleanText.slice(payload.trigger_word.length).trim();
  return cleanText;
}
async function parseAndAuthorizeSynologyWebhook(params) {
  const parsed = await parseWebhookPayloadRequest(params);
  if (!parsed.ok) return { ok: false };
  const authorized = authorizeSynologyWebhook({
    req: params.req,
    account: params.account,
    payload: parsed.payload,
    rateLimiter: params.rateLimiter,
    log: params.log,
  });
  if (!authorized.ok) {
    respondJson(params.res, authorized.statusCode, { error: authorized.error });
    return { ok: false };
  }
  const cleanText = sanitizeSynologyWebhookText(parsed.payload);
  if (!cleanText) {
    respondNoContent(params.res);
    return { ok: false };
  }
  const preview = cleanText.length > 100 ? `${cleanText.slice(0, 100)}...` : cleanText;
  return {
    ok: true,
    message: {
      payload: parsed.payload,
      body: cleanText,
      commandAuthorized: authorized.commandAuthorized,
      preview,
    },
  };
}
async function resolveSynologyReplyDeliveryUserId(params) {
  if (!params.account.dangerouslyAllowNameMatching) return params.payload.user_id;
  const resolvedChatApiUserId = await resolveLegacyWebhookNameToChatUserId({
    incomingUrl: params.account.incomingUrl,
    mutableWebhookUsername: params.payload.username,
    allowInsecureSsl: params.account.allowInsecureSsl,
    log: params.log,
  });
  if (resolvedChatApiUserId !== void 0) return String(resolvedChatApiUserId);
  params.log?.warn(
    `Could not resolve Chat API user_id for "${params.payload.username}" — falling back to webhook user_id ${params.payload.user_id}. Reply delivery may fail.`,
  );
  return params.payload.user_id;
}
async function processAuthorizedSynologyWebhook(params) {
  const authorizedWebhookUserId = params.message.payload.user_id;
  let deliveryUserId = authorizedWebhookUserId;
  try {
    deliveryUserId = await resolveSynologyReplyDeliveryUserId({
      account: params.account,
      payload: params.message.payload,
      log: params.log,
    });
    const deliverPromise = params.deliver({
      body: params.message.body,
      from: authorizedWebhookUserId,
      senderName: params.message.payload.username,
      provider: "synology-chat",
      chatType: "direct",
      accountId: params.account.accountId,
      commandAuthorized: params.message.commandAuthorized,
      chatUserId: deliveryUserId,
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(/* @__PURE__ */ new Error("Agent response timeout (120s)")), 12e4),
    );
    const reply = await Promise.race([deliverPromise, timeoutPromise]);
    if (!reply) return;
    await sendMessage(
      params.account.incomingUrl,
      reply,
      deliveryUserId,
      params.account.allowInsecureSsl,
    );
    const replyPreview = reply.length > 100 ? `${reply.slice(0, 100)}...` : reply;
    params.log?.info?.(
      `Reply sent to ${params.message.payload.username} (${deliveryUserId}): ${replyPreview}`,
    );
  } catch (err) {
    const errMsg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    params.log?.error?.(
      `Failed to process message from ${params.message.payload.username}: ${errMsg}`,
    );
    await sendMessage(
      params.account.incomingUrl,
      "Sorry, an error occurred while processing your message.",
      deliveryUserId,
      params.account.allowInsecureSsl,
    );
  }
}
function createWebhookHandler(deps) {
  const { account, deliver, log } = deps;
  const rateLimiter = getRateLimiter(account);
  return async (req, res) => {
    if (req.method !== "POST") {
      respondJson(res, 405, { error: "Method not allowed" });
      return;
    }
    const authorized = await parseAndAuthorizeSynologyWebhook({
      req,
      res,
      account,
      rateLimiter,
      log,
    });
    if (!authorized.ok) return;
    log?.info(
      `Message from ${authorized.message.payload.username} (${authorized.message.payload.user_id}): ${authorized.message.preview}`,
    );
    respondNoContent(res);
    await processAuthorizedSynologyWebhook({
      account,
      deliver,
      log,
      message: authorized.message,
    });
  };
}
//#endregion
//#region extensions/synology-chat/src/gateway-runtime.ts
const CHANNEL_ID$1 = "synology-chat";
const activeRouteUnregisters = /* @__PURE__ */ new Map();
function buildStartupIssue(code, message, logLevel = "warn") {
  return {
    code,
    logLevel,
    message,
  };
}
function logStartupIssues(log, issues) {
  for (const issue of issues) {
    const message = `Synology Chat ${issue.message}`;
    if (issue.logLevel === "info") {
      log?.info?.(message);
      continue;
    }
    log?.warn?.(message);
  }
}
function getRouteKey(account) {
  return `${account.accountId}:${account.webhookPath}`;
}
function createUnknownArgsLogAdapter(log) {
  if (!log) return;
  return {
    info: (...args) => log.info?.(String(args[0] ?? "")),
    warn: (...args) => log.warn?.(String(args[0] ?? "")),
    error: (...args) => log.error?.(String(args[0] ?? "")),
  };
}
function collectSynologyGatewayStartupIssues(params) {
  const { cfg, account, accountId } = params;
  const issues = [];
  if (!account.enabled) {
    issues.push(
      buildStartupIssue("disabled", `account ${accountId} is disabled, skipping`, "info"),
    );
    return issues;
  }
  if (!account.token || !account.incomingUrl)
    issues.push(
      buildStartupIssue(
        "missing-credentials",
        `account ${accountId} not fully configured (missing token or incomingUrl)`,
      ),
    );
  if (account.dmPolicy === "allowlist" && account.allowedUserIds.length === 0)
    issues.push(
      buildStartupIssue(
        "empty-allowlist",
        `account ${accountId} has dmPolicy=allowlist but empty allowedUserIds; refusing to start route`,
      ),
    );
  const accountIds = listAccountIds(cfg);
  if (
    accountIds.length > 1 &&
    accountId !== "default" &&
    account.webhookPathSource === "inherited-base" &&
    !account.dangerouslyAllowInheritedWebhookPath
  )
    issues.push(
      buildStartupIssue(
        "inherited-shared-webhook-path",
        `account ${accountId} must set an explicit webhookPath in multi-account setups; refusing inherited shared path. Set channels.synology-chat.accounts.${accountId}.webhookPath or opt in with dangerouslyAllowInheritedWebhookPath=true.`,
      ),
    );
  const conflictingAccounts = accountIds.filter((candidateId) => {
    if (candidateId === accountId) return false;
    const candidate = resolveAccount(cfg, candidateId);
    return candidate.enabled && candidate.webhookPath === account.webhookPath;
  });
  if (conflictingAccounts.length > 0)
    issues.push(
      buildStartupIssue(
        "duplicate-webhook-path",
        `account ${accountId} conflicts on webhookPath ${account.webhookPath} with ${conflictingAccounts.join(", ")}; refusing to start ambiguous shared route.`,
      ),
    );
  return issues;
}
function collectSynologyGatewayRoutingWarnings(params) {
  return collectSynologyGatewayStartupIssues({
    cfg: params.cfg,
    account: params.account,
    accountId: params.account.accountId,
  })
    .filter(
      (issue) =>
        issue.code === "inherited-shared-webhook-path" || issue.code === "duplicate-webhook-path",
    )
    .map((issue) => `- Synology Chat: ${issue.message}`);
}
function validateSynologyGatewayAccountStartup(params) {
  const issues = collectSynologyGatewayStartupIssues(params);
  if (issues.length > 0) {
    logStartupIssues(params.log, issues);
    return { ok: false };
  }
  return { ok: true };
}
function registerSynologyWebhookRoute(params) {
  const { account, log } = params;
  const routeKey = getRouteKey(account);
  const prevUnregister = activeRouteUnregisters.get(routeKey);
  if (prevUnregister) {
    log?.info?.(`Deregistering stale route before re-registering: ${account.webhookPath}`);
    prevUnregister();
    activeRouteUnregisters.delete(routeKey);
  }
  const handler = createWebhookHandler({
    account,
    deliver: async (msg) =>
      await dispatchSynologyChatInboundTurn({
        account,
        msg,
        log: createUnknownArgsLogAdapter(log),
      }),
    log: createUnknownArgsLogAdapter(log),
  });
  const unregister = registerPluginHttpRoute({
    path: account.webhookPath,
    auth: "plugin",
    pluginId: CHANNEL_ID$1,
    accountId: account.accountId,
    log: (msg) => log?.info?.(msg),
    handler,
  });
  activeRouteUnregisters.set(routeKey, unregister);
  return () => {
    unregister();
    activeRouteUnregisters.delete(routeKey);
  };
}
//#endregion
//#region extensions/synology-chat/src/setup-surface.ts
const channel$2 = "synology-chat";
const DEFAULT_WEBHOOK_PATH = "/webhook/synology";
const SYNOLOGY_SETUP_HELP_LINES = [
  "1) Create an incoming webhook in Synology Chat and copy its URL",
  "2) Create an outgoing webhook and copy its secret token",
  `3) Point the outgoing webhook to https://<gateway-host>${DEFAULT_WEBHOOK_PATH}`,
  "4) Keep allowed user IDs handy for DM allowlisting",
  `Docs: ${formatDocsLink("/channels/synology-chat", "channels/synology-chat")}`,
];
const SYNOLOGY_ALLOW_FROM_HELP_LINES = [
  "Allowlist Synology Chat DMs by numeric user id.",
  "Examples:",
  "- 123456",
  "- synology-chat:123456",
  "Multiple entries: comma-separated.",
  `Docs: ${formatDocsLink("/channels/synology-chat", "channels/synology-chat")}`,
];
function getChannelConfig(cfg) {
  return cfg.channels?.[channel$2] ?? {};
}
function getRawAccountConfig(cfg, accountId) {
  const channelConfig = getChannelConfig(cfg);
  if (accountId === "default") return channelConfig;
  return channelConfig.accounts?.[accountId] ?? {};
}
function patchSynologyChatAccountConfig(params) {
  const channelConfig = getChannelConfig(params.cfg);
  if (params.accountId === "default") {
    const nextChannelConfig = { ...channelConfig };
    for (const field of params.clearFields ?? []) delete nextChannelConfig[field];
    return {
      ...params.cfg,
      channels: {
        ...params.cfg.channels,
        [channel$2]: {
          ...nextChannelConfig,
          ...(params.enabled ? { enabled: true } : {}),
          ...params.patch,
        },
      },
    };
  }
  const nextAccounts = { ...(channelConfig.accounts ?? {}) };
  const nextAccountConfig = { ...(nextAccounts[params.accountId] ?? {}) };
  for (const field of params.clearFields ?? []) delete nextAccountConfig[field];
  nextAccounts[params.accountId] = {
    ...nextAccountConfig,
    ...(params.enabled ? { enabled: true } : {}),
    ...params.patch,
  };
  return {
    ...params.cfg,
    channels: {
      ...params.cfg.channels,
      [channel$2]: {
        ...channelConfig,
        ...(params.enabled ? { enabled: true } : {}),
        accounts: nextAccounts,
      },
    },
  };
}
function isSynologyChatConfigured(cfg, accountId) {
  const account = resolveAccount(cfg, accountId);
  return Boolean(account.token.trim() && account.incomingUrl.trim());
}
function validateWebhookUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return "Incoming webhook must use http:// or https://.";
  } catch {
    return "Incoming webhook must be a valid URL.";
  }
}
function validateWebhookPath(value) {
  const trimmed = value.trim();
  if (!trimmed) return;
  return trimmed.startsWith("/") ? void 0 : "Webhook path must start with /.";
}
function parseSynologyUserId(value) {
  const cleaned = value.replace(/^synology-chat:/i, "").trim();
  return /^\d+$/.test(cleaned) ? cleaned : null;
}
function resolveExistingAllowedUserIds(cfg, accountId) {
  const raw = getRawAccountConfig(cfg, accountId).allowedUserIds;
  if (Array.isArray(raw)) return raw.map((value) => String(value).trim()).filter(Boolean);
  return String(raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
const synologyChatSetupAdapter = {
  resolveAccountId: ({ accountId }) => normalizeAccountId(accountId) ?? "default",
  validateInput: ({ accountId, input }) => {
    if (input.useEnv && accountId !== "default")
      return "Synology Chat env credentials only support the default account.";
    if (!input.useEnv && !input.token?.trim())
      return "Synology Chat requires --token or --use-env.";
    if (!input.url?.trim()) return "Synology Chat requires --url for the incoming webhook.";
    const urlError = validateWebhookUrl(input.url.trim());
    if (urlError) return urlError;
    if (input.webhookPath?.trim()) return validateWebhookPath(input.webhookPath.trim()) ?? null;
    return null;
  },
  applyAccountConfig: ({ cfg, accountId, input }) =>
    patchSynologyChatAccountConfig({
      cfg,
      accountId,
      enabled: true,
      clearFields: input.useEnv ? ["token"] : void 0,
      patch: {
        ...(input.useEnv ? {} : { token: input.token?.trim() }),
        incomingUrl: input.url?.trim(),
        ...(input.webhookPath?.trim() ? { webhookPath: input.webhookPath.trim() } : {}),
      },
    }),
};
const synologyChatSetupWizard = {
  channel: channel$2,
  status: createStandardChannelSetupStatus({
    channelLabel: "Synology Chat",
    configuredLabel: "configured",
    unconfiguredLabel: "needs token + incoming webhook",
    configuredHint: "configured",
    unconfiguredHint: "needs token + incoming webhook",
    configuredScore: 1,
    unconfiguredScore: 0,
    includeStatusLine: true,
    resolveConfigured: ({ cfg }) =>
      listAccountIds(cfg).some((accountId) => isSynologyChatConfigured(cfg, accountId)),
    resolveExtraStatusLines: ({ cfg }) => [`Accounts: ${listAccountIds(cfg).length || 0}`],
  }),
  introNote: {
    title: "Synology Chat webhook setup",
    lines: SYNOLOGY_SETUP_HELP_LINES,
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: channel$2,
      credentialLabel: "outgoing webhook token",
      preferredEnvVar: "SYNOLOGY_CHAT_TOKEN",
      helpTitle: "Synology Chat webhook token",
      helpLines: SYNOLOGY_SETUP_HELP_LINES,
      envPrompt: "SYNOLOGY_CHAT_TOKEN detected. Use env var?",
      keepPrompt: "Synology Chat webhook token already configured. Keep it?",
      inputPrompt: "Enter Synology Chat outgoing webhook token",
      allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
      inspect: ({ cfg, accountId }) => {
        const account = resolveAccount(cfg, accountId);
        const raw = getRawAccountConfig(cfg, accountId);
        return {
          accountConfigured: isSynologyChatConfigured(cfg, accountId),
          hasConfiguredValue: Boolean(raw.token?.trim()),
          resolvedValue: account.token.trim() || void 0,
          envValue:
            accountId === "default" ? process.env.SYNOLOGY_CHAT_TOKEN?.trim() || void 0 : void 0,
        };
      },
      applyUseEnv: async ({ cfg, accountId }) =>
        patchSynologyChatAccountConfig({
          cfg,
          accountId,
          enabled: true,
          clearFields: ["token"],
          patch: {},
        }),
      applySet: async ({ cfg, accountId, resolvedValue }) =>
        patchSynologyChatAccountConfig({
          cfg,
          accountId,
          enabled: true,
          patch: { token: resolvedValue },
        }),
    },
  ],
  textInputs: [
    {
      inputKey: "url",
      message: "Incoming webhook URL",
      placeholder:
        "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming...",
      helpTitle: "Synology Chat incoming webhook",
      helpLines: [
        "Use the incoming webhook URL from Synology Chat integrations.",
        "This is the URL OpenClaw uses to send replies back to Chat.",
      ],
      currentValue: ({ cfg, accountId }) => getRawAccountConfig(cfg, accountId).incomingUrl?.trim(),
      keepPrompt: (value) => `Incoming webhook URL set (${value}). Keep it?`,
      validate: ({ value }) => validateWebhookUrl(value),
      applySet: async ({ cfg, accountId, value }) =>
        patchSynologyChatAccountConfig({
          cfg,
          accountId,
          enabled: true,
          patch: { incomingUrl: value.trim() },
        }),
    },
    {
      inputKey: "webhookPath",
      message: "Outgoing webhook path (optional)",
      placeholder: DEFAULT_WEBHOOK_PATH,
      required: false,
      applyEmptyValue: true,
      helpTitle: "Synology Chat outgoing webhook path",
      helpLines: [
        `Default path: ${DEFAULT_WEBHOOK_PATH}`,
        "Change this only if you need multiple Synology Chat webhook routes.",
      ],
      currentValue: ({ cfg, accountId }) => getRawAccountConfig(cfg, accountId).webhookPath?.trim(),
      keepPrompt: (value) => `Outgoing webhook path set (${value}). Keep it?`,
      validate: ({ value }) => validateWebhookPath(value),
      applySet: async ({ cfg, accountId, value }) =>
        patchSynologyChatAccountConfig({
          cfg,
          accountId,
          enabled: true,
          clearFields: value.trim() ? void 0 : ["webhookPath"],
          patch: value.trim() ? { webhookPath: value.trim() } : {},
        }),
    },
  ],
  allowFrom: createAllowFromSection({
    helpTitle: "Synology Chat allowlist",
    helpLines: SYNOLOGY_ALLOW_FROM_HELP_LINES,
    message: "Allowed Synology Chat user ids",
    placeholder: "123456, 987654",
    invalidWithoutCredentialNote: "Synology Chat user ids must be numeric.",
    parseInputs: splitSetupEntries,
    parseId: parseSynologyUserId,
    apply: async ({ cfg, accountId, allowFrom }) =>
      patchSynologyChatAccountConfig({
        cfg,
        accountId,
        enabled: true,
        patch: {
          dmPolicy: "allowlist",
          allowedUserIds: mergeAllowFromEntries(
            resolveExistingAllowedUserIds(cfg, accountId),
            allowFrom,
          ),
        },
      }),
  }),
  completionNote: {
    title: "Synology Chat access control",
    lines: [
      `Default outgoing webhook path: ${DEFAULT_WEBHOOK_PATH}`,
      'Set allowed user IDs, or manually switch `channels.synology-chat.dmPolicy` to `"open"` for public DMs.',
      'With `dmPolicy="allowlist"`, an empty allowedUserIds list blocks the route from starting.',
      `Docs: ${formatDocsLink("/channels/synology-chat", "channels/synology-chat")}`,
    ],
  },
  disable: (cfg) => setSetupChannelEnabled(cfg, channel$2, false),
};
//#endregion
//#region extensions/synology-chat/src/channel.ts
const CHANNEL_ID = "synology-chat";
const resolveSynologyChatDmPolicy = createScopedDmSecurityResolver({
  channelKey: CHANNEL_ID,
  resolvePolicy: (account) => account.dmPolicy,
  resolveAllowFrom: (account) => account.allowedUserIds,
  policyPathSuffix: "dmPolicy",
  defaultPolicy: "allowlist",
  approveHint: "openclaw pairing approve synology-chat <code>",
  normalizeEntry: (raw) => raw.toLowerCase().trim(),
});
const synologyChatConfigAdapter = createHybridChannelConfigAdapter({
  sectionKey: CHANNEL_ID,
  listAccountIds,
  resolveAccount,
  defaultAccountId: () => DEFAULT_ACCOUNT_ID,
  clearBaseFields: [
    "token",
    "incomingUrl",
    "nasHost",
    "webhookPath",
    "dangerouslyAllowNameMatching",
    "dangerouslyAllowInheritedWebhookPath",
    "dmPolicy",
    "allowedUserIds",
    "rateLimitPerMinute",
    "botName",
    "allowInsecureSsl",
  ],
  resolveAllowFrom: (account) => account.allowedUserIds,
  formatAllowFrom: (allowFrom) =>
    allowFrom.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean),
});
const collectSynologyChatSecurityWarnings = createConditionalWarningCollector(
  (account) =>
    !account.token &&
    "- Synology Chat: token is not configured. The webhook will reject all requests.",
  (account) =>
    !account.incomingUrl &&
    "- Synology Chat: incomingUrl is not configured. The bot cannot send replies.",
  (account) =>
    account.allowInsecureSsl &&
    "- Synology Chat: SSL verification is disabled (allowInsecureSsl=true). Only use this for local NAS with self-signed certificates.",
  (account) =>
    account.dangerouslyAllowNameMatching &&
    "- Synology Chat: dangerouslyAllowNameMatching=true re-enables mutable username/nickname recipient matching for replies. Prefer stable numeric user IDs.",
  (account) =>
    account.dangerouslyAllowInheritedWebhookPath &&
    account.webhookPathSource === "inherited-base" &&
    "- Synology Chat: dangerouslyAllowInheritedWebhookPath=true opts a named account into a shared inherited webhook path. Prefer an explicit per-account webhookPath.",
  (account) =>
    account.dmPolicy === "open" &&
    '- Synology Chat: dmPolicy="open" allows any user to message the bot. Consider "allowlist" for production use.',
  (account) =>
    account.dmPolicy === "allowlist" &&
    account.allowedUserIds.length === 0 &&
    '- Synology Chat: dmPolicy="allowlist" with empty allowedUserIds blocks all senders. Add users or set dmPolicy="open".',
);
const collectSynologyChatRoutingWarnings = projectAccountConfigWarningCollector(
  (cfg) => cfg,
  ({ account, cfg }) =>
    collectSynologyGatewayRoutingWarnings({
      account,
      cfg,
    }),
);
function resolveOutboundAccount(cfg, accountId) {
  return resolveAccount(cfg ?? {}, accountId);
}
function requireIncomingUrl(account) {
  if (!account.incomingUrl) throw new Error("Synology Chat incoming URL not configured");
  return account.incomingUrl;
}
function createSynologyChatPlugin() {
  return createChatChannelPlugin({
    base: {
      id: CHANNEL_ID,
      meta: {
        id: CHANNEL_ID,
        label: "Synology Chat",
        selectionLabel: "Synology Chat (Webhook)",
        detailLabel: "Synology Chat (Webhook)",
        docsPath: "/channels/synology-chat",
        blurb: "Connect your Synology NAS Chat to OpenClaw",
        order: 90,
      },
      capabilities: {
        chatTypes: ["direct"],
        media: true,
        threads: false,
        reactions: false,
        edit: false,
        unsend: false,
        reply: false,
        effects: false,
        blockStreaming: false,
      },
      reload: { configPrefixes: [`channels.${CHANNEL_ID}`] },
      configSchema: SynologyChatChannelConfigSchema,
      setup: synologyChatSetupAdapter,
      setupWizard: synologyChatSetupWizard,
      config: { ...synologyChatConfigAdapter },
      messaging: {
        normalizeTarget: (target) => {
          const trimmed = target.trim();
          if (!trimmed) return void 0;
          return trimmed.replace(/^synology[-_]?chat:/i, "").trim();
        },
        targetResolver: {
          looksLikeId: (id) => {
            const trimmed = id?.trim();
            if (!trimmed) return false;
            return /^\d+$/.test(trimmed) || /^synology[-_]?chat:/i.test(trimmed);
          },
          hint: "<userId>",
        },
      },
      directory: createEmptyChannelDirectoryAdapter(),
      gateway: {
        startAccount: async (ctx) => {
          const { cfg, accountId, log, abortSignal } = ctx;
          const account = resolveAccount(cfg, accountId);
          if (
            !validateSynologyGatewayAccountStartup({
              cfg,
              account,
              accountId,
              log,
            }).ok
          )
            return waitUntilAbort(abortSignal);
          log?.info?.(
            `Starting Synology Chat channel (account: ${accountId}, path: ${account.webhookPath})`,
          );
          const unregister = registerSynologyWebhookRoute({
            account,
            accountId,
            log,
          });
          log?.info?.(`Registered HTTP route: ${account.webhookPath} for Synology Chat`);
          return waitUntilAbort(abortSignal, () => {
            log?.info?.(`Stopping Synology Chat channel (account: ${accountId})`);
            unregister();
          });
        },
        stopAccount: async (ctx) => {
          ctx.log?.info?.(`Synology Chat account ${ctx.accountId} stopped`);
        },
      },
      agentPrompt: {
        messageToolHints: () => [
          "",
          "### Synology Chat Formatting",
          "Synology Chat supports limited formatting. Use these patterns:",
          "",
          "**Links**: Use `<URL|display text>` to create clickable links.",
          "  Example: `<https://example.com|Click here>` renders as a clickable link.",
          "",
          "**File sharing**: Include a publicly accessible URL to share files or images.",
          "  The NAS will download and attach the file (max 32 MB).",
          "",
          "**Limitations**:",
          "- No markdown, bold, italic, or code blocks",
          "- No buttons, cards, or interactive elements",
          "- No message editing after send",
          "- Keep messages under 2000 characters for best readability",
          "",
          "**Best practices**:",
          "- Use short, clear responses (Synology Chat has a minimal UI)",
          "- Use line breaks to separate sections",
          "- Use numbered or bulleted lists for clarity",
          "- Wrap URLs with `<URL|label>` for user-friendly links",
        ],
      },
    },
    pairing: {
      text: {
        idLabel: "synologyChatUserId",
        message: "OpenClaw: your access has been approved.",
        normalizeAllowEntry: (entry) => entry.toLowerCase().trim(),
        notify: async ({ cfg, id, message }) => {
          const account = resolveAccount(cfg);
          if (!account.incomingUrl) return;
          await sendMessage(account.incomingUrl, message, id, account.allowInsecureSsl);
        },
      },
    },
    security: {
      resolveDmPolicy: resolveSynologyChatDmPolicy,
      collectWarnings: composeWarningCollectors(
        projectAccountWarningCollector(collectSynologyChatSecurityWarnings),
        collectSynologyChatRoutingWarnings,
      ),
    },
    outbound: {
      deliveryMode: "gateway",
      textChunkLimit: 2e3,
      sendText: async ({ to, text, accountId, cfg }) => {
        const account = resolveOutboundAccount(cfg ?? {}, accountId);
        if (!(await sendMessage(requireIncomingUrl(account), text, to, account.allowInsecureSsl)))
          throw new Error("Failed to send message to Synology Chat");
        return attachChannelToResult(CHANNEL_ID, {
          messageId: `sc-${Date.now()}`,
          chatId: to,
        });
      },
      sendMedia: async ({ to, mediaUrl, accountId, cfg }) => {
        const account = resolveOutboundAccount(cfg ?? {}, accountId);
        const incomingUrl = requireIncomingUrl(account);
        if (!mediaUrl) throw new Error("No media URL provided");
        if (!(await sendFileUrl(incomingUrl, mediaUrl, to, account.allowInsecureSsl)))
          throw new Error("Failed to send media to Synology Chat");
        return attachChannelToResult(CHANNEL_ID, {
          messageId: `sc-${Date.now()}`,
          chatId: to,
        });
      },
    },
  });
}
const synologyChatPlugin = createSynologyChatPlugin();
defineChannelPluginEntry({
  id: "synology-chat",
  name: "Synology Chat",
  description: "Native Synology Chat channel plugin for OpenClaw",
  plugin: synologyChatPlugin,
  setRuntime: setSynologyRuntime,
});
//#endregion
//#region extensions/telegram/src/runtime.ts
const { setRuntime: setTelegramRuntime, getRuntime: getTelegramRuntime } = createPluginRuntimeStore(
  "Telegram runtime not initialized",
);
//#endregion
//#region extensions/telegram/src/setup-core.ts
const channel$1 = "telegram";
const TELEGRAM_TOKEN_HELP_LINES = [
  "1) Open Telegram and chat with @BotFather",
  "2) Run /newbot (or /mybots)",
  "3) Copy the token (looks like 123456:ABC...)",
  "Tip: you can also set TELEGRAM_BOT_TOKEN in your env.",
  `Docs: ${formatDocsLink("/telegram")}`,
  "Website: https://openclaw.ai",
];
const TELEGRAM_USER_ID_HELP_LINES = [
  `1) DM your bot, then read from.id in \`${formatCliCommand("openclaw logs --follow")}\` (safest)`,
  "2) Or call https://api.telegram.org/bot<bot_token>/getUpdates and read message.from.id",
  "3) Third-party: DM @userinfobot or @getidsbot",
  `Docs: ${formatDocsLink("/telegram")}`,
  "Website: https://openclaw.ai",
];
function normalizeTelegramAllowFromInput(raw) {
  return raw
    .trim()
    .replace(/^(telegram|tg):/i, "")
    .trim();
}
function parseTelegramAllowFromId(raw) {
  const stripped = normalizeTelegramAllowFromInput(raw);
  return /^\d+$/.test(stripped) ? stripped : null;
}
async function resolveTelegramAllowFromEntries(params) {
  return await Promise.all(
    params.entries.map(async (entry) => {
      const numericId = parseTelegramAllowFromId(entry);
      if (numericId)
        return {
          input: entry,
          resolved: true,
          id: numericId,
        };
      const stripped = normalizeTelegramAllowFromInput(entry);
      if (!stripped || !params.credentialValue?.trim())
        return {
          input: entry,
          resolved: false,
          id: null,
        };
      const username = stripped.startsWith("@") ? stripped : `@${stripped}`;
      const id = await lookupTelegramChatId({
        token: params.credentialValue,
        chatId: username,
        apiRoot: params.apiRoot,
        proxyUrl: params.proxyUrl,
        network: params.network,
      });
      return {
        input: entry,
        resolved: Boolean(id),
        id,
      };
    }),
  );
}
async function promptTelegramAllowFromForAccount(params) {
  const accountId = params.accountId ?? resolveDefaultTelegramAccountId(params.cfg);
  const resolved = resolveTelegramAccount({
    cfg: params.cfg,
    accountId,
  });
  await params.prompter.note(TELEGRAM_USER_ID_HELP_LINES.join("\n"), "Telegram user id");
  if (!resolved.token?.trim())
    await params.prompter.note(
      "Telegram token missing; username lookup is unavailable.",
      "Telegram",
    );
  const unique = await promptResolvedAllowFrom({
    prompter: params.prompter,
    existing: resolved.config.allowFrom ?? [],
    token: resolved.token,
    message: "Telegram allowFrom (numeric sender id; @username resolves to id)",
    placeholder: "@username",
    label: "Telegram allowlist",
    parseInputs: splitSetupEntries,
    parseId: parseTelegramAllowFromId,
    invalidWithoutTokenNote:
      "Telegram token missing; use numeric sender ids (usernames require a bot token).",
    resolveEntries: async ({ entries, token }) =>
      resolveTelegramAllowFromEntries({
        credentialValue: token,
        entries,
        apiRoot: resolved.config.apiRoot,
        proxyUrl: resolved.config.proxy,
        network: resolved.config.network,
      }),
  });
  return patchChannelConfigForAccount({
    cfg: params.cfg,
    channel: channel$1,
    accountId,
    patch: {
      dmPolicy: "allowlist",
      allowFrom: unique,
    },
  });
}
const telegramSetupAdapter = createEnvPatchedAccountSetupAdapter({
  channelKey: channel$1,
  defaultAccountOnlyEnvError: "TELEGRAM_BOT_TOKEN can only be used for the default account.",
  missingCredentialError: "Telegram requires token or --token-file (or --use-env).",
  hasCredentials: (input) => Boolean(input.token || input.tokenFile),
  buildPatch: (input) =>
    input.tokenFile ? { tokenFile: input.tokenFile } : input.token ? { botToken: input.token } : {},
});
//#endregion
//#region extensions/telegram/src/setup-surface.ts
const channel = "telegram";
function ensureTelegramDefaultGroupMentionGate(cfg, accountId) {
  const resolved = resolveTelegramAccount({
    cfg,
    accountId,
  });
  const wildcardGroup = resolved.config.groups?.["*"];
  if (wildcardGroup?.requireMention !== void 0) return cfg;
  return patchChannelConfigForAccount({
    cfg,
    channel,
    accountId,
    patch: {
      groups: {
        ...resolved.config.groups,
        "*": {
          ...wildcardGroup,
          requireMention: true,
        },
      },
    },
  });
}
function shouldShowTelegramDmAccessWarning(cfg, accountId) {
  const merged = mergeTelegramAccountConfig(cfg, accountId);
  const policy = merged.dmPolicy ?? "pairing";
  const hasAllowFrom =
    Array.isArray(merged.allowFrom) && merged.allowFrom.some((e) => String(e).trim());
  return policy === "pairing" && !hasAllowFrom;
}
function buildTelegramDmAccessWarningLines(accountId) {
  const configBase =
    accountId === "default" ? "channels.telegram" : `channels.telegram.accounts.${accountId}`;
  return [
    "Your bot is using DM policy: pairing.",
    "Any Telegram user who discovers the bot can send pairing requests.",
    "For private use, configure an allowlist with your Telegram user id:",
    "  " + formatCliCommand(`openclaw config set ${configBase}.dmPolicy "allowlist"`),
    "  " + formatCliCommand(`openclaw config set ${configBase}.allowFrom '["YOUR_USER_ID"]'`),
    `Docs: ${formatDocsLink("/channels/pairing", "channels/pairing")}`,
  ];
}
const dmPolicy = {
  label: "Telegram",
  channel,
  policyKey: "channels.telegram.dmPolicy",
  allowFromKey: "channels.telegram.allowFrom",
  getCurrent: (cfg) => cfg.channels?.telegram?.dmPolicy ?? "pairing",
  setPolicy: (cfg, policy) =>
    setChannelDmPolicyWithAllowFrom({
      cfg,
      channel,
      dmPolicy: policy,
    }),
  promptAllowFrom: promptTelegramAllowFromForAccount,
};
const telegramSetupWizard = {
  channel,
  status: createStandardChannelSetupStatus({
    channelLabel: "Telegram",
    configuredLabel: "configured",
    unconfiguredLabel: "needs token",
    configuredHint: "recommended · configured",
    unconfiguredHint: "recommended · newcomer-friendly",
    configuredScore: 1,
    unconfiguredScore: 10,
    resolveConfigured: ({ cfg }) =>
      listTelegramAccountIds(cfg).some((accountId) => {
        return inspectTelegramAccount({
          cfg,
          accountId,
        }).configured;
      }),
  }),
  prepare: async ({ cfg, accountId, credentialValues }) => ({
    cfg: ensureTelegramDefaultGroupMentionGate(cfg, accountId),
    credentialValues,
  }),
  credentials: [
    {
      inputKey: "token",
      providerHint: channel,
      credentialLabel: "Telegram bot token",
      preferredEnvVar: "TELEGRAM_BOT_TOKEN",
      helpTitle: "Telegram bot token",
      helpLines: TELEGRAM_TOKEN_HELP_LINES,
      envPrompt: "TELEGRAM_BOT_TOKEN detected. Use env var?",
      keepPrompt: "Telegram token already configured. Keep it?",
      inputPrompt: "Enter Telegram bot token",
      allowEnv: ({ accountId }) => accountId === DEFAULT_ACCOUNT_ID,
      inspect: ({ cfg, accountId }) => {
        const resolved = resolveTelegramAccount({
          cfg,
          accountId,
        });
        const hasConfiguredValue =
          hasConfiguredSecretInput(resolved.config.botToken) ||
          Boolean(resolved.config.tokenFile?.trim());
        return {
          accountConfigured: Boolean(resolved.token) || hasConfiguredValue,
          hasConfiguredValue,
          resolvedValue: resolved.token?.trim() || void 0,
          envValue:
            accountId === "default" ? process.env.TELEGRAM_BOT_TOKEN?.trim() || void 0 : void 0,
        };
      },
    },
  ],
  allowFrom: createAllowFromSection({
    helpTitle: "Telegram user id",
    helpLines: TELEGRAM_USER_ID_HELP_LINES,
    credentialInputKey: "token",
    message: "Telegram allowFrom (numeric sender id; @username resolves to id)",
    placeholder: "@username",
    invalidWithoutCredentialNote:
      "Telegram token missing; use numeric sender ids (usernames require a bot token).",
    parseInputs: splitSetupEntries,
    parseId: parseTelegramAllowFromId,
    resolveEntries: async ({ cfg, accountId, credentialValues, entries }) =>
      resolveTelegramAllowFromEntries({
        credentialValue: credentialValues.token,
        entries,
        apiRoot: resolveTelegramAccount({
          cfg,
          accountId,
        }).config.apiRoot,
      }),
    apply: async ({ cfg, accountId, allowFrom }) =>
      patchChannelConfigForAccount({
        cfg,
        channel,
        accountId,
        patch: {
          dmPolicy: "allowlist",
          allowFrom,
        },
      }),
  }),
  finalize: async ({ cfg, accountId, prompter }) => {
    if (!shouldShowTelegramDmAccessWarning(cfg, accountId)) return;
    await prompter.note(
      buildTelegramDmAccessWarningLines(accountId).join("\n"),
      "Telegram DM access warning",
    );
  },
  dmPolicy,
  disable: (cfg) => setSetupChannelEnabled(cfg, channel, false),
};
//#endregion
//#region extensions/telegram/src/shared.ts
const TELEGRAM_CHANNEL = "telegram";
function findTelegramTokenOwnerAccountId(params) {
  const normalizedAccountId = normalizeAccountId(params.accountId);
  const tokenOwners = /* @__PURE__ */ new Map();
  for (const id of listTelegramAccountIds(params.cfg)) {
    const account = inspectTelegramAccount({
      cfg: params.cfg,
      accountId: id,
    });
    const token = (account.token ?? "").trim();
    if (!token) continue;
    const ownerAccountId = tokenOwners.get(token);
    if (!ownerAccountId) {
      tokenOwners.set(token, account.accountId);
      continue;
    }
    if (account.accountId === normalizedAccountId) return ownerAccountId;
  }
  return null;
}
function formatDuplicateTelegramTokenReason(params) {
  return `Duplicate Telegram bot token: account "${params.accountId}" shares a token with account "${params.ownerAccountId}". Keep one owner account per bot token.`;
}
const telegramConfigAdapter = createScopedChannelConfigAdapter({
  sectionKey: TELEGRAM_CHANNEL,
  listAccountIds: listTelegramAccountIds,
  resolveAccount: adaptScopedAccountAccessor(resolveTelegramAccount),
  inspectAccount: adaptScopedAccountAccessor(inspectTelegramAccount),
  defaultAccountId: resolveDefaultTelegramAccountId,
  clearBaseFields: ["botToken", "tokenFile", "name"],
  resolveAllowFrom: (account) => account.config.allowFrom,
  formatAllowFrom: (allowFrom) =>
    formatAllowFromLowercase({
      allowFrom,
      stripPrefixRe: /^(telegram|tg):/i,
    }),
  resolveDefaultTo: (account) => account.config.defaultTo,
});
function createTelegramPluginBase(params) {
  return createChannelPluginBase({
    id: TELEGRAM_CHANNEL,
    meta: {
      ...getChatChannelMeta(TELEGRAM_CHANNEL),
      quickstartAllowFrom: true,
    },
    setupWizard: params.setupWizard,
    capabilities: {
      chatTypes: ["direct", "group", "channel", "thread"],
      reactions: true,
      threads: true,
      media: true,
      polls: true,
      nativeCommands: true,
      blockStreaming: true,
    },
    reload: { configPrefixes: ["channels.telegram"] },
    configSchema: buildChannelConfigSchema(TelegramConfigSchema),
    config: {
      ...telegramConfigAdapter,
      isConfigured: (account, cfg) => {
        if (!account.token?.trim()) return false;
        return !findTelegramTokenOwnerAccountId({
          cfg,
          accountId: account.accountId,
        });
      },
      unconfiguredReason: (account, cfg) => {
        if (!account.token?.trim()) return "not configured";
        const ownerAccountId = findTelegramTokenOwnerAccountId({
          cfg,
          accountId: account.accountId,
        });
        if (!ownerAccountId) return "not configured";
        return formatDuplicateTelegramTokenReason({
          accountId: account.accountId,
          ownerAccountId,
        });
      },
      describeAccount: (account, cfg) => ({
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured:
          Boolean(account.token?.trim()) &&
          !findTelegramTokenOwnerAccountId({
            cfg,
            accountId: account.accountId,
          }),
        tokenSource: account.tokenSource,
      }),
    },
    setup: params.setup,
  });
}
//#endregion
//#region extensions/telegram/src/channel.ts
function buildTelegramSendOptions(params) {
  return {
    verbose: false,
    cfg: params.cfg,
    ...(params.mediaUrl ? { mediaUrl: params.mediaUrl } : {}),
    ...(params.mediaLocalRoots?.length ? { mediaLocalRoots: params.mediaLocalRoots } : {}),
    messageThreadId: parseTelegramThreadId(params.threadId),
    replyToMessageId: parseTelegramReplyToMessageId(params.replyToId),
    accountId: params.accountId ?? void 0,
    silent: params.silent ?? void 0,
    forceDocument: params.forceDocument ?? void 0,
  };
}
async function sendTelegramOutbound(params) {
  return await (
    resolveOutboundSendDep(params.deps, "telegram") ??
    getTelegramRuntime().channel.telegram.sendMessageTelegram
  )(
    params.to,
    params.text,
    buildTelegramSendOptions({
      cfg: params.cfg,
      mediaUrl: params.mediaUrl,
      mediaLocalRoots: params.mediaLocalRoots,
      accountId: params.accountId,
      replyToId: params.replyToId,
      threadId: params.threadId,
      silent: params.silent,
    }),
  );
}
function resolveTelegramAutoThreadId(params) {
  const context = params.toolContext;
  if (!context?.currentThreadTs || !context.currentChannelId) return;
  const parsedTo = parseTelegramTarget(params.to);
  const parsedChannel = parseTelegramTarget(context.currentChannelId);
  if (parsedTo.chatId.toLowerCase() !== parsedChannel.chatId.toLowerCase()) return;
  return context.currentThreadTs;
}
function normalizeTelegramAcpConversationId(conversationId) {
  const parsed = parseTelegramTopicConversation({ conversationId });
  if (!parsed || !parsed.chatId.startsWith("-")) return null;
  return {
    conversationId: parsed.canonicalConversationId,
    parentConversationId: parsed.chatId,
  };
}
function matchTelegramAcpConversation(params) {
  const binding = normalizeTelegramAcpConversationId(params.bindingConversationId);
  if (!binding) return null;
  const incoming = parseTelegramTopicConversation({
    conversationId: params.conversationId,
    parentConversationId: params.parentConversationId,
  });
  if (!incoming || !incoming.chatId.startsWith("-")) return null;
  if (binding.conversationId !== incoming.canonicalConversationId) return null;
  return {
    conversationId: incoming.canonicalConversationId,
    parentConversationId: incoming.chatId,
    matchPriority: 2,
  };
}
function parseTelegramExplicitTarget(raw) {
  const target = parseTelegramTarget(raw);
  return {
    to: target.chatId,
    threadId: target.messageThreadId,
    chatType: target.chatType === "unknown" ? void 0 : target.chatType,
  };
}
function buildTelegramBaseSessionKey(params) {
  return buildOutboundBaseSessionKey({
    ...params,
    channel: "telegram",
  });
}
function resolveTelegramOutboundSessionRoute(params) {
  const parsed = parseTelegramTarget(params.target);
  const chatId = parsed.chatId.trim();
  if (!chatId) return null;
  const fallbackThreadId = normalizeOutboundThreadId(params.threadId);
  const resolvedThreadId = parsed.messageThreadId ?? parseTelegramThreadId(fallbackThreadId);
  const isGroup =
    parsed.chatType === "group" ||
    (parsed.chatType === "unknown" &&
      params.resolvedTarget?.kind &&
      params.resolvedTarget.kind !== "user");
  const peerId =
    isGroup && resolvedThreadId ? buildTelegramGroupPeerId(chatId, resolvedThreadId) : chatId;
  const peer = {
    kind: isGroup ? "group" : "direct",
    id: peerId,
  };
  const baseSessionKey = buildTelegramBaseSessionKey({
    cfg: params.cfg,
    agentId: params.agentId,
    accountId: params.accountId,
    peer,
  });
  return {
    sessionKey:
      (resolvedThreadId && !isGroup
        ? resolveThreadSessionKeys$1({
            baseSessionKey,
            threadId: String(resolvedThreadId),
          })
        : null
      )?.sessionKey ?? baseSessionKey,
    baseSessionKey,
    peer,
    chatType: isGroup ? "group" : "direct",
    from: isGroup
      ? `telegram:group:${peerId}`
      : resolvedThreadId
        ? `telegram:${chatId}:topic:${resolvedThreadId}`
        : `telegram:${chatId}`,
    to: `telegram:${chatId}`,
    threadId: resolvedThreadId,
  };
}
function hasTelegramExecApprovalDmRoute(cfg) {
  return listTelegramAccountIds(cfg).some((accountId) => {
    if (
      !isTelegramExecApprovalClientEnabled({
        cfg,
        accountId,
      })
    )
      return false;
    const target = resolveTelegramExecApprovalTarget({
      cfg,
      accountId,
    });
    return target === "dm" || target === "both";
  });
}
const telegramMessageActions = {
  describeMessageTool: (ctx) =>
    getTelegramRuntime().channel.telegram.messageActions?.describeMessageTool?.(ctx) ?? null,
  extractToolSend: (ctx) =>
    getTelegramRuntime().channel.telegram.messageActions?.extractToolSend?.(ctx) ?? null,
  handleAction: async (ctx) => {
    const ma = getTelegramRuntime().channel.telegram.messageActions;
    if (!ma?.handleAction) throw new Error("Telegram message actions not available");
    return ma.handleAction(ctx);
  },
};
const resolveTelegramAllowlistGroupOverrides = createNestedAllowlistOverrideResolver({
  resolveRecord: (account) => account.config.groups,
  outerLabel: (groupId) => groupId,
  resolveOuterEntries: (groupCfg) => groupCfg?.allowFrom,
  resolveChildren: (groupCfg) => groupCfg?.topics,
  innerLabel: (groupId, topicId) => `${groupId} topic ${topicId}`,
  resolveInnerEntries: (topicCfg) => topicCfg?.allowFrom,
});
const collectTelegramSecurityWarnings = createAllowlistProviderRouteAllowlistWarningCollector({
  providerConfigPresent: (cfg) => cfg.channels?.telegram !== void 0,
  resolveGroupPolicy: (account) => account.config.groupPolicy,
  resolveRouteAllowlistConfigured: (account) =>
    Boolean(account.config.groups) && Object.keys(account.config.groups ?? {}).length > 0,
  restrictSenders: {
    surface: "Telegram groups",
    openScope: "any member in allowed groups",
    groupPolicyPath: "channels.telegram.groupPolicy",
    groupAllowFromPath: "channels.telegram.groupAllowFrom",
  },
  noRouteAllowlist: {
    surface: "Telegram groups",
    routeAllowlistPath: "channels.telegram.groups",
    routeScope: "group",
    groupPolicyPath: "channels.telegram.groupPolicy",
    groupAllowFromPath: "channels.telegram.groupAllowFrom",
  },
});
const telegramPlugin = createChatChannelPlugin({
  base: {
    ...createTelegramPluginBase({
      setupWizard: telegramSetupWizard,
      setup: telegramSetupAdapter,
    }),
    allowlist: buildDmGroupAccountAllowlistAdapter({
      channelId: "telegram",
      resolveAccount: resolveTelegramAccount,
      normalize: ({ cfg, accountId, values }) =>
        telegramConfigAdapter.formatAllowFrom({
          cfg,
          accountId,
          allowFrom: values,
        }),
      resolveDmAllowFrom: (account) => account.config.allowFrom,
      resolveGroupAllowFrom: (account) => account.config.groupAllowFrom,
      resolveDmPolicy: (account) => account.config.dmPolicy,
      resolveGroupPolicy: (account) => account.config.groupPolicy,
      resolveGroupOverrides: resolveTelegramAllowlistGroupOverrides,
    }),
    bindings: {
      compileConfiguredBinding: ({ conversationId }) =>
        normalizeTelegramAcpConversationId(conversationId),
      matchInboundConversation: ({ compiledBinding, conversationId, parentConversationId }) =>
        matchTelegramAcpConversation({
          bindingConversationId: compiledBinding.conversationId,
          conversationId,
          parentConversationId,
        }),
    },
    groups: {
      resolveRequireMention: resolveTelegramGroupRequireMention,
      resolveToolPolicy: resolveTelegramGroupToolPolicy,
    },
    messaging: {
      normalizeTarget: normalizeTelegramMessagingTarget,
      parseExplicitTarget: ({ raw }) => parseTelegramExplicitTarget(raw),
      inferTargetChatType: ({ to }) => parseTelegramExplicitTarget(to).chatType,
      formatTargetDisplay: ({ target, display, kind }) => {
        const formatted = display?.trim();
        if (formatted) return formatted;
        const trimmedTarget = target.trim();
        if (!trimmedTarget) return trimmedTarget;
        const withoutProvider = trimmedTarget.replace(/^(telegram|tg):/i, "");
        if (kind === "user" || /^user:/i.test(withoutProvider))
          return `@${withoutProvider.replace(/^user:/i, "")}`;
        if (/^channel:/i.test(withoutProvider))
          return `#${withoutProvider.replace(/^channel:/i, "")}`;
        return withoutProvider;
      },
      resolveOutboundSessionRoute: (params) => resolveTelegramOutboundSessionRoute(params),
      targetResolver: {
        looksLikeId: looksLikeTelegramTargetId,
        hint: "<chatId>",
      },
    },
    lifecycle: {
      onAccountConfigChanged: async ({ prevCfg, nextCfg, accountId }) => {
        if (
          resolveTelegramAccount({
            cfg: prevCfg,
            accountId,
          }).token.trim() !==
          resolveTelegramAccount({
            cfg: nextCfg,
            accountId,
          }).token.trim()
        ) {
          const { deleteTelegramUpdateOffset } = await import("./update-offset-store-L2Tx_LNc.js");
          await deleteTelegramUpdateOffset({ accountId });
        }
      },
      onAccountRemoved: async ({ accountId }) => {
        const { deleteTelegramUpdateOffset } = await import("./update-offset-store-L2Tx_LNc.js");
        await deleteTelegramUpdateOffset({ accountId });
      },
    },
    execApprovals: {
      getInitiatingSurfaceState: ({ cfg, accountId }) =>
        isTelegramExecApprovalClientEnabled({
          cfg,
          accountId,
        })
          ? { kind: "enabled" }
          : { kind: "disabled" },
      hasConfiguredDmRoute: ({ cfg }) => hasTelegramExecApprovalDmRoute(cfg),
      shouldSuppressForwardingFallback: ({ cfg, target, request }) => {
        if ((normalizeMessageChannel(target.channel) ?? target.channel) !== "telegram")
          return false;
        if (normalizeMessageChannel(request.request.turnSourceChannel ?? "") !== "telegram")
          return false;
        return isTelegramExecApprovalClientEnabled({
          cfg,
          accountId: target.accountId?.trim() || request.request.turnSourceAccountId?.trim(),
        });
      },
      buildPendingPayload: ({ request, nowMs }) => {
        const payload = buildExecApprovalPendingReplyPayload({
          approvalId: request.id,
          approvalSlug: request.id.slice(0, 8),
          approvalCommandId: request.id,
          command: resolveExecApprovalCommandDisplay(request.request).commandText,
          cwd: request.request.cwd ?? void 0,
          host: request.request.host === "node" ? "node" : "gateway",
          nodeId: request.request.nodeId ?? void 0,
          expiresAtMs: request.expiresAtMs,
          nowMs,
        });
        const buttons = buildTelegramExecApprovalButtons(request.id);
        if (!buttons) return payload;
        return {
          ...payload,
          channelData: {
            ...payload.channelData,
            telegram: { buttons },
          },
        };
      },
      beforeDeliverPending: async ({ cfg, target, payload }) => {
        if (
          !(
            payload.channelData &&
            typeof payload.channelData === "object" &&
            !Array.isArray(payload.channelData) &&
            payload.channelData.execApproval
          )
        )
          return;
        const threadId =
          typeof target.threadId === "number"
            ? target.threadId
            : typeof target.threadId === "string"
              ? Number.parseInt(target.threadId, 10)
              : void 0;
        await sendTypingTelegram(target.to, {
          cfg,
          accountId: target.accountId ?? void 0,
          ...(Number.isFinite(threadId) ? { messageThreadId: threadId } : {}),
        }).catch(() => {});
      },
    },
    directory: createChannelDirectoryAdapter({
      listPeers: async (params) => listTelegramDirectoryPeersFromConfig(params),
      listGroups: async (params) => listTelegramDirectoryGroupsFromConfig(params),
    }),
    actions: telegramMessageActions,
    status: createComputedAccountStatusAdapter({
      defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID),
      collectStatusIssues: collectTelegramStatusIssues,
      buildChannelSummary: ({ snapshot }) => buildTokenChannelStatusSummary(snapshot),
      probeAccount: async ({ account, timeoutMs }) =>
        probeTelegram(account.token, timeoutMs, {
          accountId: account.accountId,
          proxyUrl: account.config.proxy,
          network: account.config.network,
          apiRoot: account.config.apiRoot,
        }),
      formatCapabilitiesProbe: ({ probe }) => {
        const lines = [];
        if (probe?.bot?.username) {
          const botId = probe.bot.id ? ` (${probe.bot.id})` : "";
          lines.push({ text: `Bot: @${probe.bot.username}${botId}` });
        }
        const flags = [];
        if (typeof probe?.bot?.canJoinGroups === "boolean")
          flags.push(`joinGroups=${probe.bot.canJoinGroups}`);
        if (typeof probe?.bot?.canReadAllGroupMessages === "boolean")
          flags.push(`readAllGroupMessages=${probe.bot.canReadAllGroupMessages}`);
        if (typeof probe?.bot?.supportsInlineQueries === "boolean")
          flags.push(`inlineQueries=${probe.bot.supportsInlineQueries}`);
        if (flags.length > 0) lines.push({ text: `Flags: ${flags.join(" ")}` });
        if (probe?.webhook?.url !== void 0)
          lines.push({ text: `Webhook: ${probe.webhook.url || "none"}` });
        return lines;
      },
      auditAccount: async ({ account, timeoutMs, probe, cfg }) => {
        const { groupIds, unresolvedGroups, hasWildcardUnmentionedGroups } =
          collectTelegramUnmentionedGroupIds(
            cfg.channels?.telegram?.accounts?.[account.accountId]?.groups ??
              cfg.channels?.telegram?.groups,
          );
        if (!groupIds.length && unresolvedGroups === 0 && !hasWildcardUnmentionedGroups) return;
        const botId = probe?.ok && probe.bot?.id != null ? probe.bot.id : null;
        if (!botId)
          return {
            ok: unresolvedGroups === 0 && !hasWildcardUnmentionedGroups,
            checkedGroups: 0,
            unresolvedGroups,
            hasWildcardUnmentionedGroups,
            groups: [],
            elapsedMs: 0,
          };
        return {
          ...(await auditTelegramGroupMembership({
            token: account.token,
            botId,
            groupIds,
            proxyUrl: account.config.proxy,
            network: account.config.network,
            apiRoot: account.config.apiRoot,
            timeoutMs,
          })),
          unresolvedGroups,
          hasWildcardUnmentionedGroups,
        };
      },
      resolveAccountSnapshot: ({ account, cfg, runtime, audit }) => {
        const configuredFromStatus = resolveConfiguredFromCredentialStatuses(account);
        const ownerAccountId = findTelegramTokenOwnerAccountId({
          cfg,
          accountId: account.accountId,
        });
        const duplicateTokenReason = ownerAccountId
          ? formatDuplicateTelegramTokenReason({
              accountId: account.accountId,
              ownerAccountId,
            })
          : null;
        const configured =
          (configuredFromStatus ?? Boolean(account.token?.trim())) && !ownerAccountId;
        const groups =
          cfg.channels?.telegram?.accounts?.[account.accountId]?.groups ??
          cfg.channels?.telegram?.groups;
        const allowUnmentionedGroups =
          groups?.["*"]?.requireMention === false ||
          Object.entries(groups ?? {}).some(
            ([key, value]) => key !== "*" && value?.requireMention === false,
          );
        return {
          accountId: account.accountId,
          name: account.name,
          enabled: account.enabled,
          configured,
          extra: {
            ...projectCredentialSnapshotFields(account),
            lastError: runtime?.lastError ?? duplicateTokenReason,
            mode: runtime?.mode ?? (account.config.webhookUrl ? "webhook" : "polling"),
            audit,
            allowUnmentionedGroups,
          },
        };
      },
    }),
    gateway: {
      startAccount: async (ctx) => {
        const account = ctx.account;
        const ownerAccountId = findTelegramTokenOwnerAccountId({
          cfg: ctx.cfg,
          accountId: account.accountId,
        });
        if (ownerAccountId) {
          const reason = formatDuplicateTelegramTokenReason({
            accountId: account.accountId,
            ownerAccountId,
          });
          ctx.log?.error?.(`[${account.accountId}] ${reason}`);
          throw new Error(reason);
        }
        const token = (account.token ?? "").trim();
        let telegramBotLabel = "";
        try {
          const probe = await probeTelegram(token, 2500, {
            accountId: account.accountId,
            proxyUrl: account.config.proxy,
            network: account.config.network,
            apiRoot: account.config.apiRoot,
          });
          const username = probe.ok ? probe.bot?.username?.trim() : null;
          if (username) telegramBotLabel = ` (@${username})`;
        } catch (err) {
          if (getTelegramRuntime().logging.shouldLogVerbose())
            ctx.log?.debug?.(`[${account.accountId}] bot probe failed: ${String(err)}`);
        }
        ctx.log?.info(`[${account.accountId}] starting provider${telegramBotLabel}`);
        return monitorTelegramProvider({
          token,
          accountId: account.accountId,
          config: ctx.cfg,
          runtime: ctx.runtime,
          abortSignal: ctx.abortSignal,
          useWebhook: Boolean(account.config.webhookUrl),
          webhookUrl: account.config.webhookUrl,
          webhookSecret: account.config.webhookSecret,
          webhookPath: account.config.webhookPath,
          webhookHost: account.config.webhookHost,
          webhookPort: account.config.webhookPort,
          webhookCertPath: account.config.webhookCertPath,
        });
      },
      logoutAccount: async ({ accountId, cfg }) => {
        const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
        const nextCfg = { ...cfg };
        const nextTelegram = cfg.channels?.telegram ? { ...cfg.channels.telegram } : void 0;
        let cleared = false;
        let changed = false;
        if (nextTelegram) {
          if (accountId === "default" && nextTelegram.botToken) {
            delete nextTelegram.botToken;
            cleared = true;
            changed = true;
          }
          const accountCleanup = clearAccountEntryFields({
            accounts: nextTelegram.accounts,
            accountId,
            fields: ["botToken"],
          });
          if (accountCleanup.changed) {
            changed = true;
            if (accountCleanup.cleared) cleared = true;
            if (accountCleanup.nextAccounts) nextTelegram.accounts = accountCleanup.nextAccounts;
            else delete nextTelegram.accounts;
          }
        }
        if (changed)
          if (nextTelegram && Object.keys(nextTelegram).length > 0)
            nextCfg.channels = {
              ...nextCfg.channels,
              telegram: nextTelegram,
            };
          else {
            const nextChannels = { ...nextCfg.channels };
            delete nextChannels.telegram;
            if (Object.keys(nextChannels).length > 0) nextCfg.channels = nextChannels;
            else delete nextCfg.channels;
          }
        const loggedOut =
          resolveTelegramAccount({
            cfg: changed ? nextCfg : cfg,
            accountId,
          }).tokenSource === "none";
        if (changed) await getTelegramRuntime().config.writeConfigFile(nextCfg);
        return {
          cleared,
          envToken: Boolean(envToken),
          loggedOut,
        };
      },
    },
  },
  pairing: {
    text: {
      idLabel: "telegramUserId",
      message: PAIRING_APPROVED_MESSAGE,
      normalizeAllowEntry: createPairingPrefixStripper(/^(telegram|tg):/i),
      notify: async ({ cfg, id, message }) => {
        const { token } = getTelegramRuntime().channel.telegram.resolveTelegramToken(cfg);
        if (!token) throw new Error("telegram token not configured");
        await getTelegramRuntime().channel.telegram.sendMessageTelegram(id, message, { token });
      },
    },
  },
  security: {
    dm: {
      channelKey: "telegram",
      resolvePolicy: (account) => account.config.dmPolicy,
      resolveAllowFrom: (account) => account.config.allowFrom,
      policyPathSuffix: "dmPolicy",
      normalizeEntry: (raw) => raw.replace(/^(telegram|tg):/i, ""),
    },
    collectWarnings: collectTelegramSecurityWarnings,
  },
  threading: {
    topLevelReplyToMode: "telegram",
    resolveAutoThreadId: ({ to, toolContext, replyToId }) =>
      replyToId
        ? void 0
        : resolveTelegramAutoThreadId({
            to,
            toolContext,
          }),
  },
  outbound: {
    base: {
      deliveryMode: "direct",
      chunker: (text, limit) => getTelegramRuntime().channel.text.chunkMarkdownText(text, limit),
      chunkerMode: "markdown",
      textChunkLimit: 4e3,
      pollMaxOptions: 10,
      shouldSkipPlainTextSanitization: ({ payload }) => Boolean(payload.channelData),
      resolveEffectiveTextChunkLimit: ({ fallbackLimit }) =>
        typeof fallbackLimit === "number" ? Math.min(fallbackLimit, 4096) : 4096,
      sendPayload: async ({
        cfg,
        to,
        payload,
        mediaLocalRoots,
        accountId,
        deps,
        replyToId,
        threadId,
        silent,
        forceDocument,
      }) => {
        return attachChannelToResult(
          "telegram",
          await sendTelegramPayloadMessages({
            send:
              resolveOutboundSendDep(deps, "telegram") ??
              getTelegramRuntime().channel.telegram.sendMessageTelegram,
            to,
            payload,
            baseOpts: buildTelegramSendOptions({
              cfg,
              mediaLocalRoots,
              accountId,
              replyToId,
              threadId,
              silent,
              forceDocument,
            }),
          }),
        );
      },
    },
    attachedResults: {
      channel: "telegram",
      sendText: async ({ cfg, to, text, accountId, deps, replyToId, threadId, silent }) =>
        await sendTelegramOutbound({
          cfg,
          to,
          text,
          accountId,
          deps,
          replyToId,
          threadId,
          silent,
        }),
      sendMedia: async ({
        cfg,
        to,
        text,
        mediaUrl,
        mediaLocalRoots,
        accountId,
        deps,
        replyToId,
        threadId,
        silent,
      }) =>
        await sendTelegramOutbound({
          cfg,
          to,
          text,
          mediaUrl,
          mediaLocalRoots,
          accountId,
          deps,
          replyToId,
          threadId,
          silent,
        }),
      sendPoll: async ({ cfg, to, poll, accountId, threadId, silent, isAnonymous }) =>
        await getTelegramRuntime().channel.telegram.sendPollTelegram(to, poll, {
          cfg,
          accountId: accountId ?? void 0,
          messageThreadId: parseTelegramThreadId(threadId),
          silent: silent ?? void 0,
          isAnonymous: isAnonymous ?? void 0,
        }),
    },
  },
});
defineChannelPluginEntry({
  id: "telegram",
  name: "Telegram",
  description: "Telegram channel plugin",
  plugin: telegramPlugin,
  setRuntime: setTelegramRuntime,
});
//#endregion
//#region extensions/telegram/src/channel.setup.ts
const telegramSetupPlugin = {
  ...createTelegramPluginBase({
    setupWizard: telegramSetupWizard,
    setup: telegramSetupAdapter,
  }),
};
defineSetupPluginEntry(telegramSetupPlugin);
//#endregion
//#region extensions/zalo/src/actions.ts
const loadZaloActionsRuntime = createLazyRuntimeNamedExport(
  () => import("./actions.runtime-BY01pzCV.js"),
  "zaloActionsRuntime",
);
const providerId = "zalo";
function listEnabledAccounts(cfg) {
  return listEnabledZaloAccounts(cfg).filter(
    (account) => account.enabled && account.tokenSource !== "none",
  );
}
const zaloMessageActions = {
  describeMessageTool: ({ cfg }) => {
    if (listEnabledAccounts(cfg).length === 0) return null;
    const actions = new Set(["send"]);
    return {
      actions: Array.from(actions),
      capabilities: [],
    };
  },
  extractToolSend: ({ args }) => extractToolSend(args, "sendMessage"),
  handleAction: async ({ action, params, cfg, accountId }) => {
    if (action === "send") {
      const to = readStringParam(params, "to", { required: true });
      const content = readStringParam(params, "message", {
        required: true,
        allowEmpty: true,
      });
      const mediaUrl = readStringParam(params, "media", { trim: false });
      const { sendMessageZalo } = await loadZaloActionsRuntime();
      const result = await sendMessageZalo(to ?? "", content ?? "", {
        accountId: accountId ?? void 0,
        mediaUrl: mediaUrl ?? void 0,
        cfg,
      });
      if (!result.ok)
        return jsonResult({
          ok: false,
          error: result.error ?? "Failed to send Zalo message",
        });
      return jsonResult({
        ok: true,
        to,
        messageId: result.messageId,
      });
    }
    throw new Error(`Action ${action} is not supported for provider ${providerId}.`);
  },
};
const ZaloConfigSchema = buildCatchallMultiAccountChannelSchema(
  z.object({
    name: z.string().optional(),
    enabled: z.boolean().optional(),
    markdown: MarkdownConfigSchema$1,
    botToken: buildSecretInputSchema().optional(),
    tokenFile: z.string().optional(),
    webhookUrl: z.string().optional(),
    webhookSecret: buildSecretInputSchema().optional(),
    webhookPath: z.string().optional(),
    dmPolicy: DmPolicySchema$1.optional(),
    allowFrom: AllowFromListSchema,
    groupPolicy: GroupPolicySchema$1.optional(),
    groupAllowFrom: AllowFromListSchema,
    mediaMaxMb: z.number().optional(),
    proxy: z.string().optional(),
    responsePrefix: z.string().optional(),
  }),
);
//#endregion
//#region extensions/zalo/src/session-route.ts
function resolveZaloOutboundSessionRoute(params) {
  const trimmed = stripChannelTargetPrefix(params.target, "zalo", "zl");
  if (!trimmed) return null;
  const isGroup = trimmed.toLowerCase().startsWith("group:");
  const peerId = stripTargetKindPrefix(trimmed);
  if (!peerId) return null;
  return buildChannelOutboundSessionRoute({
    cfg: params.cfg,
    agentId: params.agentId,
    channel: "zalo",
    accountId: params.accountId,
    peer: {
      kind: isGroup ? "group" : "direct",
      id: peerId,
    },
    chatType: isGroup ? "group" : "direct",
    from: isGroup ? `zalo:group:${peerId}` : `zalo:${peerId}`,
    to: `zalo:${peerId}`,
  });
}
//#endregion
//#region extensions/zalo/src/status-issues.ts
const ZALO_STATUS_FIELDS = ["accountId", "enabled", "configured", "dmPolicy"];
function collectZaloStatusIssues(accounts) {
  const issues = [];
  for (const entry of accounts) {
    const account = readStatusIssueFields(entry, ZALO_STATUS_FIELDS);
    if (!account) continue;
    const accountId = coerceStatusIssueAccountId(account.accountId) ?? "default";
    const enabled = account.enabled !== false;
    const configured = account.configured === true;
    if (!enabled || !configured) continue;
    if (account.dmPolicy === "open")
      issues.push({
        channel: "zalo",
        accountId,
        kind: "config",
        message: 'Zalo dmPolicy is "open", allowing any user to message the bot without pairing.',
        fix: 'Set channels.zalo.dmPolicy to "pairing" or "allowlist" to restrict access.',
      });
  }
  return issues;
}
//#endregion
//#region extensions/zalo/src/channel.ts
const meta = {
  id: "zalo",
  label: "Zalo",
  selectionLabel: "Zalo (Bot API)",
  docsPath: "/channels/zalo",
  docsLabel: "zalo",
  blurb: "Vietnam-focused messaging platform with Bot API.",
  aliases: ["zl"],
  order: 80,
  quickstartAllowFrom: true,
};
function normalizeZaloMessagingTarget(raw) {
  const trimmed = raw?.trim();
  if (!trimmed) return;
  return trimmed.replace(/^(zalo|zl):/i, "").trim();
}
const loadZaloChannelRuntime = createLazyRuntimeModule(
  () => import("./channel.runtime-BJ3StsIh.js"),
);
const zaloTextChunkLimit = 2e3;
const zaloRawSendResultAdapter = createRawChannelSendResultAdapter({
  channel: "zalo",
  sendText: async ({ to, text, accountId, cfg }) =>
    await (
      await loadZaloChannelRuntime()
    ).sendZaloText({
      to,
      text,
      accountId: accountId ?? void 0,
      cfg,
    }),
  sendMedia: async ({ to, text, mediaUrl, accountId, cfg }) =>
    await (
      await loadZaloChannelRuntime()
    ).sendZaloText({
      to,
      text,
      accountId: accountId ?? void 0,
      mediaUrl,
      cfg,
    }),
});
const zaloConfigAdapter = createScopedChannelConfigAdapter({
  sectionKey: "zalo",
  listAccountIds: listZaloAccountIds,
  resolveAccount: adaptScopedAccountAccessor(resolveZaloAccount),
  defaultAccountId: resolveDefaultZaloAccountId,
  clearBaseFields: ["botToken", "tokenFile", "name"],
  resolveAllowFrom: (account) => account.config.allowFrom,
  formatAllowFrom: (allowFrom) =>
    formatAllowFromLowercase({
      allowFrom,
      stripPrefixRe: /^(zalo|zl):/i,
    }),
});
const resolveZaloDmPolicy = createScopedDmSecurityResolver({
  channelKey: "zalo",
  resolvePolicy: (account) => account.config.dmPolicy,
  resolveAllowFrom: (account) => account.config.allowFrom,
  policyPathSuffix: "dmPolicy",
  normalizeEntry: (raw) => raw.trim().replace(/^(zalo|zl):/i, ""),
});
const collectZaloSecurityWarnings = createOpenProviderGroupPolicyWarningCollector({
  providerConfigPresent: (cfg) => cfg.channels?.zalo !== void 0,
  resolveGroupPolicy: ({ account }) => account.config.groupPolicy,
  collect: ({ account, groupPolicy }) => {
    if (groupPolicy !== "open") return [];
    const explicitGroupAllowFrom = mapAllowFromEntries(account.config.groupAllowFrom);
    const dmAllowFrom = mapAllowFromEntries(account.config.allowFrom);
    if ((explicitGroupAllowFrom.length > 0 ? explicitGroupAllowFrom : dmAllowFrom).length > 0)
      return [
        buildOpenGroupPolicyRestrictSendersWarning({
          surface: "Zalo groups",
          openScope: "any member",
          groupPolicyPath: "channels.zalo.groupPolicy",
          groupAllowFromPath: "channels.zalo.groupAllowFrom",
        }),
      ];
    return [
      buildOpenGroupPolicyWarning({
        surface: "Zalo groups",
        openBehavior:
          "with no groupAllowFrom/allowFrom allowlist; any member can trigger (mention-gated)",
        remediation: 'Set channels.zalo.groupPolicy="allowlist" + channels.zalo.groupAllowFrom',
      }),
    ];
  },
});
const zaloPlugin = createChatChannelPlugin({
  base: {
    id: "zalo",
    meta,
    setup: zaloSetupAdapter,
    setupWizard: zaloSetupWizard,
    capabilities: {
      chatTypes: ["direct", "group"],
      media: true,
      reactions: false,
      threads: false,
      polls: false,
      nativeCommands: false,
      blockStreaming: true,
    },
    reload: { configPrefixes: ["channels.zalo"] },
    configSchema: buildChannelConfigSchema(ZaloConfigSchema),
    config: {
      ...zaloConfigAdapter,
      isConfigured: (account) => Boolean(account.token?.trim()),
      describeAccount: (account) =>
        describeAccountSnapshot({
          account,
          configured: Boolean(account.token?.trim()),
          extra: { tokenSource: account.tokenSource },
        }),
    },
    groups: { resolveRequireMention: () => true },
    actions: zaloMessageActions,
    messaging: {
      normalizeTarget: normalizeZaloMessagingTarget,
      resolveOutboundSessionRoute: (params) => resolveZaloOutboundSessionRoute(params),
      targetResolver: {
        looksLikeId: isNumericTargetId,
        hint: "<chatId>",
      },
    },
    directory: createChannelDirectoryAdapter({
      listPeers: async (params) =>
        listResolvedDirectoryUserEntriesFromAllowFrom({
          ...params,
          resolveAccount: adaptScopedAccountAccessor(resolveZaloAccount),
          resolveAllowFrom: (account) => account.config.allowFrom,
          normalizeId: (entry) => entry.trim().replace(/^(zalo|zl):/i, ""),
        }),
      listGroups: async () => [],
    }),
    status: createComputedAccountStatusAdapter({
      defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID),
      collectStatusIssues: collectZaloStatusIssues,
      buildChannelSummary: ({ snapshot }) => buildTokenChannelStatusSummary(snapshot),
      probeAccount: async ({ account, timeoutMs }) =>
        await (
          await loadZaloChannelRuntime()
        ).probeZaloAccount({
          account,
          timeoutMs,
        }),
      resolveAccountSnapshot: ({ account }) => {
        const configured = Boolean(account.token?.trim());
        return {
          accountId: account.accountId,
          name: account.name,
          enabled: account.enabled,
          configured,
          extra: {
            tokenSource: account.tokenSource,
            mode: account.config.webhookUrl ? "webhook" : "polling",
            dmPolicy: account.config.dmPolicy ?? "pairing",
          },
        };
      },
    }),
    gateway: {
      startAccount: async (ctx) =>
        await (await loadZaloChannelRuntime()).startZaloGatewayAccount(ctx),
    },
  },
  security: {
    resolveDmPolicy: resolveZaloDmPolicy,
    collectWarnings: collectZaloSecurityWarnings,
  },
  pairing: {
    text: {
      idLabel: "zaloUserId",
      message: "Your pairing request has been approved.",
      normalizeAllowEntry: (entry) => entry.trim().replace(/^(zalo|zl):/i, ""),
      notify: async (params) =>
        await (await loadZaloChannelRuntime()).notifyZaloPairingApproval(params),
    },
  },
  threading: { resolveReplyToMode: createStaticReplyToModeResolver("off") },
  outbound: {
    deliveryMode: "direct",
    chunker: chunkTextForOutbound,
    chunkerMode: "text",
    textChunkLimit: zaloTextChunkLimit,
    sendPayload: async (ctx) =>
      await sendPayloadWithChunkedTextAndMedia({
        ctx,
        textChunkLimit: zaloTextChunkLimit,
        chunker: chunkTextForOutbound,
        sendText: (nextCtx) => zaloRawSendResultAdapter.sendText(nextCtx),
        sendMedia: (nextCtx) => zaloRawSendResultAdapter.sendMedia(nextCtx),
        emptyResult: createEmptyChannelResult("zalo"),
      }),
    ...zaloRawSendResultAdapter,
  },
});
defineChannelPluginEntry({
  id: "zalo",
  name: "Zalo",
  description: "Zalo channel plugin",
  plugin: zaloPlugin,
  setRuntime: setZaloRuntime,
});
//#endregion
//#region src/channels/plugins/bundled.ts
const bundledChannelPlugins = [
  bluebubblesPlugin,
  discordPlugin,
  feishuPlugin,
  imessagePlugin,
  ircPlugin,
  linePlugin,
  mattermostPlugin,
  nextcloudTalkPlugin,
  signalPlugin,
  slackPlugin,
  synologyChatPlugin,
  telegramPlugin,
  zaloPlugin,
];
const bundledChannelSetupPlugins = [
  telegramSetupPlugin,
  discordSetupPlugin,
  ircPlugin,
  slackSetupPlugin,
  signalSetupPlugin,
  imessageSetupPlugin,
  lineSetupPlugin,
];
function buildBundledChannelPluginsById(plugins) {
  const byId = /* @__PURE__ */ new Map();
  for (const plugin of plugins) {
    if (byId.has(plugin.id)) throw new Error(`duplicate bundled channel plugin id: ${plugin.id}`);
    byId.set(plugin.id, plugin);
  }
  return byId;
}
buildBundledChannelPluginsById(bundledChannelPlugins);
//#endregion
//#region src/channels/plugins/setup-registry.ts
let cachedChannelSetupPlugins = {
  registryVersion: -1,
  sorted: [],
  byId: /* @__PURE__ */ new Map(),
};
function dedupeSetupPlugins(plugins) {
  const seen = /* @__PURE__ */ new Set();
  const resolved = [];
  for (const plugin of plugins) {
    const id = String(plugin.id).trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    resolved.push(plugin);
  }
  return resolved;
}
function sortChannelSetupPlugins(plugins) {
  return dedupeSetupPlugins(plugins).toSorted((a, b) => {
    const indexA = CHAT_CHANNEL_ORDER.indexOf(a.id);
    const indexB = CHAT_CHANNEL_ORDER.indexOf(b.id);
    const orderA = a.meta.order ?? (indexA === -1 ? 999 : indexA);
    const orderB = b.meta.order ?? (indexB === -1 ? 999 : indexB);
    if (orderA !== orderB) return orderA - orderB;
    return a.id.localeCompare(b.id);
  });
}
function resolveCachedChannelSetupPlugins() {
  const registry = requireActivePluginRegistry();
  const registryVersion = getActivePluginRegistryVersion();
  const cached = cachedChannelSetupPlugins;
  if (cached.registryVersion === registryVersion) return cached;
  const registryPlugins = (registry.channelSetups ?? []).map((entry) => entry.plugin);
  const sorted = sortChannelSetupPlugins(
    registryPlugins.length > 0 ? registryPlugins : bundledChannelSetupPlugins,
  );
  const byId = /* @__PURE__ */ new Map();
  for (const plugin of sorted) byId.set(plugin.id, plugin);
  const next = {
    registryVersion,
    sorted,
    byId,
  };
  cachedChannelSetupPlugins = next;
  return next;
}
function listChannelSetupPlugins() {
  return resolveCachedChannelSetupPlugins().sorted.slice();
}
function getChannelSetupPlugin(id) {
  const resolvedId = String(id).trim();
  if (!resolvedId) return;
  return resolveCachedChannelSetupPlugins().byId.get(resolvedId);
}
//#endregion
//#region src/commands/channel-setup/discovery.ts
function resolveWorkspaceDir(cfg, workspaceDir) {
  return workspaceDir ?? resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
}
function listManifestInstalledChannelIds(params) {
  const workspaceDir = resolveWorkspaceDir(params.cfg, params.workspaceDir);
  return new Set(
    loadPluginManifestRegistry({
      config: params.cfg,
      workspaceDir,
      env: params.env ?? process.env,
    }).plugins.flatMap((plugin) => plugin.channels),
  );
}
function isCatalogChannelInstalled(params) {
  return listManifestInstalledChannelIds(params).has(params.entry.id);
}
function resolveChannelSetupEntries(params) {
  const workspaceDir = resolveWorkspaceDir(params.cfg, params.workspaceDir);
  const manifestInstalledIds = listManifestInstalledChannelIds({
    cfg: params.cfg,
    workspaceDir,
    env: params.env,
  });
  const installedPluginIds = new Set(params.installedPlugins.map((plugin) => plugin.id));
  const catalogEntries = listChannelPluginCatalogEntries({ workspaceDir });
  const installedCatalogEntries = catalogEntries.filter(
    (entry) => !installedPluginIds.has(entry.id) && manifestInstalledIds.has(entry.id),
  );
  const installableCatalogEntries = catalogEntries.filter(
    (entry) => !installedPluginIds.has(entry.id) && !manifestInstalledIds.has(entry.id),
  );
  const metaById = /* @__PURE__ */ new Map();
  for (const meta of listChatChannels()) metaById.set(meta.id, meta);
  for (const plugin of params.installedPlugins) metaById.set(plugin.id, plugin.meta);
  for (const entry of installedCatalogEntries)
    if (!metaById.has(entry.id)) metaById.set(entry.id, entry.meta);
  for (const entry of installableCatalogEntries)
    if (!metaById.has(entry.id)) metaById.set(entry.id, entry.meta);
  return {
    entries: Array.from(metaById, ([id, meta]) => ({
      id,
      meta,
    })),
    installedCatalogEntries,
    installableCatalogEntries,
    installedCatalogById: new Map(installedCatalogEntries.map((entry) => [entry.id, entry])),
    installableCatalogById: new Map(installableCatalogEntries.map((entry) => [entry.id, entry])),
  };
}
//#endregion
//#region src/channels/plugins/setup-group-access-configure.ts
async function configureChannelAccessWithAllowlist(params) {
  let next = params.cfg;
  const accessConfig = await promptChannelAccessConfig({
    prompter: params.prompter,
    label: params.label,
    currentPolicy: params.currentPolicy,
    currentEntries: params.currentEntries,
    placeholder: params.placeholder,
    updatePrompt: params.updatePrompt,
    skipAllowlistEntries: params.skipAllowlistEntries,
  });
  if (!accessConfig) return next;
  if (accessConfig.policy !== "allowlist") return params.setPolicy(next, accessConfig.policy);
  if (params.skipAllowlistEntries || !params.resolveAllowlist || !params.applyAllowlist)
    return params.setPolicy(next, "allowlist");
  const resolved = await params.resolveAllowlist({
    cfg: next,
    entries: accessConfig.entries,
  });
  next = params.setPolicy(next, "allowlist");
  return params.applyAllowlist({
    cfg: next,
    resolved,
  });
}
//#endregion
//#region src/channels/plugins/setup-wizard.ts
async function buildStatus(plugin, wizard, ctx) {
  const configured = await wizard.status.resolveConfigured({ cfg: ctx.cfg });
  const statusLines = (await wizard.status.resolveStatusLines?.({
    cfg: ctx.cfg,
    configured,
  })) ?? [
    `${plugin.meta.label}: ${configured ? wizard.status.configuredLabel : wizard.status.unconfiguredLabel}`,
  ];
  const selectionHint =
    (await wizard.status.resolveSelectionHint?.({
      cfg: ctx.cfg,
      configured,
    })) ?? (configured ? wizard.status.configuredHint : wizard.status.unconfiguredHint);
  const quickstartScore =
    (await wizard.status.resolveQuickstartScore?.({
      cfg: ctx.cfg,
      configured,
    })) ?? (configured ? wizard.status.configuredScore : wizard.status.unconfiguredScore);
  return {
    channel: plugin.id,
    configured,
    statusLines,
    selectionHint,
    quickstartScore,
  };
}
function applySetupInput(params) {
  const setup = params.plugin.setup;
  if (!setup?.applyAccountConfig) throw new Error(`${params.plugin.id} does not support setup`);
  const resolvedAccountId =
    setup.resolveAccountId?.({
      cfg: params.cfg,
      accountId: params.accountId,
      input: params.input,
    }) ?? params.accountId;
  const validationError = setup.validateInput?.({
    cfg: params.cfg,
    accountId: resolvedAccountId,
    input: params.input,
  });
  if (validationError) throw new Error(validationError);
  let next = setup.applyAccountConfig({
    cfg: params.cfg,
    accountId: resolvedAccountId,
    input: params.input,
  });
  if (params.input.name?.trim() && setup.applyAccountName)
    next = setup.applyAccountName({
      cfg: next,
      accountId: resolvedAccountId,
      name: params.input.name,
    });
  return {
    cfg: next,
    accountId: resolvedAccountId,
  };
}
function trimResolvedValue(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : void 0;
}
function collectCredentialValues(params) {
  const values = {};
  for (const credential of params.wizard.credentials) {
    const resolvedValue = trimResolvedValue(
      credential.inspect({
        cfg: params.cfg,
        accountId: params.accountId,
      }).resolvedValue,
    );
    if (resolvedValue) values[credential.inputKey] = resolvedValue;
  }
  return values;
}
async function applyWizardTextInputValue(params) {
  return params.input.applySet
    ? await params.input.applySet({
        cfg: params.cfg,
        accountId: params.accountId,
        value: params.value,
      })
    : applySetupInput({
        plugin: params.plugin,
        cfg: params.cfg,
        accountId: params.accountId,
        input: { [params.input.inputKey]: params.value },
      }).cfg;
}
function buildChannelSetupWizardAdapterFromSetupWizard(params) {
  const { plugin, wizard } = params;
  return {
    channel: plugin.id,
    getStatus: async (ctx) => buildStatus(plugin, wizard, ctx),
    configure: async ({
      cfg,
      runtime,
      prompter,
      options,
      accountOverrides,
      shouldPromptAccountIds,
      forceAllowFrom,
    }) => {
      const defaultAccountId =
        plugin.config.defaultAccountId?.(cfg) ?? plugin.config.listAccountIds(cfg)[0] ?? "default";
      const resolvedShouldPromptAccountIds =
        wizard.resolveShouldPromptAccountIds?.({
          cfg,
          options,
          shouldPromptAccountIds,
        }) ?? shouldPromptAccountIds;
      const accountId = await (wizard.resolveAccountIdForConfigure
        ? wizard.resolveAccountIdForConfigure({
            cfg,
            prompter,
            options,
            accountOverride: accountOverrides[plugin.id],
            shouldPromptAccountIds: resolvedShouldPromptAccountIds,
            listAccountIds: plugin.config.listAccountIds,
            defaultAccountId,
          })
        : resolveAccountIdForConfigure({
            cfg,
            prompter,
            label: plugin.meta.label,
            accountOverride: accountOverrides[plugin.id],
            shouldPromptAccountIds: resolvedShouldPromptAccountIds,
            listAccountIds: plugin.config.listAccountIds,
            defaultAccountId,
          }));
      let next = cfg;
      let credentialValues = collectCredentialValues({
        wizard,
        cfg: next,
        accountId,
      });
      let usedEnvShortcut = false;
      if (
        wizard.envShortcut?.isAvailable({
          cfg: next,
          accountId,
        })
      ) {
        if (
          await prompter.confirm({
            message: wizard.envShortcut.prompt,
            initialValue: true,
          })
        ) {
          next = await wizard.envShortcut.apply({
            cfg: next,
            accountId,
          });
          credentialValues = collectCredentialValues({
            wizard,
            cfg: next,
            accountId,
          });
          usedEnvShortcut = true;
        }
      }
      if (
        !usedEnvShortcut &&
        (wizard.introNote?.shouldShow
          ? await wizard.introNote.shouldShow({
              cfg: next,
              accountId,
              credentialValues,
            })
          : Boolean(wizard.introNote)) &&
        wizard.introNote
      )
        await prompter.note(wizard.introNote.lines.join("\n"), wizard.introNote.title);
      if (wizard.prepare) {
        const prepared = await wizard.prepare({
          cfg: next,
          accountId,
          credentialValues,
          runtime,
          prompter,
          options,
        });
        if (prepared?.cfg) next = prepared.cfg;
        if (prepared?.credentialValues)
          credentialValues = {
            ...credentialValues,
            ...prepared.credentialValues,
          };
      }
      const runCredentialSteps = async () => {
        if (usedEnvShortcut) return;
        for (const credential of wizard.credentials) {
          let credentialState = credential.inspect({
            cfg: next,
            accountId,
          });
          let resolvedCredentialValue = trimResolvedValue(credentialState.resolvedValue);
          if (
            !(credential.shouldPrompt
              ? await credential.shouldPrompt({
                  cfg: next,
                  accountId,
                  credentialValues,
                  currentValue: resolvedCredentialValue,
                  state: credentialState,
                })
              : true)
          ) {
            if (resolvedCredentialValue)
              credentialValues[credential.inputKey] = resolvedCredentialValue;
            else delete credentialValues[credential.inputKey];
            continue;
          }
          const allowEnv =
            credential.allowEnv?.({
              cfg: next,
              accountId,
            }) ?? false;
          const credentialResult = await runSingleChannelSecretStep({
            cfg: next,
            prompter,
            providerHint: credential.providerHint,
            credentialLabel: credential.credentialLabel,
            secretInputMode: options?.secretInputMode,
            accountConfigured: credentialState.accountConfigured,
            hasConfigToken: credentialState.hasConfiguredValue,
            allowEnv,
            envValue: credentialState.envValue,
            envPrompt: credential.envPrompt,
            keepPrompt: credential.keepPrompt,
            inputPrompt: credential.inputPrompt,
            preferredEnvVar: credential.preferredEnvVar,
            onMissingConfigured:
              credential.helpLines && credential.helpLines.length > 0
                ? async () => {
                    await prompter.note(
                      credential.helpLines.join("\n"),
                      credential.helpTitle ?? credential.credentialLabel,
                    );
                  }
                : void 0,
            applyUseEnv: async (currentCfg) =>
              credential.applyUseEnv
                ? await credential.applyUseEnv({
                    cfg: currentCfg,
                    accountId,
                  })
                : applySetupInput({
                    plugin,
                    cfg: currentCfg,
                    accountId,
                    input: {
                      [credential.inputKey]: void 0,
                      useEnv: true,
                    },
                  }).cfg,
            applySet: async (currentCfg, value, resolvedValue) => {
              resolvedCredentialValue = resolvedValue;
              return credential.applySet
                ? await credential.applySet({
                    cfg: currentCfg,
                    accountId,
                    credentialValues,
                    value,
                    resolvedValue,
                  })
                : applySetupInput({
                    plugin,
                    cfg: currentCfg,
                    accountId,
                    input: {
                      [credential.inputKey]: value,
                      useEnv: false,
                    },
                  }).cfg;
            },
          });
          next = credentialResult.cfg;
          credentialState = credential.inspect({
            cfg: next,
            accountId,
          });
          resolvedCredentialValue =
            trimResolvedValue(credentialResult.resolvedValue) ||
            trimResolvedValue(credentialState.resolvedValue);
          if (resolvedCredentialValue)
            credentialValues[credential.inputKey] = resolvedCredentialValue;
          else delete credentialValues[credential.inputKey];
        }
      };
      const runTextInputSteps = async () => {
        for (const textInput of wizard.textInputs ?? []) {
          let currentValue = trimResolvedValue(
            typeof credentialValues[textInput.inputKey] === "string"
              ? credentialValues[textInput.inputKey]
              : void 0,
          );
          if (!currentValue && textInput.currentValue)
            currentValue = trimResolvedValue(
              await textInput.currentValue({
                cfg: next,
                accountId,
                credentialValues,
              }),
            );
          if (
            !(textInput.shouldPrompt
              ? await textInput.shouldPrompt({
                  cfg: next,
                  accountId,
                  credentialValues,
                  currentValue,
                })
              : true)
          ) {
            if (currentValue) {
              credentialValues[textInput.inputKey] = currentValue;
              if (textInput.applyCurrentValue)
                next = await applyWizardTextInputValue({
                  plugin,
                  input: textInput,
                  cfg: next,
                  accountId,
                  value: currentValue,
                });
            }
            continue;
          }
          if (textInput.helpLines && textInput.helpLines.length > 0)
            await prompter.note(
              textInput.helpLines.join("\n"),
              textInput.helpTitle ?? textInput.message,
            );
          if (currentValue && textInput.confirmCurrentValue !== false) {
            if (
              await prompter.confirm({
                message:
                  typeof textInput.keepPrompt === "function"
                    ? textInput.keepPrompt(currentValue)
                    : (textInput.keepPrompt ??
                      `${textInput.message} set (${currentValue}). Keep it?`),
                initialValue: true,
              })
            ) {
              credentialValues[textInput.inputKey] = currentValue;
              if (textInput.applyCurrentValue)
                next = await applyWizardTextInputValue({
                  plugin,
                  input: textInput,
                  cfg: next,
                  accountId,
                  value: currentValue,
                });
              continue;
            }
          }
          const initialValue = trimResolvedValue(
            (await textInput.initialValue?.({
              cfg: next,
              accountId,
              credentialValues,
            })) ?? currentValue,
          );
          const trimmedValue = String(
            await prompter.text({
              message: textInput.message,
              initialValue,
              placeholder: textInput.placeholder,
              validate: (value) => {
                const trimmed = String(value ?? "").trim();
                if (!trimmed && textInput.required !== false) return "Required";
                return textInput.validate?.({
                  value: trimmed,
                  cfg: next,
                  accountId,
                  credentialValues,
                });
              },
            }),
          ).trim();
          if (!trimmedValue && textInput.required === false) {
            if (textInput.applyEmptyValue)
              next = await applyWizardTextInputValue({
                plugin,
                input: textInput,
                cfg: next,
                accountId,
                value: "",
              });
            delete credentialValues[textInput.inputKey];
            continue;
          }
          const normalizedValue = trimResolvedValue(
            textInput.normalizeValue?.({
              value: trimmedValue,
              cfg: next,
              accountId,
              credentialValues,
            }) ?? trimmedValue,
          );
          if (!normalizedValue) {
            delete credentialValues[textInput.inputKey];
            continue;
          }
          next = await applyWizardTextInputValue({
            plugin,
            input: textInput,
            cfg: next,
            accountId,
            value: normalizedValue,
          });
          credentialValues[textInput.inputKey] = normalizedValue;
        }
      };
      if (wizard.stepOrder === "text-first") {
        await runTextInputSteps();
        await runCredentialSteps();
      } else {
        await runCredentialSteps();
        await runTextInputSteps();
      }
      if (wizard.groupAccess) {
        const access = wizard.groupAccess;
        if (access.helpLines && access.helpLines.length > 0)
          await prompter.note(access.helpLines.join("\n"), access.helpTitle ?? access.label);
        next = await configureChannelAccessWithAllowlist({
          cfg: next,
          prompter,
          label: access.label,
          currentPolicy: access.currentPolicy({
            cfg: next,
            accountId,
          }),
          currentEntries: access.currentEntries({
            cfg: next,
            accountId,
          }),
          placeholder: access.placeholder,
          updatePrompt: access.updatePrompt({
            cfg: next,
            accountId,
          }),
          skipAllowlistEntries: access.skipAllowlistEntries,
          setPolicy: (currentCfg, policy) =>
            access.setPolicy({
              cfg: currentCfg,
              accountId,
              policy,
            }),
          resolveAllowlist: access.resolveAllowlist
            ? async ({ cfg: currentCfg, entries }) =>
                await access.resolveAllowlist({
                  cfg: currentCfg,
                  accountId,
                  credentialValues,
                  entries,
                  prompter,
                })
            : void 0,
          applyAllowlist: access.applyAllowlist
            ? ({ cfg: currentCfg, resolved }) =>
                access.applyAllowlist({
                  cfg: currentCfg,
                  accountId,
                  resolved,
                })
            : void 0,
        });
      }
      if (forceAllowFrom && wizard.allowFrom) {
        const allowFrom = wizard.allowFrom;
        const allowFromCredentialValue = trimResolvedValue(
          credentialValues[allowFrom.credentialInputKey ?? wizard.credentials[0]?.inputKey],
        );
        if (allowFrom.helpLines && allowFrom.helpLines.length > 0)
          await prompter.note(
            allowFrom.helpLines.join("\n"),
            allowFrom.helpTitle ?? `${plugin.meta.label} allowlist`,
          );
        const unique = await promptResolvedAllowFrom({
          prompter,
          existing:
            plugin.config.resolveAllowFrom?.({
              cfg: next,
              accountId,
            }) ?? [],
          token: allowFromCredentialValue,
          message: allowFrom.message,
          placeholder: allowFrom.placeholder,
          label: allowFrom.helpTitle ?? `${plugin.meta.label} allowlist`,
          parseInputs: allowFrom.parseInputs ?? splitSetupEntries,
          parseId: allowFrom.parseId,
          invalidWithoutTokenNote: allowFrom.invalidWithoutCredentialNote,
          resolveEntries: async ({ entries }) =>
            allowFrom.resolveEntries({
              cfg: next,
              accountId,
              credentialValues,
              entries,
            }),
        });
        next = await allowFrom.apply({
          cfg: next,
          accountId,
          allowFrom: unique,
        });
      }
      if (wizard.finalize) {
        const finalized = await wizard.finalize({
          cfg: next,
          accountId,
          credentialValues,
          runtime,
          prompter,
          options,
          forceAllowFrom,
        });
        if (finalized?.cfg) next = finalized.cfg;
        if (finalized?.credentialValues)
          credentialValues = {
            ...credentialValues,
            ...finalized.credentialValues,
          };
      }
      if (
        wizard.completionNote &&
        (wizard.completionNote.shouldShow
          ? await wizard.completionNote.shouldShow({
              cfg: next,
              accountId,
              credentialValues,
            })
          : true) &&
        wizard.completionNote
      )
        await prompter.note(wizard.completionNote.lines.join("\n"), wizard.completionNote.title);
      return {
        cfg: next,
        accountId,
      };
    },
    dmPolicy: wizard.dmPolicy,
    disable: wizard.disable,
    onAccountRecorded: wizard.onAccountRecorded,
  };
}
//#endregion
//#region src/commands/channel-setup/registry.ts
const setupWizardAdapters = /* @__PURE__ */ new WeakMap();
function resolveChannelSetupWizardAdapterForPlugin(plugin) {
  if (plugin?.setupWizard) {
    const cached = setupWizardAdapters.get(plugin);
    if (cached) return cached;
    const adapter = buildChannelSetupWizardAdapterFromSetupWizard({
      plugin,
      wizard: plugin.setupWizard,
    });
    setupWizardAdapters.set(plugin, adapter);
    return adapter;
  }
}
//#endregion
//#region src/commands/onboard-channels.ts
function createChannelOnboardingPostWriteHookCollector() {
  const hooks = /* @__PURE__ */ new Map();
  return {
    collect(hook) {
      hooks.set(`${hook.channel}:${hook.accountId}`, hook);
    },
    drain() {
      const next = [...hooks.values()];
      hooks.clear();
      return next;
    },
  };
}
async function runCollectedChannelOnboardingPostWriteHooks(params) {
  for (const hook of params.hooks)
    try {
      await hook.run({
        cfg: params.cfg,
        runtime: params.runtime,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      params.runtime.error(
        `Channel ${hook.channel} post-setup warning for "${hook.accountId}": ${message}`,
      );
    }
}
function formatAccountLabel(accountId) {
  return accountId === "default" ? "default (primary)" : accountId;
}
async function promptConfiguredAction(params) {
  const { prompter, label, supportsDisable, supportsDelete } = params;
  const updateOption = {
    value: "update",
    label: "Modify settings",
  };
  const disableOption = {
    value: "disable",
    label: "Disable (keeps config)",
  };
  const deleteOption = {
    value: "delete",
    label: "Delete config",
  };
  const skipOption = {
    value: "skip",
    label: "Skip (leave as-is)",
  };
  const options = [
    updateOption,
    ...(supportsDisable ? [disableOption] : []),
    ...(supportsDelete ? [deleteOption] : []),
    skipOption,
  ];
  return await prompter.select({
    message: `${label} already configured. What do you want to do?`,
    options,
    initialValue: "update",
  });
}
async function promptRemovalAccountId(params) {
  const { cfg, prompter, label, channel } = params;
  const plugin = params.plugin ?? getChannelSetupPlugin(channel);
  if (!plugin) return DEFAULT_ACCOUNT_ID;
  const accountIds = plugin.config.listAccountIds(cfg).filter(Boolean);
  const defaultAccountId = resolveChannelDefaultAccountId({
    plugin,
    cfg,
    accountIds,
  });
  if (accountIds.length <= 1) return defaultAccountId;
  return (
    normalizeAccountId(
      await prompter.select({
        message: `${label} account`,
        options: accountIds.map((accountId) => ({
          value: accountId,
          label: formatAccountLabel(accountId),
        })),
        initialValue: defaultAccountId,
      }),
    ) ?? defaultAccountId
  );
}
async function collectChannelStatus(params) {
  const installedPlugins = params.installedPlugins ?? listChannelSetupPlugins();
  const workspaceDir = resolveAgentWorkspaceDir(params.cfg, resolveDefaultAgentId(params.cfg));
  const { installedCatalogEntries, installableCatalogEntries } = resolveChannelSetupEntries({
    cfg: params.cfg,
    installedPlugins,
    workspaceDir,
  });
  const resolveAdapter =
    params.resolveAdapter ??
    ((channel) =>
      resolveChannelSetupWizardAdapterForPlugin(
        installedPlugins.find((plugin) => plugin.id === channel),
      ));
  const statusEntries = await Promise.all(
    installedPlugins.flatMap((plugin) => {
      const adapter = resolveAdapter(plugin.id);
      if (!adapter) return [];
      return adapter.getStatus({
        cfg: params.cfg,
        options: params.options,
        accountOverrides: params.accountOverrides,
      });
    }),
  );
  const statusByChannel = new Map(statusEntries.map((entry) => [entry.channel, entry]));
  const fallbackStatuses = listChatChannels()
    .filter((meta) => !statusByChannel.has(meta.id))
    .map((meta) => {
      const configured = isChannelConfigured(params.cfg, meta.id);
      const statusLabel = configured ? "configured (plugin disabled)" : "not configured";
      return {
        channel: meta.id,
        configured,
        statusLines: [`${meta.label}: ${statusLabel}`],
        selectionHint: configured ? "configured · plugin disabled" : "not configured",
        quickstartScore: 0,
      };
    });
  const discoveredPluginStatuses = installedCatalogEntries
    .filter((entry) => !statusByChannel.has(entry.id))
    .map((entry) => {
      const configured = isChannelConfigured(params.cfg, entry.id);
      const pluginEnabled =
        params.cfg.plugins?.entries?.[entry.pluginId ?? entry.id]?.enabled !== false;
      const statusLabel = configured
        ? pluginEnabled
          ? "configured"
          : "configured (plugin disabled)"
        : pluginEnabled
          ? "installed"
          : "installed (plugin disabled)";
      return {
        channel: entry.id,
        configured,
        statusLines: [`${entry.meta.label}: ${statusLabel}`],
        selectionHint: statusLabel,
        quickstartScore: 0,
      };
    });
  const catalogStatuses = installableCatalogEntries.map((entry) => ({
    channel: entry.id,
    configured: false,
    statusLines: [`${entry.meta.label}: install plugin to enable`],
    selectionHint: "plugin · install",
    quickstartScore: 0,
  }));
  const combinedStatuses = [
    ...statusEntries,
    ...fallbackStatuses,
    ...discoveredPluginStatuses,
    ...catalogStatuses,
  ];
  return {
    installedPlugins,
    catalogEntries: installableCatalogEntries,
    installedCatalogEntries,
    statusByChannel: new Map(combinedStatuses.map((entry) => [entry.channel, entry])),
    statusLines: combinedStatuses.flatMap((entry) => entry.statusLines),
  };
}
async function noteChannelStatus(params) {
  const { statusLines } = await collectChannelStatus({
    cfg: params.cfg,
    options: params.options,
    accountOverrides: params.accountOverrides ?? {},
  });
  if (statusLines.length > 0) await params.prompter.note(statusLines.join("\n"), "Channel status");
}
async function noteChannelPrimer(prompter, channels) {
  const channelLines = channels.map((channel) =>
    formatChannelPrimerLine({
      id: channel.id,
      label: channel.label,
      selectionLabel: channel.label,
      docsPath: "/",
      blurb: channel.blurb,
    }),
  );
  await prompter.note(
    [
      "DM security: default is pairing; unknown DMs get a pairing code.",
      `Approve with: ${formatCliCommand("openclaw pairing approve <channel> <code>")}`,
      'Public DMs require dmPolicy="open" + allowFrom=["*"].',
      "Multi-user DMs: run: " +
        formatCliCommand('openclaw config set session.dmScope "per-channel-peer"') +
        ' (or "per-account-channel-peer" for multi-account channels) to isolate sessions.',
      `Docs: ${formatDocsLink("/channels/pairing", "channels/pairing")}`,
      "",
      ...channelLines,
    ].join("\n"),
    "How channels work",
  );
}
function resolveQuickstartDefault(statusByChannel) {
  let best = null;
  for (const [channel, status] of statusByChannel) {
    if (status.quickstartScore == null) continue;
    if (!best || status.quickstartScore > best.score)
      best = {
        channel,
        score: status.quickstartScore,
      };
  }
  return best?.channel;
}
async function maybeConfigureDmPolicies(params) {
  const { selection, prompter, accountIdsByChannel } = params;
  const resolve = params.resolveAdapter ?? (() => void 0);
  const dmPolicies = selection.map((channel) => resolve(channel)?.dmPolicy).filter(Boolean);
  if (dmPolicies.length === 0) return params.cfg;
  if (
    !(await prompter.confirm({
      message: "Configure DM access policies now? (default: pairing)",
      initialValue: false,
    }))
  )
    return params.cfg;
  let cfg = params.cfg;
  const selectPolicy = async (policy) => {
    const accountId = accountIdsByChannel?.get(policy.channel);
    const { policyKey, allowFromKey } = policy.resolveConfigKeys?.(cfg, accountId) ?? {
      policyKey: policy.policyKey,
      allowFromKey: policy.allowFromKey,
    };
    await prompter.note(
      [
        "Default: pairing (unknown DMs get a pairing code).",
        `Approve: ${formatCliCommand(`openclaw pairing approve ${policy.channel} <code>`)}`,
        `Allowlist DMs: ${policyKey}="allowlist" + ${allowFromKey} entries.`,
        `Public DMs: ${policyKey}="open" + ${allowFromKey} includes "*".`,
        "Multi-user DMs: run: " +
          formatCliCommand('openclaw config set session.dmScope "per-channel-peer"') +
          ' (or "per-account-channel-peer" for multi-account channels) to isolate sessions.',
        `Docs: ${formatDocsLink("/channels/pairing", "channels/pairing")}`,
      ].join("\n"),
      `${policy.label} DM access`,
    );
    return {
      accountId,
      nextPolicy: await prompter.select({
        message: `${policy.label} DM policy`,
        options: [
          {
            value: "pairing",
            label: "Pairing (recommended)",
          },
          {
            value: "allowlist",
            label: "Allowlist (specific users only)",
          },
          {
            value: "open",
            label: "Open (public inbound DMs)",
          },
          {
            value: "disabled",
            label: "Disabled (ignore DMs)",
          },
        ],
      }),
    };
  };
  for (const policy of dmPolicies) {
    const { accountId, nextPolicy } = await selectPolicy(policy);
    if (nextPolicy !== policy.getCurrent(cfg, accountId))
      cfg = policy.setPolicy(cfg, nextPolicy, accountId);
    if (nextPolicy === "allowlist" && policy.promptAllowFrom)
      cfg = await policy.promptAllowFrom({
        cfg,
        prompter,
        accountId,
      });
  }
  return cfg;
}
async function setupChannels(cfg, runtime, prompter, options) {
  let next = cfg;
  const forceAllowFromChannels = new Set(options?.forceAllowFromChannels ?? []);
  const accountOverrides = { ...options?.accountIds };
  const scopedPluginsById = /* @__PURE__ */ new Map();
  const resolveWorkspaceDir = () => resolveAgentWorkspaceDir(next, resolveDefaultAgentId(next));
  const rememberScopedPlugin = (plugin) => {
    const channel = plugin.id;
    scopedPluginsById.set(channel, plugin);
    options?.onResolvedPlugin?.(channel, plugin);
  };
  const getVisibleChannelPlugin = (channel) =>
    scopedPluginsById.get(channel) ?? getChannelSetupPlugin(channel);
  const listVisibleInstalledPlugins = () => {
    const merged = /* @__PURE__ */ new Map();
    for (const plugin of listChannelSetupPlugins()) merged.set(plugin.id, plugin);
    for (const plugin of scopedPluginsById.values()) merged.set(plugin.id, plugin);
    return Array.from(merged.values());
  };
  const loadScopedChannelPlugin = async (channel, pluginId) => {
    const existing = getVisibleChannelPlugin(channel);
    if (existing) return existing;
    const snapshot = loadChannelSetupPluginRegistrySnapshotForChannel({
      cfg: next,
      runtime,
      channel,
      ...(pluginId ? { pluginId } : {}),
      workspaceDir: resolveWorkspaceDir(),
    });
    const plugin =
      snapshot.channels.find((entry) => entry.plugin.id === channel)?.plugin ??
      snapshot.channelSetups.find((entry) => entry.plugin.id === channel)?.plugin;
    if (plugin) {
      rememberScopedPlugin(plugin);
      return plugin;
    }
  };
  const getVisibleSetupFlowAdapter = (channel) => {
    const scopedPlugin = scopedPluginsById.get(channel);
    if (scopedPlugin) return resolveChannelSetupWizardAdapterForPlugin(scopedPlugin);
    return resolveChannelSetupWizardAdapterForPlugin(getChannelSetupPlugin(channel));
  };
  const preloadConfiguredExternalPlugins = () => {
    const workspaceDir = resolveWorkspaceDir();
    for (const entry of listChannelPluginCatalogEntries({ workspaceDir })) {
      const channel = entry.id;
      if (getVisibleChannelPlugin(channel)) continue;
      if (
        !(next.plugins?.entries?.[entry.pluginId ?? channel]?.enabled === true) &&
        !isChannelConfigured(next, channel)
      )
        continue;
      loadScopedChannelPlugin(channel, entry.pluginId);
    }
  };
  if (options?.whatsappAccountId?.trim())
    accountOverrides.whatsapp = options.whatsappAccountId.trim();
  preloadConfiguredExternalPlugins();
  const {
    installedPlugins,
    catalogEntries,
    installedCatalogEntries,
    statusByChannel,
    statusLines,
  } = await collectChannelStatus({
    cfg: next,
    options,
    accountOverrides,
    installedPlugins: listVisibleInstalledPlugins(),
    resolveAdapter: getVisibleSetupFlowAdapter,
  });
  if (!options?.skipStatusNote && statusLines.length > 0)
    await prompter.note(statusLines.join("\n"), "Channel status");
  if (
    !(options?.skipConfirm
      ? true
      : await prompter.confirm({
          message: "Configure chat channels now?",
          initialValue: true,
        }))
  )
    return cfg;
  const corePrimer = listChatChannels().map((meta) => ({
    id: meta.id,
    label: meta.label,
    blurb: meta.blurb,
  }));
  const coreIds = new Set(corePrimer.map((entry) => entry.id));
  await noteChannelPrimer(prompter, [
    ...corePrimer,
    ...installedPlugins
      .filter((plugin) => !coreIds.has(plugin.id))
      .map((plugin) => ({
        id: plugin.id,
        label: plugin.meta.label,
        blurb: plugin.meta.blurb,
      })),
    ...installedCatalogEntries
      .filter((entry) => !coreIds.has(entry.id))
      .map((entry) => ({
        id: entry.id,
        label: entry.meta.label,
        blurb: entry.meta.blurb,
      })),
    ...catalogEntries
      .filter((entry) => !coreIds.has(entry.id))
      .map((entry) => ({
        id: entry.id,
        label: entry.meta.label,
        blurb: entry.meta.blurb,
      })),
  ]);
  const quickstartDefault =
    options?.initialSelection?.[0] ?? resolveQuickstartDefault(statusByChannel);
  const shouldPromptAccountIds = options?.promptAccountIds === true;
  const accountIdsByChannel = /* @__PURE__ */ new Map();
  const recordAccount = (channel, accountId) => {
    options?.onAccountId?.(channel, accountId);
    getVisibleSetupFlowAdapter(channel)?.onAccountRecorded?.(accountId, options);
    accountIdsByChannel.set(channel, accountId);
  };
  const selection = [];
  const addSelection = (channel) => {
    if (!selection.includes(channel)) selection.push(channel);
  };
  const resolveDisabledHint = (channel) => {
    if (typeof next.channels?.[channel]?.enabled === "boolean")
      return next.channels[channel]?.enabled === false ? "disabled" : void 0;
    const plugin = getVisibleChannelPlugin(channel);
    if (!plugin) {
      if (next.plugins?.entries?.[channel]?.enabled === false) return "plugin disabled";
      if (next.plugins?.enabled === false) return "plugins disabled";
      return;
    }
    const accountId = resolveChannelDefaultAccountId({
      plugin,
      cfg: next,
    });
    const account = plugin.config.resolveAccount(next, accountId);
    let enabled;
    if (plugin.config.isEnabled) enabled = plugin.config.isEnabled(account, next);
    else if (typeof account?.enabled === "boolean") enabled = account.enabled;
    return enabled === false ? "disabled" : void 0;
  };
  const buildSelectionOptions = (entries) =>
    entries.map((entry) => {
      const status = statusByChannel.get(entry.id);
      const disabledHint = resolveDisabledHint(entry.id);
      const hint = [status?.selectionHint, disabledHint].filter(Boolean).join(" · ") || void 0;
      return {
        value: entry.meta.id,
        label: entry.meta.selectionLabel ?? entry.meta.label,
        ...(hint ? { hint } : {}),
      };
    });
  const getChannelEntries = () => {
    const resolved = resolveChannelSetupEntries({
      cfg: next,
      installedPlugins: listVisibleInstalledPlugins(),
      workspaceDir: resolveWorkspaceDir(),
    });
    return {
      entries: resolved.entries,
      catalogById: resolved.installableCatalogById,
      installedCatalogById: resolved.installedCatalogById,
    };
  };
  const refreshStatus = async (channel) => {
    const adapter = getVisibleSetupFlowAdapter(channel);
    if (!adapter) return;
    const status = await adapter.getStatus({
      cfg: next,
      options,
      accountOverrides,
    });
    statusByChannel.set(channel, status);
  };
  const enableBundledPluginForSetup = async (channel) => {
    if (getVisibleChannelPlugin(channel)) {
      await refreshStatus(channel);
      return true;
    }
    const result = enablePluginInConfig(next, channel);
    next = result.config;
    if (!result.enabled) {
      await prompter.note(
        `Cannot enable ${channel}: ${result.reason ?? "plugin disabled"}.`,
        "Channel setup",
      );
      return false;
    }
    const plugin = await loadScopedChannelPlugin(channel);
    const adapter = getVisibleSetupFlowAdapter(channel);
    if (!plugin) {
      if (adapter) {
        await prompter.note(
          `${channel} plugin not available (continuing with setup). If the channel still doesn't work after setup, run \`${formatCliCommand("openclaw plugins list")}\` and \`${formatCliCommand("openclaw plugins enable " + channel)}\`, then restart the gateway.`,
          "Channel setup",
        );
        await refreshStatus(channel);
        return true;
      }
      await prompter.note(`${channel} plugin not available.`, "Channel setup");
      return false;
    }
    await refreshStatus(channel);
    return true;
  };
  const applySetupResult = async (channel, result) => {
    const previousCfg = next;
    next = result.cfg;
    const adapter = getVisibleSetupFlowAdapter(channel);
    if (result.accountId) {
      recordAccount(channel, result.accountId);
      if (adapter?.afterConfigWritten)
        options?.onPostWriteHook?.({
          channel,
          accountId: result.accountId,
          run: async ({ cfg, runtime }) =>
            await adapter.afterConfigWritten?.({
              previousCfg,
              cfg,
              accountId: result.accountId,
              runtime,
            }),
        });
    }
    addSelection(channel);
    await refreshStatus(channel);
  };
  const applyCustomSetupResult = async (channel, result) => {
    if (result === "skip") return false;
    await applySetupResult(channel, result);
    return true;
  };
  const configureChannel = async (channel) => {
    const adapter = getVisibleSetupFlowAdapter(channel);
    if (!adapter) {
      await prompter.note(`${channel} does not support guided setup yet.`, "Channel setup");
      return;
    }
    await applySetupResult(
      channel,
      await adapter.configure({
        cfg: next,
        runtime,
        prompter,
        options,
        accountOverrides,
        shouldPromptAccountIds,
        forceAllowFrom: forceAllowFromChannels.has(channel),
      }),
    );
  };
  const handleConfiguredChannel = async (channel, label) => {
    const plugin = getVisibleChannelPlugin(channel);
    const adapter = getVisibleSetupFlowAdapter(channel);
    if (adapter?.configureWhenConfigured) {
      if (
        !(await applyCustomSetupResult(
          channel,
          await adapter.configureWhenConfigured({
            cfg: next,
            runtime,
            prompter,
            options,
            accountOverrides,
            shouldPromptAccountIds,
            forceAllowFrom: forceAllowFromChannels.has(channel),
            configured: true,
            label,
          }),
        ))
      )
        return;
      return;
    }
    const supportsDisable = Boolean(
      options?.allowDisable && (plugin?.config.setAccountEnabled || adapter?.disable),
    );
    const supportsDelete = Boolean(options?.allowDisable && plugin?.config.deleteAccount);
    const action = await promptConfiguredAction({
      prompter,
      label,
      supportsDisable,
      supportsDelete,
    });
    if (action === "skip") return;
    if (action === "update") {
      await configureChannel(channel);
      return;
    }
    if (!options?.allowDisable) return;
    if (action === "delete" && !supportsDelete) {
      await prompter.note(`${label} does not support deleting config entries.`, "Remove channel");
      return;
    }
    const resolvedAccountId =
      normalizeAccountId(
        (
          action === "delete"
            ? Boolean(plugin?.config.deleteAccount)
            : Boolean(plugin?.config.setAccountEnabled)
        )
          ? await promptRemovalAccountId({
              cfg: next,
              prompter,
              label,
              channel,
              plugin,
            })
          : "default",
      ) ??
      (plugin
        ? resolveChannelDefaultAccountId({
            plugin,
            cfg: next,
          })
        : "default");
    const accountLabel = formatAccountLabel(resolvedAccountId);
    if (action === "delete") {
      if (
        !(await prompter.confirm({
          message: `Delete ${label} account "${accountLabel}"?`,
          initialValue: false,
        }))
      )
        return;
      if (plugin?.config.deleteAccount)
        next = plugin.config.deleteAccount({
          cfg: next,
          accountId: resolvedAccountId,
        });
      await refreshStatus(channel);
      return;
    }
    if (plugin?.config.setAccountEnabled)
      next = plugin.config.setAccountEnabled({
        cfg: next,
        accountId: resolvedAccountId,
        enabled: false,
      });
    else if (adapter?.disable) next = adapter.disable(next);
    await refreshStatus(channel);
  };
  const handleChannelChoice = async (channel) => {
    const { catalogById, installedCatalogById } = getChannelEntries();
    const catalogEntry = catalogById.get(channel);
    const installedCatalogEntry = installedCatalogById.get(channel);
    if (catalogEntry) {
      const workspaceDir = resolveWorkspaceDir();
      const result = await ensureChannelSetupPluginInstalled({
        cfg: next,
        entry: catalogEntry,
        prompter,
        runtime,
        workspaceDir,
      });
      next = result.cfg;
      if (!result.installed) return;
      await loadScopedChannelPlugin(channel, result.pluginId ?? catalogEntry.pluginId);
      await refreshStatus(channel);
    } else if (installedCatalogEntry) {
      if (!(await loadScopedChannelPlugin(channel, installedCatalogEntry.pluginId))) {
        await prompter.note(`${channel} plugin not available.`, "Channel setup");
        return;
      }
      await refreshStatus(channel);
    } else if (!(await enableBundledPluginForSetup(channel))) return;
    const plugin = getVisibleChannelPlugin(channel);
    const adapter = getVisibleSetupFlowAdapter(channel);
    const label = plugin?.meta.label ?? catalogEntry?.meta.label ?? channel;
    const configured = statusByChannel.get(channel)?.configured ?? false;
    if (adapter?.configureInteractive) {
      if (
        !(await applyCustomSetupResult(
          channel,
          await adapter.configureInteractive({
            cfg: next,
            runtime,
            prompter,
            options,
            accountOverrides,
            shouldPromptAccountIds,
            forceAllowFrom: forceAllowFromChannels.has(channel),
            configured,
            label,
          }),
        ))
      )
        return;
      return;
    }
    if (configured) {
      await handleConfiguredChannel(channel, label);
      return;
    }
    await configureChannel(channel);
  };
  if (options?.quickstartDefaults) {
    const { entries } = getChannelEntries();
    const choice = await prompter.select({
      message: "Select channel (QuickStart)",
      options: [
        ...buildSelectionOptions(entries),
        {
          value: "__skip__",
          label: "Skip for now",
          hint: `You can add channels later via \`${formatCliCommand("openclaw channels add")}\``,
        },
      ],
      initialValue: quickstartDefault,
    });
    if (choice !== "__skip__") await handleChannelChoice(choice);
  } else {
    const doneValue = "__done__";
    const initialValue = options?.initialSelection?.[0] ?? quickstartDefault;
    while (true) {
      const { entries } = getChannelEntries();
      const choice = await prompter.select({
        message: "Select a channel",
        options: [
          ...buildSelectionOptions(entries),
          {
            value: doneValue,
            label: "Finished",
            hint: selection.length > 0 ? "Done" : "Skip for now",
          },
        ],
        initialValue,
      });
      if (choice === doneValue) break;
      await handleChannelChoice(choice);
    }
  }
  options?.onSelection?.(selection);
  const selectionNotes = /* @__PURE__ */ new Map();
  const { entries: selectionEntries } = getChannelEntries();
  for (const entry of selectionEntries)
    selectionNotes.set(entry.id, formatChannelSelectionLine(entry.meta, formatDocsLink));
  const selectedLines = selection
    .map((channel) => selectionNotes.get(channel))
    .filter((line) => Boolean(line));
  if (selectedLines.length > 0) await prompter.note(selectedLines.join("\n"), "Selected channels");
  if (!options?.skipDmPolicyPrompt)
    next = await maybeConfigureDmPolicies({
      cfg: next,
      selection,
      prompter,
      accountIdsByChannel,
      resolveAdapter: getVisibleSetupFlowAdapter,
    });
  return next;
}
//#endregion
export {
  isCatalogChannelInstalled as a,
  setupChannels as i,
  noteChannelStatus as n,
  runCollectedChannelOnboardingPostWriteHooks as r,
  createChannelOnboardingPostWriteHookCollector as t,
};
