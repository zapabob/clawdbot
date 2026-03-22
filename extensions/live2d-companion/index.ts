/**
 * OpenClaw Extension: @openclaw/live2d-companion
 *
 * Provides:
 *  - `llm_output` hook → AI応答を VOICEVOX で自動読み上げ（Live2D コンパニオン経由）
 *  - `voicevox_speak` tool → AIが明示的に音声を出力できるツール
 *  - `voicevox_speak_direct` tool → Python OSCスクリプト経由で直接 VOICEVOX 再生
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi, OpenClawPluginDefinition } from "../../src/plugins/types.js";

const DEFAULT_COMPANION_URL = "http://127.0.0.1:18791/control";
const DEFAULT_MAX_CHARS = 120;

// ── Text cleanup: remove markdown for TTS readability ─────────────────────────
function extractPlainText(raw: string, maxChars: number): string {
  let text = raw
    .replace(/```[\s\S]*?```/g, "") // fenced code blocks
    .replace(/`[^`]+`/g, "") // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [label](url) → label
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/[*_~]/g, "") // bold/italic/strikethrough
    .replace(/^\s*[-*+]\s+/gm, "") // list bullets
    .replace(/^\s*\d+\.\s+/gm, "") // numbered list
    .replace(/\|[^|\n]+/g, "") // table cells
    .replace(/\n{2,}/g, "。") // paragraph breaks → 。
    .replace(/\n/g, " ") // remaining newlines → space
    .trim();

  if (text.length > maxChars) {
    text = text.substring(0, maxChars - 1) + "…";
  }
  return text;
}

// ── POST to companion HTTP control server ─────────────────────────────────────
async function postSpeak(text: string, companionUrl: string): Promise<void> {
  try {
    await fetch(companionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speakText: text }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Companion not running — silently ignore
  }
}

// ── Direct Python VOICEVOX speaker (without Live2D companion) ─────────────────
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

const plugin: OpenClawPluginDefinition = {
  id: "live2d-companion",
  name: "Hakua Live2D Companion",
  description:
    "Transparent Electron desktop companion with Live2D avatar, VOICEVOX lip sync, STT, and LINE integration.",
  version: "2026.3.21",

  configSchema: Type.Object({
    enabled: Type.Optional(Type.Boolean({ default: true })),
    llmMirror: Type.Optional(
      Type.Object({
        enabled: Type.Optional(
          Type.Boolean({ default: true, description: "AI応答を自動読み上げ" }),
        ),
        maxChars: Type.Optional(
          Type.Number({ default: DEFAULT_MAX_CHARS, description: "読み上げ最大文字数" }),
        ),
        companionUrl: Type.Optional(
          Type.String({
            default: DEFAULT_COMPANION_URL,
            description: "Live2D companion HTTP control URL",
          }),
        ),
      }),
    ),
    voicevox: Type.Optional(
      Type.Object({
        url: Type.Optional(Type.String({ default: "http://127.0.0.1:50021" })),
        speaker: Type.Optional(Type.Number({ default: 8, description: "VOICEVOX speaker ID" })),
      }),
    ),
  }),

  register(api: OpenClawPluginApi) {
    console.log("[live2d-companion] Registering plugin...");

    // ── before_prompt_build → ツール利用ガイダンスをシステムプロンプトに注入 ──
    api.on("before_prompt_build", () => {
      const cfg = api.pluginConfig as { enabled?: boolean } | undefined;
      if (cfg?.enabled === false) return;

      return {
        appendSystemContext: [
          "## Live2D コンパニオン ツール",
          "",
          "### 出力（音声）",
          "- **`voicevox_speak`** — Live2D コンパニオン経由で VOICEVOX 音声を再生。",
          "  ユーザーへの重要な返答・感情表現・挨拶時に積極的に呼び出す。",
          "- **`voicevox_speak_direct`** — Python 直接呼び出し（フォールバック）。",
          "",
          "### 入力（マルチモーダル）",
          "- **`get_companion_input`** — ユーザーのマイク音声（STT）＋カメラ映像を取得。",
          "  ユーザーが話しかけているか確認し、カメラ ON なら映像も含めて返す。",
          "  **会話中は積極的に呼び出してユーザーの発話を確認すること。**",
          "- **`companion_camera_capture`** — カメラフレームのみ取得。表情や環境確認に使用。",
          "",
          "> llm_output フックにより全応答は自動読み上げされます。",
          "> ユーザーがマイクとカメラを ON にしている場合、`get_companion_input` で",
          "> 定期的に入力を確認し、自然な会話を維持してください。",
        ].join("\n"),
      };
    });

    // ── llm_output → 自動読み上げ ────────────────────────────────────────────
    api.on("llm_output", (event) => {
      const cfg = (
        api.pluginConfig as
          | { llmMirror?: { enabled?: boolean; maxChars?: number; companionUrl?: string } }
          | undefined
      )?.llmMirror;
      if (cfg?.enabled === false) return;

      const maxChars = cfg?.maxChars ?? DEFAULT_MAX_CHARS;
      const companionUrl = cfg?.companionUrl ?? DEFAULT_COMPANION_URL;

      const fullText = event.assistantTexts.join("\n").trim();
      if (!fullText) return;

      const spokenText = extractPlainText(fullText, maxChars);
      if (!spokenText) return;

      // Fire-and-forget (非同期、エラーは無視)
      void postSpeak(spokenText, companionUrl);
    });

    // ── voicevox_speak tool (Live2D companion 経由) ───────────────────────────
    api.registerTool({
      name: "voicevox_speak",
      description:
        "Live2D コンパニオンを通じて VOICEVOX で音声を再生する。ユーザーに話しかけたいときや感情を伝えたいときに使用。",
      parameters: Type.Object({
        text: Type.String({ description: "読み上げるテキスト（最大200文字）" }),
      }),
      async execute(_id: string, params: { text: string }) {
        const cfg = api.pluginConfig as { llmMirror?: { companionUrl?: string } } | undefined;
        const companionUrl = cfg?.llmMirror?.companionUrl ?? DEFAULT_COMPANION_URL;
        const text = params.text.slice(0, 200);
        await postSpeak(text, companionUrl);
        return {
          content: [
            {
              type: "text",
              text: `🔊 VOICEVOX 読み上げ: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`,
            },
          ],
        };
      },
    });

    // ── voicevox_speak_direct tool (Python 直接再生、Live2D なしでも動作) ──────
    api.registerTool({
      name: "voicevox_speak_direct",
      description:
        "Python スクリプトで直接 VOICEVOX を呼び出して音声を再生する。Live2D コンパニオンが起動していなくても動作する。",
      parameters: Type.Object({
        text: Type.String({ description: "読み上げるテキスト" }),
        speaker: Type.Optional(
          Type.Number({ description: "VOICEVOX スピーカーID（デフォルト: 8）", default: 8 }),
        ),
      }),
      async execute(_id: string, params: { text: string; speaker?: number }) {
        const cfg = api.pluginConfig as
          | { voicevox?: { url?: string; speaker?: number } }
          | undefined;
        const voicevoxUrl = cfg?.voicevox?.url ?? "http://127.0.0.1:50021";
        const speaker = params.speaker ?? cfg?.voicevox?.speaker ?? 8;
        const text = params.text.slice(0, 300);

        const result = await speakViaPython(text, speaker, voicevoxUrl);

        if (result.success) {
          return {
            content: [
              {
                type: "text",
                text: `🔊 VOICEVOX (直接): "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`,
              },
            ],
          };
        } else {
          return {
            isError: true,
            content: [{ type: "text", text: `VOICEVOX 再生失敗: ${result.error}` }],
          };
        }
      },
    });

    // ── get_companion_input tool (マルチモーダル入力: STT + カメラ) ──────────
    api.registerTool({
      name: "get_companion_input",
      description:
        "ユーザーのマイク音声（STT テキスト）とカメラ映像（JPEG画像）を取得する。" +
        "ユーザーがマイクで話しかけているか確認し、カメラ ON なら映像も取得。" +
        "会話中は積極的に呼び出してユーザーの発話を確認すること。",
      parameters: Type.Object({
        include_camera: Type.Optional(
          Type.Boolean({ default: true, description: "カメラフレームも取得するか" }),
        ),
      }),
      async execute(_id: string, params: { include_camera?: boolean }) {
        const stateDir = path.resolve(
          ((api.config as Record<string, unknown>).stateDir as string) ?? ".openclaw-desktop",
        );
        const content: Array<Record<string, unknown>> = [];

        // 1. Read STT result
        try {
          const sttPath = path.join(stateDir, "companion_stt_result.json");
          const raw = await fs.readFile(sttPath, "utf-8");
          const data = JSON.parse(raw) as { transcript: string; timestamp: number };
          const age = Date.now() - data.timestamp;
          const ageLabel =
            age < 60000 ? `${Math.round(age / 1000)}秒前` : `${Math.round(age / 60000)}分前`;
          content.push({
            type: "text",
            text: `🎤 ユーザー音声 (${ageLabel}): "${data.transcript}"`,
          });
        } catch {
          content.push({ type: "text", text: "🎤 音声入力なし（マイク OFF またはまだ発話なし）" });
        }

        // 2. Read camera frame
        if (params.include_camera !== false) {
          try {
            const res = await fetch("http://127.0.0.1:18791/camera?capture=1", {
              signal: AbortSignal.timeout(3000),
            });
            const data = (await res.json()) as { ok: boolean; base64?: string; timestamp?: number };
            if (data.ok && data.base64) {
              content.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: data.base64,
                },
              });
            } else {
              content.push({ type: "text", text: "📷 カメラ OFF" });
            }
          } catch {
            content.push({
              type: "text",
              text: "📷 カメラフレーム取得不可（コンパニオン未起動？）",
            });
          }
        }

        return { content };
      },
    });

    // ── companion_camera_capture tool (カメラフレームのみ) ────────────────────
    api.registerTool({
      name: "companion_camera_capture",
      description:
        "コンパニオンのウェブカメラから最新の映像フレームを取得する。" +
        "ユーザーの表情や周囲の環境を確認したい場合に使用。",
      parameters: Type.Object({}),
      async execute() {
        try {
          const res = await fetch("http://127.0.0.1:18791/camera?capture=1", {
            signal: AbortSignal.timeout(3000),
          });
          const data = (await res.json()) as { ok: boolean; base64?: string; timestamp?: number };
          if (data.ok && data.base64) {
            return {
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: data.base64,
                  },
                },
                {
                  type: "text",
                  text: `📷 カメラ取得 (${new Date(data.timestamp ?? Date.now()).toLocaleTimeString()})`,
                },
              ],
            };
          }
          return {
            content: [{ type: "text", text: "📷 カメラ OFF またはフレームなし" }],
          };
        } catch {
          return {
            isError: true,
            content: [{ type: "text", text: "📷 コンパニオン未起動" }],
          };
        }
      },
    });

    console.log("[live2d-companion] Plugin registered:");
    console.log("  - before_prompt_build → ツール利用ガイダンス注入");
    console.log("  - llm_output → VOICEVOX 自動読み上げ");
    console.log("  - voicevox_speak (companion 経由)");
    console.log("  - voicevox_speak_direct (Python 直接)");
    console.log("  - get_companion_input (STT + カメラ マルチモーダル入力)");
    console.log("  - companion_camera_capture (カメラフレーム取得)");
  },
};

export default plugin;
