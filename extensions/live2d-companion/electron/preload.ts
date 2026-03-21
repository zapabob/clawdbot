import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../bridge/event-types.js";
import type {
  CompanionLineEvent,
  CompanionEmotionEvent,
  CompanionStateUpdate,
  TtsProvider,
  AvatarCommand,
} from "../bridge/event-types.js";

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
  // ── New: speak-text from main process ────────────────────────────────────
  onSpeakText: (callback: (text: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.SPEAK_TEXT, (_ipcEvent, text: string) => {
      callback(text);
    });
  },
  // ── New: control events (agentId, ttsProvider, visible) ──────────────────
  onControlEvent: (callback: (cmd: Record<string, unknown>) => void) => {
    ipcRenderer.on(IPC_CHANNELS.CONTROL, (_ipcEvent, cmd: Record<string, unknown>) => {
      callback(cmd);
    });
  },
  // ── New: renderer sends state updates back to main ────────────────────────
  sendStateUpdate: (update: Partial<CompanionStateUpdate>) => {
    ipcRenderer.send(IPC_CHANNELS.STATE_UPDATE, update);
  },
  // ── Avatar command (AI agent → avatar control) ────────────────────────────
  onAvatarCommand: (callback: (cmd: AvatarCommand) => void) => {
    ipcRenderer.on(IPC_CHANNELS.AVATAR_COMMAND, (_ipcEvent, cmd: AvatarCommand) => {
      callback(cmd);
    });
  },
  // ── Screen capture (AI desktop companion — AI sees browser/game screen) ───
  captureScreen: (opts?: {
    width?: number;
    height?: number;
  }): Promise<{
    ok: boolean;
    path?: string;
    base64?: string;
    width?: number;
    height?: number;
    timestamp?: number;
    error?: string;
  }> => ipcRenderer.invoke("capture-screen", opts ?? {}),
  onScreenshotRequest: (callback: (opts: Record<string, unknown>) => void) => {
    ipcRenderer.on(IPC_CHANNELS.SCREENSHOT_REQUEST, (_ipcEvent, opts) => {
      callback(opts ?? {});
    });
  },
  // ── Native file dialog (opens Windows Explorer) ───────────────────────────
  openFileDialog: (opts?: {
    filters?: Array<{ name: string; extensions: string[] }>;
    title?: string;
  }): Promise<{
    ok: boolean;
    filePath?: string;
    buffer?: Buffer;
    canceled?: boolean;
    error?: string;
  }> => ipcRenderer.invoke("open-file-dialog", opts ?? {}),
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
      onSpeakText: (cb: (text: string) => void) => void;
      onControlEvent: (cb: (cmd: Record<string, unknown>) => void) => void;
      sendStateUpdate: (update: {
        speaking?: boolean;
        agentId?: string;
        ttsProvider?: TtsProvider;
      }) => void;
      onAvatarCommand: (cb: (cmd: AvatarCommand) => void) => void;
      captureScreen: (opts?: { width?: number; height?: number }) => Promise<{
        ok: boolean;
        path?: string;
        base64?: string;
        width?: number;
        height?: number;
        timestamp?: number;
        error?: string;
      }>;
      onScreenshotRequest: (cb: (opts: Record<string, unknown>) => void) => void;
      openFileDialog: (opts?: {
        filters?: Array<{ name: string; extensions: string[] }>;
        title?: string;
      }) => Promise<{
        ok: boolean;
        filePath?: string;
        buffer?: Buffer;
        canceled?: boolean;
        error?: string;
      }>;
    };
  }
}
