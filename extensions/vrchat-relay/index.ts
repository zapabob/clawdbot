import type { MoltbotPluginApi } from "clawdbot/plugin-sdk";
import dgram from "node:dgram";

/**
 * Encodes a string to OSC format (null-terminated, 4-byte padded).
 */
function encodeString(s: string) {
  const buf = Buffer.from(s + "\0");
  const padding = (4 - (buf.length % 4)) % 4;
  return Buffer.concat([buf, Buffer.alloc(padding)]);
}

/**
 * Sends an OSC packet to VRChat.
 */
function sendOSC(address: string, types: string, args: any[], port = 9000) {
  const addrBuf = encodeString(address);
  const typeBuf = encodeString("," + types);
  const argBufs = args.map((arg, i) => {
    const type = types[i];
    if (type === "s") return encodeString(String(arg));
    // For now we only need string and true (T) for chatbox input
    return Buffer.alloc(0);
  });

  const packet = Buffer.concat([addrBuf, typeBuf, ...argBufs]);
  const client = dgram.createSocket("udp4");

  return new Promise<void>((resolve, reject) => {
    client.send(packet, port, "127.0.0.1", (err) => {
      client.close();
      if (err) reject(err);
      else resolve();
    });
  });
}

const plugin = {
  id: "vrchat-relay",
  name: "VRChat Relay",
  description: "Relays messages to VRChat Chatbox via slash commands",
  register(api: MoltbotPluginApi) {
    api.registerCommand({
      name: "vrc",
      description: "Send text to VRChat Chatbox",
      acceptsArgs: true,
      requireAuth: true,
      handler: async (ctx) => {
        const message = ctx.args?.trim();
        if (!message) {
          return { text: "Usage: /vrc <message>" };
        }

        try {
          // 'sT' means string followed by True (for immediate display)
          await sendOSC("/chatbox/input", "sT", [message]);
          api.logger.info(`Relayed to VRChat: ${message} (from ${ctx.channel}:${ctx.senderId})`);
          return { text: `✅ Relayed to VRChat: ${message}` };
        } catch (err) {
          api.logger.error(`VRChat relay failed: ${String(err)}`);
          return {
            text: `❌ Failed to relay: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      },
    });

    // Optional: Log when the plugin is loaded
    api.logger.info("VRChat Relay plugin registered. Use /vrc <message> to relay.");
  },
};

export default plugin;
