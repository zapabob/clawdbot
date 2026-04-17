import fs from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  app,
  BrowserWindow,
  desktopCapturer,
  dialog,
  ipcMain,
  screen,
} from "electron";
import { IPC_CHANNELS } from "../bridge/event-types.js";
import type {
  AvatarCommand,
  CompanionStateUpdate,
  TtsProvider,
} from "../bridge/event-types.js";
import {
  activateCompanionAsset,
  importCompanionAsset,
  readCompanionAssets,
  type CompanionAssetManifestEntry,
} from "../companion-asset-manifest.js";
import { resolveLive2dCompanionConfig } from "../companion-config.js";
import {
  startCompanionIpcServer,
  type CompanionIpcServerHandle,
} from "../companion-ipc.js";
import type {
  CompanionBinaryCapture,
  CompanionIpcAction,
  CompanionRuntimeState,
} from "../companion-ipc-protocol.js";
import {
  createCompanionPermissionState,
  isCompanionPermissionGranted,
  setCompanionPermission,
  type CompanionPermissionCapability,
  type CompanionPermissionDecision,
  type CompanionPermissionState,
} from "../companion-permissions.js";

const require = createRequire(import.meta.url);
const rawCompanionConfig = require("../companion.config.json") as Record<string, unknown>;
const companionPolicy = resolveLive2dCompanionConfig(rawCompanionConfig);

type LocalWhisperMicSessionState = "idle" | "listening" | "processing" | "error";

type LocalWhisperMicSessionHandlers = {
  onTranscript: (text: string) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: LocalWhisperMicSessionState) => void;
};

type LocalWhisperMicSession = {
  start: () => Promise<boolean>;
  stop: () => void;
  getState: () => LocalWhisperMicSessionState;
  isRunning: () => boolean;
};

type LocalVoiceCompanionDefaults = {
  sttBackend: "local-voice-whisper";
  ttsBackend: "voicevox";
};

type LocalVoiceFacade = {
  resolveLocalVoiceCompanionDefaults: () => LocalVoiceCompanionDefaults;
  createLocalWhisperMicSession: (params: {
    sttConfig?: Record<string, unknown>;
    handlers: LocalWhisperMicSessionHandlers;
  }) => LocalWhisperMicSession;
};

function loadLocalVoiceFacade(): LocalVoiceFacade | null {
  try {
    return require("openclaw/plugin-sdk/local-voice") as LocalVoiceFacade;
  } catch {
    return null;
  }
}

const localVoiceFacade = loadLocalVoiceFacade();
const localVoiceDefaults =
  localVoiceFacade?.resolveLocalVoiceCompanionDefaults() ?? {
    sttBackend: "local-voice-whisper",
    ttsBackend: "voicevox",
  };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stateDir = process.env.OPENCLAW_STATE_DIR
  ? path.resolve(process.env.OPENCLAW_STATE_DIR)
  : path.resolve(
      path.join(__dirname, "../../..", String(rawCompanionConfig.stateDir ?? ".openclaw-desktop")),
    );

const STATE_CACHE_FILE = "companion_state.json";
const LEGACY_CAMERA_FILE = "companion_camera.jpg";
const LEGACY_CAMERA_META_FILE = "companion_camera_meta.json";
const LEGACY_SCREEN_FILE = "companion_screenshot.png";
const LEGACY_SCREEN_META_FILE = "companion_screenshot_meta.json";
const CAMERA_CAPTURE_TIMEOUT_MS = 800;

type RuntimeStateCache = {
  visible: boolean;
  agentId: string;
  ttsProvider: TtsProvider;
  permissions: CompanionPermissionState;
  voice: {
    sttBackend: "local-voice-whisper";
    ttsBackend: "voicevox";
    sttAvailable: boolean;
    micActive: boolean;
    speaking: boolean;
  };
  activeAssetId: string | null;
  timestamp: number;
};

