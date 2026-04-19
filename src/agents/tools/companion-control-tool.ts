import path from "node:path";
import { Type } from "@sinclair/typebox";
import {
  setCompanionAvatarCommand,
  speakWithCompanion,
} from "openclaw/plugin-sdk/live2d-companion";
import { stringEnum } from "../schema/typebox.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readNumberParam, readStringParam } from "./common.js";

const COMPANION_CONTROL_ACTIONS = [
  "speak",
  "emotion",
  "motion",
  "expression",
  "look_at",
  "load_model",
] as const;

const CompanionControlSchema = Type.Object({
  action: stringEnum(COMPANION_CONTROL_ACTIONS, {
    description: "Action to send to the Desktop Companion.",
  }),
  value: Type.Optional(
    Type.String({
      description:
        "For speak: text to say. For emotion: happy/sad/surprised/angry/embarrassed/neutral. For motion: motion group name. For expression: expression id.",
    }),
  ),
  motion_index: Type.Optional(
    Type.Number({
      description: "Motion index when action=motion (default 0).",
      default: 0,
    }),
  ),
  x: Type.Optional(
    Type.Number({
      description: "Normalized look-at x coordinate in the range [-1, 1].",
    }),
  ),
  y: Type.Optional(
    Type.Number({
      description: "Normalized look-at y coordinate in the range [-1, 1].",
    }),
  ),
  model_path: Type.Optional(
    Type.String({
      description: "Absolute or workspace-relative avatar model path to load.",
    }),
  ),
});

function clampNormalized(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export function createCompanionControlTool(options: { workspaceDir: string }): AnyAgentTool {
  return {
    label: "Companion Control",
    name: "control_companion",
    description:
      "Control the Desktop Companion: speak, set emotion or expression, play motion, move gaze, or load a model.",
    parameters: CompanionControlSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true }) as
        | "speak"
        | "emotion"
        | "motion"
        | "expression"
        | "look_at"
        | "load_model";
      const stateDir = path.join(options.workspaceDir, ".openclaw-desktop");

      switch (action) {
        case "speak": {
          const text = readStringParam(params, "value", { required: true, label: "text" });
          await speakWithCompanion({ stateDir, text });
          return jsonResult({ status: "sent", action, text });
        }
        case "emotion":
        case "expression": {
          const expression = readStringParam(params, "value", {
            required: true,
            label: action === "emotion" ? "emotion" : "expression",
          });
          await setCompanionAvatarCommand({
            stateDir,
            avatarCommand: {
              expression,
            },
          });
          return jsonResult({ status: "sent", action, value: expression });
        }
        case "motion": {
          const motion = readStringParam(params, "value", { required: true, label: "motion" });
          const motionIndex = readNumberParam(params, "motion_index", {
            integer: true,
          }) ?? 0;
          await setCompanionAvatarCommand({
            stateDir,
            avatarCommand: {
              motion,
              motionIndex,
            },
          });
          return jsonResult({ status: "sent", action, value: motion, motionIndex });
        }
        case "look_at": {
          const x = clampNormalized(
            readNumberParam(params, "x", { required: true, label: "x" }) ?? 0,
          );
          const y = clampNormalized(
            readNumberParam(params, "y", { required: true, label: "y" }) ?? 0,
          );
          await setCompanionAvatarCommand({
            stateDir,
            avatarCommand: {
              lookAt: { x, y },
            },
          });
          return jsonResult({ status: "sent", action, x, y });
        }
        case "load_model": {
          const requestedModelPath = readStringParam(params, "model_path", {
            required: true,
            label: "model_path",
          });
          const modelPath = path.isAbsolute(requestedModelPath)
            ? requestedModelPath
            : path.resolve(options.workspaceDir, requestedModelPath);
          await setCompanionAvatarCommand({
            stateDir,
            avatarCommand: {
              loadModel: modelPath,
            },
          });
          return jsonResult({ status: "sent", action, modelPath });
        }
      }
    },
  };
}
