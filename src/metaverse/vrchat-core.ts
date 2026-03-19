import { execFile } from "node:child_process";
import path from "node:path";
import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("metaverse/vrchat");

export interface VRChatOscOptions {
  host?: string;
  port?: number;
}

/**
 * Centralized VRChat OSC implementation for core gateway usage.
 * Uses scripts/osc_chatbox.py as the underlying substrate to ensure packet compatibility.
 */
export async function sendVRChatOscRaw(
  address: string,
  args: (string | number | boolean | null)[],
  options: VRChatOscOptions = {},
): Promise<{ success: boolean; error?: string }> {
  const { host = "127.0.0.1", port = 9000 } = options;
  const scriptPath = path.resolve(process.cwd(), "scripts/osc_chatbox.py");

  const mappedArgs = args.map((arg) => {
    if (typeof arg === "boolean") {
      return arg ? "true" : "false";
    }
    if (arg === null) {
      return "null";
    }
    return String(arg);
  });

  const pyArgs = [
    scriptPath,
    "--raw",
    address,
    ...mappedArgs,
    "--host",
    host,
    "--port",
    String(port),
  ];

  return new Promise((resolve) => {
    // py -3 is specific to Windows-based Python launcher
    execFile("py", ["-3", ...pyArgs], { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        log.error(`Python OSC bridge failed: ${error.message}`);
        resolve({ success: false, error: error.message });
      } else {
        if (stdout && stdout.trim()) {
          log.debug(`[Python] ${stdout.trim()}`);
        }
        if (stderr && stderr.trim()) {
          log.warn(`[Python Error] ${stderr.trim()}`);
        }
        resolve({ success: true });
      }
    });
  });
}

/**
 * Send a message to the VRChat chatbox.
 */
export async function sendVRChatChatbox(
  message: string,
  sendImmediately = true,
  options: VRChatOscOptions = {},
): Promise<{ success: boolean; error?: string }> {
  // Normalize and enforce limits
  const normalized = message.normalize("NFC").substring(0, 144);
  return sendVRChatOscRaw("/chatbox/input", [normalized, sendImmediately, true], options);
}

/**
 * Send an input command (Jump, MoveForward, etc.)
 */
export async function sendVRChatInput(
  action: string,
  value: boolean | number = true,
  options: VRChatOscOptions = {},
): Promise<{ success: boolean; error?: string }> {
  return sendVRChatOscRaw(`/input/${action}`, [value], options);
}
