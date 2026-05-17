import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
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

function resolveAudioInputWorkerPath(): string {
  const override = process.env.OPENCLAW_AUDIO_INPUT_WORKER_PATH?.trim();
  return override || require.resolve("./audio-input-worker.mjs");
}

function resolveAudioInputNodeExe(): string {
  return process.env.OPENCLAW_AUDIO_INPUT_NODE_EXE?.trim() || "node";
}

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

function selectInputDevices(devices: NaudiodonDevice[]): NaudiodonDevice[] {
  const inputDevices = devices.filter((device) => device.maxInputChannels > 0);
  const seen = new Set<number>();
  const addUnique = (device: NaudiodonDevice | undefined): NaudiodonDevice[] => {
    if (!device || seen.has(device.id)) {
      return [];
    }
    seen.add(device.id);
    return [device];
  };
  const micPattern = /mic|microphone|\u30de\u30a4\u30af/i;
  return [
    ...addUnique(
      inputDevices.find(
        (device) => device.hostAPIName === "Windows WASAPI" && micPattern.test(device.name),
      ),
    ),
    ...inputDevices.flatMap((device) =>
      addUnique(micPattern.test(device.name) ? device : undefined),
    ),
    ...inputDevices.flatMap((device) => addUnique(device)),
  ];
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
  private worker: ChildProcessWithoutNullStreams | null = null;
  private workerLineBuffer = "";
  private dataHandler: AudioInputHandler | null = null;
  private sourceSampleRate = TARGET_SAMPLE_RATE;
  private lastError: string | null = null;

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

  private readonly handleError = (error?: unknown): void => {
    this.lastError =
      error instanceof Error
        ? `Audio input stream emitted an error: ${error.message}`
        : "Audio input stream emitted an error";
    this.stop();
  };

  private readonly handleWorkerStdout = (chunk: Buffer): void => {
    this.workerLineBuffer += chunk.toString("utf-8");
    const lines = this.workerLineBuffer.split(/\r?\n/);
    this.workerLineBuffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.startsWith("{")) {
        continue;
      }
      try {
        const message = JSON.parse(trimmedLine) as
          | { type: "ready" }
          | { type: "data"; chunk?: string }
          | { type: "error"; message?: string };
        if (message.type === "data" && message.chunk && this.dataHandler) {
          this.dataHandler(Buffer.from(message.chunk, "base64"));
        } else if (message.type === "error") {
          this.lastError = message.message ?? "Audio input worker failed";
          this.stop();
        }
      } catch {
        continue;
      }
    }
  };

  private readonly handleWorkerStderr = (chunk: Buffer): void => {
    const message = chunk.toString("utf-8").trim();
    if (message) {
      this.lastError = message;
    }
  };

  private readonly handleWorkerError = (error: Error): void => {
    this.lastError = `Audio input worker failed: ${error.message}`;
    this.stop();
  };

  private readonly handleWorkerExit = (
    code: number | null,
    signal: NodeJS.Signals | null,
  ): void => {
    if (!this.worker) {
      return;
    }
    this.worker = null;
    if (code !== 0) {
      this.lastError = this.lastError ?? `Audio input worker exited with code ${code ?? signal}`;
    }
  };

  onData(handler: AudioInputHandler): void {
    this.dataHandler = handler;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  private startWorkerAudioInput(reason: string): boolean {
    try {
      const nodeExe = resolveAudioInputNodeExe();
      const workerPath = resolveAudioInputWorkerPath();
      const probe = spawnSync(nodeExe, [workerPath, "--probe-start"], {
        encoding: "utf-8",
        timeout: 5_000,
        windowsHide: true,
      });
      if (probe.error || probe.status !== 0) {
        this.lastError = `${reason}; audio input worker probe failed: ${
          probe.error?.message || probe.stderr.trim() || probe.stdout.trim() || probe.status
        }`;
        return false;
      }

      const worker = spawn(nodeExe, [workerPath], {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
      this.worker = worker;
      this.workerLineBuffer = "";
      this.lastError = null;
      worker.stdout.on("data", this.handleWorkerStdout);
      worker.stderr.on("data", this.handleWorkerStderr);
      worker.on("error", this.handleWorkerError);
      worker.on("exit", this.handleWorkerExit);
      return true;
    } catch (error) {
      this.lastError = `${reason}; audio input worker could not start: ${
        error instanceof Error ? error.message : String(error)
      }`;
      this.stop();
      return false;
    }
  }

  start(): boolean {
    if (this.stream || this.worker) {
      return true;
    }

    this.lastError = null;
    try {
      const naudiodon = loadNaudiodonRuntime();
      const selectedDevices = selectInputDevices(naudiodon.getDevices() as NaudiodonDevice[]);
      if (selectedDevices.length === 0) {
        this.lastError = "No audio input device is available";
        return false;
      }

      for (const selectedDevice of selectedDevices) {
        try {
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
          this.stream = stream;
          stream.start();
          this.lastError = null;
          return true;
        } catch (error) {
          this.lastError = `Failed to start input device "${selectedDevice.name}" (${selectedDevice.hostAPIName}): ${
            error instanceof Error ? error.message : String(error)
          }`;
          this.stop();
        }
      }
      return false;
    } catch (error) {
      const reason = `Unable to load native audio input runtime: ${
        error instanceof Error ? error.message : String(error)
      }`;
      if (process.versions.electron) {
        return this.startWorkerAudioInput(reason);
      }
      this.lastError = reason;
      this.stop();
      return false;
    }
  }

  stop(): void {
    const worker = this.worker;
    this.worker = null;
    this.workerLineBuffer = "";
    if (worker) {
      worker.stdout.removeListener("data", this.handleWorkerStdout);
      worker.stderr.removeListener("data", this.handleWorkerStderr);
      worker.removeListener("error", this.handleWorkerError);
      worker.removeListener("exit", this.handleWorkerExit);
      if (!worker.killed) {
        worker.kill();
      }
    }

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
