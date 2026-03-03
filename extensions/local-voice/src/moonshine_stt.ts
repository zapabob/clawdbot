import { spawn, type ChildProcess } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { STTConfig, STTEventHandlers, STTSession, STTSessionState } from "./stt.js";

// Uses a tiny VAD threshold suitable for near-instant transcription
const DEFAULT_MOONSHINE_CONFIG: Partial<STTConfig> = {
  vadThreshold: 0.1, // Very sensitive for quick response
  silenceDurationMs: 400, // Short silence to trigger transcription fast
};

export class LocalMoonshineSTT implements STTSession {
  private config: STTConfig;
  private handlers: STTEventHandlers;
  private state: STTSessionState = "disconnected";
  private audioBuffer: number[] = [];
  private isSpeaking = false;
  private silenceCount = 0;
  private readonly silenceThreshold = 10; // Approx 400ms at 25Hz chunks
  private readonly voiceThreshold = 0.01;
  private bridgeProcess: ChildProcess | null = null;
  private venvPythonPath: string;
  private scriptPath: string;

  constructor(config: Partial<STTConfig>, handlers: STTEventHandlers) {
    // Merge provided config with Moonshine-specific defaults
    this.config = {
      model: "moonshine-tiny",
      prefixPaddingMs: 0,
      ...DEFAULT_MOONSHINE_CONFIG,
      ...config,
    } as STTConfig;
    this.handlers = handlers;

    // Resolve paths relative to this file
    this.venvPythonPath = join(__dirname, "..", "moonshine-venv", "Scripts", "python.exe");
    this.scriptPath = join(__dirname, "moonshine_bridge.py");
  }

  getState(): STTSessionState {
    return this.state;
  }

  async connect(): Promise<void> {
    if (this.state === "connected" || this.state === "connecting") {
      return;
    }

    this.state = "connecting";

    return new Promise((resolve, reject) => {
      try {
        this.bridgeProcess = spawn(this.venvPythonPath, [this.scriptPath]);

        this.bridgeProcess.stdout?.on("data", (data: Buffer) => {
          const lines = data.toString().split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed === "READY") {
              this.state = "connected";
              this.handlers.onConnect?.();
              resolve();
            } else if (trimmed.startsWith("OK|")) {
              const transcript = trimmed.substring(3).trim();
              if (transcript) {
                this.handlers.onTranscript(transcript);
              }
              this.state = "connected";
            } else if (trimmed.startsWith("INTENT|")) {
              const intentName = trimmed.substring(7).trim();
              if (intentName) {
                this.handlers.onIntent?.(intentName);
              }
              this.state = "connected";
            } else if (trimmed.startsWith("ERR|")) {
              const errorMsg = trimmed.substring(4).trim();
              this.handlers.onError?.(new Error(`Moonshine Bridge Error: ${errorMsg}`));
              this.state = "connected"; // Recoverable error
            }
          }
        });

        this.bridgeProcess.stderr?.on("data", (data: Buffer) => {
          console.error(`[moonshine-stt] stderr: ${data.toString()}`);
        });

        this.bridgeProcess.on("close", (code) => {
          this.state = "disconnected";
          this.handlers.onDisconnect?.();
          this.bridgeProcess = null;
          if (code !== 0 && code !== null) {
            this.handlers.onError?.(new Error(`Moonshine bridge exited with code ${code}`));
          }
        });

        this.bridgeProcess.on("error", (err) => {
          this.state = "error";
          this.handlers.onError?.(err);
          reject(err);
        });
      } catch (err) {
        this.state = "error";
        reject(err);
      }
    });
  }

  sendAudio(data: Buffer): void {
    if (this.state !== "connected") return;

    // data is mu-law 8k. Convert back to linear for processing
    const samples = this.muLawToLinear(data);
    this.processSamples(samples);
  }

  private processSamples(samples: Float32Array): void {
    const energy = samples.reduce((acc, s) => acc + s * s, 0) / samples.length;

    if (energy > this.voiceThreshold) {
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.handlers.onSpeechStart?.();
      }
      this.silenceCount = 0;
    } else if (this.isSpeaking) {
      this.silenceCount++;
      if (this.silenceCount > this.silenceThreshold) {
        this.isSpeaking = false;
        this.handlers.onSpeechEnd?.();
        this.triggerTranscription();
      }
    }

    if (this.isSpeaking || this.silenceCount > 0) {
      for (const s of samples) this.audioBuffer.push(s);
    }
  }

  private triggerTranscription(): void {
    const buffer = new Float32Array(this.audioBuffer);
    this.audioBuffer = [];
    this.silenceCount = 0;

    // Ignore very short sounds (< 0.5s)
    if (buffer.length < 8000 * 0.5) return;

    if (!this.bridgeProcess || this.state !== "connected") return;

    this.state = "connecting"; // Re-using state for "processing"

    const tmpFile = join(tmpdir(), `moonshine_stt_${Date.now()}.wav`);
    this.writeWav(tmpFile, buffer);

    try {
      // Send the file path to the python bridge
      this.bridgeProcess.stdin?.write(`${tmpFile}\n`);
    } catch (err) {
      this.handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
      // Try to clean up immediately if write failed
      try {
        unlinkSync(tmpFile);
      } catch {}
      this.state = "connected";
    }
  }

  private muLawToLinear(muLawData: Buffer): Float32Array {
    const out = new Float32Array(muLawData.length);
    for (let i = 0; i < muLawData.length; i++) {
      let x = muLawData[i] ^ 0xff;
      const sign = x & 0x80 ? -1 : 1;
      const exponent = (x & 0x70) >> 4;
      const mantissa = x & 0x0f;
      let sample = (mantissa << (exponent + 3)) + (132 << exponent) - 132;
      out[i] = (sign * sample) / 32768.0;
    }
    return out;
  }

  private writeWav(path: string, samples: Float32Array): void {
    const buffer = Buffer.alloc(44 + samples.length * 2);
    // RIFF Header
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + samples.length * 2, 4);
    buffer.write("WAVE", 8);
    // fmt Chunk
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(8000, 24); // Rate
    buffer.writeUInt32LE(16000, 28); // ByteRate
    buffer.writeUInt16LE(2, 32); // BlockAlign
    buffer.writeUInt16LE(16, 34); // BitsPerSample
    // data Chunk
    buffer.write("data", 36);
    buffer.writeUInt32LE(samples.length * 2, 40);

    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      buffer.writeInt16LE(s < 0 ? s * 32768 : s * 32767, 44 + i * 2);
    }
    writeFileSync(path, buffer);
  }

  disconnect(): void {
    if (this.bridgeProcess) {
      try {
        this.bridgeProcess.stdin?.write("EXIT\n");
      } catch {}
      this.bridgeProcess.kill();
      this.bridgeProcess = null;
    }
    this.state = "disconnected";
  }
}
