import type { EmotionType } from "../bridge/event-types.js";
import type { IAvatarController } from "./avatar-controller.js";

export interface EmotionProfile {
  motion: { group: string; index: number };
  proceduralMotion: string;
  expression: string;
  avatarExpression: string;
  speedRate: number;
  pitchScale: number;
}

const EMOTION_TYPES: EmotionType[] = [
  "happy",
  "sad",
  "surprised",
  "angry",
  "embarrassed",
  "neutral",
];

const EMOTION_MAP: Record<EmotionType, EmotionProfile> = {
  happy: {
    motion: { group: "TapBody", index: 0 },
    proceduralMotion: "happy",
    expression: "exp_happy",
    avatarExpression: "happy",
    speedRate: 1.1,
    pitchScale: 1.05,
  },
  sad: {
    motion: { group: "FlickHead", index: 0 },
    proceduralMotion: "bow",
    expression: "exp_sad",
    avatarExpression: "sad",
    speedRate: 0.9,
    pitchScale: 0.95,
  },
  surprised: {
    motion: { group: "Shake", index: 0 },
    proceduralMotion: "surprised",
    expression: "exp_surprised",
    avatarExpression: "surprised",
    speedRate: 1.2,
    pitchScale: 1.1,
  },
  angry: {
    motion: { group: "Shake", index: 1 },
    proceduralMotion: "shake",
    expression: "exp_angry",
    avatarExpression: "angry",
    speedRate: 1.15,
    pitchScale: 0.9,
  },
  embarrassed: {
    motion: { group: "TapBody", index: 1 },
    proceduralMotion: "happy",
    expression: "exp_embarrassed",
    avatarExpression: "relaxed",
    speedRate: 1.05,
    pitchScale: 1.0,
  },
  neutral: {
    motion: { group: "Idle", index: 0 },
    proceduralMotion: "idle",
    expression: "",
    avatarExpression: "",
    speedRate: 1.0,
    pitchScale: 1.0,
  },
};

const KEYWORD_MAP: Array<{ emotion: EmotionType; patterns: RegExp }> = [
  { emotion: "angry", patterns: /怒|おこ|ダメ|だめ|許せない|やめて|むかつ|angry|frustrat/i },
  {
    emotion: "sad",
    patterns:
      /ごめん|すみません|失敗|エラー|無理|できない|悲しい|つらい|残念|sorry|failed|error|cannot|can't/i,
  },
  { emotion: "surprised", patterns: /えっ|びっくり|まさか|驚|想定外|wow|whoa|unexpected/i },
  { emotion: "embarrassed", patterns: /恥|照れ|照れる|てへ|えへ|embarrass|shy/i },
  {
    emotion: "happy",
    patterns: /ありがとう|嬉しい|うれしい|助かる|よかった|最高|いいね|やった|great|nice|thanks/i,
  },
];

const EXPLICIT_TAG = /\[EMOTION:(\w+)\]/i;

export function isEmotionType(value: string): value is EmotionType {
  return EMOTION_TYPES.includes(value.toLowerCase() as EmotionType);
}

export function detectEmotion(text: string): EmotionType {
  const tagMatch = EXPLICIT_TAG.exec(text);
  if (tagMatch) {
    const tag = tagMatch[1].toLowerCase();
    if (isEmotionType(tag)) {
      return tag;
    }
  }

  for (const { emotion, patterns } of KEYWORD_MAP) {
    if (patterns.test(text)) {
      return emotion;
    }
  }

  return "neutral";
}

export function applyEmotion(controller: IAvatarController, emotion: EmotionType): EmotionProfile {
  const profile = EMOTION_MAP[emotion] ?? EMOTION_MAP.neutral;
  const motion =
    controller.avatarType === "live2d"
      ? profile.motion
      : { group: profile.proceduralMotion, index: 0 };
  const expression =
    controller.avatarType === "live2d" ? profile.expression : profile.avatarExpression;

  controller.playMotion(motion.group, motion.index);
  if (expression) {
    controller.playExpression(expression);
  }
  return profile;
}

export function getEmotionProfile(emotion: EmotionType): EmotionProfile {
  return EMOTION_MAP[emotion] ?? EMOTION_MAP.neutral;
}
