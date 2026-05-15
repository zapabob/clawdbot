import type { ReplyPayload } from "openclaw/plugin-sdk/reply-runtime";
import { describe, expect, it, vi } from "vitest";
import { createTestDraftStream } from "./draft-stream.test-helpers.js";
import {
  createLaneTextDeliverer,
  type DraftLaneState,
  type LaneDeliveryResult,
  type LaneName,
} from "./lane-delivery.js";

const HELLO_FINAL = "Hello final";

function createHarness(params?: {
  answerMessageId?: number;
  answerStream?: DraftLaneState["stream"] | null;
  draftMaxChars?: number;
  splitFinalTextForStream?: (text: string) => readonly string[];
}) {
  const answer =
    params?.answerStream === null
      ? undefined
      : (params?.answerStream ?? createTestDraftStream({ messageId: params?.answerMessageId }));
  const reasoning = createTestDraftStream();
  const lanes: Record<LaneName, DraftLaneState> = {
    answer: {
      stream: answer,
      lastPartialText: "",
      hasStreamedMessage: false,
      finalized: false,
    },
    reasoning: {
      stream: reasoning,
      lastPartialText: "",
      hasStreamedMessage: false,
      finalized: false,
    },
  };
  const sendPayload = vi.fn().mockResolvedValue(true);
  const flushDraftLane = vi.fn().mockImplementation(async (lane: DraftLaneState) => {
    await lane.stream?.flush();
  });
  const stopDraftLane = vi.fn().mockImplementation(async (lane: DraftLaneState) => {
    await lane.stream?.stop();
  });
  const clearDraftLane = vi.fn().mockImplementation(async (lane: DraftLaneState) => {
    await lane.stream?.clear();
  });
  const editStreamMessage = vi.fn().mockResolvedValue(undefined);
  const log = vi.fn();
  const markDelivered = vi.fn();

  const deliverLaneText = createLaneTextDeliverer({
    lanes,
    draftMaxChars: params?.draftMaxChars ?? 4_096,
    applyTextToPayload: (payload: ReplyPayload, text: string) => ({ ...payload, text }),
    splitFinalTextForStream: params?.splitFinalTextForStream,
    sendPayload,
    flushDraftLane,
    stopDraftLane,
    clearDraftLane,
    editStreamMessage,
    log,
    markDelivered,
  });

  return {
    deliverLaneText,
    lanes,
    answer,
    reasoning,
    sendPayload,
    flushDraftLane,
    stopDraftLane,
    clearDraftLane,
    editStreamMessage,
    log,
    markDelivered,
  };
}

async function deliverFinalAnswer(harness: ReturnType<typeof createHarness>, text: string) {
  return harness.deliverLaneText({
    laneName: "answer",
    text,
    payload: { text },
    infoKind: "final",
  });
}

function expectPreviewFinalized(
  result: LaneDeliveryResult,
): Extract<LaneDeliveryResult, { kind: "preview-finalized" }>["delivery"] {
  expect(result.kind).toBe("preview-finalized");
  if (result.kind !== "preview-finalized") {
    throw new Error(`expected preview-finalized, got ${result.kind}`);
  }
  return result.delivery;
}

