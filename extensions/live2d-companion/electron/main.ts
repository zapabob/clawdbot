import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, desktopCapturer, dialog, ipcMain, screen } from "electron";
import { buildOptimisticAvatarCommandState } from "../avatar-command-state.js";
import { IPC_CHANNELS } from "../bridge/event-types.js";
import type { AvatarCommand, CompanionStateUpdate, TtsProvider } from "../bridge/event-types.js";
import {
  activateCompanionAsset,
  importCompanionAsset,
  readCompanionAssets,
  type CompanionAssetManifestEntry,
} from "../companion-asset-manifest.js";
import { resolveLive2dCompanionConfig } from "../companion-config.js";
import type {
  CompanionAvatarRuntimeState,
  CompanionBinaryCapture,
  CompanionIpcAction,
  CompanionRuntimeState,
} from "../companion-ipc-protocol.js";
import { startCompanionIpcServer, type CompanionIpcServerHandle } from "../companion-ipc.js";
import {
  createCompanionPermissionState,
  isCompanionPermissionGranted,
  setCompanionPermission,
  type CompanionPermissionCapability,
  type CompanionPermissionDecision,
  type CompanionPermissionState,
} from "../companion-permissions.js";
import {
  createDefaultCompanionProfile,
  readCompanionProfile,
  updateCompanionProfile,
} from "../companion-profile.js";
import {
  buildCompanionDiscoveryEntries,
  isSupportedCompanionModelPath,
  selectStartupCompanionAssetId,
  sortCompanionModelCandidates,
} from "../companion-startup.js";

const require = createRequire(import.meta.url);
const rawCompanionConfig = require("../companion.config.json") as Record<string, unknown>;
const companionPolicy = resolveLive2dCompanionConfig(rawCompanionConfig);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(path.join(__dirname, "../../.."));

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
  getLastError?: () => string | null;
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

const localVoiceSdkSpecifier = "openclaw/plugin-sdk/local-voice";

async function loadLocalVoiceFacade(): Promise<LocalVoiceFacade | null> {
  try {
    return (await import(localVoiceSdkSpecifier)) as LocalVoiceFacade;
  } catch {
    try {
      const { createJiti } = require("jiti") as typeof import("jiti");
      const loadSource = createJiti(import.meta.url);
      return loadSource(
        path.join(repoRoot, "extensions/local-voice/runtime-api.ts"),
      ) as LocalVoiceFacade;
    } catch {
      return null;
    }
  }
}

function loadLocalVoiceDefaults(facade: LocalVoiceFacade | null): LocalVoiceCompanionDefaults {
  try {
    return (
      facade?.resolveLocalVoiceCompanionDefaults() ?? {
        sttBackend: "local-voice-whisper",
        ttsBackend: "voicevox",
      }
    );
  } catch {
    return {
      sttBackend: "local-voice-whisper",
      ttsBackend: "voicevox",
    };
  }
}

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

type RendererIpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
type RendererIpcFrame = {
  send: (channel: string, ...args: unknown[]) => void;
  isDestroyed?: () => boolean;
};

function isDisposedRendererSendError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Render frame was disposed") ||
    message.includes("WebFrameMain could be accessed") ||
    message.includes("Object has been destroyed")
  );
}

function sendToRenderer(channel: RendererIpcChannel, ...args: unknown[]): boolean {
  if (!rendererIpcReady) {
    return false;
  }

  const window = mainWindow;
  if (!window || window.isDestroyed()) {
    return false;
  }

  const { webContents } = window;
  if (webContents.isDestroyed()) {
    return false;
  }

  try {
    const frame = webContents.mainFrame as RendererIpcFrame | undefined;
    if (frame?.isDestroyed?.()) {
      rendererIpcReady = false;
      return false;
    }
    if (frame) {
      frame.send(channel, ...args);
    } else {
      webContents.send(channel, ...args);
    }
    return true;
  } catch (error) {
    if (isDisposedRendererSendError(error)) {
      rendererIpcReady = false;
      return false;
    }
    throw error;
  }
}

