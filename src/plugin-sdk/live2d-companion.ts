import {
  loadActivatedBundledPluginPublicSurfaceModuleSync,
} from "./facade-runtime.js";

export const COMPANION_PERMISSION_CAPABILITIES = [
  "mic",
  "camera",
  "screen",
  "tab-follow",
] as const;

export type CompanionPermissionCapability = (typeof COMPANION_PERMISSION_CAPABILITIES)[number];
export type CompanionPermissionDecision = "granted" | "denied";
export type CompanionPermissionSource = "default" | "user" | "helper";

export type CompanionPermissionStateEntry = {
  capability: CompanionPermissionCapability;
  decision: CompanionPermissionDecision;
  source: CompanionPermissionSource;
  updatedAt: number;
};

export type CompanionPermissionState = Record<
  CompanionPermissionCapability,
  CompanionPermissionStateEntry
>;

export type CompanionAssetType = "vrm" | "fbx" | "live2d" | "unknown";
export type CompanionAssetImportMode = "local-reference" | "local-copy";

export type CompanionAssetManifestEntry = {
  id: string;
  assetType: CompanionAssetType;
  fileName: string;
  sourcePath: string;
  resolvedPath: string;
  importMode: CompanionAssetImportMode;
  hashSha256: string;
  importedAt: number;
  licenseMemo: string;
  rightsAcknowledged: boolean;
  rightsAcknowledgedAt: number | null;
  remoteUploadForbidden: true;
};

export type CompanionVoiceRuntimeState = {
  sttBackend: "local-voice-whisper";
  ttsBackend: "voicevox";
  sttAvailable: boolean;
  micActive: boolean;
  speaking: boolean;
  lastTranscript: string | null;
  lastTranscriptAt: number | null;
};

export type CompanionBrowserAttachment = {
  attached: boolean;
  tabId: string | null;
  url: string | null;
  title: string | null;
  origin: string | null;
  textSnapshot: string | null;
  screenshotBase64: string | null;
  updatedAt: number | null;
};

export type CompanionRuntimeState = {
  visible: boolean;
  agentId: string;
  ttsProvider: string;
  permissions: CompanionPermissionState;
  browser: CompanionBrowserAttachment;
  voice: CompanionVoiceRuntimeState;
  activeAssetId: string | null;
  activeAsset: CompanionAssetManifestEntry | null;
  timestamp: number;
};

export type CompanionBinaryCapture = {
  base64: string;
  mimeType: string;
  timestamp: number;
  width?: number;
  height?: number;
  source?: string;
};

export type CompanionInputSnapshot = {
  transcript: string | null;
  transcriptTimestamp: number | null;
  camera: CompanionBinaryCapture | null;
  tabContext: CompanionBrowserAttachment;
};

export type CompanionAttachTabPayload = {
  tabId: string;
  url: string;
  title: string;
  textSnapshot?: string;
  screenshotBase64?: string;
};

export type CompanionUpdateTabContextPayload = Partial<CompanionAttachTabPayload> & {
  tabId: string;
};

export type CompanionImportAssetPayload = {
  filePath: string;
  rightsAcknowledged: boolean;
  licenseMemo: string;
  importMode?: CompanionAssetImportMode;
};

export type CompanionInputSnapshotPayload = {
  includeCamera?: boolean;
  captureCamera?: boolean;
};

export type CompanionSetAvatarCommandPayload = {
  avatarCommand: {
    loadModel?: string;
    expression?: string;
    motion?: string;
    motionIndex?: number;
    speakText?: string;
    lookAt?: {
      x: number;
      y: number;
    };
  };
};

export type CompanionSpeakPayload = {
  text: string;
};

