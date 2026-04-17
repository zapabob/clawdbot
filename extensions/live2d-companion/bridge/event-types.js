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
};
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
};
