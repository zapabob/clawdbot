/**
 * OpenClaw Extension: @openclaw/live2d-companion
 *
 * Provides:
 *  - `llm_output` hook → AI応答を VOICEVOX で自動読み上げ（Live2D コンパニオン経由）
 *  - `voicevox_speak` tool → AIが明示的に音声を出力できるツール
 *  - `voicevox_speak_direct` tool → Python OSCスクリプト経由で直接 VOICEVOX 再生
 */
import { execFile } from "node:child_process";
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

    console.log("[live2d-companion] Plugin registered:");
    console.log("  - llm_output → VOICEVOX 自動読み上げ");
    console.log("  - voicevox_speak (companion 経由)");
    console.log("  - voicevox_speak_direct (Python 直接)");
  },
};

export default plugin;
