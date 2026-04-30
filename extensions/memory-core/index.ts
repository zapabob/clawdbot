import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { registerMemoryCli } from "./src/cli.js";
import { registerDreamingCommand } from "./src/dreaming-command.js";
import { registerShortTermPromotionDreaming } from "./src/dreaming.js";
import {
  buildMemoryFlushPlan,
  DEFAULT_MEMORY_FLUSH_FORCE_TRANSCRIPT_BYTES,
  DEFAULT_MEMORY_FLUSH_PROMPT,
  DEFAULT_MEMORY_FLUSH_SOFT_TOKENS,
} from "./src/flush-plan.js";
import { registerBuiltInMemoryEmbeddingProviders } from "./src/memory/provider-adapters.js";
import { buildPromptSection } from "./src/prompt-section.js";
import { listMemoryCorePublicArtifacts } from "./src/public-artifacts.js";
import { memoryRuntime } from "./src/runtime-provider.js";
import { createMemoryGetTool, createMemorySearchTool } from "./src/tools.js";
export {
  buildMemoryFlushPlan,
  DEFAULT_MEMORY_FLUSH_FORCE_TRANSCRIPT_BYTES,
  DEFAULT_MEMORY_FLUSH_PROMPT,
  DEFAULT_MEMORY_FLUSH_SOFT_TOKENS,
} from "./src/flush-plan.js";
export { buildPromptSection } from "./src/prompt-section.js";

export default definePluginEntry({
  id: "memory-core",
  name: "Memory (Core)",
  description: "File-backed memory search tools and CLI",
  kind: "memory",
  register(api) {
    registerBuiltInMemoryEmbeddingProviders(api);
    registerShortTermPromotionDreaming(api);
    registerDreamingCommand(api);
    api.registerMemoryCapability({
      promptBuilder: buildPromptSection,
      flushPlanResolver: buildMemoryFlushPlan,
      runtime: memoryRuntime,
      publicArtifacts: {
        listArtifacts: listMemoryCorePublicArtifacts,
      },
    });

    api.registerTool(
      (ctx) => {
        const getConfig = () => ctx.getRuntimeConfig?.() ?? ctx.runtimeConfig ?? ctx.config;
        return createMemorySearchTool({
          config: getConfig(),
          getConfig,
          agentSessionKey: ctx.sessionKey,
          sandboxed: ctx.sandboxed,
        });
      },
      { names: ["memory_search"] },
    );

    api.registerTool(
      (ctx) => {
        const getConfig = () => ctx.getRuntimeConfig?.() ?? ctx.runtimeConfig ?? ctx.config;
        return createMemoryGetTool({
          config: getConfig(),
          getConfig,
          agentSessionKey: ctx.sessionKey,
        });
      },
      { names: ["memory_get"] },
    );

    api.registerCli(
      ({ program }) => {
        registerMemoryCli(program);
      },
      {
        descriptors: [
          {
            name: "memory",
            description: "Search, inspect, and reindex memory files",
            hasSubcommands: true,
          },
        ],
      },
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
