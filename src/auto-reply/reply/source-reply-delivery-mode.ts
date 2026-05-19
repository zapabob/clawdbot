import { normalizeChatType } from "../../channels/chat-type.js";
import type { InboundEventKind } from "../../channels/inbound-event/kind.js";
import type { OpenClawConfig } from "../../config/types.openclaw.js";
import { createSubsystemLogger } from "../../logging/subsystem.js";
import type { SessionSendPolicyDecision } from "../../sessions/send-policy.js";
import {
  isExplicitCommandTurn,
  resolveCommandTurnContext,
  type CommandTurnContext,
} from "../command-turn-context.js";
import type { SourceReplyDeliveryMode } from "../get-reply-options.types.js";

const log = createSubsystemLogger("auto-reply");

let visibleRepliesPrivateDefaultWarned = false;

type SourceReplyVisibleRepliesDefault = "automatic" | "message_tool";

export type SourceReplyDeliveryModeContext = {
  ChatType?: string;
  InboundEventKind?: InboundEventKind;
  CommandAuthorized?: boolean;
  CommandBody?: string;
  CommandSource?: "text" | "native";
  CommandTurn?: CommandTurnContext;
};

/** @internal Test-only reset for the process-level one-shot warning. */
export function resetVisibleRepliesPrivateDefaultWarningForTest(): void {
  visibleRepliesPrivateDefaultWarned = false;
}

export function resolveSourceReplyDeliveryMode(params: {
  cfg: OpenClawConfig;
  ctx: SourceReplyDeliveryModeContext;
  requested?: SourceReplyDeliveryMode;
  defaultVisibleReplies?: SourceReplyVisibleRepliesDefault;
  messageToolAvailable?: boolean;
}): SourceReplyDeliveryMode {
  let mode: SourceReplyDeliveryMode;
  if (params.requested) {
    mode = params.requested;
  } else if (isExplicitSourceReplyCommand(params.ctx)) {
    mode = "automatic";
  } else {
    const chatType = normalizeChatType(params.ctx.ChatType);
    if (chatType === "group" || chatType === "channel") {
      const configuredMode =
        params.cfg.messages?.groupChat?.visibleReplies ?? params.cfg.messages?.visibleReplies;
      mode = configuredMode === "automatic" ? "automatic" : "message_tool_only";
      if (
        mode === "message_tool_only" &&
        configuredMode === undefined &&
        params.messageToolAvailable !== false &&
        !visibleRepliesPrivateDefaultWarned
      ) {
        visibleRepliesPrivateDefaultWarned = true;
        log.warn(
          `Group/channel replies are private by default since 2026.4.27. ` +
            `To restore automatic room posting, set messages.groupChat.visibleReplies to "automatic" in openclaw.json and save the config. ` +
            `The gateway hot-reloads messages config; restart only if file watching/reload is disabled. ` +
            `Relates to https://github.com/openclaw/openclaw/issues/74876`,
        );
      }
    } else {
      const configuredMode = params.cfg.messages?.visibleReplies ?? params.defaultVisibleReplies;
      mode = configuredMode === "message_tool" ? "message_tool_only" : "automatic";
    }
  }
  if (mode === "message_tool_only" && params.messageToolAvailable === false) {
    return "automatic";
  }
  return mode;
}

export function isExplicitSourceReplyCommand(ctx: SourceReplyDeliveryModeContext): boolean {
  if (ctx.CommandSource === "native") {
    return true;
  }
  return (
    ctx.CommandSource === "text" &&
    ctx.CommandAuthorized === true &&
    typeof ctx.CommandBody === "string" &&
    ctx.CommandBody.trim().length > 0
  );
}

export type SourceReplyVisibilityPolicy = {
  sourceReplyDeliveryMode: SourceReplyDeliveryMode;
  sendPolicyDenied: boolean;
  suppressAutomaticSourceDelivery: boolean;
  suppressDelivery: boolean;
  suppressHookUserDelivery: boolean;
  suppressHookReplyLifecycle: boolean;
  suppressTyping: boolean;
  deliverySuppressionReason: string;
};

export function resolveSourceReplyVisibilityPolicy(params: {
  cfg: OpenClawConfig;
  ctx: SourceReplyDeliveryModeContext;
  requested?: SourceReplyDeliveryMode;
  strictMessageToolOnly?: boolean;
  sendPolicy: SessionSendPolicyDecision;
  suppressAcpChildUserDelivery?: boolean;
  explicitSuppressTyping?: boolean;
  shouldSuppressTyping?: boolean;
  defaultVisibleReplies?: SourceReplyVisibleRepliesDefault;
  messageToolAvailable?: boolean;
}): SourceReplyVisibilityPolicy {
  const sourceReplyDeliveryMode = resolveSourceReplyDeliveryMode({
    cfg: params.cfg,
    ctx: params.ctx,
    requested: params.requested,
    defaultVisibleReplies: params.defaultVisibleReplies,
    messageToolAvailable: params.messageToolAvailable,
  });
  const sendPolicyDenied = params.sendPolicy === "deny";
  const suppressAutomaticSourceDelivery = sourceReplyDeliveryMode === "message_tool_only";
  const suppressDelivery = sendPolicyDenied || suppressAutomaticSourceDelivery;
  const deliverySuppressionReason = sendPolicyDenied
    ? "sendPolicy: deny"
    : suppressAutomaticSourceDelivery
      ? "sourceReplyDeliveryMode: message_tool_only"
      : "";

  return {
    sourceReplyDeliveryMode,
    sendPolicyDenied,
    suppressAutomaticSourceDelivery,
    suppressDelivery,
    suppressHookUserDelivery: params.suppressAcpChildUserDelivery === true || suppressDelivery,
    suppressHookReplyLifecycle:
      sendPolicyDenied ||
      params.suppressAcpChildUserDelivery === true ||
      params.explicitSuppressTyping === true ||
      params.shouldSuppressTyping === true,
    suppressTyping:
      sendPolicyDenied ||
      params.explicitSuppressTyping === true ||
      params.shouldSuppressTyping === true,
    deliverySuppressionReason,
  };
}
