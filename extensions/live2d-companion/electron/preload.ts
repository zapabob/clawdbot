import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../bridge/event-types.js";
import type {
  AvatarCommand,
  CompanionEmotionEvent,
  CompanionLineEvent,
  CompanionStateUpdate,
  TtsProvider,
} from "../bridge/event-types.js";
import type {
  CompanionAssetManifestEntry,
  CompanionPermissionCapability,
  CompanionPermissionDecision,
  CompanionRuntimeState,
} from "../runtime-api.js";

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
  getStateSnapshot: (): Promise<CompanionRuntimeState> => ipcRenderer.invoke("companion:get-state"),
  listAssets: (): Promise<CompanionAssetManifestEntry[]> => ipcRenderer.invoke("companion:list-assets"),
  onRuntimeState: (callback: (state: CompanionRuntimeState) => void) => {
    ipcRenderer.on(IPC_CHANNELS.RUNTIME_STATE, (_ipcEvent, state: CompanionRuntimeState) => {
      callback(state);
    });
  },
  setPermission: (
    capability: CompanionPermissionCapability,
    decision: CompanionPermissionDecision,
  ): Promise<CompanionRuntimeState> =>
    ipcRenderer.invoke("companion:set-permission", capability, decision),
  setMicEnabled: (enabled: boolean): Promise<{ ok: boolean; reason?: string }> =>
    ipcRenderer.invoke("companion:set-mic-enabled", enabled),
  importAsset: (payload: {
    filePath: string;
    rightsAcknowledged: boolean;
    licenseMemo: string;
    importMode?: "local-reference" | "local-copy";
  }): Promise<CompanionAssetManifestEntry> => ipcRenderer.invoke("companion:import-asset", payload),
  activateAsset: (assetId: string): Promise<CompanionRuntimeState> =>
    ipcRenderer.invoke("companion:activate-asset", assetId),
  startStt: (): Promise<{ ok: boolean; reason?: string }> =>
    ipcRenderer.invoke("companion:set-mic-enabled", true),
  stopStt: (): Promise<{ ok: boolean; reason?: string }> =>
    ipcRenderer.invoke("companion:set-mic-enabled", false),
  discoverModel: (): Promise<string | null> => ipcRenderer.invoke("discover-model"),
  onSpeakText: (callback: (text: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.SPEAK_TEXT, (_ipcEvent, text: string) => {
      callback(text);
    });
  },
  onControlEvent: (callback: (cmd: Record<string, unknown>) => void) => {
    ipcRenderer.on(IPC_CHANNELS.CONTROL, (_ipcEvent, cmd: Record<string, unknown>) => {
      callback(cmd);
    });
  },
  sendStateUpdate: (update: Partial<CompanionStateUpdate>) => {
    ipcRenderer.send(IPC_CHANNELS.STATE_UPDATE, update);
  },
  onAvatarCommand: (callback: (cmd: AvatarCommand) => void) => {
    ipcRenderer.on(IPC_CHANNELS.AVATAR_COMMAND, (_ipcEvent, cmd: AvatarCommand) => {
      callback(cmd);
    });
  },
  captureScreen: (): Promise<{
    ok: boolean;
    base64?: string;
    mimeType?: string;
    width?: number;
    height?: number;
    timestamp?: number;
    error?: string;
  }> => ipcRenderer.invoke("capture-screen"),
  openFileDialog: (opts?: {
    filters?: Array<{ name: string; extensions: string[] }>;
    title?: string;
  }): Promise<{
    ok: boolean;
    filePath?: string;
    buffer?: ArrayBuffer;
    canceled?: boolean;
    error?: string;
  }> => ipcRenderer.invoke("open-file-dialog", opts ?? {}),
  notifyMouseActive: (active: boolean) => ipcRenderer.send("mouse-active", active),
  sendCameraFrame: (base64: string) => {
    ipcRenderer.send(IPC_CHANNELS.CAMERA_FRAME, base64);
  },
  onCameraCaptureRequest: (callback: () => void) => {
    ipcRenderer.on(IPC_CHANNELS.CAMERA_CAPTURE_REQUEST, () => callback());
  },
});

declare global {
  interface Window {
    companionBridge: {
      onLineEvent: (cb: (event: CompanionLineEvent) => void) => void;
      onEmotionEvent: (cb: (event: CompanionEmotionEvent) => void) => void;
      getStateSnapshot: () => Promise<CompanionRuntimeState>;
      listAssets: () => Promise<CompanionAssetManifestEntry[]>;
      onRuntimeState: (cb: (state: CompanionRuntimeState) => void) => void;
      setPermission: (
        capability: CompanionPermissionCapability,
        decision: CompanionPermissionDecision,
      ) => Promise<CompanionRuntimeState>;
      setMicEnabled: (enabled: boolean) => Promise<{ ok: boolean; reason?: string }>;
      importAsset: (payload: {
        filePath: string;
        rightsAcknowledged: boolean;
        licenseMemo: string;
        importMode?: "local-reference" | "local-copy";
      }) => Promise<CompanionAssetManifestEntry>;
      activateAsset: (assetId: string) => Promise<CompanionRuntimeState>;
      startStt: () => Promise<{ ok: boolean; reason?: string }>;
      stopStt: () => Promise<{ ok: boolean; reason?: string }>;
      discoverModel: () => Promise<string | null>;
      onSpeakText: (cb: (text: string) => void) => void;
      onControlEvent: (cb: (cmd: Record<string, unknown>) => void) => void;
      sendStateUpdate: (update: {
        speaking?: boolean;
        agentId?: string;
        ttsProvider?: TtsProvider;
      }) => void;
      onAvatarCommand: (cb: (cmd: AvatarCommand) => void) => void;
      captureScreen: () => Promise<{
        ok: boolean;
        base64?: string;
        mimeType?: string;
        width?: number;
        height?: number;
        timestamp?: number;
        error?: string;
      }>;
      openFileDialog: (opts?: {
        filters?: Array<{ name: string; extensions: string[] }>;
        title?: string;
      }) => Promise<{
        ok: boolean;
        filePath?: string;
        buffer?: ArrayBuffer;
        canceled?: boolean;
        error?: string;
      }>;
      notifyMouseActive: (active: boolean) => void;
      sendCameraFrame: (base64: string) => void;
      onCameraCaptureRequest: (cb: () => void) => void;
    };
  }
}
