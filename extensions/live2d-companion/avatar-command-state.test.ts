import { describe, expect, it } from "vitest";
import { buildOptimisticAvatarCommandState } from "./avatar-command-state.js";

describe("optimistic companion avatar command state", () => {
  it("records VRM speech expression and procedural motion immediately", () => {
    expect(
      buildOptimisticAvatarCommandState({
        assetType: "vrm",
        now: 42,
        command: {
          speakText: "hello",
          expression: "happy",
          speakEmotion: "happy",
        },
      }),
    ).toMatchObject({
      lastAction: "speak",
      lastEmotion: "happy",
      lastExpression: "happy",
      lastMotion: "happy",
      lastMotionIndex: 0,
      lastUpdatedAt: 42,
      lastSpeechAt: 42,
    });
  });

  it("uses Live2D expression and motion ids for optimistic Live2D state", () => {
    expect(
      buildOptimisticAvatarCommandState({
        assetType: "live2d",
        now: 7,
        command: {
          speakText: "hello",
          expression: "happy",
          speakEmotion: "happy",
        },
      }),
    ).toMatchObject({
      lastAction: "speak",
      lastEmotion: "happy",
      lastExpression: "exp_happy",
      lastMotion: "TapBody",
      lastSpeechAt: 7,
    });
  });

  it("records direct motion commands without inventing speech", () => {
    expect(
      buildOptimisticAvatarCommandState({
        assetType: "fbx",
        now: 11,
        command: {
          motion: "surprised",
          motionIndex: 2,
        },
      }),
    ).toMatchObject({
      lastAction: "motion",
      lastMotion: "surprised",
      lastMotionIndex: 2,
      lastUpdatedAt: 11,
    });
  });
});
