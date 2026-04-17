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
    getStateSnapshot: () => ipcRenderer.invoke("companion:get-state"),
    listAssets: () => ipcRenderer.invoke("companion:list-assets"),
    onRuntimeState: (callback) => {
        ipcRenderer.on(IPC_CHANNELS.RUNTIME_STATE, (_ipcEvent, state) => {
            callback(state);
        });
    },
    setPermission: (capability, decision) => ipcRenderer.invoke("companion:set-permission", capability, decision),
    setMicEnabled: (enabled) => ipcRenderer.invoke("companion:set-mic-enabled", enabled),
    importAsset: (payload) => ipcRenderer.invoke("companion:import-asset", payload),
    activateAsset: (assetId) => ipcRenderer.invoke("companion:activate-asset", assetId),
    startStt: () => ipcRenderer.invoke("companion:set-mic-enabled", true),
    stopStt: () => ipcRenderer.invoke("companion:set-mic-enabled", false),
    discoverModel: () => ipcRenderer.invoke("discover-model"),
    onSpeakText: (callback) => {
        ipcRenderer.on(IPC_CHANNELS.SPEAK_TEXT, (_ipcEvent, text) => {
            callback(text);
        });
    },
    onControlEvent: (callback) => {
        ipcRenderer.on(IPC_CHANNELS.CONTROL, (_ipcEvent, cmd) => {
            callback(cmd);
        });
    },
    sendStateUpdate: (update) => {
        ipcRenderer.send(IPC_CHANNELS.STATE_UPDATE, update);
    },
    onAvatarCommand: (callback) => {
        ipcRenderer.on(IPC_CHANNELS.AVATAR_COMMAND, (_ipcEvent, cmd) => {
            callback(cmd);
        });
    },
    captureScreen: () => ipcRenderer.invoke("capture-screen"),
    openFileDialog: (opts) => ipcRenderer.invoke("open-file-dialog", opts ?? {}),
    notifyMouseActive: (active) => ipcRenderer.send("mouse-active", active),
    sendCameraFrame: (base64) => {
        ipcRenderer.send(IPC_CHANNELS.CAMERA_FRAME, base64);
    },
    onCameraCaptureRequest: (callback) => {
        ipcRenderer.on(IPC_CHANNELS.CAMERA_CAPTURE_REQUEST, () => callback());
    },
});
