import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCompanionInputSnapshot: vi.fn(),
  requestCompanionCameraCapture: vi.fn(),
  speakWithCompanion: vi.fn(),
}));

vi.mock("./runtime-api.js", () => ({
  getCompanionInputSnapshot: mocks.getCompanionInputSnapshot,
  requestCompanionCameraCapture: mocks.requestCompanionCameraCapture,
  speakWithCompanion: mocks.speakWithCompanion,
}));

const tempPaths: string[] = [];

type RegisteredTool = {
  name: string;
  execute: (id: string, params: Record<string, unknown>) => Promise<unknown> | unknown;
};

function registerPlugin() {
  const tools: RegisteredTool[] = [];
  const handlers = new Map<string, (payload?: unknown) => unknown>();
  return {
    handlers,
    tools,
    api: {
      pluginConfig: {},
      on: vi.fn((event: string, handler: (payload?: unknown) => unknown) => {
        handlers.set(event, handler);
      }),
      registerTool: vi.fn((tool: RegisteredTool) => {
        tools.push(tool);
      }),
    },
  };
}

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(
    tempPaths.splice(0).map(async (targetPath) => {
      await fs.rm(targetPath, { recursive: true, force: true });
    }),
  );
});

async function createTempStateDir(): Promise<string> {
  const targetPath = await fs.mkdtemp(path.join(os.tmpdir(), "companion-prompt-"));
  tempPaths.push(targetPath);
  return targetPath;
}

describe("Desktop Companion plugin entry", () => {
  beforeEach(() => {
    mocks.getCompanionInputSnapshot.mockReset().mockResolvedValue({});
    mocks.requestCompanionCameraCapture.mockReset().mockResolvedValue(null);
    mocks.speakWithCompanion.mockReset().mockResolvedValue({});
  });

  it("registers speech tools and forwards emotion with TTS provider overrides", async () => {
    const { default: plugin } = await import("./index.js");
    const { api, tools } = registerPlugin();

    plugin.register(api);
    const tool = tools.find((entry) => entry.name === "voicevox_speak");
    expect(tool).toBeDefined();

    await tool?.execute("1", {
      text: "Local companion online.",
      emotion: "happy",
      tts_provider: "web-speech",
    });

    expect(mocks.speakWithCompanion).toHaveBeenCalledWith({
      text: "Local companion online.",
      emotion: "happy",
      ttsProvider: "web-speech",
    });
  });

  it("mirrors assistant output through the companion speech path when enabled", async () => {
    const { default: plugin } = await import("./index.js");
    const { api, handlers } = registerPlugin();

    plugin.register(api);
    handlers.get("llm_output")?.({
      assistantTexts: ["# Heading\n\nHello **local** companion."],
    });

    expect(mocks.speakWithCompanion).toHaveBeenCalledWith({
      text: "Heading Hello local companion.",
    });
  });

  it("advertises control_companion as the primary local avatar harness", async () => {
    const { default: plugin } = await import("./index.js");
    const { api, handlers } = registerPlugin();

    plugin.register(api);
    const context = handlers.get("before_prompt_build")?.() as
      | { appendSystemContext?: string }
      | undefined;

    expect(context?.appendSystemContext).toContain("control_companion");
    expect(context?.appendSystemContext).toContain('action: "permission"');
    expect(context?.appendSystemContext).toContain('action: "input_snapshot"');
    expect(context?.appendSystemContext).toContain('action: "window_capture"');
    expect(context?.appendSystemContext).toContain("animate the loaded VRM or FBX avatar");
  });

  it("injects the saved local character profile into prompt guidance", async () => {
    const stateDir = await createTempStateDir();
    vi.stubEnv("OPENCLAW_STATE_DIR", stateDir);
    await fs.writeFile(
      path.join(stateDir, "companion_profile.json"),
      JSON.stringify({
        version: 1,
        displayName: "Hakua",
        characterPrompt: "Soft-spoken local desktop companion. Keep replies concise.",
        greeting: "Welcome back.",
        mood: "focused",
        voiceProfile: "VOICEVOX:8",
        relationship: {
          level: 64,
          label: "trusted",
          updatedAt: 1234,
        },
        updatedAt: 1234,
      }),
      "utf-8",
    );

    const { default: plugin } = await import("./index.js");
    const { api, handlers } = registerPlugin();

    plugin.register(api);
    const context = handlers.get("before_prompt_build")?.() as
      | { appendSystemContext?: string }
      | undefined;

    expect(context?.appendSystemContext).toContain("## Desktop Companion Profile");
    expect(context?.appendSystemContext).toContain("Display name: Hakua");
    expect(context?.appendSystemContext).toContain("Mood: focused");
    expect(context?.appendSystemContext).toContain("Relationship: trusted (64/100)");
    expect(context?.appendSystemContext).toContain("VOICEVOX:8");
    expect(context?.appendSystemContext).toContain("Welcome back.");
    expect(context?.appendSystemContext).toContain(
      "Soft-spoken local desktop companion. Keep replies concise.",
    );
  });
});
