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
        getDevices: () => [
          {
            id: 10,
            name: "Microphone (Brio 100)",
            maxInputChannels: 2,
            maxOutputChannels: 0,
            defaultSampleRate: 48_000,
            defaultLowInputLatency: 0,
            defaultLowOutputLatency: 0,
            defaultHighInputLatency: 0,
            defaultHighOutputLatency: 0,
            hostAPIName: "Windows WASAPI",
          },
        ],
        SampleFormat16Bit: 16,
      },
    });

    const input = new AudioInput();
    input.onData(handler);

    expect(input.start()).toBe(true);
    expect(audioIoMock).toHaveBeenCalledWith({
      inOptions: expect.objectContaining({
        channelCount: 1,
        deviceId: 10,
        framesPerBuffer: 960,
        sampleFormat: 16,
        sampleRate: 48000,
      }),
    });

    const pcm = Buffer.alloc(24);
    pcm.writeInt16LE(0, 0);
    pcm.writeInt16LE(0x7fff, 12);
    stream.emit("data", pcm);

    expect(handler).toHaveBeenCalledTimes(1);
    const [encoded] = handler.mock.calls[0] as [Buffer];
    expect(encoded).toBeInstanceOf(Buffer);
    expect(encoded).toHaveLength(2);

    input.stop();
    expect(stream.quit).toHaveBeenCalledTimes(1);
  });

  it("returns false when no input device is available", () => {
    setAudioInputRuntimeForTest({
      naudiodon: {
        AudioIO: vi.fn(),
        getDevices: () => [],
        SampleFormat16Bit: 16,
      },
    });

    const input = new AudioInput();

    expect(input.start()).toBe(false);
    expect(input.getLastError()).toBe("No audio input device is available");
  });

  it("falls back to the next input device when the preferred device fails", () => {
    const stream = new FakeAudioStream();
    const audioIoMock = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("WASAPI unavailable");
      })
      .mockImplementationOnce(() => stream);

    setAudioInputRuntimeForTest({
      naudiodon: {
        AudioIO: audioIoMock,
        getDevices: () => [
          {
            id: 10,
            name: "Microphone (Primary)",
            maxInputChannels: 2,
            maxOutputChannels: 0,
            defaultSampleRate: 48_000,
            defaultLowInputLatency: 0,
            defaultLowOutputLatency: 0,
            defaultHighInputLatency: 0,
            defaultHighOutputLatency: 0,
            hostAPIName: "Windows WASAPI",
          },
          {
            id: 11,
            name: "Microphone (Fallback)",
            maxInputChannels: 2,
            maxOutputChannels: 0,
            defaultSampleRate: 44_100,
            defaultLowInputLatency: 0,
            defaultLowOutputLatency: 0,
            defaultHighInputLatency: 0,
            defaultHighOutputLatency: 0,
            hostAPIName: "MME",
          },
        ],
        SampleFormat16Bit: 16,
      },
    });

    const input = new AudioInput();

    expect(input.start()).toBe(true);
    expect(audioIoMock).toHaveBeenCalledTimes(2);
    expect(audioIoMock).toHaveBeenLastCalledWith({
      inOptions: expect.objectContaining({
        deviceId: 11,
        sampleRate: 44_100,
      }),
    });
    expect(input.getLastError()).toBeNull();

    input.stop();
  });
});
