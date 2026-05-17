import type { TtsProvider } from "../bridge/event-types.js";
import type { IAvatarController } from "./avatar-controller.js";

type MoraData = { vowel_length?: number };
type AccentPhrase = { moras?: MoraData[] };
type AudioQueryResponse = {
  accent_phrases?: AccentPhrase[];
  speedRate?: number;
  pitchScale?: number;
};

export type LipSyncConfig = {
  voicevoxUrl?: unknown;
  voicevoxSpeaker?: unknown;
  ttsProvider?: TtsProvider;
  webSpeechLang?: unknown;
  webSpeechRate?: unknown;
  webSpeechPitch?: unknown;
};

function stringConfig(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function speakerConfig(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function numberConfig(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export class LipSyncController {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Float32Array<ArrayBuffer> | null = null;
  private lipAnimFrame: number | null = null;
  private readonly voicevoxBase: string;
  private readonly speaker: number;
  private readonly webSpeechLang: string;
  private readonly webSpeechRate: number;
  private readonly webSpeechPitch: number;
  ttsProvider: TtsProvider;

  constructor(
    private readonly live2d: IAvatarController,
    config: LipSyncConfig = {},
  ) {
    this.voicevoxBase = stringConfig(config.voicevoxUrl, "http://127.0.0.1:50021");
    this.speaker = speakerConfig(config.voicevoxSpeaker, 8);
    this.webSpeechLang = stringConfig(config.webSpeechLang, "ja-JP");
    this.webSpeechRate = numberConfig(config.webSpeechRate, 1.0);
    this.webSpeechPitch = numberConfig(config.webSpeechPitch, 1.1);
    this.ttsProvider = config.ttsProvider ?? "voicevox";
  }

  async speak(
    text: string,
    emotionProfile?: { speedRate: number; pitchScale: number },
  ): Promise<void> {
    if (this.ttsProvider === "voicevox") {
      try {
        await this.speakWithVoicevox(text, emotionProfile);
        return;
      } catch (err) {
        console.warn("[LipSync] VOICEVOX unavailable; skipping Web Speech fallback:", err);
        this.live2d.setLipSyncValue(0);
        window.companionBridge?.sendStateUpdate?.({ speaking: false });
        return;
      }
    }
    // Explicit local fallback: Web Speech API (browser built-in, no cost).
    await this.speakWithWebSpeech(text);
  }

  // ── VOICEVOX TTS ─────────────────────────────────────────────────────────
  private async speakWithVoicevox(
    text: string,
    emotionProfile?: { speedRate: number; pitchScale: number },
  ): Promise<void> {
    // 1. Audio query
    const queryRes = await fetch(
      `${this.voicevoxBase}/audio_query?text=${encodeURIComponent(text)}&speaker=${this.speaker}`,
      { method: "POST" },
    );
    if (!queryRes.ok) throw new Error(`audio_query failed: ${queryRes.status}`);
    const query = (await queryRes.json()) as AudioQueryResponse;

    // Apply emotion modifiers
    if (emotionProfile) {
      (query as Record<string, unknown>).speedScale =
        (query.speedRate ?? 1.0) * emotionProfile.speedRate;
      (query as Record<string, unknown>).pitchScale =
        (query.pitchScale ?? 0.0) + (emotionProfile.pitchScale - 1.0) * 0.3;
    }

    // 2. Synthesis → WAV buffer
    const synthRes = await fetch(`${this.voicevoxBase}/synthesis?speaker=${this.speaker}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    if (!synthRes.ok) throw new Error(`synthesis failed: ${synthRes.status}`);
    const wavBuffer = await synthRes.arrayBuffer();

    // 3. Phoneme-based timeline
    const phonemeTimeline = buildPhonemeTimeline(query);

    // 4. Play audio + lip sync
    await this.playWithLipSync(wavBuffer, phonemeTimeline);
  }

  // ── Web Speech API (無料フォールバック / Moonshot代替) ────────────────────
  private speakWithWebSpeech(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) {
        this.live2d.setLipSyncValue(0);
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.webSpeechLang;
      utterance.rate = this.webSpeechRate;
      utterance.pitch = this.webSpeechPitch;

      // Pick Japanese voice if available
      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find((v) => v.lang.startsWith("ja"));
      if (jaVoice) utterance.voice = jaVoice;

      // Simple lip sync: open mouth on word boundaries
      utterance.onboundary = (e) => {
        if (e.name === "word") {
          this.live2d.setLipSyncValue(0.65);
          setTimeout(() => this.live2d.setLipSyncValue(0), 90);
        }
      };

      utterance.onstart = () => {
        window.companionBridge?.sendStateUpdate?.({ speaking: true });
      };

      utterance.onend = () => {
        this.live2d.setLipSyncValue(0);
        window.companionBridge?.sendStateUpdate?.({ speaking: false });
        resolve();
      };

      utterance.onerror = () => {
        this.live2d.setLipSyncValue(0);
        window.companionBridge?.sendStateUpdate?.({ speaking: false });
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // ── AudioContext playback + analyser lip sync ─────────────────────────────
  private async playWithLipSync(
    wavBuffer: ArrayBuffer,
    timeline: Array<{ t: number; v: number }>,
  ): Promise<void> {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }

    const decoded = await this.audioCtx.decodeAudioData(wavBuffer);
    const source = this.audioCtx.createBufferSource();
    source.buffer = decoded;

    if (!this.analyser) {
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Float32Array(this.analyser.fftSize) as Float32Array<ArrayBuffer>;
    }

    source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    const startTime = this.audioCtx.currentTime;
    source.start(startTime);

    window.companionBridge?.sendStateUpdate?.({ speaking: true });

    for (const point of timeline) {
      const delay = point.t * 1000;
      setTimeout(() => this.live2d.setLipSyncValue(point.v), delay);
    }

    this.startAnalyserLoop();

    source.onended = () => {
      this.stopAnalyserLoop();
      this.live2d.setLipSyncValue(0);
      window.companionBridge?.sendStateUpdate?.({ speaking: false });
    };
  }

  private startAnalyserLoop(): void {
    if (this.lipAnimFrame !== null) return;
    const loop = () => {
      if (this.analyser && this.dataArray) {
        this.analyser.getFloatTimeDomainData(this.dataArray);
        let sum = 0;
        for (const v of this.dataArray) sum += v * v;
        const rms = Math.sqrt(sum / this.dataArray.length);
        this.live2d.setLipSyncValue(Math.min(1, rms * 6));
      }
      this.lipAnimFrame = requestAnimationFrame(loop);
    };
    this.lipAnimFrame = requestAnimationFrame(loop);
  }

  private stopAnalyserLoop(): void {
    if (this.lipAnimFrame !== null) {
      cancelAnimationFrame(this.lipAnimFrame);
      this.lipAnimFrame = null;
    }
  }
}

function buildPhonemeTimeline(query: AudioQueryResponse): Array<{ t: number; v: number }> {
  const timeline: Array<{ t: number; v: number }> = [];
  let t = 0;

  for (const phrase of query.accent_phrases ?? []) {
    for (const mora of phrase.moras ?? []) {
      const dur = mora.vowel_length ?? 0.07;
      timeline.push({ t, v: 0.8 });
      timeline.push({ t: t + dur * 0.8, v: 0 });
      t += dur;
    }
  }

  return timeline;
}
