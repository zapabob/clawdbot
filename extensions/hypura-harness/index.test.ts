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
    expect(tools.some((t) => t.name === "hypura_harness_osc")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_voice_devices")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_voice_turn")).toBe(true);
    expect(tools.some((t) => t.name === "hypura_harness_companion_voice_turn")).toBe(true);
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
    expect(ctx?.appendSystemContext).toContain("hypura_harness_submodule");
    expect(ctx?.appendSystemContext).toContain("hypura_harness_voice_devices");
    expect(ctx?.appendSystemContext).toContain("hypura_harness_companion_voice_turn");
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
});