const localVoiceFacade = await loadLocalVoiceFacade();
const localVoiceDefaults = loadLocalVoiceDefaults(localVoiceFacade);

const stateDir = process.env.OPENCLAW_STATE_DIR
  ? path.resolve(process.env.OPENCLAW_STATE_DIR)
  : path.resolve(path.join(repoRoot, String(rawCompanionConfig.stateDir ?? ".openclaw-desktop")));

const STATE_CACHE_FILE = "companion_state.json";
const LEGACY_CAMERA_FILE = "companion_camera.jpg";
const LEGACY_CAMERA_META_FILE = "companion_camera_meta.json";
const LEGACY_SCREEN_FILE = "companion_screenshot.png";
const LEGACY_SCREEN_META_FILE = "companion_screenshot_meta.json";
const CAMERA_CAPTURE_TIMEOUT_MS = 800;
const WINDOW_CAPTURE_TIMEOUT_MS = 2500;
const WINDOW_CAPTURE_FALLBACK_TIMEOUT_MS = 1000;

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
  avatar: CompanionAvatarRuntimeState;
  activeAssetId: string | null;
  timestamp: number;
};

let mainWindow: BrowserWindow | null = null;
let rendererIpcReady = false;
let ignoreMouseTimer: ReturnType<typeof setInterval> | null = null;
let legacyHttpServer: http.Server | null = null;
let companionIpcServer: CompanionIpcServerHandle | null = null;
let micSession: LocalWhisperMicSession | null = null;
let activeAsset: CompanionAssetManifestEntry | null = null;
let latestCameraCapture: CompanionBinaryCapture | null = null;
let latestScreenCapture: CompanionBinaryCapture | null = null;
let cameraCaptureWaiters: Array<(capture: CompanionBinaryCapture | null) => void> = [];
let interactiveRegions: Array<{ x: number; y: number; width: number; height: number }> = [];

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
  avatar: {
    lastAction: null,
    lastEmotion: null,
    lastExpression: null,
    lastMotion: null,
    lastMotionIndex: null,
    lastLookAt: null,
    lastUpdatedAt: null,
    lastSpeechAt: null,
  },
  profile: createDefaultCompanionProfile(),
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
    avatar: runtimeState.avatar,
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

