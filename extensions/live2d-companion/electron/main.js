import fs from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, screen, ipcMain, desktopCapturer, dialog } from "electron";
import { IPC_CHANNELS, FLAG_FILES } from "../bridge/event-types.js";
import { startFlagWatcher } from "../bridge/flag-watcher.js";
const companionConfig = createRequire(import.meta.url)("../companion.config.json");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stateDir = process.env.OPENCLAW_STATE_DIR
  ? path.resolve(process.env.OPENCLAW_STATE_DIR)
  : path.resolve(path.join(__dirname, "../../..", companionConfig.stateDir));
let mainWindow = null;
// ── Companion runtime state ───────────────────────────────────────────────────
const companionState = {
  visible: true,
  agentId: companionConfig.agentId ?? "main",
  ttsProvider: companionConfig.ttsProvider ?? "voicevox",
  speaking: false,
  timestamp: Date.now(),
};
async function writeState() {
  const statePath = path.join(stateDir, FLAG_FILES.STATE);
  try {
    await fs.mkdir(stateDir, { recursive: true });
    await fs.writeFile(statePath, JSON.stringify(companionState), "utf-8");
  } catch {
    // Best-effort
  }
}
// ── Window creation ──────────────────────────────────────────────────────────
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
      sandbox: false,
    },
    show: false,
  });
  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // Start in click-through mode; renderer toggles via IPC when cursor enters UI
  // (avoids HiDPI DPI mismatch in the old polling-timer approach)
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  const rendererPath = path.join(__dirname, "../renderer/index.html");
  void mainWindow.loadFile(rendererPath);
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    void writeState();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  // Start flag watcher — forwards .openclaw-desktop JSON events to renderer
  startFlagWatcher(stateDir, () => mainWindow?.webContents ?? null);
}
// ── Control command handler ──────────────────────────────────────────────────
function handleControlCommand(cmd) {
  if (typeof cmd.visible === "boolean") {
    companionState.visible = cmd.visible;
    if (cmd.visible) {
      mainWindow?.show();
    } else {
      mainWindow?.hide();
    }
  }
  if (typeof cmd.agentId === "string" && cmd.agentId) {
    companionState.agentId = cmd.agentId;
    mainWindow?.webContents.send(IPC_CHANNELS.CONTROL, { agentId: cmd.agentId });
  }
  if (cmd.ttsProvider === "voicevox" || cmd.ttsProvider === "web-speech") {
    companionState.ttsProvider = cmd.ttsProvider;
    mainWindow?.webContents.send(IPC_CHANNELS.CONTROL, { ttsProvider: cmd.ttsProvider });
  }
  if (typeof cmd.speakText === "string" && cmd.speakText) {
    mainWindow?.webContents.send(IPC_CHANNELS.SPEAK_TEXT, cmd.speakText);
  }
  if (cmd.avatarCommand) {
    // Forward avatar command to renderer via dedicated IPC channel
    mainWindow?.webContents.send(IPC_CHANNELS.AVATAR_COMMAND, cmd.avatarCommand);
  }
  companionState.timestamp = Date.now();
  void writeState();
}
// ── HTTP control server (port 18791) ─────────────────────────────────────────
function startControlServer() {
  const port = companionConfig.controlPort ?? 18791;
  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    const url = req.url ?? "/";
    if (req.method === "GET" && url === "/state") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(companionState));
      return;
    }
    if (req.method === "GET" && url.startsWith("/screenshot")) {
      // AI agent can call GET /screenshot to get the latest captured image
      // Optional ?capture=1 query param triggers a fresh capture
      const doCapture = url.includes("capture=1");
      const respond = (data) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      };
      if (doCapture) {
        ipcMain.emit("__internal-capture__");
        // Capture fresh screenshot
        desktopCapturer
          .getSources({ types: ["screen"], thumbnailSize: { width: 1280, height: 720 } })
          .then(async (sources) => {
            if (!sources.length) {
              respond({ ok: false, error: "no sources" });
              return;
            }
            const pngBuffer = sources[0].thumbnail.toPNG();
            await fs.mkdir(stateDir, { recursive: true });
            const p = path.join(stateDir, "companion_screenshot.png");
            await fs.writeFile(p, pngBuffer);
            const size = sources[0].thumbnail.getSize();
            const meta = { path: p, width: size.width, height: size.height, timestamp: Date.now() };
            await fs.writeFile(
              path.join(stateDir, "companion_screenshot_meta.json"),
              JSON.stringify(meta, null, 2),
              "utf-8",
            );
            respond({ ok: true, base64: pngBuffer.toString("base64"), ...meta });
          })
          .catch((err) => respond({ ok: false, error: String(err) }));
      } else {
        // Return the last saved screenshot if available
        const metaPath = path.join(stateDir, "companion_screenshot_meta.json");
        const imgPath = path.join(stateDir, "companion_screenshot.png");
        (async () => {
          try {
            const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
            const pngBuffer = await fs.readFile(imgPath);
            respond({ ok: true, base64: pngBuffer.toString("base64"), ...meta });
          } catch {
            respond({ ok: false, error: "no screenshot yet — call GET /screenshot?capture=1" });
          }
        })();
      }
      return;
    }
    if (req.method === "POST" && url === "/control") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const cmd = JSON.parse(body);
          handleControlCommand(cmd);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, state: companionState }));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "invalid JSON" }));
        }
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`[Companion] Control server on 127.0.0.1:${port}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[Companion] Port ${port} in use — control server skipped`);
    } else {
      console.error("[Companion] Control server error:", err.message);
    }
  });
}
// ── IPC: screen capture (AI desktop companion) ────────────────────────────────
ipcMain.handle("capture-screen", async (_event, opts = {}) => {
  try {
    // Capture primary screen at 1920x1080 (downscaled to reduce payload size)
    const captureWidth = opts.width ?? 1280;
    const captureHeight = opts.height ?? 720;
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: captureWidth, height: captureHeight },
    });
    if (sources.length === 0) return { ok: false, error: "no screen sources found" };
    const primary = sources[0];
    const img = primary.thumbnail;
    const pngBuffer = img.toPNG();
    // Save PNG to stateDir so AI agent can read it via flag files
    await fs.mkdir(stateDir, { recursive: true });
    const screenshotPath = path.join(stateDir, "companion_screenshot.png");
    await fs.writeFile(screenshotPath, pngBuffer);
    const size = img.getSize();
    const meta = {
      path: screenshotPath,
      width: size.width,
      height: size.height,
      source: primary.name,
      timestamp: Date.now(),
    };
    await fs.writeFile(
      path.join(stateDir, "companion_screenshot_meta.json"),
      JSON.stringify(meta, null, 2),
      "utf-8",
    );
    // Return base64 for direct use by the renderer or HTTP callers
    const base64 = pngBuffer.toString("base64");
    return { ok: true, path: screenshotPath, base64, ...meta };
  } catch (err) {
    console.error("[Companion] capture-screen error:", err);
    return { ok: false, error: String(err) };
  }
});
// ── IPC: native file dialog (open Windows Explorer) ──────────────────────────
ipcMain.handle("open-file-dialog", async (_event, opts = {}) => {
  if (!mainWindow) return { ok: false, error: "no window" };
  // Temporarily lower always-on-top so the dialog is not hidden behind the companion window
  mainWindow.setAlwaysOnTop(false);
  let result;
  try {
    result = await dialog.showOpenDialog({
      title: opts.title ?? "モデルを選択",
      filters: opts.filters ?? [{ name: "All Files", extensions: ["*"] }],
      properties: ["openFile"],
    });
  } finally {
    mainWindow?.setAlwaysOnTop(true, "screen-saver");
  }
  if (result.canceled || result.filePaths.length === 0) {
    return { ok: false, canceled: true };
  }
  const filePath = result.filePaths[0];
  try {
    const buffer = await fs.readFile(filePath);
    return { ok: true, filePath, buffer };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

// ── IPC: model discovery ──────────────────────────────────────────────────────
async function scanModels(dir) {
  const results = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await scanModels(fullPath)));
      } else if (
        entry.name.endsWith(".model3.json") ||
        entry.name.endsWith(".vrm") ||
        entry.name.endsWith(".fbx")
      ) {
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
// ── IPC: renderer → state update ─────────────────────────────────────────────
ipcMain.on(IPC_CHANNELS.STATE_UPDATE, (_event, update) => {
  Object.assign(companionState, update, { timestamp: Date.now() });
  void writeState();
});
// ── IPC: click-through toggle (renderer-driven, avoids HiDPI DPI mismatch) ───
ipcMain.on("set-ignore-mouse-events", (_e, ignore) => {
  mainWindow?.setIgnoreMouseEvents(ignore, { forward: true });
});
// ── Bootstrap ────────────────────────────────────────────────────────────────
if (process.platform === "win32") {
  app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
}
app.whenReady().then(() => {
  createWindow();
  startControlServer();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
