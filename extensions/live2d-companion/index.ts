import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import { resolveLive2dCompanionConfig } from "./companion-config.js";
import {
  formatCompanionProfilePromptContext,
  readCompanionProfileSync,
} from "./companion-profile.js";
import {
  getCompanionInputSnapshot,
  requestCompanionCameraCapture,
  speakWithCompanion,
} from "./runtime-api.js";

const require = createRequire(import.meta.url);
const DEFAULT_MAX_CHARS = 120;
const DEFAULT_PERMISSION = "deny-until-approved" as const;
type LlmOutputEvent = { assistantTexts: string[] };
type LocalVoiceCompanionDefaults = {
  sttBackend: "local-voice-whisper";
  ttsBackend: "voicevox";
};

type MinimalPluginApi = {
  pluginConfig: Record<string, unknown>;
  on: (event: string, handler: (payload?: unknown) => unknown) => void;
};

type LocalVoiceFacade = {
  resolveLocalVoiceCompanionDefaults: () => LocalVoiceCompanionDefaults;
};

const TTS_PROVIDERS = ["voicevox", "web-speech"] as const;

function normalizeTtsProvider(value: unknown): (typeof TTS_PROVIDERS)[number] | undefined {
  return typeof value === "string" &&
    TTS_PROVIDERS.includes(value as (typeof TTS_PROVIDERS)[number])
    ? (value as (typeof TTS_PROVIDERS)[number])
    : undefined;
}

function resolveCompanionLocalVoiceDefaults(): LocalVoiceCompanionDefaults {
  try {
    return (
      require("openclaw/plugin-sdk/local-voice") as LocalVoiceFacade
    ).resolveLocalVoiceCompanionDefaults();
  } catch {
    return {
      sttBackend: "local-voice-whisper",
      ttsBackend: "voicevox",
    };
  }
}

const LOCAL_VOICE_DEFAULTS = resolveCompanionLocalVoiceDefaults();

function extractPlainText(raw: string, maxChars: number): string {
  let text = raw
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|[^|\n]+/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();

  if (text.length > maxChars) {
    text = `${text.slice(0, maxChars - 1)}...`;
  }
  return text;
}

function speakViaPython(
  text: string,
  speaker = 8,
  voicevoxUrl = "http://127.0.0.1:50021",
): Promise<{ success: boolean; error?: string }> {
  const scriptPath = path.resolve(process.cwd(), "scripts/voicevox_speak.py");
  return new Promise((resolve) => {
    execFile(
      "py",
      ["-3", scriptPath, "--text", text, "--speaker", String(speaker), "--url", voicevoxUrl],
      { timeout: 30000 },
      (error) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          resolve({ success: true });
        }
      },
    );
  });
}

function buildBeforePromptGuidance(): string {
  return [
    "## Desktop Companion Tools",
    "",
    "### Available tools",
    "- `control_companion`: primary OpenClaw harness for Desktop Companion status, speech, emotion, gaze, model loading, microphone consent, input snapshots, and window captures.",
    "- `voicevox_speak`: speak through the local Desktop Companion overlay with local VOICEVOX output and optional emotion animation.",
    "- `voicevox_speak_direct`: use the local Python VOICEVOX helper without requiring the overlay.",
    "- `get_companion_input`: read the latest local transcript, visible tab context, and optional camera frame.",
    "- `companion_camera_capture`: capture the latest local webcam frame when the user has allowed camera access.",
    "",
    "### Preferred workflow",
    '- Use `control_companion({ action: "status" })` before diagnosis or live operation.',
    '- Use `control_companion({ action: "profile" })` to read the local character profile before roleplay, relationship, or avatar-persona work.',
    '- Use `control_companion({ action: "profile", display_name, character_prompt, mood })` to update the strict-local companion profile instead of inventing transient identity state.',
    '- Use `control_companion({ action: "permission", capability: "mic", decision: "granted" })` before enabling STT.',
    '- Use `control_companion({ action: "speak", value, emotion })` when assistant speech should animate the loaded VRM or FBX avatar.',
    '- Use `control_companion({ action: "input_snapshot" })` to read local STT transcripts instead of guessing voice state.',
    '- Use `control_companion({ action: "window_capture" })` for local visual proof of the rendered companion window after a speech or motion command.',
    "",
    "### Privacy and consent",
    "- The Desktop Companion stays in strict local-only mode by default.",
    "- Browser follow is opt-in per attached tab only.",
    "- Camera, microphone, screen, and tab follow each require explicit permission.",
    "- Imported avatars require rights acknowledgment before activation.",
  ].join("\n");
}