async function readStateCache(): Promise<Partial<RuntimeStateCache> | null> {
  try {
    const raw = await fs.readFile(path.join(stateDir, STATE_CACHE_FILE), "utf-8");
    const parsed = JSON.parse(raw) as Partial<RuntimeStateCache>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function applyRuntimeStateCache(cache: Partial<RuntimeStateCache> | null): string | null {
  if (!cache) {
    return null;
  }
  if (typeof cache.visible === "boolean") {
    runtimeState.visible = cache.visible;
  }
  if (typeof cache.agentId === "string" && cache.agentId.trim()) {
    runtimeState.agentId = cache.agentId.trim();
  }
  if (cache.ttsProvider === "voicevox" || cache.ttsProvider === "web-speech") {
    runtimeState.ttsProvider = cache.ttsProvider;
  }
  if (cache.avatar && typeof cache.avatar === "object") {
    runtimeState.avatar = {
      ...runtimeState.avatar,
      ...cache.avatar,
    };
  }
  return typeof cache.activeAssetId === "string" && cache.activeAssetId.trim()
    ? cache.activeAssetId
    : null;
}

function updateAvatarRuntimeState(update: CompanionStateUpdate["avatar"]): void {
  if (!update || typeof update !== "object") {
    return;
  }
  runtimeState.avatar = {
    ...runtimeState.avatar,
    ...(update.lastAction ? { lastAction: update.lastAction } : {}),
    ...(update.lastEmotion !== undefined ? { lastEmotion: update.lastEmotion } : {}),
    ...(update.lastExpression !== undefined ? { lastExpression: update.lastExpression } : {}),
    ...(update.lastMotion !== undefined ? { lastMotion: update.lastMotion } : {}),
    ...(update.lastMotionIndex !== undefined ? { lastMotionIndex: update.lastMotionIndex } : {}),
    ...(update.lastLookAt !== undefined ? { lastLookAt: update.lastLookAt } : {}),
    ...(update.lastSpeechAt !== undefined ? { lastSpeechAt: update.lastSpeechAt } : {}),
    lastUpdatedAt: update.lastUpdatedAt ?? Date.now(),
  };
}

function recordAvatarCommandDispatch(command: AvatarCommand): void {
  const update = buildOptimisticAvatarCommandState({
    command,
    assetType: runtimeState.activeAsset?.assetType ?? null,
    currentEmotion: runtimeState.avatar.lastEmotion,
  });
  if (update) {
    updateAvatarRuntimeState(update);
    publishRuntimeState();
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
  sendToRenderer(IPC_CHANNELS.RUNTIME_STATE, runtimeState);
  void writeStateCache();
}

function markRendererIpcUnavailable(window: BrowserWindow): void {
  if (mainWindow !== window) {
    return;
  }
  rendererIpcReady = false;
  resolveCameraWaiters(latestCameraCapture);
}

function markRendererIpcReady(window: BrowserWindow): void {
  if (mainWindow !== window || window.isDestroyed() || window.webContents.isDestroyed()) {
    return;
  }
  rendererIpcReady = true;
  publishRuntimeState();
}

function startIgnoreMouseTimer(): ReturnType<typeof setInterval> {
  const pollBufferPx = 8;
  return setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }
    const pos = screen.getCursorScreenPoint();
    const bounds = mainWindow.getBounds();
    const localX = pos.x - bounds.x;
    const localY = pos.y - bounds.y;
    const inInteractiveRegion = interactiveRegions.some(
      (region) =>
        localX >= region.x - pollBufferPx &&
        localX <= region.x + region.width + pollBufferPx &&
        localY >= region.y - pollBufferPx &&
        localY <= region.y + region.height + pollBufferPx,
    );
    mainWindow.setIgnoreMouseEvents(!inInteractiveRegion, { forward: true });
  }, 33);
}

function createWindow(): void {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const windowConfig =
    rawCompanionConfig.window && typeof rawCompanionConfig.window === "object"
      ? (rawCompanionConfig.window as Record<string, number>)
      : {};

  mainWindow = new BrowserWindow({
    title: "OpenClaw Desktop Companion",
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
      preload: path.join(__dirname, "preload.cjs"),
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

  const createdWindow = mainWindow;
  rendererIpcReady = false;
  createdWindow.webContents.on("did-start-loading", () =>
    markRendererIpcUnavailable(createdWindow),
  );
  createdWindow.webContents.on("did-fail-load", () => markRendererIpcUnavailable(createdWindow));
  createdWindow.webContents.on("render-process-gone", () =>
    markRendererIpcUnavailable(createdWindow),
  );
  createdWindow.webContents.on("destroyed", () => markRendererIpcUnavailable(createdWindow));
  createdWindow.webContents.on("did-finish-load", () => markRendererIpcReady(createdWindow));

  void createdWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  createdWindow.once("ready-to-show", () => {
    mainWindow?.show();
    publishRuntimeState();
  });
  createdWindow.on("close", () => markRendererIpcUnavailable(createdWindow));
  createdWindow.on("closed", () => {
    if (ignoreMouseTimer) {
      clearInterval(ignoreMouseTimer);
      ignoreMouseTimer = null;
    }
    mainWindow = null;
  });
}

function focusCompanionWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

function updateBrowserAttachment(
  next: Partial<CompanionRuntimeState["browser"]> & { attached: boolean },
): void {
  runtimeState.browser = {
    ...runtimeState.browser,
    ...next,
    updatedAt: Date.now(),
  };
  publishRuntimeState();
}

function sendAvatarCommand(command: AvatarCommand): void {
  recordAvatarCommandDispatch(command);
  sendToRenderer(IPC_CHANNELS.AVATAR_COMMAND, command);
}

async function requestRendererCameraCapture(): Promise<CompanionBinaryCapture | null> {
  if (!isCompanionPermissionGranted(runtimeState.permissions, "camera")) {
    return null;
  }
  if (!mainWindow) {
    return latestCameraCapture;
  }
  if (!sendToRenderer(IPC_CHANNELS.CAMERA_CAPTURE_REQUEST)) {
    return latestCameraCapture;
  }
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

function waitForWindowPaint(delayMs = 180): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function withCaptureTimeout<T>(operation: Promise<T>, timeoutMs = 1200): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      operation,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function captureWindowWithWindowsGdi(): Promise<CompanionBinaryCapture | null> {
  if (process.platform !== "win32" || !mainWindow || mainWindow.isDestroyed()) {
    return Promise.resolve(null);
  }

  const bounds = mainWindow.getBounds();
  if (bounds.width <= 0 || bounds.height <= 0) {
    return Promise.resolve(null);
  }

  const script = `& {
param([int]$X, [int]$Y, [int]$Width, [int]$Height)
Add-Type -AssemblyName System.Drawing
$bitmap = [System.Drawing.Bitmap]::new($Width, $Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  $graphics.CopyFromScreen($X, $Y, 0, 0, $bitmap.Size)
  $stream = [System.IO.MemoryStream]::new()
  try {
    $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    [System.Convert]::ToBase64String($stream.ToArray())
  } finally {
    $stream.Dispose()
  }
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}
}
`;

  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script,
        String(Math.max(0, bounds.x)),
        String(Math.max(0, bounds.y)),
        String(Math.max(1, bounds.width)),
        String(Math.max(1, bounds.height)),
      ],
      { timeout: WINDOW_CAPTURE_FALLBACK_TIMEOUT_MS },
      (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        const base64 = stdout.trim();
        if (!base64) {
          resolve(null);
          return;
        }
        resolve({
          base64,
          mimeType: "image/png",
          timestamp: Date.now(),
          width: bounds.width,
          height: bounds.height,
          source: "desktop-companion-window:gdi",
        });
      },
    );
  });
}

