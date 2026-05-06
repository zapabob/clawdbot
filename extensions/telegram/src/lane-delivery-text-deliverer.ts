import {
  createPreviewMessageReceipt,
  type MessageReceipt,
} from "openclaw/plugin-sdk/channel-message";
import { resolveSendableOutboundReplyParts } from "openclaw/plugin-sdk/reply-payload";
import type { ReplyPayload } from "openclaw/plugin-sdk/reply-runtime";
import type { TelegramInlineButtons } from "./button-types.js";
import type { TelegramDraftStream } from "./draft-stream.js";

export type LaneName = "answer" | "reasoning";

export type DraftLaneState = {
  stream: TelegramDraftStream | undefined;
  lastPartialText: string;
  hasStreamedMessage: boolean;
  finalized: boolean;
};

type LanePreviewFinalizedDelivery = {
  content: string;
  messageId: number;
  receipt: MessageReceipt;
};

type LanePreviewFinalizedDeliveryInput = Omit<LanePreviewFinalizedDelivery, "receipt"> & {
  receipt?: MessageReceipt;
};

export type LaneDeliveryResult =
  | {
      kind: "preview-finalized";
      delivery: LanePreviewFinalizedDelivery;
    }
  | { kind: "preview-retained" | "preview-updated" | "sent" | "skipped" };

type CreateLaneTextDelivererParams = {
  lanes: Record<LaneName, DraftLaneState>;
  draftMaxChars: number;
  applyTextToPayload: (payload: ReplyPayload, text: string) => ReplyPayload;
  applyTextToFollowUpPayload?: (payload: ReplyPayload, text: string) => ReplyPayload;
  splitFinalTextForStream?: (text: string) => readonly string[];
  sendPayload: (
    payload: ReplyPayload,
    options?: { durable?: boolean; silent?: boolean },
  ) => Promise<boolean>;
  flushDraftLane: (lane: DraftLaneState) => Promise<void>;
  stopDraftLane: (lane: DraftLaneState) => Promise<void>;
  clearDraftLane: (lane: DraftLaneState) => Promise<void>;
  editStreamMessage: (params: {
    laneName: LaneName;
    messageId: number;
    text: string;
    buttons?: TelegramInlineButtons;
  }) => Promise<void>;
  log: (message: string) => void;
  markDelivered: () => void;
};

type DeliverLaneTextParams = {
  laneName: LaneName;
  text: string;
  payload: ReplyPayload;
  infoKind: string;
  buttons?: TelegramInlineButtons;
};

function result(
  kind: LaneDeliveryResult["kind"],
  delivery?: LanePreviewFinalizedDeliveryInput,
): LaneDeliveryResult {
  if (kind === "preview-finalized") {
    const finalized = delivery!;
    return {
      kind,
      delivery: {
        ...finalized,
        receipt: finalized.receipt ?? createPreviewMessageReceipt({ id: finalized.messageId }),
      },
    };
  }
  return { kind };
}

function compactChunks(chunks: readonly string[]): string[] {
  const out: string[] = [];
  let whitespace = "";
  for (const chunk of chunks) {
    if (!chunk) {
      continue;
    }
    if (chunk.trim().length === 0) {
      whitespace += chunk;
      continue;
    }
    out.push(`${whitespace}${chunk}`);
    whitespace = "";
  }
  if (whitespace && out.length > 0) {
    out[out.length - 1] = `${out[out.length - 1]}${whitespace}`;
  }
  return out;
}

