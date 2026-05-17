import { describe, expect, it } from "vitest";
import { buildVoiceVoxSpeechProvider } from "./voicevox-speech-provider.js";

describe("VOICEVOX speech provider", () => {
  it("honors legacy local-voice vvEndpoint and vvSpeakerId config", () => {
    const provider = buildVoiceVoxSpeechProvider();

    const resolved = provider.resolveConfig?.({
      rawConfig: {
        vvEndpoint: "http://127.0.0.1:50021/",
        vvSpeakerId: 8,
      },
    });

    expect(resolved).toMatchObject({
      baseUrl: "http://127.0.0.1:50021",
      speakerId: 8,
    });
  });
});