async function captureRendererCanvasToMemory(): Promise<CompanionBinaryCapture | null> {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) {
    return null;
  }
  const preferStatusOnly = runtimeState.activeAsset?.assetType === "vrm";
  const result = (await mainWindow.webContents.executeJavaScript(
    `(() => {
      const preferStatusOnly = ${JSON.stringify(preferStatusOnly)};
      const fromDataUrl = (dataUrl, width, height, source) => {
        const comma = dataUrl.indexOf(",");
        if (!dataUrl.startsWith("data:image/png;base64,") || comma < 0) {
          return null;
        }
        return { base64: dataUrl.slice(comma + 1), width, height, source };
      };
      const modelCanvas = document.querySelector("#canvas-container canvas");
      if (!preferStatusOnly &&
        modelCanvas instanceof HTMLCanvasElement &&
        modelCanvas.width > 0 &&
        modelCanvas.height > 0
      ) {
        try {
          const captured = fromDataUrl(
            modelCanvas.toDataURL("image/png"),
            modelCanvas.width,
            modelCanvas.height,
            "desktop-companion-renderer-canvas",
          );
          if (captured) {
            return captured;
          }
        } catch {}
      }
      const width = Math.max(320, Math.min(960, Math.round(window.innerWidth || 380)));
      const height = Math.max(240, Math.min(720, Math.round(window.innerHeight || 480)));
      const statusCanvas = document.createElement("canvas");
      statusCanvas.width = width;
      statusCanvas.height = height;
      const ctx = statusCanvas.getContext("2d");
      if (!ctx) {
        return null;
      }
      const text = (selector, fallback) =>
        (document.querySelector(selector)?.textContent || fallback).trim();
      const avatarName = text("#dock-avatar-name", "No avatar selected");
      const voiceStatus = text("#dock-voice-status", "Voice status unavailable");
      const panelOpen = document.querySelector("#companion-panel")?.classList.contains("is-open");
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#151923");
      gradient.addColorStop(1, "#253140");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.font = "600 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("OpenClaw Desktop Companion", 24, 42);
      ctx.font = "500 15px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Avatar: " + avatarName, 24, 78);
      ctx.fillText("Voice: " + voiceStatus, 24, 104);
      ctx.fillText("Setup panel: " + (panelOpen ? "open" : "closed"), 24, 130);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, width - 24, height - 24);
      return fromDataUrl(
        statusCanvas.toDataURL("image/png"),
        width,
        height,
        "desktop-companion-renderer-status",
      );
    })()`,
    true,
  )) as { base64?: unknown; width?: unknown; height?: unknown; source?: unknown } | null;
  if (
    !result ||
    typeof result.base64 !== "string" ||
    typeof result.width !== "number" ||
    typeof result.height !== "number" ||
    result.width <= 0 ||
    result.height <= 0
  ) {
    return null;
  }
  return {
    base64: result.base64,
    mimeType: "image/png",
    timestamp: Date.now(),
    width: result.width,
    height: result.height,
    source:
      typeof result.source === "string" && result.source.trim()
        ? result.source
        : "desktop-companion-renderer-canvas",
  };
}

