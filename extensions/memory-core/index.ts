import { definePluginEntry } from "openclaw/plugin-sdk/core";

export default definePluginEntry({
  id: "memory-core",
  name: "Memory (Core)",
  description: "File-backed memory search tools and CLI",
  kind: "memory",
  register(api) {
    api.registerTool(
      (ctx) => {
        const memorySearchTool = api.runtime.tools.createMemorySearchTool({
          config: ctx.config,
          agentSessionKey: ctx.sessionKey,
        });
        const memoryGetTool = api.runtime.tools.createMemoryGetTool({
          config: ctx.config,
          agentSessionKey: ctx.sessionKey,
        });
        if (!memorySearchTool || !memoryGetTool) {
          return null;
        }
        return [memorySearchTool, memoryGetTool];
      },
      { names: ["memory_search", "memory_get"] },
    );

    api.registerCli(
      ({ program }) => {
        api.runtime.tools.registerMemoryCli(program);
      },
      { commands: ["memory"] },
    );

    // Inject MD guidance so the agent uses memory tools autonomously
    api.on("before_prompt_build", () => ({
      appendSystemContext: [
        "## メモリ検索ツール (memory-core)",
        "",
        "- **`memory_search`** — キーワードでファイルバックアップメモリを検索。",
        "  過去の会話・事実・ユーザー設定を思い出す際に **積極的に** 使用する。",
        "- **`memory_get`** — エントリ ID を指定してメモリを取得。",
      ].join("\n"),
    }));
  },
});