let mainWindow: BrowserWindow | null = null;
let ignoreMouseTimer: ReturnType<typeof setInterval> | null = null;
let legacyHttpServer: http.Server | null = null;
let companionIpcServer: CompanionIpcServerHandle | null = null;
let micSession: LocalWhisperMicSession | null = null;
let activeAsset: CompanionAssetManifestEntry | null = null;
let latestCameraCapture: CompanionBinaryCapture | null = null;
let latestScreenCapture: CompanionBinaryCapture | null = null;
let cameraCaptureWaiters: Array<(capture: CompanionBinaryCapture | null) => void> = [];

const runtimeState: CompanionRuntimeState = {
  visible: true,
  agentId: String(rawCompanionConfig.agentId ?? "main"),
  ttsProvider: String(rawCompanionConfig.ttsProvider ?? "voicevox") as TtsProvider,
  permissions: createCompanionPermissionState(companionPolicy.capturePolicy),
  browser: {
    attached: false,
    tabId: null,
    url: null,
    title: null,
    origin: null,
    textSnapshot: null,
    screenshotBase64: null,
    updatedAt: null,
  },
  voice: {
    sttBackend: localVoiceDefaults.sttBackend,
    ttsBackend: localVoiceDefaults.ttsBackend,
    sttAvailable: true,
    micActive: false,
    speaking: false,
    lastTranscript: null,
    lastTranscriptAt: null,
  },
  activeAssetId: null,
  activeAsset: null,
  timestamp: Date.now(),
};

function buildStateCache(): RuntimeStateCache {
  return {
    visible: runtimeState.visible,
    agentId: runtimeState.agentId,
    ttsProvider: runtimeState.ttsProvider,
    permissions: runtimeState.permissions,
    voice: {
      sttBackend: runtimeState.voice.sttBackend,
      ttsBackend: runtimeState.voice.ttsBackend,
      sttAvailable: runtimeState.voice.sttAvailable,
      micActive: runtimeState.voice.micActive,
      speaking: runtimeState.voice.speaking,
    },
    activeAssetId: runtimeState.activeAssetId,
    timestamp: runtimeState.timestamp,
  };
}

async function writeStateCache(): Promise<void> {
  try {
    await fs.mkdir(stateDir, { recursive: true });
    await fs.writeFile(
      path.join(stateDir, STATE_CACHE_FILE),
      JSON.stringify(buildStateCache(), null, 2),
      "utf-8",
    );
  } catch {
    // Best-effort cache only.
  }
}

async function writeLegacyBinaryCapture(params: {
  capture: CompanionBinaryCapture;
  binaryPath: string;
  metaPath: string;
}): Promise<void> {
  if (!companionPolicy.security.allowLegacyHttpControl) {
    return;
  }
  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(
    path.join(stateDir, params.binaryPath),
    Buffer.from(params.capture.base64, "base64"),
  );
  await fs.writeFile(
    path.join(stateDir, params.metaPath),
    JSON.stringify(
      {
        mimeType: params.capture.mimeType,
        timestamp: params.capture.timestamp,
        width: params.capture.width ?? null,
        height: params.capture.height ?? null,
        source: params.capture.source ?? null,
      },
      null,
      2,
    ),
    "utf-8",
  );
}

function publishRuntimeState(): void {
  runtimeState.timestamp = Date.now();
  mainWindow?.webContents.send(IPC_CHANNELS.RUNTIME_STATE, runtimeState);
  void writeStateCache();
}

function startIgnoreMouseTimer(): ReturnType<typeof setInterval> {
  const pollBufferPx = 60;
  return setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }
    const pos = screen.getCursorScreenPoint();
    const bounds = mainWindow.getBounds();
    const scaleFactor = screen.getDisplayNearestPoint({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    }).scaleFactor;
    const inLogicalBounds =
      pos.x >= bounds.x - pollBufferPx &&
      pos.x <= bounds.x + bounds.width + pollBufferPx &&
      pos.y >= bounds.y - pollBufferPx &&
      pos.y <= bounds.y + bounds.height + pollBufferPx;
    const inPhysicalBounds =
      pos.x >= bounds.x * scaleFactor - pollBufferPx &&
      pos.x <= (bounds.x + bounds.width) * scaleFactor + pollBufferPx &&
      pos.y >= bounds.y * scaleFactor - pollBufferPx &&
      pos.y <= (bounds.y + bounds.height) * scaleFactor + pollBufferPx;
    mainWindow.setIgnoreMouseEvents(!(inLogicalBounds || inPhysicalBounds), { forward: true });
  }, 8);
}

