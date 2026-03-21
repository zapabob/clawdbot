import { definePluginEntry } from "openclaw/plugin-sdk/core";
import { createDuckDuckGoProvider } from "./src/ddg-provider.js";

export default definePluginEntry({
  id: "duckduckgo",
  name: "DuckDuckGo Plugin",
  description: "Bundled DuckDuckGo plugin — no API key required",
  register(api) {
    api.registerWebSearchProvider(createDuckDuckGoProvider());
  },
});
