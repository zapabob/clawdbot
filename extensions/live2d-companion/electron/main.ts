import fs from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, screen, ipcMain, desktopCapturer, dialog } from "electron";
import { IPC_CHANNELS, FLAG_FILES } from "../bridge/event-types.js";
import type { CompanionStateUpdate, TtsProvider, AvatarCommand } from "../bridge/event-types.js";
import { startFlagWatcher } from "../bridge/flag-watcher.js";
const companionConfig = createRequire(import.meta.url)(
  "../companion.config.json",
) as typeof import("../companion.config.json");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const stateDir = process.env.OPENCLAW_STATE_DIR
  ? path.resolve(process.env.OPENCLAW_STATE_DIR)
  : path.resolve(path.join(__dirname, "../../..", companionConfig.stateDir));

let mainWindow: BrowserWindow | null = null;
let ignoreMouseTimer: ReturnType<typeof setInterval> | null = null;

// ── Companion runtime state ───────────────────────────────────────────────────
const companionState: CompanionStateUpdate = {
  visible: true,
  agentId: companionConfig.agentId ?? "main",
  ttsProvider: (companionConfig.ttsProvider as TtsProvider) ?? "voicevox",
  speaking: false,
  timestamp: Date.now(),
};

async function writeState(): Promise<void> {
  const statePath = path.join(stateDir, FLAG_FILES.STATE);
  try {
    await fs.mkdir(stateDir, { recursive: true });
    await fs.writeFile(statePath, JSON.stringify(companionState), "utf-8");
  } catch {
    // Best-effort
  }
}

// ── DPI-robust click-through timer ───────────────────────────────────────────
// Electron 28 on Windows: getCursorScreenPoint() may return logical (DIP) OR
// physical pixels depending on per-monitor DPI awareness mode.
// getBounds() always returns logical pixels.
// Strategy: check BOTH coordinate spaces (OR) so one is always correct.
// POLL_BUFFER_PX: pre-activate setIgnoreMouseEvents(false) this many pixels
// OUTSIDE the window so OLE DragEnter is received before the cursor crosses
// the window boundary (WS_EX_TRANSPARENT / WindowFromPoint incompatibility).
const POLL_BUFFER_PX = 60;
function startIgnoreMouseTimer(): ReturnType<typeof setInterval> {
  return setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const pos = screen.getCursorScreenPoint();
    const b = mainWindow.getBounds();
    const sf = screen.getDisplayNearestPoint({
      x: b.x + b.width / 2,
      y: b.y + b.height / 2,
    }).scaleFactor;
    const inL =
      pos.x >= b.x - POLL_BUFFER_PX &&
      pos.x <= b.x + b.width + POLL_BUFFER_PX &&
      pos.y >= b.y - POLL_BUFFER_PX &&
      pos.y <= b.y + b.height + POLL_BUFFER_PX;
    const inP =
      pos.x >= b.x * sf - POLL_BUFFER_PX &&
      pos.x <= (b.x + b.width) * sf + POLL_BUFFER_PX &&
      pos.y >= b.y * sf - POLL_BUFFER_PX &&
      pos.y <= (b.y + b.height) * sf + POLL_BUFFER_PX;
    mainWindow.setIgnoreMouseEvents(!(inL || inP), { forward: true });
  }, 8);
}

// ── Window creation ──────────────────────────────────────────────────────────
function createWindow(): void {
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

  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  ignoreMouseTimer = startIgnoreMouseTimer();

  const rendererPath = path.join(__dirname, "../renderer/index.html");
  void mainWindow.loadFile(rendererPath);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    void writeState();
  });

  mainWindow.on("closed", () => {
    if (ignoreMouseTimer) clearInterval(ignoreMouseTimer);
    mainWindow = null;
  });

  // Start flag watcher — forwards .openclaw-desktop JSON events to renderer
  startFlagWatcher(stateDir, () => mainWindow?.webContents ?? null);
}

// ── Control command handler ──────────────────────────────────────────────────
function handleControlCommand(cmd: Record<string, unknown>): void {
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
    mainWindow?.webContents.send(IPC_CHANNELS.AVATAR_COMMAND, cmd.avatarCommand as AvatarCommand);
  }
  companionState.timestamp = Date.now();
  void writeState();
}

