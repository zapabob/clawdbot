import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioInput, setAudioInputRuntimeForTest } from "./audio-input.js";

class FakeAudioStream extends PassThrough {
  readonly start = vi.fn();
  readonly quit = vi.fn((callback?: () => void) => callback?.());
  readonly abort = vi.fn((callback?: () => void) => callback?.());
}

afterEach(() => {
  setAudioInputRuntimeForTest();
});

describe("AudioInput", () => {
  it("imports without eagerly loading native audio bindings", async () => {
    await expect(import("./audio-input.js")).resolves.toMatchObject({
      AudioInput: expect.any(Function),
    });
  });

  it("encodes microphone PCM data to mu-law and stops cleanly", () => {
    const stream = new FakeAudioStream();
    const audioIoMock = vi.fn(() => stream);
    const handler = vi.fn();

    setAudioInputRuntimeForTest({
      naudiodon: {
        AudioIO: audioIoMock,
        SampleFormat16Bit: 16,
      },
    });

    const input = new AudioInput();
    input.onData(handler);

    expect(input.start()).toBe(true);
    expect(audioIoMock).toHaveBeenCalledWith({
      inOptions: expect.objectContaining({
        channelCount: 1,
        framesPerBuffer: 320,
        sampleFormat: 16,
        sampleRate: 8000,
      }),
    });

    stream.emit("data", Buffer.from([0x00, 0x00, 0xff, 0x7f]));

    expect(handler).toHaveBeenCalledTimes(1);
    const [encoded] = handler.mock.calls[0] as [Buffer];
    expect(encoded).toBeInstanceOf(Buffer);
    expect(encoded).toHaveLength(2);

    input.stop();
    expect(stream.quit).toHaveBeenCalledTimes(1);
  });
});