function resolveCompanionStateDir(): string {
  return path.resolve(
    process.env.OPENCLAW_STATE_DIR ?? path.join(process.cwd(), ".openclaw-desktop"),
  );
}

function buildBeforePromptContext(): string {
  const profileContext = formatCompanionProfilePromptContext(
    readCompanionProfileSync(resolveCompanionStateDir()),
  );
  return [buildBeforePromptGuidance(), profileContext].filter(Boolean).join("\n\n");
}

const plugin: {
  id: string;
  name: string;
  description: string;
  version: string;
  configSchema: ReturnType<typeof Type.Object>;
  register: (api: MinimalPluginApi) => void;
} = {
  id: "live2d-companion",
  name: "Desktop Companion",
  description:
    "Strict-local desktop companion overlay with VRM or FBX avatars, local whisper STT, VOICEVOX speech, and opt-in browser follow.",
  version: "2026.4.17",
  configSchema: Type.Object({
    enabled: Type.Optional(
      Type.Boolean({
        default: true,
        description: "Enable the Desktop Companion integration.",
      }),
    ),
    llmMirror: Type.Optional(
      Type.Object({
        enabled: Type.Optional(
          Type.Boolean({
            default: true,
            description: "Mirror assistant output to the local Desktop Companion voice path.",
          }),
        ),
        maxChars: Type.Optional(
          Type.Number({
            default: DEFAULT_MAX_CHARS,
            description: "Maximum assistant characters mirrored into local speech.",
          }),
        ),
      }),
    ),
    security: Type.Optional(
      Type.Object({
        allowLegacyHttpControl: Type.Optional(
          Type.Boolean({
            default: false,
            description: "Compatibility-only escape hatch for the legacy localhost control server.",
          }),
        ),
        allowLegacyFlagTransport: Type.Optional(
          Type.Boolean({
            default: false,
            description: "Compatibility-only escape hatch for the legacy flag-file bridge.",
          }),
        ),
      }),
    ),
    browserHelper: Type.Optional(
      Type.Object({
        enabled: Type.Optional(
          Type.Boolean({
            default: true,
            description: "Enable the Desktop Companion browser helper integration.",
          }),
        ),
        nativeHostName: Type.Optional(
          Type.String({
            default: "io.openclaw.desktop_companion",
            description: "Native Messaging host id used by the browser helper.",
          }),
        ),
        persistentFollow: Type.Optional(
          Type.Boolean({
            default: true,
            description:
              "Allow the attached tab helper to keep following the same tab until detached.",
          }),
        ),
      }),
    ),
    assetPolicy: Type.Optional(
      Type.Object({
        requireRightsAck: Type.Optional(
          Type.Boolean({
            default: true,
            description: "Require explicit rights acknowledgment before importing avatar assets.",
          }),
        ),
        importMode: Type.Optional(
          Type.String({
            default: "local-reference",
            enum: ["local-reference", "local-copy"],
            description: "How imported avatar assets are stored locally.",
          }),
        ),
        remoteUploadAllowed: Type.Optional(
          Type.Boolean({
            default: false,
            description: "Keep remote upload disabled for creator-safe local-only mode.",
          }),
        ),
      }),
    ),
    capturePolicy: Type.Optional(
      Type.Object({
        mic: Type.Optional(
          Type.String({
            default: DEFAULT_PERMISSION,
            enum: ["deny-until-approved", "granted"],
          }),
        ),
        camera: Type.Optional(
          Type.String({
            default: DEFAULT_PERMISSION,
            enum: ["deny-until-approved", "granted"],
          }),
        ),
        screen: Type.Optional(
          Type.String({
            default: DEFAULT_PERMISSION,
            enum: ["deny-until-approved", "granted"],
          }),
        ),
        "tab-follow": Type.Optional(
          Type.String({
            default: DEFAULT_PERMISSION,
            enum: ["deny-until-approved", "granted"],
          }),
        ),
      }),
    ),
    voicevox: Type.Optional(
      Type.Object({
        url: Type.Optional(
          Type.String({
            default: "http://127.0.0.1:50021",
            description: "Local VOICEVOX endpoint for the direct speech fallback tool.",
          }),
        ),
        speaker: Type.Optional(
          Type.Number({
            default: 8,
            description: "VOICEVOX speaker id for the direct speech fallback tool.",
          }),
        ),
      }),
    ),
  }),
  register(api) {
    const apiAny = api as MinimalPluginApi & {
      registerTool: (tool: Record<string, unknown>) => void;
    };

    api.on("before_prompt_build", () => {
      const cfg = resolveLive2dCompanionConfig(apiAny.pluginConfig);
      if (!cfg.enabled) {
        return;
      }
      return {
        appendSystemContext: buildBeforePromptContext(),
      };
    });

    api.on("llm_output", (payload?: unknown) => {
      const cfg = resolveLive2dCompanionConfig(apiAny.pluginConfig);
      if (!cfg.enabled || !cfg.llmMirror.enabled) {
        return;
      }

      const event = payload as LlmOutputEvent;
      const fullText = event.assistantTexts.join("\n").trim();
      if (!fullText) {
        return;
      }

      const spokenText = extractPlainText(fullText, cfg.llmMirror.maxChars);
      if (!spokenText) {
        return;
      }

      void speakWithCompanion({ text: spokenText }).catch(() => {
        // The overlay is optional during normal agent runs.
      });
    });

    apiAny.registerTool({
      name: "voicevox_speak",
      description:
        "Speak text through the local Desktop Companion overlay with VOICEVOX-backed lip sync.",
      parameters: Type.Object({
        text: Type.String({
          description: "Text to speak locally through the Desktop Companion.",
        }),
        emotion: Type.Optional(
          Type.String({
            description: "Optional emotion to animate before speech.",
          }),
        ),
        tts_provider: Type.Optional(
          Type.String({
            enum: [...TTS_PROVIDERS],
            description: "Optional TTS backend override for this speech call.",
          }),
        ),
      }),
      async execute(
        _id: string,
        params: { text: string; emotion?: string; tts_provider?: string },
      ) {
        const text = params.text.slice(0, 200);
        const emotion = typeof params.emotion === "string" ? params.emotion.trim() : "";
        const ttsProvider = normalizeTtsProvider(params.tts_provider);
        try {
          await speakWithCompanion({
            text,
            ...(emotion ? { emotion } : {}),
            ...(ttsProvider ? { ttsProvider } : {}),
          });
          return {
            content: [
              {
                type: "text",
                text: `Desktop Companion spoke${emotion ? ` with ${emotion}` : ""}: "${text.slice(0, 60)}${text.length > 60 ? "..." : ""}"`,
              },
            ],
          };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Desktop Companion speech failed: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      },
    });

    apiAny.registerTool({
      name: "voicevox_speak_direct",
      description:
        "Speak text through the local Python VOICEVOX helper without requiring the Desktop Companion overlay.",
      parameters: Type.Object({
        text: Type.String({ description: "Text to speak via local VOICEVOX." }),
        speaker: Type.Optional(Type.Number({ description: "VOICEVOX speaker id.", default: 8 })),
      }),
      async execute(_id: string, params: { text: string; speaker?: number }) {
        const cfg = resolveLive2dCompanionConfig(apiAny.pluginConfig);
        const text = params.text.slice(0, 300);
        const voicevoxConfig =
          apiAny.pluginConfig && typeof apiAny.pluginConfig === "object"
            ? (apiAny.pluginConfig as { voicevox?: { url?: string; speaker?: number } }).voicevox
            : undefined;
        const voicevoxUrl = voicevoxConfig?.url ?? "http://127.0.0.1:50021";
        const speaker = params.speaker ?? voicevoxConfig?.speaker ?? 8;
        const result = await speakViaPython(text, speaker, voicevoxUrl);

        if (!result.success) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `VOICEVOX direct speech failed: ${result.error}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `VOICEVOX direct spoke: "${text.slice(0, 60)}${text.length > 60 ? "..." : ""}"`,
            },
            {
              type: "text",
              text: `Default local voice backends: STT=${LOCAL_VOICE_DEFAULTS.sttBackend}, TTS=${cfg.voice.ttsBackend}`,
            },
          ],
        };
      },
    });

    apiAny.registerTool({
      name: "get_companion_input",
      description:
        "Read the latest local Desktop Companion transcript, opt-in tab follow context, and optional camera frame.",
      parameters: Type.Object({
        include_camera: Type.Optional(
          Type.Boolean({
            default: true,
            description: "Include the latest local camera frame when camera access is allowed.",
          }),
        ),
      }),
      async execute(_id: string, params: { include_camera?: boolean }) {
        try {
          const snapshot = await getCompanionInputSnapshot({
            payload: {
              includeCamera: params.include_camera !== false,
              captureCamera: params.include_camera !== false,
            },
          });

          const content: Array<Record<string, unknown>> = [];
          if (snapshot.transcript) {
            const ageMs =
              snapshot.transcriptTimestamp === null
                ? null
                : Date.now() - snapshot.transcriptTimestamp;
            const ageLabel =
              ageMs === null
                ? "unknown age"
                : ageMs < 60_000
                  ? `${Math.round(ageMs / 1000)}s ago`
                  : `${Math.round(ageMs / 60_000)}m ago`;
            content.push({
              type: "text",
              text: `Local transcript (${ageLabel}): "${snapshot.transcript}"`,
            });
          } else {
            content.push({
              type: "text",
              text: "No local companion transcript is available yet.",
            });
          }

          if (snapshot.tabContext.attached) {
            const tabLines = [
              `Attached tab: ${snapshot.tabContext.title ?? "(untitled)"}`,
              `URL: ${snapshot.tabContext.url ?? "(missing)"}`,
              snapshot.tabContext.textSnapshot
                ? `Visible text: ${snapshot.tabContext.textSnapshot}`
                : "Visible text: (not captured yet)",
            ];
            content.push({
              type: "text",
              text: tabLines.join("\n"),
            });
          } else {
            content.push({
              type: "text",
              text: "No browser tab is attached for persistent follow.",
            });
          }

          if (snapshot.camera) {
            content.push({
              type: "image",
              source: {
                type: "base64",
                media_type: snapshot.camera.mimeType,
                data: snapshot.camera.base64,
              },
            });
          }

          return { content };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Desktop Companion input read failed: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      },
    });

    apiAny.registerTool({
      name: "companion_camera_capture",
      description:
        "Capture the latest local Desktop Companion webcam frame when camera permission has been granted.",
      parameters: Type.Object({}),
      async execute() {
        try {
          const capture = await requestCompanionCameraCapture();
          if (!capture) {
            return {
              content: [
                {
                  type: "text",
                  text: "Desktop Companion camera capture is unavailable or not permitted.",
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: capture.mimeType,
                  data: capture.base64,
                },
              },
              {
                type: "text",
                text: `Camera captured at ${new Date(capture.timestamp).toLocaleTimeString()}.`,
              },
            ],
          };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Desktop Companion camera capture failed: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      },
    });
  },
};

export default plugin;
