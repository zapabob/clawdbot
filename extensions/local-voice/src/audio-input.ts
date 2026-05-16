import { createRequire } from "node:module";
import type { IoStreamRead } from "naudiodon";

type AudioInputHandler = (data: Buffer) => void;
type NaudiodonDevice = {
  id: number;
  name: string;
  maxInputChannels: number;
  defaultSampleRate: number;
  hostAPIName: string;
};
type NaudiodonRuntime = Pick<
  typeof import("naudiodon"),
  "AudioIO" | "SampleFormat16Bit" | "getDevices"
>;

const require = createRequire(__filename);
const TARGET_SAMPLE_RATE = 8_000;
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
      getDevices: runtime.getDevices,
      SampleFormat16Bit: runtime.SampleFormat16Bit,
    };
  }
  return naudiodonRuntimeCache;
}

function selectInputDevice(devices: NaudiodonDevice[]): NaudiodonDevice | null {
  const inputDevices = devices.filter((device) => device.maxInputChannels > 0);
  return (
    inputDevices.find(
      (device) =>
        device.hostAPIName === "Windows WASAPI" &&
        /mic|microphone|\u30de\u30a4\u30af/i.test(device.name),
    ) ??
    inputDevices.find((device) => /mic|microphone|\u30de\u30a4\u30af/i.test(device.name)) ??
    inputDevices[0] ??
    null
  );
}

function linear16ToMuLaw(sample: number): number {
  const sign = sample < 0 ? 0x80 : 0;
  let magnitude = Math.min(Math.abs(sample), MU_LAW_CLIP) + MU_LAW_BIAS;
  let exponent = 7;

  for (let mask = 0x4000; exponent > 0 && (magnitude & mask) === 0; mask >>= 1) {
    exponent -= 1;
  }

  const mantissa = (magnitude >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

function pcm16LeToMuLaw(chunk: Buffer): Buffer {
  const sampleCount = Math.floor(chunk.length / 2);
  const encoded = Buffer.allocUnsafe(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    encoded[index] = linear16ToMuLaw(chunk.readInt16LE(index * 2));
  }
  return encoded;
}

function downsamplePcm16Le(chunk: Buffer, sourceSampleRate: number): Buffer {
  if (sourceSampleRate === TARGET_SAMPLE_RATE) {
    return chunk;
  }

  const sourceSampleCount = Math.floor(chunk.length / 2);
  if (sourceSampleCount === 0) {
    return Buffer.alloc(0);
  }

  const ratio = sourceSampleRate / TARGET_SAMPLE_RATE;
  const targetSampleCount = Math.max(1, Math.floor(sourceSampleCount / ratio));
  const output = Buffer.allocUnsafe(targetSampleCount * 2);

  for (let targetIndex = 0; targetIndex < targetSampleCount; targetIndex += 1) {
    const sourceIndex = Math.min(sourceSampleCount - 1, Math.floor(targetIndex * ratio));
    output.writeInt16LE(chunk.readInt16LE(sourceIndex * 2), targetIndex * 2);
  }

  return output;
}

export class AudioInput {
  private stream: IoStreamRead | null = null;
  private dataHandler: AudioInputHandler | null = null;
  private sourceSampleRate = TARGET_SAMPLE_RATE;

  private readonly handleData = (chunk: Buffer): void => {
    if (!this.dataHandler || chunk.length < 2) {
      return;
    }
    const evenChunk = chunk.length % 2 === 0 ? chunk : chunk.subarray(0, chunk.length - 1);
    if (evenChunk.length === 0) {
      return;
    }
    const targetRateChunk = downsamplePcm16Le(evenChunk, this.sourceSampleRate);
    this.dataHandler(pcm16LeToMuLaw(targetRateChunk));
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
      const selectedDevice = selectInputDevice(naudiodon.getDevices() as NaudiodonDevice[]);
      if (!selectedDevice) {
        return false;
      }

      const sampleRate = Number(selectedDevice.defaultSampleRate) || TARGET_SAMPLE_RATE;
      this.sourceSampleRate = sampleRate;
      const stream = naudiodon.AudioIO({
        inOptions: {
          deviceId: selectedDevice.id,
          channelCount: 1,
          framesPerBuffer: Math.max(160, Math.round(sampleRate * 0.02)),
          sampleFormat: naudiodon.SampleFormat16Bit,
          sampleRate,
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
