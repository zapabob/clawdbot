import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setCompanionAvatarCommand: vi.fn(),
  speakWithCompanion: vi.fn(),
}));

vi.mock("openclaw/plugin-sdk/live2d-companion", () => ({
  setCompanionAvatarCommand: mocks.setCompanionAvatarCommand,
  speakWithCompanion: mocks.speakWithCompanion,
}));

describe("createCompanionControlTool", () => {
  beforeEach(() => {
    mocks.setCompanionAvatarCommand.mockReset().mockResolvedValue({});
    mocks.speakWithCompanion.mockReset().mockResolvedValue({});
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
});
