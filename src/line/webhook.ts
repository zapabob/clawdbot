
/**
 * LINE Messaging API Webhook Handler
 * 
 * Handles incoming webhook events from LINE Platform.
 */

import { createHmac } from "node:crypto";
import { info, warn } from "../globals.js";
import { logError } from "../logger.js";

type LineEvent = {
  type: string;
  mode: string;
  timestamp: number;
  source: {
    type: string;
    userId: string;
    groupId?: string;
    roomId?: string;
  };
  message?: {
    id: string;
    type: string;
    text?: string;
  };
  replyToken?: string;
};

type LineWebhookBody = {
  destination: string;
  events: LineEvent[];
};

export function validateLineSignature(body: string, channelSecret: string, signature: string): boolean {
  if (!signature) return false;
  const hash = createHmac("sha256", channelSecret).update(body).digest("base64");
  return hash === signature;
}

export async function handleLineWebhook(
  body: LineWebhookBody, 
  signature: string, 
  channelSecret: string
) {
  // 1. Signature Validation
  if (!validateLineSignature(JSON.stringify(body), channelSecret, signature)) {
    throw new Error("Invalid LINE Signature");
  }

  console.log(info(`Received ${body.events.length} LINE events.`));

  for (const event of body.events) {
    try {
      await processLineEvent(event);
    } catch (err) {
      logError(warn(`Failed to process LINE event ${event.type}: ${err}`));
    }
  }
}

async function processLineEvent(event: LineEvent) {
  if (event.type !== "message" || event.message?.type !== "text") {
    // For now only handle text messages
    return;
  }

  const userId = event.source.userId;
  const text = event.message.text || "";

  console.log(info(`LINE Message from ${userId}: ${text}`));
  
  // const ctx = normalizeLineContext(event);
  // await dispatchMessage(ctx);
}


export type LineWebhookOptions = {
  channelSecret: string;
  channelAccessToken?: string; 
};

export type StartLineWebhookOptions = LineWebhookOptions & {
  port?: number;
  path?: string;
  onEvents?: (body: any) => Promise<void>;
};

export function createLineWebhookMiddleware(opts: LineWebhookOptions) {
  return async (req: any, res: any, next: any) => {
    next();
  };
}

export function startLineWebhook(opts: StartLineWebhookOptions) {
  const { port, path = "/line/webhook", channelSecret, onEvents } = opts;
  console.log(info(`Configuring LINE webhook at ${path}`));
  
  // Return a mock handler for bot.ts compatibility
  const handler = async (req: any, res: any) => {
      // Mock invocation
      if (onEvents) await onEvents(req.body);
  };

  return { handler, path };
}
