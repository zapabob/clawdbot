import { describe, expect, it, vi } from "vitest";
import type { IAvatarController } from "./avatar-controller.js";
import { applyEmotion, detectEmotion, isEmotionType } from "./emotion-mapper.js";

function createController(avatarType: IAvatarController["avatarType"]): IAvatarController & {
  playMotion: ReturnType<typeof vi.fn<(group: string, index?: number, loop?: boolean) => void>>;
  playExpression: ReturnType<typeof vi.fn<(expressionId: string) => void>>;
} {
  const playMotion = vi.fn<(group: string, index?: number, loop?: boolean) => void>();
  const playExpression = vi.fn<(expressionId: string) => void>();
  return {
    avatarType,
    init: vi.fn(async () => {}),
    reloadModel: vi.fn(async () => {}),
    playMotion,
    playExpression,
    setLipSyncValue: vi.fn(),
    lookAt: vi.fn(),
    destroy: vi.fn(),
  };
}

describe("Desktop Companion emotion mapping", () => {
  it("detects explicit tags and Japanese assistant tone", () => {
    expect(detectEmotion("[EMOTION:happy] 了解です")).toBe("happy");
    expect(detectEmotion("ありがとうございます。助かりました。")).toBe("happy");
    expect(detectEmotion("ごめん、処理に失敗しました。")).toBe("sad");
    expect(detectEmotion("えっ、想定外の結果です。")).toBe("surprised");
    expect(detectEmotion("それはダメです。")).toBe("angry");
    expect(detectEmotion("ちょっと照れますね。")).toBe("embarrassed");
    expect(detectEmotion("通常の案内です。")).toBe("neutral");
  });

  it("uses Live2D expression ids for Live2D controllers", () => {
    const controller = createController("live2d");

    applyEmotion(controller, "happy");

    expect(controller.playMotion).toHaveBeenCalledWith("TapBody", 0);
    expect(controller.playExpression).toHaveBeenCalledWith("exp_happy");
  });

  it("uses avatar-native expressions and procedural motions for VRM and FBX", () => {
    const vrm = createController("vrm");
    const fbx = createController("fbx");

    applyEmotion(vrm, "happy");
    applyEmotion(fbx, "surprised");

    expect(vrm.playMotion).toHaveBeenCalledWith("happy", 0);
    expect(vrm.playExpression).toHaveBeenCalledWith("happy");
    expect(fbx.playMotion).toHaveBeenCalledWith("surprised", 0);
    expect(fbx.playExpression).toHaveBeenCalledWith("surprised");
  });

  it("recognizes only supported emotion tags", () => {
    expect(isEmotionType("happy")).toBe(true);
    expect(isEmotionType("exp_happy")).toBe(false);
  });
});
