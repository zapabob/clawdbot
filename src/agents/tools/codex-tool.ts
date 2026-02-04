import { Type } from "@sinclair/typebox";
import { jsonResult, type AnyAgentTool } from "../../agents/tools/common.js";

const CodexActionSchema = Type.Union([
    Type.Object({ action: Type.Literal("generate"), prompt: Type.String() }),
    Type.Object({ action: Type.Literal("edit"), file: Type.String(), instructions: Type.String() }),
    Type.Object({ action: Type.Literal("explain"), code: Type.String() }),
]);

export function createCodexTool(): AnyAgentTool {
  return {
    label: "Codex",
    name: "codex",
    description: "Generate or edit code using OpenAI Codex API",
    parameters: CodexActionSchema,
    execute: async (_toolCallId, args) => {
      const action = (args as { action: string }).action;
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        return jsonResult({ error: "OPENAI_API_KEY not configured" });
      }

      try {
        if (action === "generate") {
            const prompt = (args as { prompt: string }).prompt;
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: "You are Codex, an AI coding assistant. Generate clean, well-documented code." },
                        { role: "user", content: prompt },
                    ],
                    max_tokens: 2000,
                }),
            });
            const data = await response.json();
            const result = data.choices?.[0]?.message?.content ?? "No response";
            return jsonResult({ result });
        }
        if (action === "edit") {
            const file = (args as { file: string }).file;
            const instructions = (args as { instructions: string }).instructions;
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: "You are Codex. Edit the code according to instructions." },
                        { role: "user", content: `File: ${file}\n\nInstructions: ${instructions}` },
                    ],
                    max_tokens: 2000,
                }),
            });
            const data = await response.json();
            const result = data.choices?.[0]?.message?.content ?? "No response";
            return jsonResult({ result });
        }
        if (action === "explain") {
            const code = (args as { code: string }).code;
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: "You are Codex. Explain code clearly." },
                        { role: "user", content: `Explain:\n\n${code}` },
                    ],
                    max_tokens: 1000,
                }),
            });
            const data = await response.json();
            const result = data.choices?.[0]?.message?.content ?? "No response";
            return jsonResult({ result });
        }
        return jsonResult({ error: `Unknown action: ${action}` });
      } catch (error) {
        return jsonResult({ error: String(error) });
      }
    },
  };
}
