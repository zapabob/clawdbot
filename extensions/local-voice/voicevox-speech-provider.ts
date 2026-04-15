import type {
  SpeechProviderConfig,
  SpeechProviderPlugin,
  SpeechVoiceOption,
} from "openclaw/plugin-sdk/speech";

type VoiceVoxProviderConfig = {
  baseUrl: string;
  speakerId: number;
  speed?: number;
};

type VoiceVoxOverrideConfig = {
  speakerId?: number;
  speed?: number;
};

const DEFAULT_BASE_URL = "http://127.0.0.1:50021";
const DEFAULT_SPEAKER_ID = 2;

function trimToUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeBaseUrl(value: string | undefined): string {
  return (value?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function parseSpeakerId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeVoiceVoxProviderConfig(rawConfig: Record<string, unknown>): VoiceVoxProviderConfig {
  const providers =
    typeof rawConfig.providers === "object" && rawConfig.providers !== null && !Array.isArray(rawConfig.providers)
      ? (rawConfig.providers as Record<string, unknown>)
      : undefined;
  const raw =
    (providers?.voicevox as Record<string, unknown> | undefined) ??
    (rawConfig.voicevox as Record<string, unknown> | undefined) ??
    {};

  return {
    baseUrl: normalizeBaseUrl(
      trimToUndefined(raw.baseUrl) ?? trimToUndefined(process.env.VOICEVOX_ENDPOINT),
    ),
    speakerId:
      parseSpeakerId(raw.speakerId) ??
      parseSpeakerId(process.env.VOICEVOX_SPEAKER_ID) ??
      DEFAULT_SPEAKER_ID,
    speed: asNumber(raw.speed),
  };
}

function readVoiceVoxProviderConfig(config: SpeechProviderConfig): VoiceVoxProviderConfig {
  const defaults = normalizeVoiceVoxProviderConfig({});
  return {
    baseUrl: normalizeBaseUrl(trimToUndefined(config.baseUrl) ?? defaults.baseUrl),
    speakerId: parseSpeakerId(config.speakerId) ?? defaults.speakerId,
    speed: asNumber(config.speed) ?? defaults.speed,
  };
}

function readVoiceVoxOverrides(
  overrides: SpeechProviderConfig | undefined,
): VoiceVoxOverrideConfig {
  if (!overrides) {
    return {};
  }
  return {
    speakerId: parseSpeakerId(overrides.speakerId ?? overrides.voiceId),
    speed: asNumber(overrides.speed),
  };
}

async function voiceVoxFetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`VOICEVOX request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

async function synthesizeVoiceVox(params: {
  text: string;
  baseUrl: string;
  speakerId: number;
  speed?: number;
  timeoutMs?: number;
}): Promise<Buffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), params.timeoutMs ?? 30_000);

  try {
    const queryUrl = `${params.baseUrl}/audio_query?text=${encodeURIComponent(params.text)}&speaker=${params.speakerId}`;
    const query = await voiceVoxFetchJson<Record<string, unknown>>(queryUrl, {
      method: "POST",
      signal: controller.signal,
    });
    if (typeof params.speed === "number" && Number.isFinite(params.speed)) {
      query.speedScale = params.speed;
    }

    const synthesisResponse = await fetch(`${params.baseUrl}/synthesis?speaker=${params.speakerId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
      signal: controller.signal,
    });
    if (!synthesisResponse.ok) {
      throw new Error(`VOICEVOX synthesis failed: ${synthesisResponse.status}`);
    }
    return Buffer.from(await synthesisResponse.arrayBuffer());
  } finally {
    clearTimeout(timeoutId);
  }
}

async function listVoiceVoxVoices(baseUrl: string): Promise<SpeechVoiceOption[]> {
  const speakers = await voiceVoxFetchJson<
    Array<{
      name?: string;
      speaker_uuid?: string;
      styles?: Array<{ id?: number; name?: string }>;
    }>
  >(`${baseUrl}/speakers`);

  return speakers.flatMap((speaker) =>
    (speaker.styles ?? []).map((style) => ({
      id: String(style.id ?? ""),
      name:
        speaker.name && style.name
          ? `${speaker.name} / ${style.name}`
          : speaker.name ?? style.name ?? String(style.id ?? ""),
      category: "VOICEVOX",
      locale: "ja-JP",
      description: speaker.speaker_uuid,
    })),
  );
}

export function buildVoiceVoxSpeechProvider(): SpeechProviderPlugin {
  return {
    id: "voicevox",
    label: "VOICEVOX",
    autoSelectOrder: 40,
    resolveConfig: ({ rawConfig }) => normalizeVoiceVoxProviderConfig(rawConfig),
    resolveTalkConfig: ({ baseTtsConfig, talkProviderConfig }) => {
      const base = normalizeVoiceVoxProviderConfig(baseTtsConfig as Record<string, unknown>);
      return {
        ...base,
        ...(trimToUndefined(talkProviderConfig.baseUrl) == null
          ? {}
          : { baseUrl: normalizeBaseUrl(trimToUndefined(talkProviderConfig.baseUrl)) }),
        ...(parseSpeakerId(talkProviderConfig.speakerId ?? talkProviderConfig.voiceId) == null
          ? {}
          : { speakerId: parseSpeakerId(talkProviderConfig.speakerId ?? talkProviderConfig.voiceId) }),
        ...(asNumber(talkProviderConfig.speed) == null ? {} : { speed: asNumber(talkProviderConfig.speed) }),
      };
    },
    resolveTalkOverrides: ({ params }) => ({
      ...(parseSpeakerId(params.voiceId ?? params.speakerId) == null
        ? {}
        : { speakerId: parseSpeakerId(params.voiceId ?? params.speakerId) }),
      ...(asNumber(params.speed) == null ? {} : { speed: asNumber(params.speed) }),
    }),
    listVoices: async ({ providerConfig }) => {
      const config = readVoiceVoxProviderConfig(providerConfig);
      return await listVoiceVoxVoices(config.baseUrl);
    },
    isConfigured: ({ providerConfig }) => Boolean(readVoiceVoxProviderConfig(providerConfig).baseUrl),
    synthesize: async (req) => {
      const config = readVoiceVoxProviderConfig(req.providerConfig);
      const overrides = readVoiceVoxOverrides(req.providerOverrides);
      const audioBuffer = await synthesizeVoiceVox({
        text: req.text,
        baseUrl: config.baseUrl,
        speakerId: overrides.speakerId ?? config.speakerId,
        speed: overrides.speed ?? config.speed,
        timeoutMs: req.timeoutMs,
      });
      return {
        audioBuffer,
        outputFormat: "wav",
        fileExtension: ".wav",
        voiceCompatible: false,
      };
    },
  };
}
