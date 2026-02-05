import { describe, expect, it } from "vitest";
import {
  getOpencodeZenStaticFallbackModels,
  OPENCODE_ZEN_MODEL_ALIASES,
  resolveOpencodeZenAlias,
  resolveOpencodeZenModelApi,
} from "./opencode-zen-models.js";

describe("resolveOpencodeZenAlias", () => {
  it("resolves gpt5 alias to GPT-5.2 (Codex)", () => {
    expect(resolveOpencodeZenAlias("gpt5")).toBe("gpt-5.2");
  });

  it("resolves gpt alias to GPT-5.2 (Codex)", () => {
    expect(resolveOpencodeZenAlias("gpt")).toBe("gpt-5.2");
  });

  it("keeps legacy aliases working (now map to GPT-5.2)", () => {
    expect(resolveOpencodeZenAlias("gpt4")).toBe("gpt-5.1");
    expect(resolveOpencodeZenAlias("o1")).toBe("gpt-5.2");
    expect(resolveOpencodeZenAlias("gemini-2.5")).toBe("gemini-3-pro");
  });

  it("resolves gemini alias", () => {
    expect(resolveOpencodeZenAlias("gemini")).toBe("gemini-3-pro");
  });

  it("returns input if no alias exists", () => {
    expect(resolveOpencodeZenAlias("some-unknown-model")).toBe("some-unknown-model");
  });

  it("is case-insensitive", () => {
    expect(resolveOpencodeZenAlias("GPT5")).toBe("gpt-5.2");
    expect(resolveOpencodeZenAlias("Gpt")).toBe("gpt-5.2");
  });
});

describe("resolveOpencodeZenModelApi", () => {
  it("maps APIs by model family", () => {
    expect(resolveOpencodeZenModelApi("gpt-5.2")).toBe("openai-responses");
    expect(resolveOpencodeZenModelApi("gemini-3-pro")).toBe("google-generative-ai");
    expect(resolveOpencodeZenModelApi("alpha-gd4")).toBe("openai-completions");
    expect(resolveOpencodeZenModelApi("big-pickle")).toBe("openai-completions");
    expect(resolveOpencodeZenModelApi("glm-4.7")).toBe("openai-completions");
    expect(resolveOpencodeZenModelApi("some-unknown-model")).toBe("openai-completions");
  });
});

describe("getOpencodeZenStaticFallbackModels", () => {
  it("returns an array of models", () => {
    const models = getOpencodeZenStaticFallbackModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBe(8);
  });

  it("includes GPT (Codex), Gemini models", () => {
    const models = getOpencodeZenStaticFallbackModels();
    const ids = models.map((m) => m.id);

    expect(ids).toContain("gpt-5.2");
    expect(ids).toContain("gpt-5.1-codex");
    expect(ids).toContain("gemini-3-pro");
    expect(ids).toContain("glm-4.7");
  });

  it("returns valid ModelDefinitionConfig objects", () => {
    const models = getOpencodeZenStaticFallbackModels();
    for (const model of models) {
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(typeof model.reasoning).toBe("boolean");
      expect(Array.isArray(model.input)).toBe(true);
      expect(model.cost).toBeDefined();
      expect(typeof model.contextWindow).toBe("number");
      expect(typeof model.maxTokens).toBe("number");
    }
  });
});

describe("OPENCODE_ZEN_MODEL_ALIASES", () => {
  it("has expected aliases (Codex GPT-5.2 primary, Gemini secondary)", () => {
    expect(OPENCODE_ZEN_MODEL_ALIASES.gpt).toBe("gpt-5.2");
    expect(OPENCODE_ZEN_MODEL_ALIASES.gpt5).toBe("gpt-5.2");
    expect(OPENCODE_ZEN_MODEL_ALIASES.gemini).toBe("gemini-3-pro");
    expect(OPENCODE_ZEN_MODEL_ALIASES.codex).toBe("gpt-5.1-codex");
    expect(OPENCODE_ZEN_MODEL_ALIASES.glm).toBe("glm-4.7");

    // Legacy aliases (kept for backward compatibility)
    expect(OPENCODE_ZEN_MODEL_ALIASES.gpt4).toBe("gpt-5.1");
    expect(OPENCODE_ZEN_MODEL_ALIASES.o1).toBe("gpt-5.2");
    expect(OPENCODE_ZEN_MODEL_ALIASES["gemini-2.5"]).toBe("gemini-3-pro");
  });
});
