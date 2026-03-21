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
};
// Flag file names (relative to stateDir)
export const FLAG_FILES = {
  LINE_EVENT: "companion_line_event.json",
  EMOTION: "companion_emotion.json",
  STT_RESULT: "companion_stt_result.json",
  CONTROL: "companion_control.json",
  STATE: "companion_state.json",
};
