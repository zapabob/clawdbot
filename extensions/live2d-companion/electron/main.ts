import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, screen, ipcMain } from "electron";
import { IPC_CHANNELS, FLAG_FILES } from "../bridge/event-types.js";
import type { CompanionStateUpdate, TtsProvider, AvatarCommand } from "../bridge/event-types.js";
import { startFlagWatcher } from "../bridge/flag-watcher.js";
import companionConfig from "../companion.config.json" with { type: "json" };

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
    },
    show: false,
  });

  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const rendererPath = path.join(__dirname, "../renderer/index.html");
  void mainWindow.loadFile(rendererPath);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    void writeState();
  });

  // Transparent click-through outside the model area
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