function createWindow(): void {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const windowConfig =
    rawCompanionConfig.window && typeof rawCompanionConfig.window === "object"
      ? (rawCompanionConfig.window as Record<string, number>)
      : {};

  mainWindow = new BrowserWindow({
    x: screenWidth - Number(windowConfig.offsetRight ?? 400),
    y: screenHeight - Number(windowConfig.offsetBottom ?? 500),
    width: Number(windowConfig.width ?? 380),
    height: Number(windowConfig.height ?? 480),
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

  void mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    publishRuntimeState();
  });
  mainWindow.on("closed", () => {
    if (ignoreMouseTimer) {
      clearInterval(ignoreMouseTimer);
      ignoreMouseTimer = null;
    }
    mainWindow = null;
  });
}

function updateBrowserAttachment(next: Partial<CompanionRuntimeState["browser"]> & { attached: boolean }): void {
  runtimeState.browser = {
    ...runtimeState.browser,
    ...next,
    updatedAt: Date.now(),
  };
  publishRuntimeState();
}

function sendAvatarCommand(command: AvatarCommand): void {
  mainWindow?.webContents.send(IPC_CHANNELS.AVATAR_COMMAND, command);
}

async function requestRendererCameraCapture(): Promise<CompanionBinaryCapture | null> {
  if (!isCompanionPermissionGranted(runtimeState.permissions, "camera")) {
    return null;
  }
  if (!mainWindow) {
    return latestCameraCapture;
  }
  mainWindow.webContents.send(IPC_CHANNELS.CAMERA_CAPTURE_REQUEST);
  return await new Promise<CompanionBinaryCapture | null>((resolve) => {
    const waiter = (capture: CompanionBinaryCapture | null) => {
      clearTimeout(timer);
      resolve(capture);
    };
    const timer = setTimeout(() => {
      cameraCaptureWaiters = cameraCaptureWaiters.filter((pending) => pending !== waiter);
      resolve(latestCameraCapture);
    }, CAMERA_CAPTURE_TIMEOUT_MS);
    cameraCaptureWaiters.push(waiter);
  });
}

function resolveCameraWaiters(capture: CompanionBinaryCapture | null): void {
  const pending = cameraCaptureWaiters;
  cameraCaptureWaiters = [];
  for (const waiter of pending) {
    waiter(capture);
  }
}

async function captureScreenToMemory(): Promise<CompanionBinaryCapture | null> {
  if (!isCompanionPermissionGranted(runtimeState.permissions, "screen")) {
    return null;
  }
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: 1280, height: 720 },
  });
  const primary = sources[0];
  if (!primary) {
    return null;
  }
  const pngBuffer = primary.thumbnail.toPNG();
  const size = primary.thumbnail.getSize();
  latestScreenCapture = {
    base64: pngBuffer.toString("base64"),
    mimeType: "image/png",
    timestamp: Date.now(),
    width: size.width,
    height: size.height,
    source: primary.name,
  };
  await writeLegacyBinaryCapture({
    capture: latestScreenCapture,
    binaryPath: LEGACY_SCREEN_FILE,
    metaPath: LEGACY_SCREEN_META_FILE,
  });
  return latestScreenCapture;
}

function ensureMicSession(): LocalWhisperMicSession | null {
  if (micSession) {
    return micSession;
  }
  micSession =
    localVoiceFacade?.createLocalWhisperMicSession({
    handlers: {
      onTranscript: (text: string) => {
        runtimeState.voice.lastTranscript = text;
        runtimeState.voice.lastTranscriptAt = Date.now();
        publishRuntimeState();
      },
      onError: () => {
        runtimeState.voice.micActive = false;
        runtimeState.voice.sttAvailable = false;
        publishRuntimeState();
      },
      onStateChange: (state: LocalWhisperMicSessionState) => {
        runtimeState.voice.micActive = state === "listening" || state === "processing";
        publishRuntimeState();
      },
    },
    }) ?? null;
  if (!micSession) {
    runtimeState.voice.sttAvailable = false;
  }
  return micSession;
}

