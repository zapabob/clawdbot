import { definePluginEntry, type AnyAgentTool, type OpenClawPluginApi } from "./api.js";
import { createLlmTaskTool } from "./src/llm-task-tool.js";

export default definePluginEntry({
  id: "llm-task",
  name: "LLM Task",
  description: "Optional tool for structured subtask execution",
  register(api: OpenClawPluginApi) {
    api.registerTool(createLlmTaskTool(api) as unknown as AnyAgentTool, { optional: true });

    // Inject MD guidance so the agent uses llm_task autonomously
    api.on("before_prompt_build", () => ({
      appendSystemContext: [
        "## サブタスク実行ツール (llm-task)",
        "",
        "- **`llm_task`** — 構造化サブタスクを別 LLM セッションで実行し JSON を返す。",
        "  複雑なタスクを分解してサブエージェントに委譲する際に使用。",
        "  `schema` パラメーターで出力 JSON Schema を指定すると結果が検証される。",
      ].join("\n"),
    }));
  },
});