// ── HTTP control server (port 18791) ─────────────────────────────────────────
function startControlServer(): void {
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
      const doCapture = url.includes("capture=1");
      const respond = (data: unknown) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      };
      if (doCapture) {
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
              path.join(stateDir, FLAG_FILES.SCREENSHOT_META),
              JSON.stringify(meta, null, 2),
              "utf-8",
            );
            respond({ ok: true, base64: pngBuffer.toString("base64"), ...meta });
          })
          .catch((err) => respond({ ok: false, error: String(err) }));
      } else {
        const metaPath = path.join(stateDir, FLAG_FILES.SCREENSHOT_META);
        const imgPath = path.join(stateDir, "companion_screenshot.png");
        void (async () => {
          try {
            const meta = JSON.parse(await fs.readFile(metaPath, "utf-8")) as Record<
              string,
              unknown
            >;
            const pngBuffer = await fs.readFile(imgPath);
            respond({ ok: true, base64: pngBuffer.toString("base64"), ...meta });
          } catch {
            respond({ ok: false, error: "no screenshot yet — call GET /screenshot?capture=1" });
          }
        })();
      }
      return;
    }

    if (req.method === "GET" && url.startsWith("/camera")) {
      // AI agent calls GET /camera to read the latest webcam frame
      // Optional ?capture=1 triggers a fresh capture from the renderer
      const doCapture = url.includes("capture=1");
      const respondCam = (data: unknown) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      };
      if (doCapture) {
        // Ask renderer to capture and send a new camera frame via IPC
        mainWindow?.webContents.send(IPC_CHANNELS.CAMERA_CAPTURE_REQUEST);
        // Wait 400ms for renderer to respond via CAMERA_FRAME IPC
        setTimeout(() => {
          void (async () => {
            try {
              const imgPath = path.join(stateDir, FLAG_FILES.CAMERA);
              const metaPath = path.join(stateDir, FLAG_FILES.CAMERA_META);
              const meta = JSON.parse(await fs.readFile(metaPath, "utf-8")) as Record<
                string,
                unknown
              >;
              const buf = await fs.readFile(imgPath);
              respondCam({ ok: true, base64: buf.toString("base64"), ...meta });
            } catch {
              respondCam({ ok: false, error: "no camera frame yet" });
            }
          })();
        }, 400);
      } else {
        void (async () => {
          try {
            const imgPath = path.join(stateDir, FLAG_FILES.CAMERA);
            const metaPath = path.join(stateDir, FLAG_FILES.CAMERA_META);
            const meta = JSON.parse(await fs.readFile(metaPath, "utf-8")) as Record<
              string,
              unknown
            >;
            const buf = await fs.readFile(imgPath);
            respondCam({ ok: true, base64: buf.toString("base64"), ...meta });
          } catch {
            respondCam({
              ok: false,
              error: "no camera frame yet — call GET /camera?capture=1",
            });
          }
        })();
      }
      return;
    }

    if (req.method === "POST" && url === "/control") {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const cmd = JSON.parse(body) as Record<string, unknown>;
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

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[Companion] Port ${port} in use — control server skipped`);
    } else {
      console.error("[Companion] Control server error:", err.message);
    }
  });
}

// ── IPC: screen capture (AI desktop companion) ────────────────────────────────
ipcMain.handle("capture-screen", async (_event, opts: { width?: number; height?: number } = {}) => {
  try {
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
      path.join(stateDir, FLAG_FILES.SCREENSHOT_META),
      JSON.stringify(meta, null, 2),
      "utf-8",
    );
    return { ok: true, path: screenshotPath, base64: pngBuffer.toString("base64"), ...meta };
  } catch (err) {
    console.error("[Companion] capture-screen error:", err);
    return { ok: false, error: String(err) };
  }
});

// ── IPC: native file dialog (open Windows Explorer) ──────────────────────────
ipcMain.handle(
  "open-file-dialog",
  async (
    _event,
    opts: { filters?: Electron.FileFilter[]; title?: string } = {},
  ): Promise<{
    ok: boolean;
    filePath?: string;
    buffer?: ArrayBuffer;
    canceled?: boolean;
    error?: string;
  }> => {
    if (!mainWindow) return { ok: false, error: "no window" };
    // Temporarily lower always-on-top so the dialog is not hidden behind the companion window
    mainWindow.setAlwaysOnTop(false);
    // Stop the polling timer while dialog is open (prevents focus flickering)
    if (ignoreMouseTimer) {
      clearInterval(ignoreMouseTimer);
      ignoreMouseTimer = null;
    }
    mainWindow.setIgnoreMouseEvents(false);
    let result: Electron.OpenDialogReturnValue;
    try {
      // Pass mainWindow as parent so dialog is properly associated
      result = await dialog.showOpenDialog(mainWindow, {
        title: opts.title ?? "モデルを選択",
        filters: opts.filters ?? [{ name: "All Files", extensions: ["*"] }],
        properties: ["openFile"],
      });
    } finally {
      mainWindow?.setAlwaysOnTop(true, "screen-saver");
      // Restart polling timer after dialog closes
      if (mainWindow && !ignoreMouseTimer) ignoreMouseTimer = startIgnoreMouseTimer();
    }
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    const filePath = result.filePaths[0];
    try {
      const nodeBuffer = await fs.readFile(filePath);
      // Convert Node.js Buffer → ArrayBuffer so the renderer receives a true
      // ArrayBuffer (not Uint8Array) — GLTFLoader/FBXLoader require ArrayBuffer.
      const arrayBuffer = nodeBuffer.buffer.slice(
        nodeBuffer.byteOffset,
        nodeBuffer.byteOffset + nodeBuffer.byteLength,
      ) as ArrayBuffer;
      return { ok: true, filePath, buffer: arrayBuffer };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  },
);

// ── IPC: model discovery ──────────────────────────────────────────────────────
async function scanModels(dir: string): Promise<string[]> {
  const results: string[] = [];
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

// ── IPC: camera frame (webcam → stateDir/companion_camera.jpg) ───────────────
ipcMain.on(IPC_CHANNELS.CAMERA_FRAME, (_event, base64: string) => {
  void (async () => {
    try {
      const buf = Buffer.from(base64, "base64");
      await fs.mkdir(stateDir, { recursive: true });
      const imgPath = path.join(stateDir, FLAG_FILES.CAMERA);
      await fs.writeFile(imgPath, buf);
      const meta = { path: imgPath, timestamp: Date.now() };
      await fs.writeFile(
        path.join(stateDir, FLAG_FILES.CAMERA_META),
        JSON.stringify(meta, null, 2),
        "utf-8",
      );
    } catch {
      // best-effort
    }
  })();
});

// ── IPC: renderer mouse-active (immediate click-through / D&D toggle) ─────────
ipcMain.on("mouse-active", (_event, active: boolean) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setIgnoreMouseEvents(!active, { forward: true });
});

// ── IPC: renderer → state update ─────────────────────────────────────────────
ipcMain.on(IPC_CHANNELS.STATE_UPDATE, (_event, update: Partial<CompanionStateUpdate>) => {
  Object.assign(companionState, update, { timestamp: Date.now() });
  void writeState();
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
