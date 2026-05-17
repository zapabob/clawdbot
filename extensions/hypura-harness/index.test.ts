import { describe, expect, it, vi } from "vitest";
import plugin from "./index.js";

describe("hypura-harness plugin", () => {
  it("registers tools and wires status to fetch", async () => {
    const tools: Array<{
      name: string;
      execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
    }> = [];
    const onHandlers: Record<string, () => unknown> = {};
    const mockApi = {
      pluginConfig: { baseUrl: "http://127.0.0.1:18794" },
      config: {},
      registerTool(t: {
        name: string;
        execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
      }) {
        tools.push(t);
      },
      on: vi.fn((event: string, fn: () => unknown) => {
        onHandlers[event] = fn;
      }),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ daemon_version: "0.1.0" }),
    });

    plugin.register(mockApi as never);

    expect(tools.some((t) => t.name === "hypura_harness_companion")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_submodule")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_status")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_channel_readiness")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_osc")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_voice_devices")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_voice_turn")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_companion_voice_turn")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_vrc_status")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_vrc_action")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_vrc_emergency_stop")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_companion3d_status")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_companion3d_load_model")).toBe(true);
    expect(mockApi.on).toHaveBeenCalledWith("before_prompt_build", expect.any(Function));

    const statusTool = tools.find((t) => t.name === "hypura_harness_status")!;
    const res = (await statusTool.execute("id", {})) as {
      content: Array<{ type: string; text: string }>;
    };
    expect(res.content[0].text).toContain("daemon_version");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/status",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );

    const ctx = onHandlers.before_prompt_build?.() as { appendSystemContext?: string };
    expect(ctx?.appendSystemContext).toContain("hypura_harness_status");
    expect(ctx?.appendSystemContext).toContain("hypura_harness_channel_readiness");
    expect(ctx?.appendSystemContext).toContain("hypura_harness_submodule");
    expect(ctx?.appendSystemContext).toContain("hypura_harness_voice_devices");
    expect(ctx?.appendSystemContext).toContain("hypura_harness_companion_voice_turn");
    expect(ctx?.appendSystemContext).toContain("hypura_harness_vrc_status");
    expect(ctx?.appendSystemContext).toContain("hypura_harness_vrc_action");
    expect(ctx?.appendSystemContext).toContain("hypura_harness_companion3d_event");
  });

  it("wires channel readiness to the redacted harness endpoint", async () => {
    const tools: Array<{
      name: string;
      execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
    }> = [];
    const mockApi = {
      pluginConfig: { baseUrl: "http://127.0.0.1:18794" },
      config: {},
      registerTool(t: {
        name: string;
        execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
      }) {
        tools.push(t);
      },
      on: vi.fn(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          success: true,
          liveRoundtripReady: { line: false, telegram: true },
        }),
    });

    plugin.register(mockApi as never);

    const tool = tools.find((entry) => entry.name === "hypura_harness_channel_readiness");
    expect(tool).toBeDefined();
    await tool!.execute("id", {});

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/channels/readiness",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("wires companion control to the harness endpoint", async () => {
    const tools: Array<{
      name: string;
      execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
    }> = [];
    const mockApi = {
      pluginConfig: { baseUrl: "http://127.0.0.1:18794" },
      config: {},
      registerTool(t: {
        name: string;
        execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
      }) {
        tools.push(t);
      },
      on: vi.fn(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true, action: "look_at" }),
    });

    plugin.register(mockApi as never);

    const tool = tools.find((entry) => entry.name === "hypura_harness_companion");
    expect(tool).toBeDefined();
    await tool!.execute("id", {
      action: "look_at",
      x: 0.5,
      y: -0.2,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/companion/control",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "look_at", x: 0.5, y: -0.2 }),
      }),
    );
  });

  it("wires expanded companion control voice and state options", async () => {
    const tools: Array<{
      name: string;
      execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
    }> = [];
    const mockApi = {
      pluginConfig: { baseUrl: "http://127.0.0.1:18794" },
      config: {},
      registerTool(t: {
        name: string;
        execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
      }) {
        tools.push(t);
      },
      on: vi.fn(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true, action: "speak" }),
    });

    plugin.register(mockApi as never);

    const tool = tools.find((entry) => entry.name === "hypura_harness_companion");
    expect(tool).toBeDefined();
    await tool!.execute("id", {
      action: "speak",
      value: "hello",
      emotion: "happy",
      tts_provider: "web-speech",
    });
    await tool!.execute("id", {
      action: "permission",
      capability: "mic",
      decision: "granted",
    });
    await tool!.execute("id", {
      action: "input_snapshot",
      include_camera: true,
      capture_camera: false,
    });
    await tool!.execute("id", {
      action: "window_capture",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/companion/control",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "speak",
          value: "hello",
          emotion: "happy",
          tts_provider: "web-speech",
        }),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/companion/control",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "permission",
          capability: "mic",
          decision: "granted",
        }),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/companion/control",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "input_snapshot",
          include_camera: true,
          capture_camera: false,
        }),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/companion/control",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "window_capture",
        }),
      }),
    );
  });

  it("wires submodule runs to the harness endpoint", async () => {
    const tools: Array<{
      name: string;
      execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
    }> = [];
    const mockApi = {
      pluginConfig: { baseUrl: "http://127.0.0.1:18794" },
      config: {},
      registerTool(t: {
        name: string;
        execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
      }) {
        tools.push(t);
      },
      on: vi.fn(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true, status: "completed" }),
    });

    plugin.register(mockApi as never);

    const tool = tools.find((entry) => entry.name === "hypura_harness_submodule");
    expect(tool).toBeDefined();
    await tool!.execute("id", {
      repoId: "vrchat-mcp-osc",
      preset: "status",
      extraArgs: ["--branch"],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/submodule/run",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          repoId: "vrchat-mcp-osc",
          preset: "status",
          extraArgs: ["--branch"],
        }),
      }),
    );
  });

  it("wires voice turn to the harness endpoint", async () => {
    const tools: Array<{
      name: string;
      execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
    }> = [];
    const mockApi = {
      pluginConfig: { baseUrl: "http://127.0.0.1:18794" },
      config: {},
      registerTool(t: {
        name: string;
        execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
      }) {
        tools.push(t);
      },
      on: vi.fn(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true, transcript: "hi", reply: "hello" }),
    });

    plugin.register(mockApi as never);

    const tool = tools.find((entry) => entry.name === "hypura_harness_voice_turn");
    expect(tool).toBeDefined();
    await tool!.execute("id", {
      record_seconds: 2,
      input_device: 1,
      output_devices: [5, 4, "skip"],
      speaker: 3,
      emotion: "happy",
      openclaw_timeout: 180,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/voice/turn",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          record_seconds: 2,
          input_device: 1,
          output_devices: [5, 4],
          speaker: 3,
          emotion: "happy",
          openclaw_timeout: 180,
        }),
      }),
    );
  });

  it("wires companion voice turns and mic toggles", async () => {
    const tools: Array<{
      name: string;
      execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
    }> = [];
    const mockApi = {
      pluginConfig: { baseUrl: "http://127.0.0.1:18794" },
      config: {},
      registerTool(t: {
        name: string;
        execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
      }) {
        tools.push(t);
      },
      on: vi.fn(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true }),
    });

    plugin.register(mockApi as never);

    const turnTool = tools.find((entry) => entry.name === "hypura_harness_companion_voice_turn");
    expect(turnTool).toBeDefined();
    await turnTool!.execute("id", {
      transcript: "hello",
      transcript_timestamp: 42,
      last_seen_timestamp: 12,
      speak: false,
      animate: true,
    });

    const micTool = tools.find((entry) => entry.name === "hypura_harness_companion_mic");
    expect(micTool).toBeDefined();
    await micTool!.execute("id", { enabled: false });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/voice/companion-turn",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          transcript: "hello",
          transcript_timestamp: 42,
          last_seen_timestamp: 12,
          speak: false,
          animate: true,
        }),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/voice/companion-mic",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ enabled: false }),
      }),
    );
  });

  it("wires existing-avatar VRChat tools to safe daemon endpoints", async () => {
    const tools: Array<{
      name: string;
      execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
    }> = [];
    const mockApi = {
      pluginConfig: { baseUrl: "http://127.0.0.1:18794" },
      config: {},
      registerTool(t: {
        name: string;
        execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
      }) {
        tools.push(t);
      },
      on: vi.fn(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true }),
    });

    plugin.register(mockApi as never);

    await tools.find((entry) => entry.name === "hypura_harness_vrc_status")!.execute("id", {});
    await tools
      .find((entry) => entry.name === "hypura_harness_vrc_action")!
      .execute("id", {
        action: "smile",
        reason: "greeting",
        intensity: 0.7,
      });
    await tools
      .find((entry) => entry.name === "hypura_harness_vrc_suggest_profile")!
      .execute("id", { avatar_id: "avtr_123" });
    await tools
      .find((entry) => entry.name === "hypura_harness_vrc_approve_profile")!
      .execute("id", {
        avatar_id: "avtr_123",
        confirm: "approve avtr_123",
        notes: "Reviewed by operator",
      });
    await tools
      .find((entry) => entry.name === "hypura_harness_vrc_emergency_stop")!
      .execute("id", {});

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/vrc/status",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/vrc/action",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "smile", reason: "greeting", intensity: 0.7 }),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/vrc/avatar/profile/suggest",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ avatar_id: "avtr_123" }),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/vrc/avatar/profile/approve",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          confirm: "approve avtr_123",
          avatar_id: "avtr_123",
          notes: "Reviewed by operator",
        }),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/vrc/emergency-stop",
      expect.objectContaining({
        method: "POST",
        body: "{}",
      }),
    );
  });

  it("wires companion3d tools to policy endpoints", async () => {
    const tools: Array<{
      name: string;
      execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
    }> = [];
    const mockApi = {
      pluginConfig: { baseUrl: "http://127.0.0.1:18794" },
      config: {},
      registerTool(t: {
        name: string;
        execute: (id: string, p: Record<string, unknown>) => Promise<unknown>;
      }) {
        tools.push(t);
      },
      on: vi.fn(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true }),
    });

    plugin.register(mockApi as never);

    await tools
      .find((entry) => entry.name === "hypura_harness_companion3d_status")!
      .execute("id", {});
    await tools
      .find((entry) => entry.name === "hypura_harness_companion3d_load_model")!
      .execute("id", { model_path: "state/companion3d/assets/default.vrm" });
    await tools
      .find((entry) => entry.name === "hypura_harness_companion3d_event")!
      .execute("id", {
        type: "emotion",
        payload: { emotion: "happy", intensity: 0.75 },
      });
    await tools
      .find((entry) => entry.name === "hypura_harness_companion3d_set_state")!
      .execute("id", { state: { speaking: true } });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/companion3d/status",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/companion3d/load-model",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ model_path: "state/companion3d/assets/default.vrm" }),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/companion3d/event",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          type: "emotion",
          payload: { emotion: "happy", intensity: 0.75 },
        }),
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:18794/companion3d/state",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ state: { speaking: true } }),
      }),
    );
  });
});