async function setMicEnabled(enabled: boolean): Promise<{ ok: boolean; reason?: string }> {
  if (!enabled) {
    micSession?.stop();
    runtimeState.voice.micActive = false;
    publishRuntimeState();
    return { ok: true };
  }
  if (!isCompanionPermissionGranted(runtimeState.permissions, "mic")) {
    return { ok: false, reason: "Microphone permission is denied" };
  }
  const session = ensureMicSession();
  if (!session) {
    return { ok: false, reason: "Local whisper STT is unavailable" };
  }
  const started = await session.start();
  runtimeState.voice.micActive = started;
  runtimeState.voice.sttAvailable = started || runtimeState.voice.sttAvailable;
  publishRuntimeState();
  return started ? { ok: true } : { ok: false, reason: "Unable to start microphone capture" };
}

function setPermissionDecision(
  capability: CompanionPermissionCapability,
  decision: CompanionPermissionDecision,
  source: "user" | "helper" = "user",
): CompanionRuntimeState {
  runtimeState.permissions = setCompanionPermission(
    runtimeState.permissions,
    capability,
    decision,
    source,
  );
  publishRuntimeState();
  return runtimeState;
}

function inferOrigin(url: string | null): string | null {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

async function handleCompanionAction(
  action: CompanionIpcAction,
  payload: unknown,
): Promise<unknown> {
  switch (action) {
    case "get-state":
      return runtimeState;
    case "list-assets":
      return await readCompanionAssets(stateDir);
    case "get-input-snapshot": {
      const request =
        payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
      const captureCamera = request.captureCamera === true || request.includeCamera === true;
      const camera = captureCamera ? await requestRendererCameraCapture() : null;
      return {
        transcript: runtimeState.voice.lastTranscript,
        transcriptTimestamp: runtimeState.voice.lastTranscriptAt,
        camera,
        tabContext: runtimeState.browser,
      };
    }
    case "set-permission": {
      const request = payload as {
        capability: CompanionPermissionCapability;
        decision: CompanionPermissionDecision;
      };
      return setPermissionDecision(request.capability, request.decision);
    }
    case "speak": {
      const request = payload as { text: string };
      if (typeof request.text === "string" && request.text.trim()) {
        mainWindow?.webContents.send(IPC_CHANNELS.SPEAK_TEXT, request.text.trim());
      }
      return runtimeState;
    }
    case "set-avatar-command": {
      const request = payload as { avatarCommand: AvatarCommand };
      if (request?.avatarCommand) {
        sendAvatarCommand(request.avatarCommand);
      }
      return runtimeState;
    }
    case "attach-tab": {
      const request = payload as {
        tabId: string;
        url: string;
        title: string;
        textSnapshot?: string;
        screenshotBase64?: string;
      };
      setPermissionDecision("tab-follow", "granted", "helper");
      updateBrowserAttachment({
        attached: true,
        tabId: request.tabId,
        url: request.url,
        title: request.title,
        origin: inferOrigin(request.url),
        textSnapshot: request.textSnapshot ?? null,
        screenshotBase64: request.screenshotBase64 ?? null,
      });
      return runtimeState;
    }
    case "detach-tab":
      updateBrowserAttachment({
        attached: false,
        tabId: null,
        url: null,
        title: null,
        origin: null,
        textSnapshot: null,
        screenshotBase64: null,
      });
      return runtimeState;
    case "update-tab-context": {
      const request = payload as {
        tabId: string;
        url?: string;
        title?: string;
        textSnapshot?: string;
        screenshotBase64?: string;
      };
      if (!runtimeState.browser.attached || runtimeState.browser.tabId !== request.tabId) {
        return runtimeState;
      }
      updateBrowserAttachment({
        attached: true,
        tabId: request.tabId,
        ...(request.url === undefined ? {} : { url: request.url, origin: inferOrigin(request.url) }),
        ...(request.title === undefined ? {} : { title: request.title }),
        ...(request.textSnapshot === undefined ? {} : { textSnapshot: request.textSnapshot }),
        ...(request.screenshotBase64 === undefined
          ? {}
          : { screenshotBase64: request.screenshotBase64 }),
      });
      return runtimeState;
    }
    case "request-tab-snapshot":
      return runtimeState;
    case "import-asset": {
      const request = payload as {
        filePath: string;
        rightsAcknowledged: boolean;
        licenseMemo: string;
        importMode?: "local-reference" | "local-copy";
      };
      return await importCompanionAsset({
        stateDir,
        filePath: request.filePath,
        rightsAcknowledged: request.rightsAcknowledged,
        licenseMemo: request.licenseMemo,
        importMode: request.importMode,
      });
    }
    case "activate-asset": {
      const request = payload as { assetId: string };
      activeAsset = await activateCompanionAsset({ stateDir, assetId: request.assetId });
      runtimeState.activeAssetId = activeAsset.id;
      runtimeState.activeAsset = activeAsset;
      publishRuntimeState();
      sendAvatarCommand({ loadModel: activeAsset.resolvedPath });
      return runtimeState;
    }
    case "request-camera-capture":
      return await requestRendererCameraCapture();
    case "request-screen-capture":
      return await captureScreenToMemory();
    default:
      throw new Error(`Unsupported companion action: ${String(action)}`);
  }
}

function handleLegacyControlCommand(command: Record<string, unknown>): void {
  if (typeof command.visible === "boolean") {
    runtimeState.visible = command.visible;
    if (command.visible) {
      mainWindow?.show();
    } else {
      mainWindow?.hide();
    }
  }
  if (typeof command.agentId === "string" && command.agentId.trim()) {
    runtimeState.agentId = command.agentId.trim();
  }
  if (command.ttsProvider === "voicevox" || command.ttsProvider === "web-speech") {
    runtimeState.ttsProvider = command.ttsProvider;
  }
  if (typeof command.speakText === "string" && command.speakText.trim()) {
    mainWindow?.webContents.send(IPC_CHANNELS.SPEAK_TEXT, command.speakText.trim());
  }
  if (command.avatarCommand && typeof command.avatarCommand === "object") {
    sendAvatarCommand(command.avatarCommand as AvatarCommand);
  }
  publishRuntimeState();
}

function startLegacyHttpControlServer(): void {
  if (!companionPolicy.security.allowLegacyHttpControl) {
    return;
  }

  legacyHttpServer = http.createServer((req, res) => {
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
      res.end(JSON.stringify(buildStateCache()));
      return;
    }
    if (req.method === "GET" && url.startsWith("/camera")) {
      void requestRendererCameraCapture()
        .then((capture) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify(
              capture ? { ok: true, ...capture } : { ok: false, error: "camera unavailable" },
            ),
          );
        })
        .catch((error) => {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            }),
          );
        });
      return;
    }
    if (req.method === "GET" && url.startsWith("/screenshot")) {
      void captureScreenToMemory()
        .then((capture) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify(
              capture
                ? { ok: true, ...capture }
                : { ok: false, error: "screen capture unavailable" },
            ),
          );
        })
        .catch((error) => {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            }),
          );
        });
      return;
    }
    if (req.method === "POST" && url === "/control") {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          handleLegacyControlCommand(JSON.parse(body) as Record<string, unknown>);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, state: buildStateCache() }));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "invalid JSON" }));
        }
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const port = Number(rawCompanionConfig.controlPort ?? 18791);
  legacyHttpServer.listen(port, "127.0.0.1", () => {
    console.log(`[Companion] Legacy localhost control enabled on 127.0.0.1:${port}`);
  });
}

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
        entry.name.endsWith(".model.json") ||
        entry.name.endsWith(".vrm") ||
        entry.name.endsWith(".fbx")
      ) {
        results.push(fullPath);
      }
    }
  } catch {
    // Ignore missing model directories.
  }
  return results;
}

