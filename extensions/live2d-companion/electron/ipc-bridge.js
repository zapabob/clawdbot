import fs from "node:fs/promises";
import path from "node:path";
/**
 * ipc-bridge.ts
 * Additional ipcMain handlers for STT and speak-text routing.
 * Imported by main.ts if needed for extended IPC handling.
 */
import { ipcMain } from "electron";
import { IPC_CHANNELS, FLAG_FILES } from "../bridge/event-types.js";
export function registerIpcHandlers(stateDir) {
    // Write STT result to flag file (also handled in flag-watcher, but here for completeness)
    ipcMain.on(IPC_CHANNELS.STT_RESULT, (_event, transcript) => {
        const flagPath = path.join(stateDir, FLAG_FILES.STT_RESULT);
        const data = { type: "stt_result", transcript, timestamp: Date.now() };
        fs.writeFile(flagPath, JSON.stringify(data), "utf-8").catch(() => { });
    });
}
