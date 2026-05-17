import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCompanionInputSnapshot: vi.fn(),
  getCompanionProfile: vi.fn(),
  getCompanionState: vi.fn(),
  requestCompanionWindowCapture: vi.fn(),
  setCompanionMicEnabled: vi.fn(),
  setCompanionPermission: vi.fn(),
  setCompanionAvatarCommand: vi.fn(),
  speakWithCompanion: vi.fn(),
  updateCompanionProfile: vi.fn(),
}));

vi.mock("openclaw/plugin-sdk/live2d-companion", () => ({
  getCompanionInputSnapshot: mocks.getCompanionInputSnapshot,
  getCompanionProfile: mocks.getCompanionProfile,
  getCompanionState: mocks.getCompanionState,
  requestCompanionWindowCapture: mocks.requestCompanionWindowCapture,
  setCompanionMicEnabled: mocks.setCompanionMicEnabled,
  setCompanionPermission: mocks.setCompanionPermission,
  setCompanionAvatarCommand: mocks.setCompanionAvatarCommand,
  speakWithCompanion: mocks.speakWithCompanion,
  updateCompanionProfile: mocks.updateCompanionProfile,
}));

describe("createCompanionControlTool", () => {
  beforeEach(() => {
    mocks.getCompanionInputSnapshot.mockReset().mockResolvedValue({});
    mocks.getCompanionProfile.mockReset().mockResolvedValue({
      displayName: "OpenClaw Companion",
      mood: "neutral",
    });
    mocks.getCompanionState.mockReset().mockResolvedValue({});
    mocks.requestCompanionWindowCapture.mockReset().mockResolvedValue(null);
    mocks.setCompanionMicEnabled.mockReset().mockResolvedValue({ ok: true });
    mocks.setCompanionPermission.mockReset().mockResolvedValue({});
    mocks.setCompanionAvatarCommand.mockReset().mockResolvedValue({});
    mocks.speakWithCompanion.mockReset().mockResolvedValue({});
    mocks.updateCompanionProfile.mockReset().mockResolvedValue({
      displayName: "Hakua",
      mood: "happy",
    });
  });

  it("sends look_at commands with clamped coordinates", async () => {
    const { createCompanionControlTool } = await import("./companion-control-tool.js");
    const tool = createCompanionControlTool({
      workspaceDir: "C:/repo",
    });

    await tool.execute("1", {
      action: "look_at",
      x: 2,
      y: -4,
    });

    expect(mocks.setCompanionAvatarCommand).toHaveBeenCalledWith({
      stateDir: "C:\\repo\\.openclaw-desktop",
      avatarCommand: {
        lookAt: { x: 1, y: -1 },
      },
    });
  });

  it("can cue an emotion before speaking", async () => {
    const { createCompanionControlTool } = await import("./companion-control-tool.js");
    const tool = createCompanionControlTool({
      workspaceDir: "C:/repo",
    });

    await tool.execute("1", {
      action: "speak",
      value: "Local companion online.",
      emotion: "happy",
    });

    expect(mocks.setCompanionAvatarCommand).not.toHaveBeenCalled();
    expect(mocks.speakWithCompanion).toHaveBeenCalledWith({
      stateDir: "C:\\repo\\.openclaw-desktop",
      text: "Local companion online.",
      emotion: "happy",
    });
  });

  it("sends speech emotion and TTS provider through the companion speech payload", async () => {
    const { createCompanionControlTool } = await import("./companion-control-tool.js");
    const tool = createCompanionControlTool({
      workspaceDir: "C:/repo",
    });

    await tool.execute("1", {
      action: "speak",
      value: "Local companion online.",
      emotion: "happy",
      tts_provider: "web-speech",
    });

    expect(mocks.setCompanionAvatarCommand).not.toHaveBeenCalled();
    expect(mocks.speakWithCompanion).toHaveBeenCalledWith({
      stateDir: "C:\\repo\\.openclaw-desktop",
      text: "Local companion online.",
      emotion: "happy",
      ttsProvider: "web-speech",
    });
  });

  it("loads a model path into the companion", async () => {
    const { createCompanionControlTool } = await import("./companion-control-tool.js");
    const tool = createCompanionControlTool({
      workspaceDir: "C:/repo",
    });

    await tool.execute("1", {
      action: "load_model",
      model_path: "C:/repo/assets/Hakua.fbx",
    });

    expect(mocks.setCompanionAvatarCommand).toHaveBeenCalledWith({
      stateDir: "C:\\repo\\.openclaw-desktop",
      avatarCommand: {
        loadModel: "C:/repo/assets/Hakua.fbx",
      },
    });
  });

  it("resolves workspace-relative model paths before loading", async () => {
    const { createCompanionControlTool } = await import("./companion-control-tool.js");
    const tool = createCompanionControlTool({
      workspaceDir: "C:/repo",
    });

    await tool.execute("1", {
      action: "load_model",
      model_path: "assets/NFD/Hakua/FBX/FBX/Hakua.fbx",
    });

    expect(mocks.setCompanionAvatarCommand).toHaveBeenCalledWith({
      stateDir: "C:\\repo\\.openclaw-desktop",
      avatarCommand: {
        loadModel: "C:\\repo\\assets\\NFD\\Hakua\\FBX\\FBX\\Hakua.fbx",
      },
    });
  });

  it("toggles companion microphone STT capture", async () => {
    const { createCompanionControlTool } = await import("./companion-control-tool.js");
    const tool = createCompanionControlTool({
      workspaceDir: "C:/repo",
    });

    await tool.execute("1", {
      action: "mic",
      enabled: true,
    });

    expect(mocks.setCompanionMicEnabled).toHaveBeenCalledWith({
      stateDir: "C:\\repo\\.openclaw-desktop",
      enabled: true,
    });
  });

  it("reads the companion input snapshot for STT transcripts", async () => {
    mocks.getCompanionInputSnapshot.mockResolvedValue({
      transcript: "hello",
      transcriptTimestamp: 123,
      camera: null,
      tabContext: { attached: false },
    });
    const { createCompanionControlTool } = await import("./companion-control-tool.js");
    const tool = createCompanionControlTool({
      workspaceDir: "C:/repo",
    });

    const result = await tool.execute("1", {
      action: "input_snapshot",
      capture_camera: true,
    });

    expect(mocks.getCompanionInputSnapshot).toHaveBeenCalledWith({
      stateDir: "C:\\repo\\.openclaw-desktop",
      payload: {
        includeCamera: true,
        captureCamera: true,
      },
    });
    expect(result.details).toMatchObject({
      status: "ok",
      action: "input_snapshot",
      snapshot: {
        transcript: "hello",
        transcriptTimestamp: 123,
      },
    });
  });

  it("captures the companion window for visual avatar proof", async () => {
    mocks.requestCompanionWindowCapture.mockResolvedValue({
      base64: "iVBORw0KGgo=",
      mimeType: "image/png",
      timestamp: 123,
      width: 380,
      height: 480,
      source: "desktop-companion-window",
    });
    const { createCompanionControlTool } = await import("./companion-control-tool.js");
    const tool = createCompanionControlTool({
      workspaceDir: "C:/repo",
    });

    const result = await tool.execute("1", {
      action: "window_capture",
    });

    expect(mocks.requestCompanionWindowCapture).toHaveBeenCalledWith({
      stateDir: "C:\\repo\\.openclaw-desktop",
    });
    expect(result.details).toMatchObject({
      status: "ok",
      action: "window_capture",
      capture: {
        mimeType: "image/png",
        source: "desktop-companion-window",
      },
    });
  });

  it("updates explicit companion permissions", async () => {
    const { createCompanionControlTool } = await import("./companion-control-tool.js");
    const tool = createCompanionControlTool({
      workspaceDir: "C:/repo",
    });

    await tool.execute("1", {
      action: "permission",
      capability: "mic",
      decision: "granted",
    });

    expect(mocks.setCompanionPermission).toHaveBeenCalledWith({
      stateDir: "C:\\repo\\.openclaw-desktop",
      capability: "mic",
      decision: "granted",
    });
  });

  it("reads the local companion profile when no profile patch is provided", async () => {
    const { createCompanionControlTool } = await import("./companion-control-tool.js");
    const tool = createCompanionControlTool({
      workspaceDir: "C:/repo",
    });

    const result = await tool.execute("1", {
      action: "profile",
    });

    expect(mocks.getCompanionProfile).toHaveBeenCalledWith({
      stateDir: "C:\\repo\\.openclaw-desktop",
    });
    expect(mocks.updateCompanionProfile).not.toHaveBeenCalled();
    expect(result.details).toMatchObject({
      status: "ok",
      action: "profile",
      profile: {
        displayName: "OpenClaw Companion",
      },
    });
  });

  it("updates the local companion profile for character-first state", async () => {
    const { createCompanionControlTool } = await import("./companion-control-tool.js");
    const tool = createCompanionControlTool({
      workspaceDir: "C:/repo",
    });

    const result = await tool.execute("1", {
      action: "profile",
      display_name: "Hakua",
      character_prompt: "Local-first companion",
      mood: "happy",
      voice_profile: "VOICEVOX:8",
      relationship_level: 75,
      relationship_label: "trusted",
    });

    expect(mocks.updateCompanionProfile).toHaveBeenCalledWith({
      stateDir: "C:\\repo\\.openclaw-desktop",
      profile: {
        displayName: "Hakua",
        characterPrompt: "Local-first companion",
        mood: "happy",
        voiceProfile: "VOICEVOX:8",
        relationship: {
          level: 75,
          label: "trusted",
        },
      },
    });
    expect(result.details).toMatchObject({
      status: "updated",
      action: "profile",
      profile: {
        displayName: "Hakua",
        mood: "happy",
      },
    });
  });
});
