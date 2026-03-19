export type EmotionType = "happy" | "sad" | "surprised" | "angry" | "embarrassed" | "neutral";

export interface CompanionLineEvent {
  type: "line_message";
  text: string;
  senderId: string;
  timestamp: number;
}

export interface CompanionEmotionEvent {
  type: "emotion";
  emotion: EmotionType;
  text?: string;
  timestamp: number;
}

export interface CompanionSttResult {
  type: "stt_result";
  transcript: string;
  timestamp: number;
}

export type CompanionEvent = CompanionLineEvent | CompanionEmotionEvent | CompanionSttResult;

// IPC channel names
export const IPC_CHANNELS = {
  LINE_EVENT: "companion:line-event",
  EMOTION_EVENT: "companion:emotion-event",
  STT_RESULT: "stt-result",
  STT_START: "stt-start",
  STT_STOP: "stt-stop",
  SPEAK_TEXT: "companion:speak-text",
} as const;

// Flag file names (relative to stateDir)
export const FLAG_FILES = {
  LINE_EVENT: "companion_line_event.json",
  EMOTION: "companion_emotion.json",
  STT_RESULT: "companion_stt_result.json",
} as const;
