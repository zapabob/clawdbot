import type { CompanionAvatarStateUpdate } from "../bridge/event-types.js";
import type { IAvatarController } from "./avatar-controller.js";
import type { EmotionProfile } from "./emotion-mapper.js";

type AvatarBackendType = IAvatarController["avatarType"];

export function buildAvatarEmotionState(params: {
  avatarType: AvatarBackendType;
  emotionProfile: EmotionProfile;
}): CompanionAvatarStateUpdate {
  const { avatarType, emotionProfile } = params;
  const isLive2d = avatarType === "live2d";
  const expression = isLive2d ? emotionProfile.expression : emotionProfile.avatarExpression;
  return {
    lastMotion: isLive2d ? emotionProfile.motion.group : emotionProfile.proceduralMotion,
    lastMotionIndex: isLive2d ? emotionProfile.motion.index : 0,
    lastExpression: expression || null,
  };
}

export function buildAvatarSpeechState(params: {
  avatarType: AvatarBackendType;
  emotion: string;
  emotionProfile: EmotionProfile;
  timestamp?: number;
}): CompanionAvatarStateUpdate {
  const { avatarType, emotion, emotionProfile, timestamp } = params;
  return {
    lastAction: "speak",
    lastEmotion: emotion,
    lastSpeechAt: timestamp ?? Date.now(),
    ...buildAvatarEmotionState({ avatarType, emotionProfile }),
  };
}
