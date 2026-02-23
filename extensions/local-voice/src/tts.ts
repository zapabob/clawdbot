import type { OpenClawConfig } from "../../../src/config/config.js";

export type TTSProvider = "style-bert-vits2" | "elevenlabs" | "openai";

export type StyleBertVITS2Config = {
  endpoint: string;
  modelId: string;
  speakerId: number;
  style: string;
  styleWeight: number;
  speed: number;
};

export type TTSConfig = {
  provider: TTSProvider;
  styleBertVits2: StyleBertVITS2Config;
  openaiApiKey?: string;
  elevenLabsApiKey?: string;
};

export type TTSResult = {
  success: boolean;
  audioUrl?: string;
  audioData?: Buffer;
  error?: string;
};

const DEFAULT_SBV2_CONFIG: StyleBertVITS2Config = {
  endpoint: "http://localhost:5000",
  modelId: "Hakua",
  speakerId: 0,
  style: "Neutral",
  styleWeight: 1.0,
  speed: 1.0,
};

export function getTTSConfig(globalConfig: OpenClawConfig): TTSConfig {
  const talkVoiceCfg = globalConfig.plugins?.entries?.["talk-voice"]?.config as {
    provider?: TTSProvider;
    styleBertVits2?: Partial<StyleBertVITS2Config>;
  } | null;

  const localVoiceCfg = globalConfig.plugins?.entries?.["local-voice"]?.config as {
    ttsProvider?: TTSProvider;
    sbv2Endpoint?: string;
    sbv2ModelId?: string;
    openaiApiKey?: string;
  } | null;

  const provider = localVoiceCfg?.ttsProvider ?? talkVoiceCfg?.provider ?? "style-bert-vits2";

  const sbv2Partial: Partial<StyleBertVITS2Config> = talkVoiceCfg?.styleBertVits2 ?? {};

  if (localVoiceCfg?.sbv2Endpoint) {
    sbv2Partial.endpoint = localVoiceCfg.sbv2Endpoint;
  }
  if (localVoiceCfg?.sbv2ModelId) {
    sbv2Partial.modelId = localVoiceCfg.sbv2ModelId;
  }

  const styleBertVits2: StyleBertVITS2Config = {
    ...DEFAULT_SBV2_CONFIG,
    ...sbv2Partial,
  };

  return {
    provider,
    styleBertVits2,
    openaiApiKey: localVoiceCfg?.openaiApiKey,
  };
}

export async function synthesizeSpeech(text: string, config: TTSConfig): Promise<TTSResult> {
  if (!text.trim()) {
    return { success: false, error: "Empty text" };
  }

  try {
    switch (config.provider) {
      case "style-bert-vits2":
        return await synthesizeWithSBV2(text, config.styleBertVits2);
      case "openai":
        return await synthesizeWithOpenAI(text, config.openaiApiKey);
      default:
        return { success: false, error: `Unsupported TTS provider: ${config.provider}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

async function synthesizeWithSBV2(text: string, config: StyleBertVITS2Config): Promise<TTSResult> {
  const base = config.endpoint.replace(/\/$/, "");
  const params = new URLSearchParams({
    text,
    model_id: config.modelId,
    speaker_id: String(config.speakerId),
    style: config.style,
    style_weight: String(config.styleWeight),
    speed: String(config.speed),
    language: "JP",
    auto_split: "true",
  });

  const url = `${base}/voice?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    return { success: false, error: `SBV2 API error: ${response.status}` };
  }

  return { success: true, audioUrl: url };
}

async function synthesizeWithOpenAI(text: string, apiKey?: string): Promise<TTSResult> {
  if (!apiKey) {
    return { success: false, error: "OpenAI API key not configured" };
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: "alloy",
    }),
  });

  if (!response.ok) {
    return { success: false, error: `OpenAI TTS error: ${response.status}` };
  }

  const audioData = Buffer.from(await response.arrayBuffer());
  return { success: true, audioData };
}

export async function playAudio(url: string): Promise<void> {
  const { exec } = require("child_process");
  const platform = process.platform;

  const command = getPlayCommand(url, platform);
  if (command) {
    exec(command, (error: Error | null) => {
      if (error) {
        console.error("[local-voice] Audio playback failed:", error.message);
      }
    });
  }
}

export async function playAudioData(data: Buffer): Promise<void> {
  const { exec } = require("child_process");
  const { writeFileSync, unlinkSync } = require("fs");
  const { tmpdir } = require("os");
  const { join } = require("path");

  const tmpFile = join(tmpdir(), `tts-${Date.now()}.mp3`);
  writeFileSync(tmpFile, data);

  const command = getPlayCommand(tmpFile, process.platform);
  if (command) {
    exec(command, () => {
      try {
        unlinkSync(tmpFile);
      } catch {
        // Ignore cleanup errors
      }
    });
  }
}

function getPlayCommand(source: string, platform: string): string | null {
  switch (platform) {
    case "darwin":
      return `afplay "${source}"`;
    case "win32":
      return `powershell -c (New-Object Media.SoundPlayer "${source}").PlaySync()`;
    case "linux":
      return `mpv "${source}"`;
    default:
      return null;
  }
}
