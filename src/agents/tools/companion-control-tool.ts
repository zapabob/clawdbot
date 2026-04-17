import path from "node:path";
import { Type } from "@sinclair/typebox";
import {
  setCompanionAvatarCommand,
  speakWithCompanion,
} from "openclaw/plugin-sdk/live2d-companion";
import { stringEnum } from "../schema/typebox.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";

const COMPANION_CONTROL_ACTIONS = [
  "speak",
  "emotion",
  "motion",
  "expression",
] as const;

const CompanionControlSchema = Type.Object({
  action: stringEnum(COMPANION_CONTROL_ACTIONS, {
    description: "Action to send to the Desktop Companion",
  }),
  value: Type.String({
    description:
      "For speak: text to say. For emotion: happy/sad/surprised/angry/embarrassed/neutral. For motion: motion group name. For expression: expression id.",
  }),
  motion_index: Type.Optional(Type.Number({ description: "Motion index (default 0)", default: 0 })),
});

export function createCompanionControlTool(options: { workspaceDir: string }): AnyAgentTool {
  return {
    label: "Companion Control",
    name: "control_companion",
    description:
      "Control the Desktop Companion: set emotion, play motion, change expression, or speak text via VOICEVOX.",
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

      switch (action) {
        case "speak":
          await speakWithCompanion({ stateDir, text: value });
          break;
        case "emotion":
          await setCompanionAvatarCommand({
            stateDir,
            avatarCommand: { expression: value },
          });
          break;
        case "motion":
          await setCompanionAvatarCommand({
            stateDir,
            avatarCommand: { motion: value, motionIndex },
          });
          break;
        case "expression":
          await setCompanionAvatarCommand({
            stateDir,
            avatarCommand: { expression: value },
          });
          break;
      }

      return jsonResult({ status: "sent", action, value });
    },
  };
}