export function createLaneTextDeliverer(params: CreateLaneTextDelivererParams) {
  const getLanePreviewText = (lane: DraftLaneState) => lane.lastPartialText;
  const readNow = () => params.now?.() ?? Date.now();
  const markActivePreviewComplete = (laneName: LaneName) => {
    params.activePreviewLifecycleByLane[laneName] = "complete";
    params.retainPreviewOnCleanupByLane[laneName] = true;
  };
  const isMessagePreviewLane = (lane: DraftLaneState) => lane.stream != null;
  const shouldUseFreshFinalForLane = (lane: DraftLaneState) =>
    isMessagePreviewLane(lane) && isLongLivedPreview(lane.stream?.visibleSinceMs?.(), readNow());
  const shouldUseFreshFinalForPreview = (lane: DraftLaneState, visibleSinceMs?: number) =>
    isMessagePreviewLane(lane) && isLongLivedPreview(visibleSinceMs, readNow());
  const clearActivePreviewAfterFreshFinal = async (lane: DraftLaneState, laneName: LaneName) => {
    try {
      await lane.stream?.clear();
    } catch (err) {
      params.log(`telegram: ${laneName} fresh final preview cleanup failed: ${String(err)}`);
    }
    await params.clearDraftLane(lane);
    lane.lastPartialText = "";
    lane.hasStreamedMessage = false;
  };
  const tryEditPreviewMessage = async (args: {
    laneName: LaneName;
    messageId: number;
    text: string;
    context: "final" | "update";
    previewButtons?: TelegramInlineButtons;
    updateLaneSnapshot: boolean;
    lane: DraftLaneState;
    finalTextAlreadyLanded: boolean;
    retainAlternatePreviewOnMissingTarget: boolean;
    targetPreviewText: string;
  }): Promise<PreviewEditResult> => {
    try {
      await params.editPreview({
        laneName: args.laneName,
        messageId: args.messageId,
        text: args.text,
        previewButtons: args.previewButtons,
        context: args.context,
      });
      if (args.updateLaneSnapshot) {
        args.lane.lastPartialText = args.text;
      }
      params.markDelivered();
      return "edited";
    } catch (err) {
      if (isMessageNotModifiedError(err)) {
        params.log(
          `telegram: ${args.laneName} preview ${args.context} edit returned "message is not modified"; treating as delivered`,
        );
        params.markDelivered();
        return "edited";
      }
      if (args.context === "final") {
        if (args.finalTextAlreadyLanded) {
          params.log(
            `telegram: ${args.laneName} preview final edit failed after stop flush; keeping existing preview (${String(err)})`,
          );
          params.markDelivered();
          return "retained";
        }
        if (isSafeToRetrySendError(err)) {
          params.log(
            `telegram: ${args.laneName} preview final edit failed before reaching Telegram; falling back to standard send (${String(err)})`,
          );
          return "fallback";
        }
        if (isMissingPreviewMessageError(err)) {
          if (args.retainAlternatePreviewOnMissingTarget) {
            params.log(
              `telegram: ${args.laneName} preview final edit target missing; keeping alternate preview without fallback (${String(err)})`,
            );
            params.markDelivered();
            return "retained";
          }
          params.log(
            `telegram: ${args.laneName} preview final edit target missing with no alternate preview; falling back to standard send (${String(err)})`,
          );
          return "fallback";
        }
        if (isRecoverableTelegramNetworkError(err, { allowMessageMatch: true })) {
          params.log(
            `telegram: ${args.laneName} preview final edit may have landed despite network error; keeping existing preview (${String(err)})`,
          );
          params.markDelivered();
          return "retained";
        }
        if (isTelegramClientRejection(err)) {
          params.log(
            `telegram: ${args.laneName} preview final edit rejected by Telegram (client error); falling back to standard send (${String(err)})`,
          );
          return "fallback";
        }
        if (isIncompleteFinalPreviewPrefix(args.targetPreviewText, args.text)) {
          params.log(
            `telegram: ${args.laneName} preview final edit failed and existing preview is an incomplete prefix; falling back to standard send (${String(err)})`,
          );
          return "fallback";
        }
        // Default: ambiguous error — retain when fallback may duplicate a final
        // edit that already landed or when the preview is not known-incomplete.
        params.log(
          `telegram: ${args.laneName} preview final edit failed with ambiguous error; keeping existing preview to avoid duplicate (${String(err)})`,
        );
        params.markDelivered();
        return "retained";
      }
      params.log(
        `telegram: ${args.laneName} preview ${args.context} edit failed; falling back to standard send (${String(err)})`,
      );
      return "fallback";
    }
  };

  const tryUpdatePreviewForLane = async ({
    lane,
    laneName,
    text,
    previewButtons,
    stopBeforeEdit = false,
    updateLaneSnapshot = false,
    skipRegressive,
    context,
    previewMessageId: previewMessageIdOverride,
    previewTextSnapshot,
  }: TryUpdatePreviewParams): Promise<PreviewEditResult> => {
    const editPreview = (
      messageId: number,
      finalTextAlreadyLanded: boolean,
      retainAlternatePreviewOnMissingTarget: boolean,
      targetPreviewText: string,
    ) =>
      tryEditPreviewMessage({
        laneName,
        messageId,
        text,
        context,
        previewButtons,
        updateLaneSnapshot,
        lane,
        finalTextAlreadyLanded,
        retainAlternatePreviewOnMissingTarget,
        targetPreviewText,
      });
    const finalizePreview = (
      previewMessageId: number,
      finalTextAlreadyLanded: boolean,
      hadPreviewMessage: boolean,
      retainAlternatePreviewOnMissingTarget = false,
    ): PreviewEditResult | Promise<PreviewEditResult> => {
      const currentPreviewText = previewTextSnapshot ?? getLanePreviewText(lane);
      const shouldSkipRegressive = shouldSkipRegressivePreviewUpdate({
        currentPreviewText,
        text,
        skipRegressive,
        hadPreviewMessage,
      });
      if (shouldSkipRegressive) {
        params.markDelivered();
        return "regressive-skipped";
      }
      return editPreview(
        previewMessageId,
        finalTextAlreadyLanded,
        retainAlternatePreviewOnMissingTarget,
        currentPreviewText,
      );
    };
    if (!lane.stream) {
      return "fallback";
    }
    const previewTargetBeforeStop = resolvePreviewTarget({
      lane,
      previewMessageIdOverride,
      stopBeforeEdit,
      context,
    });
    if (previewTargetBeforeStop.stopCreatesFirstPreview && lane.hasStreamedMessage) {
      // Final stop() can create the first visible preview message.
      // Prime pending text so the stop flush sends the final text snapshot.
      lane.stream.update(text);
      await params.stopDraftLane(lane);
    } else {
      await params.flushDraftLane(lane);
    }

    const messageId = stream.messageId();
    if (typeof messageId !== "number") {
      if (isFinal && stream.sendMayHaveLanded?.()) {
        lane.finalized = true;
        params.markDelivered();
        return result("preview-retained");
      }
      return undefined;
    }

    const deliveredStreamText = stream.lastDeliveredText?.();
    if (
      isFinal &&
      deliveredStreamText !== undefined &&
      deliveredStreamText !== firstChunk.trimEnd()
    ) {
      return undefined;
    }

    params.markDelivered();
    if (buttons) {
      try {
        await params.editStreamMessage({ laneName, messageId, text: firstChunk, buttons });
      } catch (err) {
        params.log(`telegram: ${laneName} stream button edit failed: ${String(err)}`);
      }
    }

    if (isFinal) {
      lane.finalized = true;
      for (const chunk of remainingChunks) {
        if (chunk.trim().length === 0) {
          continue;
        }
        await params.sendPayload(followUpPayload(payload, chunk));
      }
      return result("preview-finalized", { content: text, messageId });
    }

    return result("preview-updated");
  };

  return async ({
    laneName,
    text,
    payload,
    infoKind,
    buttons,
  }: DeliverLaneTextParams): Promise<LaneDeliveryResult> => {
    const lane = params.lanes[laneName];
    const reply = resolveSendableOutboundReplyParts(payload, { text });
    const hasMedia = reply.hasMedia;
    const canEditViaPreview =
      !hasMedia && text.length > 0 && text.length <= params.draftMaxChars && !payload.isError;

    if (infoKind === "final") {
      // Transient previews must decide cleanup retention per final attempt.
      // Completed previews intentionally stay retained so later extra payloads
      // do not clear the already-finalized message.
      if (params.activePreviewLifecycleByLane[laneName] === "transient") {
        params.retainPreviewOnCleanupByLane[laneName] = false;
      }
      if (laneName === "answer") {
        const archivedResult = await consumeArchivedAnswerPreviewForFinal({
          lane,
          text,
          payload,
          previewButtons,
          canEditViaPreview,
        });
        if (archivedResult) {
          return archivedResult;
        }
      }
      if (canEditViaPreview && params.activePreviewLifecycleByLane[laneName] === "transient") {
        await params.flushDraftLane(lane);
        if (laneName === "answer") {
          const archivedResultAfterFlush = await consumeArchivedAnswerPreviewForFinal({
            lane,
            text,
            payload,
            previewButtons,
            canEditViaPreview,
          });
          if (archivedResultAfterFlush) {
            return archivedResultAfterFlush;
          }
        }
        if (shouldUseFreshFinalForLane(lane)) {
          await params.stopDraftLane(lane);
          const delivered = await params.sendPayload(params.applyTextToPayload(payload, text));
          if (delivered) {
            await clearActivePreviewAfterFreshFinal(lane, laneName);
            return result("sent");
          }
        }
        const previewMessageId = lane.stream?.messageId();
        const finalized = await tryUpdatePreviewForLane({
          lane,
          laneName,
          text,
          previewButtons,
          stopBeforeEdit: true,
          skipRegressive: "existingOnly",
          context: "final",
        });
        if (finalized === "edited") {
          markActivePreviewComplete(laneName);
          return result("preview-finalized", {
            content: text,
            messageId: previewMessageId ?? lane.stream?.messageId(),
          });
        }
        if (finalized === "regressive-skipped") {
          markActivePreviewComplete(laneName);
          return result("preview-finalized", {
            content: lane.lastPartialText,
            messageId: previewMessageId ?? lane.stream?.messageId(),
          });
        }
        if (finalized === "retained") {
          markActivePreviewComplete(laneName);
          return result("preview-retained");
        }
      } else if (!hasMedia && !payload.isError && text.length > params.draftMaxChars) {
        params.log(
          `telegram: preview final too long for edit (${text.length} > ${params.draftMaxChars}); falling back to standard send`,
        );
      }
      await params.stopDraftLane(lane);
      const delivered = await params.sendPayload(params.applyTextToPayload(payload, text));
      return delivered ? result("sent") : result("skipped");
    }

    if (allowPreviewUpdateForNonFinal && canEditViaPreview) {
      const updated = await tryUpdatePreviewForLane({
        lane,
        laneName,
        text,
        previewButtons,
        stopBeforeEdit: false,
        updateLaneSnapshot: true,
        skipRegressive: "always",
        context: "update",
      });
      if (updated === "edited" || updated === "regressive-skipped") {
        return result("preview-updated");
      }
    }

    const delivered = await params.sendPayload(params.applyTextToPayload(payload, text), {
      durable: isFinal,
    });
    if (delivered && isFinal) {
      lane.finalized = true;
    }
    return delivered ? result("sent") : result("skipped");
  };
}
