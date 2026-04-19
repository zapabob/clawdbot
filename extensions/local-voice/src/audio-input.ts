import { createRequire } from "node:module";
import type { IoStreamRead } from "naudiodon";

type AudioInputHandler = (data: Buffer) => void;
type NaudiodonRuntime = Pick<typeof import("naudiodon"), "AudioIO" | "SampleFormat16Bit">;

const require = createRequire(import.meta.url);
const AUDIO_SAMPLE_RATE = 8_000;
const AUDIO_FRAMES_PER_BUFFER = 320;
const MU_LAW_BIAS = 0x84;
const MU_LAW_CLIP = 32_635;

let naudiodonRuntimeOverride: NaudiodonRuntime | null = null;
let naudiodonRuntimeCache: NaudiodonRuntime | null = null;

function loadNaudiodonRuntime(): NaudiodonRuntime {
  if (naudiodonRuntimeOverride) {
    return naudiodonRuntimeOverride;
  }
  if (!naudiodonRuntimeCache) {
    const runtime = require("naudiodon") as typeof import("naudiodon");
    naudiodonRuntimeCache = {
      AudioIO: runtime.AudioIO,
      SampleFormat16Bit: runtime.SampleFormat16Bit,
    };
  }
  return naudiodonRuntimeCache;
}

function linear16ToMuLaw(sample: number): number {
  const sign = sample < 0 ? 0x80 : 0;
  let magnitude = Math.min(Math.abs(sample), MU_LAW_CLIP) + MU_LAW_BIAS;
  let exponent = 7;

  for (let mask = 0x4000; exponent > 0 && (magnitude & mask) === 0; mask >>= 1) {
    exponent -= 1;
  }

  const mantissa = (magnitude >> (exponent + 3)) & 0x0f;
  return (~(sign | (exponent << 4) | mantissa)) & 0xff;
}

function pcm16LeToMuLaw(chunk: Buffer): Buffer {
  const sampleCount = Math.floor(chunk.length / 2);
  const encoded = Buffer.allocUnsafe(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    encoded[index] = linear16ToMuLaw(chunk.readInt16LE(index * 2));
  }
  return encoded;
}

export class AudioInput {
  private stream: IoStreamRead | null = null;
  private dataHandler: AudioInputHandler | null = null;

  private readonly handleData = (chunk: Buffer): void => {
    if (!this.dataHandler || chunk.length < 2) {
      return;
    }
    const evenChunk = chunk.length % 2 === 0 ? chunk : chunk.subarray(0, chunk.length - 1);
    if (evenChunk.length === 0) {
      return;
    }
    this.dataHandler(pcm16LeToMuLaw(evenChunk));
  };

  private readonly handleError = (): void => {
    this.stop();
  };

  onData(handler: AudioInputHandler): void {
    this.dataHandler = handler;
  }

  start(): boolean {
    if (this.stream) {
      return true;
    }

    try {
      const naudiodon = loadNaudiodonRuntime();
      const stream = naudiodon.AudioIO({
        inOptions: {
          channelCount: 1,
          framesPerBuffer: AUDIO_FRAMES_PER_BUFFER,
          sampleFormat: naudiodon.SampleFormat16Bit,
          sampleRate: AUDIO_SAMPLE_RATE,
        },
      });
      stream.on("data", this.handleData);
      stream.on("error", this.handleError);
      stream.start();
      this.stream = stream;
      return true;
    } catch {
      this.stop();
      return false;
    }
  }

  stop(): void {
    const stream = this.stream;
    this.stream = null;
    if (!stream) {
      return;
    }

    stream.removeListener("data", this.handleData);
    stream.removeListener("error", this.handleError);

    try {
      stream.quit();
    } catch {
      try {
        stream.abort();
      } catch {}
    }
  }
}

export function setAudioInputRuntimeForTest(overrides?: { naudiodon?: NaudiodonRuntime }): void {
  naudiodonRuntimeOverride = overrides?.naudiodon ?? null;
  if (!overrides?.naudiodon) {
    naudiodonRuntimeCache = null;
  }
}
