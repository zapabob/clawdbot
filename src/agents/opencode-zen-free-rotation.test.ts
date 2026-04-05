import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyOpencodeZenFreeRotation,
  isOpencodeZenFreeCandidate,
} from "./opencode-zen-free-rotation.js";

describe("isOpencodeZenFreeCandidate", () => {
  it("matches opencode and opencode-go Zen free ids", () => {
    expect(
      isOpencodeZenFreeCandidate({ provider: "opencode", model: "qwen3.6-plus-free" }),
    ).toBe(true);
    expect(
      isOpencodeZenFreeCandidate({ provider: "opencode-go", model: "big-pickle" }),
    ).toBe(true);
    expect(
      isOpencodeZenFreeCandidate({ provider: "opencode", model: "claude-opus-4-6" }),
    ).toBe(false);
    expect(isOpencodeZenFreeCandidate({ provider: "ollama", model: "qwen3.6-plus-free" })).toBe(
      false,
    );
  });
});

describe("applyOpencodeZenFreeRotation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no-ops when OPENCLAW_ROTATE_OPENCODE_ZEN_FREE disables rotation", async () => {
    vi.stubEnv("OPENCLAW_ROTATE_OPENCODE_ZEN_FREE", "0");
    const candidates = [
      { provider: "opencode", model: "qwen3.6-plus-free" },
      { provider: "opencode", model: "minimax-m2.5-free" },
    ];
    const dir = await mkdtemp(join(tmpdir(), "oc-rot-"));
    try {
      const out = await applyOpencodeZenFreeRotation(candidates, dir);
      expect(out).toEqual(candidates);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("no-ops when fewer than two Zen free models", async () => {
    const candidates = [
      { provider: "ollama", model: "x" },
      { provider: "opencode", model: "qwen3.6-plus-free" },
    ];
    const dir = await mkdtemp(join(tmpdir(), "oc-rot-"));
    try {
      const out = await applyOpencodeZenFreeRotation(candidates, dir);
      expect(out).toEqual(candidates);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rotates only Zen free slots and persists the next index", async () => {
    const dir = await mkdtemp(join(tmpdir(), "oc-rot-"));
    const chain = () => [
      { provider: "ollama", model: "x" },
      { provider: "opencode", model: "qwen3.6-plus-free" },
      { provider: "opencode", model: "minimax-m2.5-free" },
      { provider: "opencode", model: "gpt-5-nano" },
      { provider: "ollama", model: "y" },
    ];

    try {
      const r1 = await applyOpencodeZenFreeRotation(chain(), dir);
      expect(r1.map((c) => `${c.provider}/${c.model}`)).toEqual([
        "ollama/x",
        "opencode/qwen3.6-plus-free",
        "opencode/minimax-m2.5-free",
        "opencode/gpt-5-nano",
        "ollama/y",
      ]);

      const r2 = await applyOpencodeZenFreeRotation(chain(), dir);
      expect(r2.map((c) => `${c.provider}/${c.model}`)).toEqual([
        "ollama/x",
        "opencode/minimax-m2.5-free",
        "opencode/gpt-5-nano",
        "opencode/qwen3.6-plus-free",
        "ollama/y",
      ]);

      const stateRaw = await readFile(join(dir, "opencode-zen-free-rotation.json"), "utf8");
      const state = JSON.parse(stateRaw) as { index?: number };
      expect(state.index).toBe(2);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
