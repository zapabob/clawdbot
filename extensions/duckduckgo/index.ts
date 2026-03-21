import { definePluginEntry } from "openclaw/plugin-sdk/core";
import { createDuckDuckGoProvider } from "./src/ddg-provider.js";

export default definePluginEntry({
  id: "duckduckgo",
  name: "DuckDuckGo Plugin",
  description: "Bundled DuckDuckGo plugin — no API key required",
  register(api) {
    api.registerWebSearchProvider(createDuckDuckGoProvider());

    // Inject MD guidance so the agent uses web search autonomously
    api.on("before_prompt_build", () => ({
      appendSystemContext: [
        "## ウェブ検索 (DuckDuckGo)",
        "",
        "- **`web_search`** — API キー不要の DuckDuckGo 検索。",
        "  最新情報・外部ドキュメント・公式サイト確認が必要な場合は **積極的に** 使用する。",
        "- 検索結果はスニペットのみ。詳細ページが必要なら URL を取得してさらに調べること。",
      ].join("\n"),
    }));
  },
});
