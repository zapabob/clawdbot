import { afterEach, describe, expect, it, vi } from "vitest";
import type { IAvatarController } from "./avatar-controller.js";
import { LipSyncController } from "./lip-sync.js";

function createAvatar(): IAvatarController & {
  setLipSyncValue: ReturnType<typeof vi.fn<(value: number) => void>>;
} {
  return {
    avatarType: "vrm",
    init: vi.fn(async () => {}),
    reloadModel: vi.fn(async () => {}),
    playMotion: vi.fn(),
    playExpression: vi.fn(),
    setLipSyncValue: vi.fn(),
    lookAt: vi.fn(),
    destroy: vi.fn(),
  };
}

describe("Desktop Companion lip sync TTS", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not fall back to mechanical Web Speech when VOICEVOX is selected", async () => {
    const avatar = createAvatar();
    const speak = vi.fn();
    const sendStateUpdate = vi.fn();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503 })),
    );
    vi.stubGlobal("window", {
      companionBridge: { sendStateUpdate },
      speechSynthesis: {
        cancel: vi.fn(),
        getVoices: vi.fn(() => []),
        speak,
      },
    });

    const controller = new LipSyncController(avatar, { ttsProvider: "voicevox" });

    await controller.speak("voicevox selected");

    expect(speak).not.toHaveBeenCalled();
    expect(avatar.setLipSyncValue).toHaveBeenCalledWith(0);
    expect(sendStateUpdate).toHaveBeenCalledWith({ speaking: false });
  });
});
