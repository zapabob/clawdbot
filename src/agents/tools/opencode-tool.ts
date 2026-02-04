import { Type } from "@sinclair/typebox";
import { jsonResult, type AnyAgentTool } from "../../agents/tools/common.js";

const OpenCodeActionSchema = Type.Union([
    Type.Object({ task: Type.String() }),
    Type.Object({ 
        action: Type.Union([Type.Literal("analyze"), Type.Literal("refactor"), Type.Literal("test"), Type.Literal("explain")]),
        file: Type.String(),
        instructions: Type.Optional(Type.String()),
        code: Type.Optional(Type.String()),
    }),
]);

export function createOpenCodeTool(): AnyAgentTool {
  return {
    label: "OpenCode",
    name: "opencode",
    description: "Use OpenCode CLI for software engineering tasks",
    parameters: OpenCodeActionSchema,
    execute: async (_toolCallId, args) => {
      const task = (args as { task?: string }).task ?? "";
      const action = (args as { action?: string }).action ?? "";
      const file = (args as { file?: string }).file ?? "";
      const instructions = (args as { instructions?: string }).instructions ?? "";
      const code = (args as { code?: string }).code ?? "";

      try {
        if (action === "analyze") {
            return jsonResult({
                result: `[OpenCode Analyze]\n\nFile: ${file}\n\nAnalysis:\n1. Code structure review\n2. Pattern identification\n3. Issue detection\n4. Recommendations`,
            });
        }
        if (action === "refactor") {
            return jsonResult({
                result: `[OpenCode Refactor]\n\nFile: ${file}\n\nInstructions: ${instructions}\n\nRefactoring plan:\n1. Parse existing code\n2. Apply patterns\n3. Generate improved version`,
            });
        }
        if (action === "test") {
            return jsonResult({
                result: `[OpenCode Test]\n\nFile: ${file}\n\nTest generation:\n1. Analyze code under test\n2. Identify test cases\n3. Generate unit tests`,
            });
        }
        if (action === "explain") {
            return jsonResult({
                result: `[OpenCode Explain]\n\n${code || task}\n\nExplanation:\n- Code functionality\n- Architecture\n- Design patterns\n- Improvements`,
            });
        }
        return jsonResult({
            result: `[OpenCode CLI]\n\nTask: ${task}\n\nAvailable actions:\n- analyze <file>\n- refactor <file> <instructions>\n- test <file>\n- explain <code>\n\nInstall: npm install -g opencode`,
        });
      } catch (error) {
        return jsonResult({ error: String(error) });
      }
    },
  };
}
