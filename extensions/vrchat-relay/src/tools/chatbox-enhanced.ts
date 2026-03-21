import { execFile } from "node:child_process";
import { join } from "node:path";
import { getOSCClient } from "../osc/client.js";
import { logInfo, logSkip, logError } from "./audit.js";
import { checkPermission } from "./permissions.js";
import { rateLimiters } from "./rate-limiter.js";

export interface ChatboxSendParams {
  message: string;
  sendImmediately?: boolean;
  sfx?: boolean;
  typingDelayMs?: number;
}

// NFC Normalize text for VRChat compatibility
function normalizeText(text: string): string {
  // Normalize to NFC form
  let normalized = text.normalize("NFC");

  // Limit to 144 characters
  if (normalized.length > 144) {
    normalized = normalized.substring(0, 144);
  }

  // Limit to 9 lines
  const lines = normalized.split("\n");
  if (lines.length > 9) {
    normalized = lines.slice(0, 9).join("\n");
  }

  return normalized;
}

/**
 * Send a chatbox message via Python's python-osc library.
 * Node.js UDP OSC packets are not recognized by VRChat —
 * only python-osc produces correct packets.
 */
function sendViaPython(
  message: string,
  options: { sfx?: boolean; host?: string; port?: number } = {},
): Promise<{ success: boolean; error?: string }> {
  const { sfx = true, host = "127.0.0.1", port = 9000 } = options;
  const scriptPath = join(process.cwd(), "scripts", "osc_chatbox.py");

  const args = [scriptPath, message, "--host", host, "--port", String(port)];
  if (!sfx) args.push("--no-sfx");

  return new Promise((resolve) => {
    execFile("py", ["-3", ...args], { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        console.error("[vrchat-relay] Python OSC error:", error.message);
        resolve({ success: false, error: error.message });
      } else {
        if (stdout) console.log("[vrchat-relay]", stdout.trim());
        resolve({ success: true });
      }
    });
  });
}

/**
 * Send a raw OSC message via Python's python-osc library.
 */
export function sendRawOscViaPython(
  address: string,
  value: string | number | boolean,
  options: { host?: string; port?: number } = {},
): Promise<{ success: boolean; error?: string }> {
  const { host = "127.0.0.1", port = 9000 } = options;
  const scriptPath = join(process.cwd(), "scripts", "osc_chatbox.py");

  const args = [
    scriptPath,
    "--raw",
    address,
    String(value),
    "--host",
    host,
    "--port",
    String(port),
  ];

  return new Promise((resolve) => {
    execFile("py", ["-3", ...args], { timeout: 10000 }, (error) => {
      if (error) {
        console.error("[vrchat-relay] Python raw OSC error:", error.message);
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
}

/**
 * Send a message to VRChat chatbox via Python OSC bridge
 */
export async function sendChatboxMessage(
  params: ChatboxSendParams,
): Promise<{ success: boolean; error?: string; trimmed?: boolean }> {
  const permission = checkPermission("chatbox_send");

  if (!permission.allowed) {
    logSkip("chatbox_send", permission.message || "Permission denied", {
      level: permission.level,
    });
    return { success: false, error: permission.message };
  }

  // Check rate limit
  const rateLimit = rateLimiters.chatbox.allowAction();
  if (!rateLimit.allowed) {
    const error = rateLimit.jailTimeRemaining
      ? `Rate limit exceeded. Jail time: ${Math.ceil(rateLimit.jailTimeRemaining / 1000)}s`
      : "Rate limit exceeded";

    logSkip("chatbox_send", error, { remaining: rateLimit.remaining });
    return { success: false, error };
  }

  try {
    const { message, sfx = true } = params;

    if (!message || message.trim() === "") {
      return { success: false, error: "Message cannot be empty" };
    }

    // Normalize message
    const normalized = normalizeText(message);
    const wasTrimmed = normalized.length !== message.length;

    // Send via Python OSC bridge (the ONLY method VRChat accepts)
    const result = await sendViaPython(normalized, { sfx });

    if (!result.success) {
      logError("chatbox_send", result.error || "Python OSC bridge failed", {
        messageLength: normalized.length,
      });
      return { success: false, error: result.error };
    }

    logInfo("chatbox_send", {
      messageLength: normalized.length,
      wasTrimmed,
      sfx,
      method: "python-osc",
      remaining: rateLimit.remaining,
    });

    return {
      success: true,
      trimmed: wasTrimmed,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logError("chatbox_send", errorMessage, { messageLength: params.message.length });
    return { success: false, error: errorMessage };
  }
}

/**
 * Set typing indicator only
 */
export function setChatboxTyping(typing: boolean): { success: boolean; error?: string } {
  const permission = checkPermission("chatbox_typing");

  if (!permission.allowed) {
    logSkip("chatbox_typing", permission.message || "Permission denied");
    return { success: false, error: permission.message };
  }

  try {
    const client = getOSCClient();
    client.setTyping(typing);

    logInfo("chatbox_typing", { typing });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logError("chatbox_typing", errorMessage, { typing });
    return { success: false, error: errorMessage };
  }
}

/**
 * Get chatbox rate limit status
 */
export function getChatboxRateLimitStatus(): {
  allowed: boolean;
  remaining: number;
  inJail: boolean;
  jailTimeRemaining: number;
} {
  const status = rateLimiters.chatbox.getStatus();
  return {
    allowed: !status.inJail && status.tokens > 0,
    remaining: status.tokens,
    inJail: status.inJail,
    jailTimeRemaining: status.jailTimeRemaining,
  };
}
