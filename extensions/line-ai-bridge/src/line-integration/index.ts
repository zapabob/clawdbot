/**
 * LINE Integration Module for line-ai-bridge
 *
 * This module provides the actual connection between the bridge and LINE.
 * It hooks into the LINE runtime to send messages and receive webhooks.
 */

import type { PluginRuntime } from "openclaw/plugin-sdk";
import type { BridgeRouter } from "../bridge/index.js";
import type { LineMessage } from "../types.js";

let runtime: PluginRuntime | null = null;
let bridge: BridgeRouter | null = null;

// Store for pending responses (replyToken -> resolve function)
const pendingResponses = new Map<string, (message: string) => void>();

/**
 * Initialize the LINE integration
 */
export function initLineIntegration(
  pluginRuntime: PluginRuntime,
  bridgeRouter: BridgeRouter,
): void {
  runtime = pluginRuntime;
  bridge = bridgeRouter;
  console.log("[LINE-AI Integration] Initialized");
}

/**
 * Send a message to LINE user
 * This is the actual implementation that connects to LINE API
 */
export async function sendLineMessage(userId: string, message: string): Promise<boolean> {
  if (!runtime) {
    console.error("[LINE-AI Integration] Runtime not initialized");
    return false;
  }

  try {
    // Get the LINE runtime
    const lineRuntime = runtime.channel?.line;

    if (!lineRuntime) {
      console.error("[LINE-AI Integration] LINE runtime not available");
      return false;
    }

    // Check if we have a channel access token
    // In a real implementation, we'd get this from config
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelAccessToken) {
      console.error("[LINE-AI Integration] LINE_CHANNEL_ACCESS_TOKEN not set");
      return false;
    }

    // Send message using LINE API
    const result = await lineRuntime.pushMessageLine(userId, message, {
      channelAccessToken,
      verbose: false,
    });

    console.log(`[LINE-AI Integration] Message sent to ${userId}: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error(`[LINE-AI Integration] Failed to send message: ${error}`);
    return false;
  }
}

/**
 * Handle incoming LINE webhook
 * This should be called when LINE sends a webhook to OpenClaw
 */
export async function handleLineWebhook(payload: {
  events: Array<{
    type: string;
    replyToken?: string;
    source: { userId: string };
    message: { type: string; text?: string; id: string };
  }>;
}): Promise<void> {
  if (!bridge) {
    console.error("[LINE-AI Integration] Bridge not initialized");
    return;
  }

  for (const event of payload.events) {
    if (
      event.type !== "message" ||
      !event.message ||
      event.message.type !== "text" ||
      !event.message.text
    ) {
      continue;
    }

    const userId = event.source.userId;
    const text = event.message.text;
    const replyToken = event.replyToken;

    console.log(`[LINE-AI Integration] Received from ${userId}: ${text}`);

    // Create LINE message object
    const lineMessage: LineMessage = {
      id: event.message.id,
      userId,
      text,
      timestamp: new Date(),
      replyToken,
    };

    // Store reply token for response if needed
    if (replyToken) {
      // Process through bridge
      const result = await bridge.handleLineMessage(lineMessage);

      if (!result.success) {
        console.error(`[LINE-AI Integration] Bridge error: ${result.error}`);
      }
    } else {
      // Process without reply capability
      await bridge.handleLineMessage(lineMessage);
    }
  }
}

/**
 * Get LINE webhook handler for Express/HTTP
 */
export function createLineWebhookHandler() {
  return async (
    req: { body: unknown },
    res: {
      send: (data: string) => void;
      status: (code: number) => { send: (data: string) => void };
    },
  ) => {
    try {
      const body = req.body as { events?: unknown[] };

      if (body.events && Array.isArray(body.events)) {
        await handleLineWebhook({ events: body.events as any });
      }

      res.send("OK");
    } catch (error) {
      console.error("[LINE-AI Integration] Webhook error:", error);
      res.status(500).send("Error");
    }
  };
}

/**
 * Check if LINE is configured
 */
export function isLineConfigured(): boolean {
  return Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET);
}

/**
 * Get LINE configuration status
 */
export function getLineStatus(): {
  configured: boolean;
  hasRuntime: boolean;
  hasBridge: boolean;
} {
  return {
    configured: isLineConfigured(),
    hasRuntime: Boolean(runtime),
    hasBridge: Boolean(bridge),
  };
}
