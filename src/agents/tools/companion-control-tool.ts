import fs from "node:fs/promises";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";

const CompanionControlSchema = Type.Object({
  action: Type.Union(
    [
      Type.Literal("speak"),
      Type.Literal("emotion"),
      Type.Literal("motion"),
      Type.Literal("expression"),
    ],
    { description: "Action to send to the Live2D companion" },
  ),
  value: Type.String({
    description:
      "For speak: text to say. For emotion: happy/sad/surprised/angry/embarrassed/neutral. For motion: motion group name. For expression: expression ID.",
  }),
  motion_index: Type.Optional(Type.Number({ description: "Motion index (default 0)", default: 0 })),
});

export function createCompanionControlTool(options: { workspaceDir: string }): AnyAgentTool {
  return {
    label: "Companion Control",
    name: "control_companion",
    description:
      "Control Hakua's Live2D companion — set emotion, play motion, change expression, or speak text via VOICEVOX.",
    parameters: CompanionControlSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true }) as
        | "speak"
        | "emotion"
        | "motion"
        | "expression";
      const value = readStringParam(params, "value", { required: true });
      const motionIndex = typeof params["motion_index"] === "number" ? params["motion_index"] : 0;

      const stateDir = path.join(options.workspaceDir, ".openclaw-desktop");
      await fs.mkdir(stateDir, { recursive: true });
      const flagPath = path.join(stateDir, "companion_emotion.json");

      type Payload =
        | { type: "emotion"; emotion: string; text?: string; timestamp: number }
        | { type: "speak"; text: string; emotion: string; timestamp: number }
        | { type: "motion"; group: string; index: number; timestamp: number }
        | { type: "expression"; expressionId: string; timestamp: number };

      let payload: Payload;
      switch (action) {
        case "speak":
          payload = { type: "speak", text: value, emotion: "neutral", timestamp: Date.now() };
          break;
        case "emotion":
          payload = { type: "emotion", emotion: value, timestamp: Date.now() };
          break;
        case "motion":
          payload = { type: "motion", group: value, index: motionIndex, timestamp: Date.now() };
          break;
        case "expression":
          payload = { type: "expression", expressionId: value, timestamp: Date.now() };
          break;
      }

      await fs.writeFile(flagPath, JSON.stringify(payload), "utf-8");

      return jsonResult({ status: "sent", action, value });
    },
  };
}
