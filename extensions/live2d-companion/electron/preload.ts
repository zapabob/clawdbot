import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../bridge/event-types.js";
import type { CompanionLineEvent, CompanionEmotionEvent } from "../bridge/event-types.js";

contextBridge.exposeInMainWorld("companionBridge", {
  onLineEvent: (callback: (event: CompanionLineEvent) => void) => {
    ipcRenderer.on(IPC_CHANNELS.LINE_EVENT, (_ipcEvent, data: CompanionLineEvent) => {
      callback(data);
    });
  },
  onEmotionEvent: (callback: (event: CompanionEmotionEvent) => void) => {
    ipcRenderer.on(IPC_CHANNELS.EMOTION_EVENT, (_ipcEvent, data: CompanionEmotionEvent) => {
      callback(data);
    });
  },
  sendSttResult: (transcript: string) => {
    ipcRenderer.send(IPC_CHANNELS.STT_RESULT, transcript);
  },
  startStt: () => {
    ipcRenderer.send(IPC_CHANNELS.STT_START);
  },
  stopStt: () => {
    ipcRenderer.send(IPC_CHANNELS.STT_STOP);
  },
  discoverModel: (): Promise<string | null> => {
    return ipcRenderer.invoke("discover-model");
  },
});

// Type declaration for renderer-side TypeScript
declare global {
  interface Window {
    companionBridge: {
      onLineEvent: (cb: (event: CompanionLineEvent) => void) => void;
      onEmotionEvent: (cb: (event: CompanionEmotionEvent) => void) => void;
      sendSttResult: (transcript: string) => void;
      startStt: () => void;
      stopStt: () => void;
      discoverModel: () => Promise<string | null>;
    };
  }
}
