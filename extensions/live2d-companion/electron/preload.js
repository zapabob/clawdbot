import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../bridge/event-types.js";
contextBridge.exposeInMainWorld("companionBridge", {
  onLineEvent: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.LINE_EVENT, (_ipcEvent, data) => {
      callback(data);
    });
  },
  onEmotionEvent: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.EMOTION_EVENT, (_ipcEvent, data) => {
      callback(data);
    });
  },
  sendSttResult: (transcript) => {
    ipcRenderer.send(IPC_CHANNELS.STT_RESULT, transcript);
  },
  startStt: () => {
    ipcRenderer.send(IPC_CHANNELS.STT_START);
  },
  stopStt: () => {
    ipcRenderer.send(IPC_CHANNELS.STT_STOP);
  },
  discoverModel: () => {
    return ipcRenderer.invoke("discover-model");
  },
  // ── New: speak-text from main process ────────────────────────────────────
  onSpeakText: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.SPEAK_TEXT, (_ipcEvent, text) => {
      callback(text);
    });
  },
  // ── New: control events (agentId, ttsProvider, visible) ──────────────────
  onControlEvent: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.CONTROL, (_ipcEvent, cmd) => {
      callback(cmd);
    });
  },
  // ── New: renderer sends state updates back to main ────────────────────────
  sendStateUpdate: (update) => {
    ipcRenderer.send(IPC_CHANNELS.STATE_UPDATE, update);
  },
  // ── Avatar command (AI agent → avatar control) ────────────────────────────
  onAvatarCommand: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.AVATAR_COMMAND, (_ipcEvent, cmd) => {
      callback(cmd);
    });
  },
  // ── Screen capture (AI desktop companion — AI sees browser/game screen) ───
  captureScreen: (opts) => ipcRenderer.invoke("capture-screen", opts ?? {}),
  onScreenshotRequest: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.SCREENSHOT_REQUEST, (_ipcEvent, opts) => {
      callback(opts ?? {});
    });
  },
  // ── Native file dialog (opens Windows Explorer) ───────────────────────────
  openFileDialog: (opts) => ipcRenderer.invoke("open-file-dialog", opts ?? {}),
  // ── Mouse active state (renderer → main for D&D / click-through) ──────────
  notifyMouseActive: (active) => ipcRenderer.send("mouse-active", active),
  // ── Camera (webcam) frame → main process ─────────────────────────────────
  sendCameraFrame: (base64) => {
    ipcRenderer.send(IPC_CHANNELS.CAMERA_FRAME, base64);
  },
  onCameraCaptureRequest: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.CAMERA_CAPTURE_REQUEST, () => callback());
  },
});
