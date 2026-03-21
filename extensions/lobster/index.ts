import { definePluginEntry } from "openclaw/plugin-sdk/core";
import type { AnyAgentTool, OpenClawPluginApi, OpenClawPluginToolFactory } from "./runtime-api.js";
import { createLobsterTool } from "./src/lobster-tool.js";

export default definePluginEntry({
  id: "lobster",
  name: "Lobster",
  description: "Optional local shell helper tools",
  register(api: OpenClawPluginApi) {
    api.registerTool(
      ((ctx) => {
        if (ctx.sandboxed) {
          return null;
        }
        return createLobsterTool(api) as AnyAgentTool;
      }) as OpenClawPluginToolFactory,
      { optional: true },
    );

    // Inject MD guidance so the agent uses the lobster tool autonomously
    api.on("before_prompt_build", () => ({
      appendSystemContext: [
        "## シェルワークフローツール (lobster)",
        "",
        "- **`lobster`** — JSON-first シェルパイプライン実行。承認・再開フロー付き。",
        "  複数コマンドのパイプライン・自動化タスクに使用。`lobster` バイナリが PATH 上に必要。",
      ].join("\n"),
    }));
  },
});
