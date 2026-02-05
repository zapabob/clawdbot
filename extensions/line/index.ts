import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { registerLineCardCommand } from "./src/card-command.js";
import { linePlugin } from "./src/channel.js";
import { setLineRuntime } from "./src/runtime.js";

const plugin = {
  id: "line",
  name: "LINE (Merged)",
  description: "LINE Messaging API channel plugin with AI Bridge features merged",
  version: "2026.2.3",
  merged: {
    source: "line-ai-bridge",
    version: "2026.2.2",
    features: [
      "Webhook server for bidirectional communication",
      "Terminal bridge for AI tools (Codex, Gemini, Opencode)",
      "Session management with timeout",
      "Free tier tracking for AI requests",
      "Repository scanning and selection",
    ],
  },
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    setLineRuntime(api.runtime);
    api.registerChannel({ plugin: linePlugin });
    registerLineCardCommand(api);
    console.log("[LINE] Plugin registered with merged AI Bridge features");
  },
};

export default plugin;