type Live2dCompanionFacadeModule = {
  getCompanionState: (params?: { stateDir?: string }) => Promise<CompanionRuntimeState>;
  listCompanionAssets: (params?: {
    stateDir?: string;
  }) => Promise<CompanionAssetManifestEntry[]>;
  getCompanionInputSnapshot: (params?: {
    stateDir?: string;
    payload?: CompanionInputSnapshotPayload;
  }) => Promise<CompanionInputSnapshot>;
  setCompanionPermission: (params: {
    stateDir?: string;
    capability: CompanionPermissionCapability;
    decision: CompanionPermissionDecision;
  }) => Promise<CompanionRuntimeState>;
  speakWithCompanion: (params: {
    stateDir?: string;
    text: string;
  }) => Promise<CompanionRuntimeState>;
  setCompanionAvatarCommand: (params: {
    stateDir?: string;
    avatarCommand: CompanionSetAvatarCommandPayload["avatarCommand"];
  }) => Promise<CompanionRuntimeState>;
  attachCompanionTab: (params: {
    stateDir?: string;
    attachment: CompanionAttachTabPayload;
  }) => Promise<CompanionRuntimeState>;
  detachCompanionTab: (params?: { stateDir?: string }) => Promise<CompanionRuntimeState>;
  updateCompanionTabContext: (params: {
    stateDir?: string;
    attachment: CompanionUpdateTabContextPayload;
  }) => Promise<CompanionRuntimeState>;
  requestCompanionTabSnapshot: (params?: { stateDir?: string }) => Promise<CompanionRuntimeState>;
  importCompanionAsset: (params: {
    stateDir?: string;
    asset: CompanionImportAssetPayload;
  }) => Promise<CompanionAssetManifestEntry>;
  activateCompanionAsset: (params: {
    stateDir?: string;
    assetId: string;
  }) => Promise<CompanionRuntimeState>;
  requestCompanionCameraCapture: (params?: {
    stateDir?: string;
  }) => Promise<CompanionBinaryCapture | null>;
  requestCompanionScreenCapture: (params?: {
    stateDir?: string;
  }) => Promise<CompanionBinaryCapture | null>;
};

function loadLive2dCompanionFacadeModule(): Live2dCompanionFacadeModule {
  return loadActivatedBundledPluginPublicSurfaceModuleSync<Live2dCompanionFacadeModule>({
    dirName: "live2d-companion",
    artifactBasename: "runtime-api.js",
  });
}

export function getCompanionState(params?: { stateDir?: string }): Promise<CompanionRuntimeState> {
  return loadLive2dCompanionFacadeModule().getCompanionState(params);
}

export function listCompanionAssets(params?: {
  stateDir?: string;
}): Promise<CompanionAssetManifestEntry[]> {
  return loadLive2dCompanionFacadeModule().listCompanionAssets(params);
}

export function getCompanionInputSnapshot(params?: {
  stateDir?: string;
  payload?: CompanionInputSnapshotPayload;
}): Promise<CompanionInputSnapshot> {
  return loadLive2dCompanionFacadeModule().getCompanionInputSnapshot(params);
}

export function setCompanionPermission(params: {
  stateDir?: string;
  capability: CompanionPermissionCapability;
  decision: CompanionPermissionDecision;
}): Promise<CompanionRuntimeState> {
  return loadLive2dCompanionFacadeModule().setCompanionPermission(params);
}

export function speakWithCompanion(params: {
  stateDir?: string;
  text: string;
}): Promise<CompanionRuntimeState> {
  return loadLive2dCompanionFacadeModule().speakWithCompanion(params);
}

export function setCompanionAvatarCommand(params: {
  stateDir?: string;
  avatarCommand: CompanionSetAvatarCommandPayload["avatarCommand"];
}): Promise<CompanionRuntimeState> {
  return loadLive2dCompanionFacadeModule().setCompanionAvatarCommand(params);
}

export function attachCompanionTab(params: {
  stateDir?: string;
  attachment: CompanionAttachTabPayload;
}): Promise<CompanionRuntimeState> {
  return loadLive2dCompanionFacadeModule().attachCompanionTab(params);
}

export function detachCompanionTab(params?: {
  stateDir?: string;
}): Promise<CompanionRuntimeState> {
  return loadLive2dCompanionFacadeModule().detachCompanionTab(params);
}

export function updateCompanionTabContext(params: {
  stateDir?: string;
  attachment: CompanionUpdateTabContextPayload;
}): Promise<CompanionRuntimeState> {
  return loadLive2dCompanionFacadeModule().updateCompanionTabContext(params);
}

export function requestCompanionTabSnapshot(params?: {
  stateDir?: string;
}): Promise<CompanionRuntimeState> {
  return loadLive2dCompanionFacadeModule().requestCompanionTabSnapshot(params);
}

export function importCompanionAsset(params: {
  stateDir?: string;
  asset: CompanionImportAssetPayload;
}): Promise<CompanionAssetManifestEntry> {
  return loadLive2dCompanionFacadeModule().importCompanionAsset(params);
}

export function activateCompanionAsset(params: {
  stateDir?: string;
  assetId: string;
}): Promise<CompanionRuntimeState> {
  return loadLive2dCompanionFacadeModule().activateCompanionAsset(params);
}

export function requestCompanionCameraCapture(params?: {
  stateDir?: string;
}): Promise<CompanionBinaryCapture | null> {
  return loadLive2dCompanionFacadeModule().requestCompanionCameraCapture(params);
}

export function requestCompanionScreenCapture(params?: {
  stateDir?: string;
}): Promise<CompanionBinaryCapture | null> {
  return loadLive2dCompanionFacadeModule().requestCompanionScreenCapture(params);
}
