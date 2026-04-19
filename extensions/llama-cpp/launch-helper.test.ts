import { describe, expect, it } from "vitest";
import {
  deriveLlamaCppModelIdFromPath,
  resolveLlamaCppLaunchSpec,
} from "../../scripts/llama-cpp-launch.js";

describe("llama.cpp launch helper", () => {
  it("derives a model id from the GGUF basename", () => {
    expect(
      deriveLlamaCppModelIdFromPath(
        "C:\\Users\\downl\\Desktop\\SO8T\\gguf_models\\Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf",
      ),
    ).toBe("Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf");
  });

  it("builds a launch command with the default llama.cpp host and port", () => {
    const spec = resolveLlamaCppLaunchSpec({
      LLAMA_CPP_MODEL_PATH:
        "C:\\models\\Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf",
    } as NodeJS.ProcessEnv);

    expect(spec.modelId).toBe("Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf");
    expect(spec.args).toEqual([
      "-m",
      "C:\\models\\Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf",
      "--host",
      "127.0.0.1",
      "--port",
      "8080",
    ]);
  });

  it("adds mmproj and API key when configured and preserves spaced Windows paths", () => {
    const spec = resolveLlamaCppLaunchSpec({
      LLAMA_CPP_MODEL: "Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf",
      LLAMA_CPP_MODEL_PATH:
        "C:\\Users\\downl\\Desktop\\SO8T\\gguf models\\Gemma\\Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf",
      LLAMA_CPP_MMPROJ_PATH:
        "C:\\Users\\downl\\Desktop\\SO8T\\gguf models\\Gemma\\mmproj-Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-f16.gguf",
      LLAMA_CPP_API_KEY: "llama-cpp-local",
    } as NodeJS.ProcessEnv);

    expect(spec.args).toEqual([
      "-m",
      "C:\\Users\\downl\\Desktop\\SO8T\\gguf models\\Gemma\\Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf",
      "--host",
      "127.0.0.1",
      "--port",
      "8080",
      "--mmproj",
      "C:\\Users\\downl\\Desktop\\SO8T\\gguf models\\Gemma\\mmproj-Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-f16.gguf",
      "--api-key",
      "llama-cpp-local",
    ]);
  });

  it("fails clearly when LLAMA_CPP_MODEL_PATH is missing", () => {
    expect(() => resolveLlamaCppLaunchSpec({} as NodeJS.ProcessEnv)).toThrow(
      "Missing LLAMA_CPP_MODEL_PATH",
    );
  });
});
