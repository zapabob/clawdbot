import type { MoltbotPluginApi, CommandContext } from "clawdbot/plugin-sdk";
import { VRChatProtocol } from "./src/protocol/index.js";
import { globalOscGuard } from "./src/core/guard.js";
import { VRChatOSCQuery } from "./src/discovery/oscquery.js";

export const VRChatRelayPlugin: any = {
  name: "vrchat-relay",
  setup: async (api: MoltbotPluginApi) => {
    const baseDir = api.configDir;
    const config = api.config || {};
    const sendPort = config.sendPort || 9000;
    const receivePort = config.receivePort || 9001;
    const oscQueryPort = config.oscQueryPort || 9001;

    const vrc = new VRChatProtocol({
      host: "127.0.0.1",
      sendPort,
      receivePort,
      baseDir,
    });
    // Inject OSCQuery port if different
    vrc.discovery = new VRChatOSCQuery("127.0.0.1", oscQueryPort);

    await vrc.start();

    api.registerCommand({
      name: "vrc",
      description: "Send text to VRChat Chatbox (v1.0 Basic)",
      acceptsArgs: true,
      requireAuth: true,
      handler: async (ctx: CommandContext) => {
        const message = ctx.args?.trim();
        if (!message) return { text: "Usage: /vrc <message>" };
        try {
          await vrc.chatbox.sendMessage(message);
          return { text: `✅ Relayed: ${message}` };
        } catch (err) {
          return { text: `❌ Error: ${String(err)}` };
        }
      },
    });

    api.registerCommand({
      name: "vrc_speak",
      description: "Concierge Speak: Typing delay + SFX + Text",
      acceptsArgs: true,
      requireAuth: true,
      handler: async (ctx: CommandContext) => {
        const message = ctx.args?.trim();
        if (!message) return { text: "Usage: /vrc_speak <message>" };
        try {
          await vrc.chatbox.sendWithTyping(message, 1200, true);
          return { text: `💬 Spoken: ${message} (with typing delay)` };
        } catch (err) {
          return { text: `❌ Error: ${String(err)}` };
        }
      },
    });

    api.registerCommand({
      name: "vrc_cam",
      description: "Camera Director: Zoom/Mode/Dolly (e.g., zoom 0.5, mode 1, dolly position 0.3)",
      acceptsArgs: true,
      requireAuth: true,
      handler: async (ctx: CommandContext) => {
        const args = ctx.args?.split(" ") || [];
        const cmd = args[0]?.toLowerCase();
        const val = parseFloat(args[1] || "0");

        try {
          if (cmd === "zoom") await vrc.camera.setZoom(val);
          else if (cmd === "mode") await vrc.camera.setMode(Math.floor(val));
          else if (cmd === "aperture") await vrc.camera.setAperture(val);
          else if (cmd === "dolly" && args[1] === "pos") await vrc.camera.dollyPosition(parseFloat(args[2] || "0"));
          else return { text: "Usage: /vrc_cam <zoom|mode|aperture|dolly pos> <value>" };
          
          return { text: `📸 Camera set: ${cmd} = ${args[1]}` };
        } catch (err) {
          return { text: `❌ Camera Error: ${String(err)}` };
        }
      },
    });

    api.registerCommand({
      name: "vrc_profile",
      description: "Set VRChat security profile (SAFE|PRO|DIRECTOR|ADMIN)",
      acceptsArgs: true,
      requireAuth: true,
      handler: async (ctx: CommandContext) => {
        const profileStr = ctx.args?.trim().toUpperCase();
        if (!profileStr) return { text: "Usage: /vrc_profile <SAFE|PRO|DIRECTOR|ADMIN>" };
        
        try {
          const profile = profileStr as any;
          globalOscGuard.setProfile(profile);
          return { text: `🛡️ OSC Security Profile set to: ${profileStr}` };
        } catch (err) {
          return { text: `❌ Error setting profile: ${String(err)}` };
        }
      },
    });

    api.registerCommand({
      name: "vrc_status",
      description: "Check VRChat Pro v1.2 status and capabilities",
      acceptsArgs: false,
      requireAuth: true,
      handler: async () => {
        const caps = vrc.capabilities.size;
        return {
          text: `🥽 **VRChat Pro v1.2 (BoB-Nyan)**\n` +
                `- Status: Online\n` +
                `- Capabilities: ${caps} parameters discovered\n` +
                `- Active Profile: ${globalOscGuard.getProfile()}\n` +
                `- Audit: Logging enabled\n` +
                `Use \`/vrc_cam\` or \`/vrc_speak\` for advanced features.`
        };
      },
    });

    api.registerCommand({
      name: "vrc_reload",
      description: "Force reload VRChat avatar capabilities",
      acceptsArgs: false,
      requireAuth: true,
      handler: async () => {
        try {
          await vrc.scanLocalConfig();
          return { text: "🔄 Capabilities reloaded.\n(Hint: If parameters are still missing, use 'Reset OSC Config' in VRChat's Radial Menu)" };
        } catch (err) {
          return { text: `❌ Reload failed: ${String(err)}` };
        }
      },
    });

    api.logger.info("VRChat Relay v1.2 (Agent-Safe Agent) registered.");
  },
};

export default VRChatRelayPlugin;
