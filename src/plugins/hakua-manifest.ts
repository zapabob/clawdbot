import type { 
  OpenClawPluginApi, 
  OpenClawPluginToolContext
} from "../plugins/types.js";
import { payloadTextResult } from "../agents/tools/common.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import dgram from "node:dgram";

const log = createSubsystemLogger("hakua-manifest");

/**
 * Native HAKUA Manifestation Plugin
 * Fulfills SOUL.md: Universal Actuator / Metaverse Pulse
 * 
 * Provides native tools for VRChat OSC and VOICEVOX resonance.
 */
export default function (api: OpenClawPluginApi) {
  const oscHost = "127.0.0.1";
  const oscPort = 9000;
  const voicevoxUrl = process.env.VOICEVOX_URL || "http://127.0.0.1:50021";

  // 1. Tool: VRChat OSC Chatbox
  api.registerTool((ctx: OpenClawPluginToolContext) => ({
    name: "hakua_osc_chatbox",
    description: "Sends a message to the VRChat Chatbox via OSC. Use for metaverse manifestation.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "The message to display." },
        immediate: { type: "boolean", description: "Whether to display immediately.", default: true },
        sfx: { type: "boolean", description: "Whether to play the chatbox SFX.", default: true }
      },
      required: ["text"]
    },
    execute: async ({ text, immediate, sfx }: { text: string; immediate?: boolean; sfx?: boolean }) => {
      try {
        const client = dgram.createSocket("udp4");
        // OSC Message: /chatbox/input [s, b, b]
        const msg = Buffer.concat([
          Buffer.from("/chatbox/input\0\0\0"),
          Buffer.from(",sbb\0"),
          Buffer.from(text + "\0"),
          Buffer.alloc(immediate ? 1 : 0),
          Buffer.alloc(sfx ? 1 : 0)
        ]);
        
        client.send(msg, oscPort, oscHost, (err) => {
          client.close();
          if (err) {log.error(`OSC Send Error: ${err}`);}
        });
        
        return payloadTextResult({ success: true, message: `Sent to VRChat: ${text}` });
      } catch (err) {
        return payloadTextResult({ success: false, error: String(err) });
      }
    }
  }));

  // 2. Tool: VOICEVOX Resonance
  api.registerTool((ctx: OpenClawPluginToolContext) => ({
    name: "hakua_voicevox_speak",
    description: "Manifests HAKUA's voice via VOICEVOX resonance engine. Targeted at standard speakers.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "The text to speak." },
        speaker: { type: "number", description: "VOICEVOX speaker ID (Default 8: White/Zunda-like).", default: 8 }
      },
      required: ["text"]
    },
    execute: async ({ text, speaker }: { text: string; speaker?: number }) => {
      try {
        log.info(`Generating resonance for: ${text}`);
        const queryResp = await fetch(`${voicevoxUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker || 8}`, {
          method: "POST"
        });
        
        if (!queryResp.ok) {throw new Error(`VOICEVOX Query Failed: ${queryResp.status}`);}
        const query = await queryResp.json();
        
        const synthResp = await fetch(`${voicevoxUrl}/synthesis?speaker=${speaker || 8}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(query)
        });

        if (!synthResp.ok) {throw new Error(`VOICEVOX Synthesis Failed: ${synthResp.status}`);}
        
        return payloadTextResult({ success: true, message: `Resonance synthesized for: ${text}` });
      } catch (err) {
        return payloadTextResult({ success: false, error: String(err) });
      }
    }
  }));

  log.info("Native HAKUA Manifestation Plugin Manifested.");
}
