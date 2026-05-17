import { describe, expect, it } from "vitest";
import { buildAvatarSpeechState } from "./avatar-state.js";
import { getEmotionProfile } from "./emotion-mapper.js";

describe("Desktop Companion avatar speech state", () => {
  it("reports Live2D expression and motion ids while speaking", () => {
    expect(
      buildAvatarSpeechState({
        avatarType: "live2d",
        emotion: "happy",
        emotionProfile: getEmotionProfile("happy"),
        timestamp: 1710000000000,
      }),
    ).toEqual({
      lastAction: "speak",
      lastEmotion: "happy",
      lastSpeechAt: 1710000000000,
      lastMotion: "TapBody",
      lastMotionIndex: 0,
      lastExpression: "exp_happy",
    });
  });

  it("reports VRM native expressions and procedural motions while speaking", () => {
    expect(
      buildAvatarSpeechState({
        avatarType: "vrm",
        emotion: "happy",
        emotionProfile: getEmotionProfile("happy"),
        timestamp: 1710000000001,
      }),
    ).toEqual({
      lastAction: "speak",
      lastEmotion: "happy",
      lastSpeechAt: 1710000000001,
      lastMotion: "happy",
      lastMotionIndex: 0,
      lastExpression: "happy",
    });
  });

  it("reports FBX native expressions and procedural motions while speaking", () => {
    expect(
      buildAvatarSpeechState({
        avatarType: "fbx",
        emotion: "surprised",
        emotionProfile: getEmotionProfile("surprised"),
        timestamp: 1710000000002,
      }),
    ).toEqual({
      lastAction: "speak",
      lastEmotion: "surprised",
      lastSpeechAt: 1710000000002,
      lastMotion: "surprised",
      lastMotionIndex: 0,
      lastExpression: "surprised",
    });
  });
});
