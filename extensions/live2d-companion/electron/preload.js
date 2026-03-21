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
});
