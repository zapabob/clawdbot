import { afterEach, describe, expect, it } from "vitest";
import { buildLocalWhisperInvocation } from "./stt.js";

const originalWhisperCppPath = process.env.OPENCLAW_WHISPER_CPP_PATH;
const originalWhisperModelPath = process.env.OPENCLAW_WHISPER_MODEL_PATH;

afterEach(() => {
  if (originalWhisperCppPath === undefined) {
    delete process.env.OPENCLAW_WHISPER_CPP_PATH;
  } else {
    process.env.OPENCLAW_WHISPER_CPP_PATH = originalWhisperCppPath;
  }
  if (originalWhisperModelPath === undefined) {
    delete process.env.OPENCLAW_WHISPER_MODEL_PATH;
  } else {
    process.env.OPENCLAW_WHISPER_MODEL_PATH = originalWhisperModelPath;
  }
});

describe("buildLocalWhisperInvocation", () => {
  it("uses explicit whisper commands with file/model/language templates", () => {
    const invocation = buildLocalWhisperInvocation("sample.wav", {
      whisperCommand: "whisper-cli",
      whisperArgs: ["-m", "{model}", "-f", "{file}", "-l", "{language}"],
      whisperModelPath: "model.bin",
      whisperLanguage: "ja",
    });

    expect(invocation).toEqual({
      command: "whisper-cli",
      args: ["-m", "model.bin", "-f", "sample.wav", "-l", "ja"],
    });
  });

  it("falls back to the Python whisper module when whisper.cpp is unavailable", () => {
    process.env.OPENCLAW_WHISPER_CPP_PATH = "Z:/missing/whisper-cli.exe";
    process.env.OPENCLAW_WHISPER_MODEL_PATH = "Z:/missing/ggml-small.bin";

    const invocation = buildLocalWhisperInvocation("sample.wav", {});

    expect(invocation.command).toBe("py");
    expect(invocation.args).toContain("whisper");
    expect(invocation.transcriptPath).toBe("sample.txt");
  });
});