describe("createLaneTextDeliverer", () => {
  it("finalizes text-only replies in the active stream message", async () => {
    const harness = createHarness({ answerMessageId: 999 });

    const result = await deliverFinalAnswer(harness, HELLO_FINAL);

    const delivery = expectPreviewFinalized(result);
    expect(delivery.content).toBe(HELLO_FINAL);
    expect(delivery.messageId).toBe(999);
    expect(delivery.receipt?.primaryPlatformMessageId).toBe("999");
    expect(harness.answer?.update).toHaveBeenCalledWith(HELLO_FINAL);
    expect(harness.stopDraftLane).toHaveBeenCalledTimes(1);
    expect(harness.sendPayload).not.toHaveBeenCalled();
    expect(harness.markDelivered).toHaveBeenCalledTimes(1);
    expect(harness.lanes.answer.finalized).toBe(true);
  });

  it("streams block and final text through the same lane", async () => {
    const harness = createHarness({ answerMessageId: 999 });

    const blockResult = await harness.deliverLaneText({
      laneName: "answer",
      text: "working",
      payload: { text: "working" },
      infoKind: "block",
    });
    const finalResult = await deliverFinalAnswer(harness, "done");

    expect(blockResult.kind).toBe("preview-updated");
    const delivery = expectPreviewFinalized(finalResult);
    expect(delivery.content).toBe("done");
    expect(delivery.messageId).toBe(999);
    expect(harness.answer?.update).toHaveBeenNthCalledWith(1, "working");
    expect(harness.answer?.update).toHaveBeenNthCalledWith(2, "done");
    expect(harness.flushDraftLane).toHaveBeenCalledTimes(1);
    expect(harness.stopDraftLane).toHaveBeenCalledTimes(1);
    expect(harness.sendPayload).not.toHaveBeenCalled();
  });

  it("uses normal final delivery when the stream edit leaves stale text", async () => {
    const answer = createTestDraftStream({ messageId: 999 });
    answer.lastDeliveredText.mockReturnValue("working");
    const harness = createHarness({ answerStream: answer });

    const result = await deliverFinalAnswer(harness, "done");

    expect(result.kind).toBe("sent");
    expect(answer.update).toHaveBeenCalledWith("done");
    expect(harness.clearDraftLane).toHaveBeenCalledTimes(1);
    expect(harness.sendPayload).toHaveBeenCalledWith({ text: "done" }, { durable: true });
    expect(harness.markDelivered).not.toHaveBeenCalled();
    expect(harness.lanes.answer.finalized).toBe(true);
  });

  it("falls back to normal delivery when no stream exists", async () => {
    const harness = createHarness({ answerStream: null });

    const result = await deliverFinalAnswer(harness, HELLO_FINAL);

    expect(result.kind).toBe("sent");
    expect(harness.sendPayload).toHaveBeenCalledWith({ text: HELLO_FINAL }, { durable: true });
    expect(harness.clearDraftLane).not.toHaveBeenCalled();
    expect(harness.lanes.answer.finalized).toBe(true);
  });

  it("clears unfinalized stream state before non-stream final delivery", async () => {
    const harness = createHarness({ answerMessageId: 999 });

    const result = await harness.deliverLaneText({
      laneName: "answer",
      text: "photo",
      payload: { text: "photo", mediaUrl: "https://example.com/a.png" },
      infoKind: "final",
    });

    expect(result.kind).toBe("sent");
    expect(harness.clearDraftLane).toHaveBeenCalledTimes(1);
    expect(harness.answer?.clear).toHaveBeenCalledTimes(1);
    expect(harness.sendPayload).toHaveBeenCalledWith(
      {
        text: "photo",
        mediaUrl: "https://example.com/a.png",
      },
      { durable: true },
    );
  });

  it("streams the first long final chunk and sends follow-up chunks", async () => {
    const harness = createHarness({
      answerMessageId: 999,
      draftMaxChars: 5,
      splitFinalTextForStream: () => ["Hello", " world", " again"],
    });

    const result = await deliverFinalAnswer(harness, "Hello world again");

    const delivery = expectPreviewFinalized(result);
    expect(delivery.content).toBe("Hello world again");
    expect(delivery.messageId).toBe(999);
    expect(harness.answer?.update).toHaveBeenCalledWith("Hello");
    expect(harness.sendPayload).toHaveBeenCalledTimes(2);
    expect(harness.sendPayload).toHaveBeenNthCalledWith(1, { text: " world" });
    expect(harness.sendPayload).toHaveBeenNthCalledWith(2, { text: " again" });
  });

  it("retains the streamed message when stop may have landed without a message id", async () => {
    const answer = createTestDraftStream();
    answer.sendMayHaveLanded.mockReturnValue(true);
    const harness = createHarness({ answerStream: answer });

    const result = await deliverFinalAnswer(harness, HELLO_FINAL);

    expect(result.kind).toBe("preview-retained");
    expect(answer.update).toHaveBeenCalledWith(HELLO_FINAL);
    expect(harness.sendPayload).not.toHaveBeenCalled();
    expect(harness.markDelivered).toHaveBeenCalledTimes(1);
    expect(harness.lanes.answer.finalized).toBe(true);
  });

  it("attaches buttons to the stream message without sending a second reply", async () => {
    const harness = createHarness({ answerMessageId: 999 });
    const buttons = [[{ text: "OK", callback_data: "ok" }]];

    const result = await harness.deliverLaneText({
      laneName: "answer",
      text: HELLO_FINAL,
      payload: { text: HELLO_FINAL, channelData: { telegram: { buttons } } },
      infoKind: "final",
      buttons,
    });

    expect(expectPreviewFinalized(result)).toMatchObject({
      content: HELLO_FINAL,
      messageId: 999,
    });
    expect(harness.stopDraftLane).toHaveBeenCalledTimes(2);
    expect(harness.sendPayload).toHaveBeenCalledTimes(1);
    expect(harness.editPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 999,
        text: HELLO_FINAL,
      }),
    );
    expect(harness.answer.stream?.clear).not.toHaveBeenCalled();
    expect(harness.markDelivered).toHaveBeenCalledTimes(1);
  });

  it("sends a fresh final for stale archived previews", async () => {
    const visibleSinceMs = 10_000;
    const harness = createHarness({
      answerMessageId: 1001,
      answerPreviewVisibleSinceMs: visibleSinceMs,
      nowMs: visibleSinceMs + 60_000,
    });
    harness.archivedAnswerPreviews.push({
      messageId: 222,
      textSnapshot: "Working...",
      visibleSinceMs,
      deleteIfUnused: true,
    });

    const result = await deliverFinalAnswer(harness, HELLO_FINAL);

    expect(result.kind).toBe("sent");
    expect(harness.sendPayload).toHaveBeenCalledWith(
      expect.objectContaining({ text: HELLO_FINAL }),
    );
    expect(harness.editPreview).not.toHaveBeenCalled();
    expect(harness.deletePreviewMessage).toHaveBeenCalledWith(222);
  });

  it("falls back to editing a stale archived preview when fresh final send returns false", async () => {
    const visibleSinceMs = 10_000;
    const harness = createHarness({
      answerMessageId: 1001,
      answerPreviewVisibleSinceMs: visibleSinceMs,
      nowMs: visibleSinceMs + 60_000,
    });
    harness.archivedAnswerPreviews.push({
      messageId: 222,
      textSnapshot: "Working...",
      visibleSinceMs,
      deleteIfUnused: true,
    });
    harness.sendPayload.mockResolvedValueOnce(false);

    const result = await deliverFinalAnswer(harness, HELLO_FINAL);

    expect(expectPreviewFinalized(result)).toEqual({
      content: HELLO_FINAL,
      messageId: 222,
    });
    expect(harness.sendPayload).toHaveBeenCalledTimes(1);
    expect(harness.editPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 222,
        text: HELLO_FINAL,
      }),
    );
    expect(harness.deletePreviewMessage).not.toHaveBeenCalled();
    expect(harness.markDelivered).toHaveBeenCalledTimes(1);
  });

  // ── Duplicate message regression tests ──────────────────────────────────
  // During final delivery, only ambiguous post-connect failures keep the
  // preview. Definite non-delivery falls back to a real send.

  it("retains preview on ambiguous API error during final", async () => {
    const harness = createHarness({ answerMessageId: 999 });
    // Plain Error with no error_code → ambiguous, prefer incomplete over duplicate
    harness.editPreview.mockRejectedValue(new Error("500: Internal Server Error"));

    await expectFinalPreviewRetained({ harness });
    expect(harness.editPreview).toHaveBeenCalledTimes(1);
  });

  it("falls back when an archived preview edit target is missing and no alternate preview exists", async () => {
    const harness = createHarness();
    seedArchivedAnswerPreview(harness);
    harness.editPreview.mockRejectedValue(new Error("400: Bad Request: message to edit not found"));

    const result = await deliverFinalAnswer(harness, "Complete final answer");

    expect(harness.editPreview).toHaveBeenCalledTimes(1);
    expect(harness.sendPayload).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Complete final answer" }),
    );
    expect(result.kind).toBe("sent");
    expect(harness.deletePreviewMessage).toHaveBeenCalledWith(5555);
  });

  it("falls back when an archived preview ambiguous final edit would leave an incomplete prefix", async () => {
    const harness = createHarness();
    harness.archivedAnswerPreviews.push({
      messageId: 5555,
      textSnapshot: "Hello fi",
      deleteIfUnused: true,
    });
    harness.editPreview.mockRejectedValue(new Error("500: preview edit failed"));

    await expectFinalEditFallbackToSend({
      harness,
      text: HELLO_FINAL,
      buttons,
    });
    expect(harness.sendPayload).not.toHaveBeenCalled();
  });

  it("keeps the stream delivery when button attachment fails", async () => {
    const harness = createHarness({ answerMessageId: 999 });
    const buttons = [[{ text: "OK", callback_data: "ok" }]];
    harness.editStreamMessage.mockRejectedValue(new Error("400: button rejected"));

    const result = await harness.deliverLaneText({
      laneName: "answer",
      text: HELLO_FINAL,
      payload: { text: HELLO_FINAL, channelData: { telegram: { buttons } } },
      infoKind: "final",
      buttons,
    });

    const delivery = expectPreviewFinalized(result);
    expect(delivery.content).toBe(HELLO_FINAL);
    expect(delivery.messageId).toBe(999);
    expect(harness.sendPayload).not.toHaveBeenCalled();
    expect(harness.log).toHaveBeenCalledWith(
      "telegram: answer stream button edit failed: Error: 400: button rejected",
    );
  });
});