async function captureWindowToMemory(): Promise<CompanionBinaryCapture | null> {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) {
    return null;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  if (!mainWindow.isVisible()) {
    mainWindow.showInactive();
  }
  await waitForWindowPaint();
  const canvasCapture = await withCaptureTimeout(
    captureRendererCanvasToMemory(),
    WINDOW_CAPTURE_TIMEOUT_MS,
  );
  if (canvasCapture) {
    return canvasCapture;
  }
  return await withCaptureTimeout(
    captureWindowWithWindowsGdi(),
    WINDOW_CAPTURE_FALLBACK_TIMEOUT_MS,
  );
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
  return started
    ? { ok: true }
    : {
        ok: false,
        reason: session.getLastError?.() ?? "Unable to start microphone capture",
      };
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

function isTtsProvider(value: unknown): value is TtsProvider {
  return value === "voicevox" || value === "web-speech";
}

async function handleCompanionAction(
  action: CompanionIpcAction,
  payload: unknown,
): Promise<unknown> {
  switch (action) {
    case "get-state":
      return runtimeState;
    case "get-profile":
      return runtimeState.profile;
    case "update-profile": {
      const request = payload as {
        profile?: Parameters<typeof updateCompanionProfile>[0]["patch"];
      };
      runtimeState.profile = await updateCompanionProfile({
        stateDir,
        patch: request?.profile ?? {},
      });
      publishRuntimeState();
      return runtimeState.profile;
    }
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
    case "set-mic-enabled": {
      const request = payload as { enabled?: boolean } | null | undefined;
      return setMicEnabled(request?.enabled === true);
    }
    case "speak": {
      const request = payload as { text: string; emotion?: string; ttsProvider?: TtsProvider };
      if (typeof request.text === "string" && request.text.trim()) {
        const ttsProvider = isTtsProvider(request.ttsProvider) ? request.ttsProvider : undefined;
        const emotion =
          typeof request.emotion === "string" && request.emotion.trim()
            ? request.emotion.trim()
            : undefined;
        let shouldPublishState = false;
        if (emotion) {
          runtimeState.profile = await updateCompanionProfile({
            stateDir,
            patch: { mood: emotion },
          });
          shouldPublishState = true;
        }
        if (ttsProvider) {
          runtimeState.ttsProvider = ttsProvider;
          shouldPublishState = true;
        }
        if (shouldPublishState) {
          publishRuntimeState();
        }
        if (emotion || ttsProvider) {
          sendAvatarCommand({
            speakText: request.text.trim(),
            ...(emotion ? { expression: emotion, speakEmotion: emotion } : {}),
            ...(ttsProvider ? { ttsProvider } : {}),
          });
        } else {
          sendToRenderer(IPC_CHANNELS.SPEAK_TEXT, request.text.trim());
        }
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
        ...(request.url === undefined
          ? {}
          : { url: request.url, origin: inferOrigin(request.url) }),
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
    case "request-window-capture":
      return await captureWindowToMemory();
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
    sendToRenderer(IPC_CHANNELS.SPEAK_TEXT, command.speakText.trim());
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
    const stat = await fs.stat(dir);
    if (stat.isFile()) {
      return isSupportedCompanionModelPath(dir) ? [path.resolve(dir)] : [];
    }
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await scanModels(fullPath)));
      } else if (isSupportedCompanionModelPath(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch {
    // Ignore missing model directories.
  }
  return results;
}

ipcMain.handle("companion:get-config", async () => rawCompanionConfig);
ipcMain.handle("companion:get-state", async () => runtimeState);
ipcMain.handle("companion:get-profile", async () => runtimeState.profile);
ipcMain.handle(
  "companion:update-profile",
  async (_event, profile: unknown) => await handleCompanionAction("update-profile", { profile }),
);
ipcMain.handle("companion:list-assets", async () => await readCompanionAssets(stateDir));
ipcMain.handle(
  "companion:set-permission",
  async (
    _event,
    capability: CompanionPermissionCapability,
    decision: CompanionPermissionDecision,
  ) => setPermissionDecision(capability, decision),
);
ipcMain.handle("companion:set-mic-enabled", async (_event, enabled: boolean) =>
  setMicEnabled(enabled),
);
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
  async (_event, assetId: string) => await handleCompanionAction("activate-asset", { assetId }),
);
ipcMain.on(
  "companion:interactive-regions",
  (_event, regions: Array<{ x: number; y: number; width: number; height: number }>) => {
    interactiveRegions = Array.isArray(regions)
      ? regions
          .filter(
            (region) =>
              Number.isFinite(region.x) &&
              Number.isFinite(region.y) &&
              Number.isFinite(region.width) &&
              Number.isFinite(region.height) &&
              region.width > 0 &&
              region.height > 0,
          )
          .slice(0, 12)
      : [];
  },
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
  const discoveryEntries = buildCompanionDiscoveryEntries({
    repoRoot,
    configuredModelPath: rawCompanionConfig.modelPath,
    configuredAvatarPath: rawCompanionConfig.avatarPath,
  });
  const found = (
    await Promise.all(discoveryEntries.map(async (entry) => await scanModels(entry)))
  ).flat();
  return sortCompanionModelCandidates(found)[0] ?? null;
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
  updateAvatarRuntimeState(update.avatar);
  publishRuntimeState();
});

if (process.platform === "win32") {
  app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
}

const hasCompanionInstanceLock = app.requestSingleInstanceLock();
if (!hasCompanionInstanceLock) {
  console.warn("[Companion] another desktop companion instance is already running; exiting.");
  app.quit();
} else {
  app.on("second-instance", () => {
    focusCompanionWindow();
  });

  void app
    .whenReady()
    .then(async () => {
      await fs.mkdir(stateDir, { recursive: true });
      runtimeState.profile = await readCompanionProfile(stateDir);
      const cachedActiveAssetId = applyRuntimeStateCache(await readStateCache());
      const manifestAssets = await readCompanionAssets(stateDir);
      const startupAssetId = selectStartupCompanionAssetId({
        assets: manifestAssets,
        cachedActiveAssetId,
      });
      if (startupAssetId) {
        try {
          activeAsset = await activateCompanionAsset({
            stateDir,
            assetId: startupAssetId,
          });
          runtimeState.activeAssetId = activeAsset.id;
          runtimeState.activeAsset = activeAsset;
        } catch {
          runtimeState.activeAssetId = null;
          runtimeState.activeAsset = null;
        }
      }
      createWindow();
      publishRuntimeState();
      try {
        companionIpcServer = await startCompanionIpcServer({
          stateDir,
          handleRequest: handleCompanionAction,
        });
      } catch (error) {
        if (hasErrorCode(error, "EADDRINUSE")) {
          console.warn(
            "[Companion] IPC endpoint is already in use; keeping the existing companion instance.",
          );
          focusCompanionWindow();
          app.quit();
          return;
        }
        throw error;
      }
      startLegacyHttpControlServer();

      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      });
    })
    .catch((error: unknown) => {
      console.error("[Companion] startup failed:", error);
      app.quit();
    });
}

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
