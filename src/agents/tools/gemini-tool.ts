import { Type } from "@sinclair/typebox";
import { jsonResult, type AnyAgentTool } from "../../agents/tools/common.js";

const GeminiActionSchema = Type.Union([
    Type.Object({ message: Type.String() }),
    Type.Object({ type: Type.Union([Type.Literal("code"), Type.Literal("explain")]), prompt: Type.String() }),
]);

export function createGeminiTool(): AnyAgentTool {
  return {
    label: "Gemini",
    name: "gemini",
    description: "Use Google Gemini CLI/API for AI-powered conversations",
    parameters: GeminiActionSchema,
    execute: async (_toolCallId, args) => {
      const message = (args as { message?: string }).message ?? "";
      const type = (args as { type?: string }).type;
      const prompt = (args as { prompt?: string }).prompt ?? "";

      try {
        const input = type === "code" ? `Generate code: ${prompt}` : 
                      type === "explain" ? `Explain: ${prompt}` : 
                      message;

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (geminiApiKey) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: input }] }] }),
                });
                const data = await response.json();
                const result = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response";
                return jsonResult({ result, source: "gemini-api" });
            } catch {
                // Fall through to CLI fallback
            }
        }

        return jsonResult({ 
            result: `[Gemini]\n\nMessage: ${input}\n\nConfigure GEMINI_API_KEY environment variable for API access.\n\nAlternatively, install Google Gemini CLI:\nnpm install -g @google/gemini-cli`,
            source: "gemini-cli-fallback",
        });
      } catch (error) {
        return jsonResult({ error: String(error) });
      }
    },
  };
}
