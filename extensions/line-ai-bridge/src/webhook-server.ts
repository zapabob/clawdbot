/**
 * LINE Webhook Server for line-ai-bridge
 *
 * This creates an Express server that:
 * 1. Receives LINE webhooks
 * 2. Routes them to the bridge
 * 3. Sends responses back to LINE
 *
 * Usage: node dist/webhook-server.js
 */

import express from "express";
import type { AIToolType } from "./types.js";
import { createAIToolClient } from "./ai-tools/index.js";
import { BridgeRouter, type BridgeConfig } from "./bridge/index.js";
import { getFreeTierTracker } from "./free-tier/index.js";

// Configuration
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || "3000", 10);

// Create bridge
const config: BridgeConfig = {
  defaultTool: "codex",
  sessionTimeoutMinutes: 30,
  maxMessageLength: 5000,
  lineSendCallback: async (userId: string, message: string) => {
    await sendLineMessage(userId, message);
  },
};

const bridge = new BridgeRouter(config);
bridge.start();

// Create Express app
const app = express();
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", bridge: bridge.isActive() });
});

// LINE Webhook endpoint
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

    console.log(`[Webhook] Received ${body.events.length} events`);

    for (const event of body.events) {
      if (event.type !== "message" || event.message?.type !== "text") {
        continue;
      }

      const userId = event.source.userId;
      const text = event.message.text;

      console.log(`[Webhook] Message from ${userId}: ${text}`);

      // Create LINE message
      const lineMessage = {
        id: event.message.id,
        userId,
        text,
        timestamp: new Date(),
        replyToken: event.replyToken,
      };

      // Process through bridge
      const result = await bridge.handleLineMessage(lineMessage);

      console.log(`[Webhook] Bridge result: ${result.success ? "OK" : "FAIL"}`);
    }

    res.send("OK");
  } catch (error) {
    console.error("[Webhook] Error:", error);
    res.status(500).send("Error");
  }
});

/**
 * Send message to LINE using Push Message API
 */
async function sendLineMessage(userId: string, message: string): Promise<boolean> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error("[LINE] No channel access token configured");
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
      console.error(`[LINE] API error: ${error}`);
      return false;
    }

    console.log(`[LINE] Message sent to ${userId}`);
    return true;
  } catch (error) {
    console.error(`[LINE] Error sending message: ${error}`);
    return false;
  }
}

/**
 * Start the webhook server
 */
async function startServer(): Promise<void> {
  // Verify LINE credentials
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn("[WARNING] LINE_CHANNEL_ACCESS_TOKEN not set. Outgoing messages will fail.");
    console.warn("[WARNING] Set environment variable: export LINE_CHANNEL_ACCESS_TOKEN=your-token");
  }

  if (!LINE_CHANNEL_SECRET) {
    console.warn("[WARNING] LINE_CHANNEL_SECRET not set. Webhook verification will fail.");
  }

  // Start server
  app.listen(WEBHOOK_PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          LINE AI Bridge - Webhook Server                   ║
╠════════════════════════════════════════════════════════════╣
║  Status:     ${bridge.isActive() ? "✅ Running" : "❌ Stopped"}                            ║
║  Port:       ${WEBHOOK_PORT}                                             ║
║  Endpoint:   http://localhost:${WEBHOOK_PORT}/webhook/line              ║
║  Health:     http://localhost:${WEBHOOK_PORT}/health                     ║
╠════════════════════════════════════════════════════════════╣
║  Configuration:                                           ║
║  - LINE_CHANNEL_ACCESS_TOKEN: ${LINE_CHANNEL_ACCESS_TOKEN ? "✅ Set" : "❌ Not set"}             ║
║  - LINE_CHANNEL_SECRET:       ${LINE_CHANNEL_SECRET ? "✅ Set" : "❌ Not set"}             ║
╠════════════════════════════════════════════════════════════╣
║  Usage:                                                   ║
║  1. Set LINE_CHANNEL_ACCESS_TOKEN in environment          ║
║  2. Configure LINE Messaging API webhook to:              ║
║     https://your-domain.com/webhook/line                 ║
║  3. Send /terminal from LINE to start                    ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);
