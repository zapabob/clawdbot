import path from "node:path";
import {
  getCompanionInputSnapshot,
  getCompanionProfile,
  getCompanionState,
  requestCompanionWindowCapture,
  setCompanionMicEnabled,
  setCompanionPermission,
  setCompanionAvatarCommand,
  speakWithCompanion,
  updateCompanionProfile,
} from "openclaw/plugin-sdk/live2d-companion";
import { Type } from "typebox";
import { readSnakeCaseParamRaw } from "../../param-key.js";
import { stringEnum } from "../schema/typebox.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readNumberParam, readStringParam, ToolInputError } from "./common.js";

const COMPANION_CONTROL_ACTIONS = [
  "status",
  "speak",
  "emotion",
  "motion",
  "expression",
  "look_at",
  "load_model",
  "mic",
  "input_snapshot",
  "window_capture",
  "permission",
  "profile",
] as const;

const COMPANION_PERMISSION_CAPABILITIES = ["mic", "camera", "screen", "tab-follow"] as const;
const COMPANION_PERMISSION_DECISIONS = ["granted", "denied"] as const;
const COMPANION_TTS_PROVIDERS = ["voicevox", "web-speech"] as const;

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
  emotion: Type.Optional(
    Type.String({
      description:
        "Optional emotion to cue before action=speak. Use happy, sad, surprised, angry, embarrassed, or neutral.",
    }),
  ),
  tts_provider: Type.Optional(
    stringEnum(COMPANION_TTS_PROVIDERS, {
      description: "Optional action=speak TTS backend override.",
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
  enabled: Type.Optional(
    Type.Boolean({
      description: "For mic: enable or disable local microphone STT capture.",
    }),
  ),
  include_camera: Type.Optional(
    Type.Boolean({
      description: "For input_snapshot: include the last camera capture if available.",
    }),
  ),
  capture_camera: Type.Optional(
    Type.Boolean({
      description: "For input_snapshot: request a fresh camera capture if camera is granted.",
    }),
  ),
  capability: Type.Optional(
    stringEnum(COMPANION_PERMISSION_CAPABILITIES, {
      description: "For permission: companion capability to update.",
    }),
  ),
  decision: Type.Optional(
    stringEnum(COMPANION_PERMISSION_DECISIONS, {
      description: "For permission: grant or deny the companion capability.",
    }),
  ),
  display_name: Type.Optional(
    Type.String({
      description: "For profile: local companion display name.",
    }),
  ),
  character_prompt: Type.Optional(
    Type.String({
      description: "For profile: local character persona or behavior notes.",
    }),
  ),
  greeting: Type.Optional(
    Type.String({
      description: "For profile: local companion greeting.",
    }),
  ),
  mood: Type.Optional(
    Type.String({
      description: "For profile: current companion mood label.",
    }),
  ),
  voice_profile: Type.Optional(
    Type.String({
      description: "For profile: voice persona note such as VOICEVOX speaker id.",
    }),
  ),
  relationship_level: Type.Optional(
    Type.Number({
      description: "For profile: relationship/familiarity score from 0 to 100.",
    }),
  ),
  relationship_label: Type.Optional(
    Type.String({
      description: "For profile: relationship label such as new, familiar, or trusted.",
    }),
  ),
});

function clampNormalized(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function readBooleanParam(
  params: Record<string, unknown>,
  key: string,
  options: { required?: boolean; label?: string } = {},
): boolean | undefined {
  const raw = readSnakeCaseParamRaw(params, key);
  if (typeof raw === "boolean") {
    return raw;
  }
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }
  if (options.required) {
    throw new ToolInputError(`${options.label ?? key} required`);
  }
  return undefined;
}

function readCompanionPermissionCapability(
  params: Record<string, unknown>,
): (typeof COMPANION_PERMISSION_CAPABILITIES)[number] {
  const capability = readStringParam(params, "capability", {
    required: true,
    label: "capability",
  }) as (typeof COMPANION_PERMISSION_CAPABILITIES)[number];
  if (!COMPANION_PERMISSION_CAPABILITIES.includes(capability)) {
    throw new ToolInputError(
      `capability must be one of ${COMPANION_PERMISSION_CAPABILITIES.join(", ")}`,
    );
  }
  return capability;
}

function readCompanionPermissionDecision(
  params: Record<string, unknown>,
): (typeof COMPANION_PERMISSION_DECISIONS)[number] {
  const decision = readStringParam(params, "decision", {
    required: true,
    label: "decision",
  }) as (typeof COMPANION_PERMISSION_DECISIONS)[number];
  if (!COMPANION_PERMISSION_DECISIONS.includes(decision)) {
    throw new ToolInputError(
      `decision must be one of ${COMPANION_PERMISSION_DECISIONS.join(", ")}`,
    );
  }
  return decision;
}

function readCompanionTtsProvider(
  params: Record<string, unknown>,
): (typeof COMPANION_TTS_PROVIDERS)[number] | undefined {
  const provider = readStringParam(params, "tts_provider");
  if (provider === undefined) {
    return undefined;
  }
  if (!COMPANION_TTS_PROVIDERS.includes(provider as (typeof COMPANION_TTS_PROVIDERS)[number])) {
    throw new ToolInputError(`tts_provider must be one of ${COMPANION_TTS_PROVIDERS.join(", ")}`);
  }
  return provider as (typeof COMPANION_TTS_PROVIDERS)[number];
}

export function createCompanionControlTool(options: { workspaceDir: string }): AnyAgentTool {
  return {
    label: "Companion Control",
    name: "control_companion",
    description:
      "Control the Desktop Companion: read or update the local character profile, speak, set emotion or expression, play motion, move gaze, load a model, toggle mic STT, or read companion input state.",
    parameters: CompanionControlSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true }) as
        | "status"
        | "speak"
        | "emotion"
        | "motion"
        | "expression"
        | "look_at"
        | "load_model"
        | "mic"
        | "input_snapshot"
        | "window_capture"
        | "permission"
        | "profile";
      const stateDir = path.join(options.workspaceDir, ".openclaw-desktop");

      switch (action) {
        case "status": {
          const state = await getCompanionState({ stateDir });
          return jsonResult({ status: "ok", action, state });
        }
        case "speak": {
          const text = readStringParam(params, "value", { required: true, label: "text" });
          const emotion = readStringParam(params, "emotion");
          const ttsProvider = readCompanionTtsProvider(params);
          await speakWithCompanion({
            stateDir,
            text,
            ...(emotion ? { emotion } : {}),
            ...(ttsProvider ? { ttsProvider } : {}),
          });
          return jsonResult({
            status: "sent",
            action,
            text,
            ...(emotion ? { emotion } : {}),
            ...(ttsProvider ? { ttsProvider } : {}),
          });
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
          const motionIndex =
            readNumberParam(params, "motion_index", {
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
        case "mic": {
          const enabled =
            readBooleanParam(params, "enabled", {
              required: true,
              label: "enabled",
            }) ?? false;
          const result = await setCompanionMicEnabled({ stateDir, enabled });
          return jsonResult({
            status: result.ok ? "sent" : "failed",
            action,
            enabled,
            ...(result.reason ? { reason: result.reason } : {}),
          });
        }
        case "input_snapshot": {
          const captureCamera = readBooleanParam(params, "capture_camera") ?? false;
          const includeCamera = readBooleanParam(params, "include_camera") ?? captureCamera;
          const snapshot = await getCompanionInputSnapshot({
            stateDir,
            payload: {
              includeCamera,
              captureCamera,
            },
          });
          return jsonResult({ status: "ok", action, snapshot });
        }
        case "window_capture": {
          const capture = await requestCompanionWindowCapture({ stateDir });
          return jsonResult({ status: capture ? "ok" : "unavailable", action, capture });
        }
        case "permission": {
          const capability = readCompanionPermissionCapability(params);
          const decision = readCompanionPermissionDecision(params);
          const state = await setCompanionPermission({
            stateDir,
            capability,
            decision,
          });
          return jsonResult({ status: "sent", action, capability, decision, state });
        }
        case "profile": {
          const profilePatch: {
            displayName?: string;
            characterPrompt?: string;
            greeting?: string;
            mood?: string;
            voiceProfile?: string | null;
            relationship?: {
              level?: number;
              label?: string;
            };
          } = {};
          const displayName = readStringParam(params, "display_name");
          const characterPrompt = readStringParam(params, "character_prompt");
          const greeting = readStringParam(params, "greeting");
          const mood = readStringParam(params, "mood");
          const voiceProfile = readStringParam(params, "voice_profile");
          const relationshipLevel = readNumberParam(params, "relationship_level");
          const relationshipLabel = readStringParam(params, "relationship_label");

          if (displayName !== undefined) {
            profilePatch.displayName = displayName;
          }
          if (characterPrompt !== undefined) {
            profilePatch.characterPrompt = characterPrompt;
          }
          if (greeting !== undefined) {
            profilePatch.greeting = greeting;
          }
          if (mood !== undefined) {
            profilePatch.mood = mood;
          }
          if (voiceProfile !== undefined) {
            profilePatch.voiceProfile = voiceProfile;
          }
          if (relationshipLevel !== undefined || relationshipLabel !== undefined) {
            profilePatch.relationship = {
              ...(relationshipLevel !== undefined ? { level: relationshipLevel } : {}),
              ...(relationshipLabel !== undefined ? { label: relationshipLabel } : {}),
            };
          }

          const hasPatch = Object.keys(profilePatch).length > 0;
          const profile = hasPatch
            ? await updateCompanionProfile({ stateDir, profile: profilePatch })
            : await getCompanionProfile({ stateDir });
          return jsonResult({
            status: hasPatch ? "updated" : "ok",
            action,
            profile,
          });
        }
      }
    },
  };
}
