import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, screen, ipcMain } from "electron";
import { startFlagWatcher } from "../bridge/flag-watcher.js";
import companionConfig from "../companion.config.json" assert { type: "json" };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stateDir = process.env.OPENCLAW_STATE_DIR
  ? path.resolve(process.env.OPENCLAW_STATE_DIR)
  : path.resolve(path.join(__dirname, "../../..", companionConfig.stateDir));
let mainWindow = null;
let ignoreMouseTimer = null;
function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const { width, height, offsetRight, offsetBottom } = companionConfig.window;
  mainWindow = new BrowserWindow({
    x: screenWidth - offsetRight,
    y: screenHeight - offsetBottom,
    width,
    height,
    transparent: true,
    frame: false,
    backgroundColor: "#00000000",
    alwaysOnTop: true,
    skipTaskbar: true,
    type: "toolbar",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });
  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  const rendererPath = path.join(__dirname, "../renderer/index.html");
  void mainWindow.loadFile(rendererPath);
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  // Transparent click-through outside the model area
  // Poll mouse position every 50ms; ignore events when outside model bounds
  ignoreMouseTimer = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const pos = screen.getCursorScreenPoint();
    const bounds = mainWindow.getBounds();
    const inBounds =
      pos.x >= bounds.x &&
      pos.x <= bounds.x + bounds.width &&
      pos.y >= bounds.y &&
      pos.y <= bounds.y + bounds.height;
    mainWindow.setIgnoreMouseEvents(!inBounds, { forward: true });
  }, 50);
  mainWindow.on("closed", () => {
    if (ignoreMouseTimer) clearInterval(ignoreMouseTimer);
    mainWindow = null;
  });
  // Start flag watcher — forwards .openclaw-desktop JSON events to renderer
  startFlagWatcher(stateDir, () => mainWindow?.webContents ?? null);
}
// Recursively scan a directory for .model3.json files
async function scanModels(dir) {
  const results = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await scanModels(fullPath)));
      } else if (entry.name.endsWith(".model3.json")) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory may not exist yet — return empty
  }
  return results;
}
ipcMain.handle("discover-model", async () => {
  const modelsDir = path.join(__dirname, "../../models");
  const found = await scanModels(modelsDir);
  return found[0] ?? null;
});
if (process.platform === "win32") {
  app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