ipcMain.handle("companion:get-state", async () => runtimeState);
ipcMain.handle("companion:list-assets", async () => await readCompanionAssets(stateDir));
ipcMain.handle(
  "companion:set-permission",
  async (_event, capability: CompanionPermissionCapability, decision: CompanionPermissionDecision) =>
    setPermissionDecision(capability, decision),
);
ipcMain.handle("companion:set-mic-enabled", async (_event, enabled: boolean) => setMicEnabled(enabled));
ipcMain.handle(
  "companion:import-asset",
  async (
    _event,
    payload: {
      filePath: string;
      rightsAcknowledged: boolean;
      licenseMemo: string;
      importMode?: "local-reference" | "local-copy";
    },
  ) =>
    await importCompanionAsset({
      stateDir,
      filePath: payload.filePath,
      rightsAcknowledged: payload.rightsAcknowledged,
      licenseMemo: payload.licenseMemo,
      importMode: payload.importMode,
    }),
);
ipcMain.handle(
  "companion:activate-asset",
  async (_event, assetId: string) =>
    await handleCompanionAction("activate-asset", { assetId }),
);
ipcMain.handle("capture-screen", async () => {
  const capture = await captureScreenToMemory();
  return capture ? { ok: true, ...capture } : { ok: false, error: "screen capture unavailable" };
});
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
    if (!mainWindow) {
      return { ok: false, error: "no companion window" };
    }
    mainWindow.setAlwaysOnTop(false);
    if (ignoreMouseTimer) {
      clearInterval(ignoreMouseTimer);
      ignoreMouseTimer = null;
    }
    mainWindow.setIgnoreMouseEvents(false);
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: opts.title ?? "Select avatar asset",
        filters: opts.filters ?? [{ name: "All Files", extensions: ["*"] }],
        properties: ["openFile"],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { ok: false, canceled: true };
      }
      const filePath = result.filePaths[0];
      const nodeBuffer = await fs.readFile(filePath);
      const arrayBuffer = nodeBuffer.buffer.slice(
        nodeBuffer.byteOffset,
        nodeBuffer.byteOffset + nodeBuffer.byteLength,
      ) as ArrayBuffer;
      return { ok: true, filePath, buffer: arrayBuffer };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      mainWindow?.setAlwaysOnTop(true, "screen-saver");
      if (mainWindow && !ignoreMouseTimer) {
        ignoreMouseTimer = startIgnoreMouseTimer();
      }
    }
  },
);
ipcMain.handle("discover-model", async () => {
  const modelsDir = path.join(__dirname, "../../models");
  const found = await scanModels(modelsDir);
  return found[0] ?? null;
});

