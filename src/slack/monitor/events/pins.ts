import type { SlackEventMiddlewareArgs } from "@slack/bolt";
import { danger } from "../../../globals.js";
import { enqueueSystemEvent } from "../../../infra/system-events.js";
import { resolveSlackChannelLabel } from "../channel-config.js";
import type { SlackMonitorContext } from "../context.js";
import type { SlackPinEvent } from "../types.js";

async function handleSlackPinEvent(params: {
  ctx: SlackMonitorContext;
  trackEvent?: () => void;
  body: unknown;
  event: unknown;
  action: "pinned" | "unpinned";
  contextKeySuffix: "added" | "removed";
  errorLabel: string;
}): Promise<void> {
  const { ctx, trackEvent, body, event, action, contextKeySuffix, errorLabel } = params;

  try {
    if (ctx.shouldDropMismatchedSlackEvent(body)) {
      return;
    }
    trackEvent?.();

    const payload = event as SlackPinEvent;
    const channelId = payload.channel_id;
    const channelInfo = channelId ? await ctx.resolveChannelName(channelId) : {};
    if (
      !ctx.isChannelAllowed({
        channelId,
        channelName: channelInfo?.name,
        channelType: channelInfo?.type,
      })
    ) {
      return;
    }
    const label = resolveSlackChannelLabel({
      channelId,
      channelName: channelInfo?.name,
    });
    const userInfo = payload.user ? await ctx.resolveUserName(payload.user) : {};
    const userLabel = userInfo?.name ?? payload.user ?? "someone";
    const itemType = payload.item?.type ?? "item";
    const messageId = payload.item?.message?.ts ?? payload.event_ts;
    const sessionKey = ctx.resolveSlackSystemEventSessionKey({
      channelId,
      channelType: channelInfo?.type ?? undefined,
    });
    enqueueSystemEvent(`Slack: ${userLabel} ${action} a ${itemType} in ${label}.`, {
      sessionKey,
      contextKey: `slack:pin:${contextKeySuffix}:${channelId ?? "unknown"}:${messageId ?? "unknown"}`,
    });
  } catch (err) {
    ctx.runtime.error?.(danger(`slack ${errorLabel} handler failed: ${String(err)}`));
  }
}

export function registerSlackPinEvents(params: {
  ctx: SlackMonitorContext;
  trackEvent?: () => void;
}) {
  const { ctx, trackEvent } = params;

  ctx.app.event("pin_added", async ({ event, body }: SlackEventMiddlewareArgs<"pin_added">) => {
    await handleSlackPinEvent({
      ctx,
      trackEvent,
      body,
      event,
      action: "pinned",
      contextKeySuffix: "added",
      errorLabel: "pin added",
    });
  });

  ctx.app.event("pin_removed", async ({ event, body }: SlackEventMiddlewareArgs<"pin_removed">) => {
    await handleSlackPinEvent({
      ctx,
      trackEvent,
      body,
      event,
      action: "unpinned",
      contextKeySuffix: "removed",
      errorLabel: "pin removed",
    });
  });
}
