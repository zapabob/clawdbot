import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { ipcMain } from "electron";
import { FLAG_FILES, IPC_CHANNELS } from "./event-types.js";
/**
 * Watches .openclaw-desktop flag files and forwards events to the renderer
 * via ipcMain. Uses fs.watch() with 300ms debounce to avoid double-fire.
 */
export function startFlagWatcher(stateDir, webContentsRef) {
    const lineEventPath = path.join(stateDir, FLAG_FILES.LINE_EVENT);
    const emotionPath = path.join(stateDir, FLAG_FILES.EMOTION);
    // Ensure state dir exists
    fs.mkdirSync(stateDir, { recursive: true });
    let lineDebounce = null;
    let emotionDebounce = null;
    async function readAndSend(filePath, ipcChannel) {
        try {
            const raw = await fsPromises.readFile(filePath, "utf-8");
            const data = JSON.parse(raw);
            const wc = webContentsRef();
            if (wc && !wc.isDestroyed()) {
                wc.send(ipcChannel, data);
            }
        }
        catch {
            // File may not exist yet or be invalid JSON – ignore
        }
    }
    function watchFile(filePath, ipcChannel, debounceRef) {
        try {
            fs.watch(filePath, { persistent: false }, (_event) => {
                if (debounceRef.current)
                    clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => {
                    void readAndSend(filePath, ipcChannel);
                }, 300);
            });
        }
        catch {
            // File doesn't exist yet; poll with interval until it appears
            const interval = setInterval(() => {
                if (fs.existsSync(filePath)) {
                    clearInterval(interval);
                    watchFile(filePath, ipcChannel, debounceRef);
                    void readAndSend(filePath, ipcChannel);
                }
            }, 2000);
        }
    }
    const lineDebounceRef = { current: lineDebounce };
    const emotionDebounceRef = { current: emotionDebounce };
    watchFile(lineEventPath, IPC_CHANNELS.LINE_EVENT, lineDebounceRef);
    watchFile(emotionPath, IPC_CHANNELS.EMOTION_EVENT, emotionDebounceRef);
    // Handle STT result write from renderer → flag file
    ipcMain.on(IPC_CHANNELS.STT_RESULT, (_event, transcript) => {
        const sttPath = path.join(stateDir, FLAG_FILES.STT_RESULT);
        const data = { type: "stt_result", transcript, timestamp: Date.now() };
        fsPromises.writeFile(sttPath, JSON.stringify(data), "utf-8").catch(() => { });
    });
}
