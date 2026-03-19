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
});
