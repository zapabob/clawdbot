/**
 * OpenClaw LINE Bot - Full Featured
 *
 * Control OpenClaw entirely from LINE
 */

import express from "express";
import type { LineMessage, AIResponse } from "./types.js";
import { findCommand, formatHelp, getAllCommands } from "./commands/index.js";

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || "3000", 10);

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", bot: "openclaw-line-full" });
});

app.post("/webhook/line", async (req, res) => {
  try {
    const body = req.body as {
      events?: Array<{
        type: string;
        replyToken?: string;
        source: { userId: string };
        message: { type: string; text: string; id: string };
      }>;
    };

    if (!body.events || !Array.isArray(body.events)) {
      res.send("No events");
      return;
    }

    console.log(`[Bot] Received ${body.events.length} events`);

    for (const event of body.events) {
      if (event.type !== "message" || event.message?.type !== "text") {
        continue;
      }

      const userId = event.source.userId;
      const text = event.message.text.trim();

      console.log(`[Bot] Message from ${userId}: ${text}`);

      const response = await handleMessage(text, userId);
      await sendLineMessage(userId, response);

      console.log(`[Bot] Response sent: ${response.substring(0, 50)}...`);
    }

    res.send("OK");
  } catch (error) {
    console.error("[Bot] Error:", error);
    res.status(500).send("Error");
  }
});

async function handleMessage(text: string, userId: string): Promise<string> {
  if (!text.startsWith("/")) {
    return `💬 メッセージ受信: "${text}"

コマンドを使用するには "/" を付けて送信してください。
例: /help で全コマンドを表示`;
  }

  const cmd = findCommand(text);
  if (!cmd) {
    return `❌ 未知のコマンド: "${text.split(" ")[0]}"

/help で利用可能なコマンド一覧を表示`;
  }

  const args = text.split(" ").slice(1);

  try {
    const result = await cmd.handler(args, userId, async (msg) => {
      await sendLineMessage(userId, msg);
    });

    return result.content;
  } catch (error) {
    return `❌ エラー: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

async function sendLineMessage(userId: string, message: string): Promise<boolean> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error("[Bot] No channel access token");
    return false;
  }

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: "text",
            text: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Bot] LINE API error: ${error}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Bot] Error sending message: ${error}`);
    return false;
  }
}

async function startServer(): Promise<void> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn("[Bot] LINE_CHANNEL_ACCESS_TOKEN not set. Only outgoing messages will fail.");
  }

  app.listen(WEBHOOK_PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║          OpenClaw LINE Bot - Full Edition                    ║
╠══════════════════════════════════════════════════════════════╣
║  Status:     Running                                        ║
║  Port:       ${WEBHOOK_PORT}                                            ║
║  Endpoint:   http://localhost:${WEBHOOK_PORT}/webhook/line              ║
║  Health:     http://localhost:${WEBHOOK_PORT}/health                     ║
╠══════════════════════════════════════════════════════════════╣
║  Commands:   ${getAllCommands().length} available                                   ║
║  Token:      ${LINE_CHANNEL_ACCESS_TOKEN ? "✅ Set" : "❌ Not set"}                               ║
╚══════════════════════════════════════════════════════════════╝

📋 Available Commands:
${formatHelp().split("\n").slice(0, 20).join("\n")}
...
    `);
  });
}

startServer().catch(console.error);