ipcMain.on(IPC_CHANNELS.CAMERA_FRAME, (_event, base64: string) => {
  latestCameraCapture = {
    base64,
    mimeType: "image/jpeg",
    timestamp: Date.now(),
    source: "renderer-camera",
  };
  resolveCameraWaiters(latestCameraCapture);
  void writeLegacyBinaryCapture({
    capture: latestCameraCapture,
    binaryPath: LEGACY_CAMERA_FILE,
    metaPath: LEGACY_CAMERA_META_FILE,
  });
});

ipcMain.on("mouse-active", (_event, active: boolean) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  mainWindow.setIgnoreMouseEvents(!active, { forward: true });
});

ipcMain.on(IPC_CHANNELS.STATE_UPDATE, (_event, update: Partial<CompanionStateUpdate>) => {
  if (typeof update.speaking === "boolean") {
    runtimeState.voice.speaking = update.speaking;
  }
  if (typeof update.agentId === "string" && update.agentId.trim()) {
    runtimeState.agentId = update.agentId.trim();
  }
  if (update.ttsProvider === "voicevox" || update.ttsProvider === "web-speech") {
    runtimeState.ttsProvider = update.ttsProvider;
  }
  publishRuntimeState();
});

if (process.platform === "win32") {
  app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
}

app.whenReady().then(async () => {
  await fs.mkdir(stateDir, { recursive: true });
  createWindow();
  publishRuntimeState();
  companionIpcServer = await startCompanionIpcServer({
    stateDir,
    handleRequest: handleCompanionAction,
  });
  startLegacyHttpControlServer();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", async () => {
  micSession?.stop();
  await companionIpcServer?.close();
  if (legacyHttpServer) {
    legacyHttpServer.close();
    legacyHttpServer = null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
