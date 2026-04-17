export type EmotionType = "happy" | "sad" | "surprised" | "angry" | "embarrassed" | "neutral";
export type TtsProvider = "voicevox" | "web-speech";

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

export interface CompanionControlCommand {
  type: "control";
  visible?: boolean;
  agentId?: string;
  ttsProvider?: TtsProvider;
  speakText?: string;
  /** Avatar commands sent by the AI agent */
  avatarCommand?: AvatarCommand;
  timestamp: number;
}

/**
 * Commands the AI agent can issue to control the desktop avatar.
 * Dispatched via the HTTP control API (/control) or IPC.
 */
export interface AvatarCommand {
  /** Load a new avatar model (.vrm / .fbx / .model3.json) */
  loadModel?: string;
  /** Play a named emotion expression */
  expression?: string;
  /** Play a named motion group */
  motion?: string;
  /** Optional motion index within the named motion group */
  motionIndex?: number;
  /** Speak text via TTS (triggers lip sync) */
  speakText?: string;
  /** Eye gaze direction: normalised [-1,1] per axis */
  lookAt?: { x: number; y: number };
}

export interface CompanionStateUpdate {
  visible: boolean;
  agentId: string;
  ttsProvider: TtsProvider;
  speaking: boolean;
  timestamp: number;
}

export type CompanionEvent =
  | CompanionLineEvent
  | CompanionEmotionEvent
  | CompanionSttResult
  | CompanionControlCommand;

// IPC channel names
export const IPC_CHANNELS = {
  LINE_EVENT: "companion:line-event",
  EMOTION_EVENT: "companion:emotion-event",
  STT_RESULT: "stt-result",
  STT_START: "stt-start",
  STT_STOP: "stt-stop",
  SPEAK_TEXT: "companion:speak-text",
  CONTROL: "companion:control",
  STATE_UPDATE: "companion:state-update",
  RUNTIME_STATE: "companion:runtime-state",
  AVATAR_COMMAND: "companion:avatar-command",
  // Screen capture
  SCREENSHOT_REQUEST: "companion:screenshot-request",
  SCREENSHOT_RESULT: "companion:screenshot-result",
  // Camera (webcam) capture
  CAMERA_FRAME: "companion:camera-frame",
  CAMERA_CAPTURE_REQUEST: "companion:camera-capture-request",
} as const;

// Flag file names (relative to stateDir)
export const FLAG_FILES = {
  LINE_EVENT: "companion_line_event.json",
  EMOTION: "companion_emotion.json",
  STT_RESULT: "companion_stt_result.json",
  CONTROL: "companion_control.json",
  STATE: "companion_state.json",
  // Screen capture output
  SCREENSHOT_META: "companion_screenshot_meta.json",
  // Camera (webcam) output
  CAMERA: "companion_camera.jpg",
  CAMERA_META: "companion_camera_meta.json",
} as const;
