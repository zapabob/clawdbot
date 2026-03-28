import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
import { registerLineCardCommand } from "./src/card-command.js";
import { linePlugin } from "./src/channel.js";
import { registerLinePushCommand } from "./src/push-command.js";
import { setLineRuntime } from "./src/runtime.js";

export { linePlugin };
export { setLineRuntime };

export default defineChannelPluginEntry({
  id: "line",
  name: "LINE",
  description: "LINE Messaging API channel plugin",
  plugin: linePlugin,
  setRuntime: setLineRuntime,
  registerFull(api) {
    registerLineCardCommand(api);
    registerLinePushCommand(api);
  },
});
