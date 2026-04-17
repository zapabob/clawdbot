import type {
  CompanionPermissionCapability,
  CompanionPermissionDecision,
  CompanionPermissionState,
} from "./companion-permissions.js";
import type { CompanionAssetManifestEntry } from "./companion-asset-manifest.js";
import type { AvatarCommand, TtsProvider } from "./bridge/event-types.js";

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
  ttsProvider: TtsProvider;
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

export type CompanionIpcAction =
  | "get-state"
  | "list-assets"
  | "get-input-snapshot"
  | "set-permission"
  | "speak"
  | "set-avatar-command"
  | "attach-tab"
  | "detach-tab"
  | "update-tab-context"
  | "request-tab-snapshot"
  | "import-asset"
  | "activate-asset"
  | "request-camera-capture"
  | "request-screen-capture";

export type CompanionSetPermissionPayload = {
  capability: CompanionPermissionCapability;
  decision: CompanionPermissionDecision;
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
  importMode?: "local-reference" | "local-copy";
};

export type CompanionActivateAssetPayload = {
  assetId: string;
};

export type CompanionInputSnapshotPayload = {
  includeCamera?: boolean;
  captureCamera?: boolean;
};

export type CompanionIpcRequestEnvelope =
  | {
      type: "auth";
      token: string;
    }
  | {
      type: "request";
      id: string;
      action: CompanionIpcAction;
      payload?: unknown;
    };

export type CompanionIpcResponseEnvelope =
  | {
      type: "auth-result";
      ok: boolean;
      error?: string;
    }
  | {
      type: "response";
      id: string;
      ok: boolean;
      result?: unknown;
      error?: string;
    };

export type CompanionIpcAuthMetadata = {
  version: 1;
  pipePath: string;
  authToken: string;
  updatedAt: number;
};

export function isCompanionIpcRequestEnvelope(
  value: unknown,
): value is CompanionIpcRequestEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (record.type === "auth") {
    return typeof record.token === "string";
  }
  return (
    record.type === "request" &&
    typeof record.id === "string" &&
    typeof record.action === "string"
  );
}

export type CompanionSetAvatarCommandPayload = {
  avatarCommand: AvatarCommand;
};

export type CompanionSpeakPayload = {
  text: string;
};
