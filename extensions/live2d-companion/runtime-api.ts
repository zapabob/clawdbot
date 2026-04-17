import path from "node:path";
import {
  sendCompanionIpcRequest,
} from "./companion-ipc.js";
import type {
  CompanionBinaryCapture,
  CompanionBrowserAttachment,
  CompanionInputSnapshot,
  CompanionInputSnapshotPayload,
  CompanionRuntimeState,
  CompanionSetAvatarCommandPayload,
  CompanionSpeakPayload,
  CompanionAttachTabPayload,
  CompanionUpdateTabContextPayload,
  CompanionImportAssetPayload,
} from "./companion-ipc-protocol.js";
import type {
  CompanionAssetManifestEntry,
} from "./companion-asset-manifest.js";
import type {
  CompanionPermissionCapability,
  CompanionPermissionDecision,
} from "./companion-permissions.js";

type CompanionActionResultMap = {
  "get-state": CompanionRuntimeState;
  "list-assets": CompanionAssetManifestEntry[];
  "get-input-snapshot": CompanionInputSnapshot;
  "set-permission": CompanionRuntimeState;
  speak: CompanionRuntimeState;
  "set-avatar-command": CompanionRuntimeState;
  "attach-tab": CompanionRuntimeState;
  "detach-tab": CompanionRuntimeState;
  "update-tab-context": CompanionRuntimeState;
  "request-tab-snapshot": CompanionRuntimeState;
  "import-asset": CompanionAssetManifestEntry;
  "activate-asset": CompanionRuntimeState;
  "request-camera-capture": CompanionBinaryCapture | null;
  "request-screen-capture": CompanionBinaryCapture | null;
};

function resolveCompanionStateDir(stateDir?: string): string {
  return path.resolve(
    stateDir ?? process.env.OPENCLAW_STATE_DIR ?? path.join(process.cwd(), ".openclaw-desktop"),
  );
}

async function sendCompanionAction<TAction extends keyof CompanionActionResultMap>(params: {
  stateDir?: string;
  action: TAction;
  payload?: unknown;
}): Promise<CompanionActionResultMap[TAction]> {
  return (await sendCompanionIpcRequest({
    stateDir: resolveCompanionStateDir(params.stateDir),
    action: params.action,
    ...(params.payload === undefined ? {} : { payload: params.payload }),
  })) as CompanionActionResultMap[TAction];
}

export function getCompanionState(params?: { stateDir?: string }): Promise<CompanionRuntimeState> {
  return sendCompanionAction({
    ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
    action: "get-state",
  });
}

export function listCompanionAssets(params?: {
  stateDir?: string;
}): Promise<CompanionAssetManifestEntry[]> {
  return sendCompanionAction({
    ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
    action: "list-assets",
  });
}

export function getCompanionInputSnapshot(params?: {
  stateDir?: string;
  payload?: CompanionInputSnapshotPayload;
}): Promise<CompanionInputSnapshot> {
  return sendCompanionAction({
    ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
    action: "get-input-snapshot",
    ...(params?.payload === undefined ? {} : { payload: params.payload }),
  });
}

export function setCompanionPermission(params: {
  stateDir?: string;
  capability: CompanionPermissionCapability;
  decision: CompanionPermissionDecision;
}): Promise<CompanionRuntimeState> {
  return sendCompanionAction({
    ...(params.stateDir ? { stateDir: params.stateDir } : {}),
    action: "set-permission",
    payload: {
      capability: params.capability,
      decision: params.decision,
    },
  });
}

export function speakWithCompanion(params: {
  stateDir?: string;
  text: string;
}): Promise<CompanionRuntimeState> {
  const payload: CompanionSpeakPayload = {
    text: params.text,
  };
  return sendCompanionAction({
    ...(params.stateDir ? { stateDir: params.stateDir } : {}),
    action: "speak",
    payload,
  });
}

export function setCompanionAvatarCommand(params: {
  stateDir?: string;
  avatarCommand: CompanionSetAvatarCommandPayload["avatarCommand"];
}): Promise<CompanionRuntimeState> {
  return sendCompanionAction({
    ...(params.stateDir ? { stateDir: params.stateDir } : {}),
    action: "set-avatar-command",
    payload: {
      avatarCommand: params.avatarCommand,
    } satisfies CompanionSetAvatarCommandPayload,
  });
}

export function attachCompanionTab(params: {
  stateDir?: string;
  attachment: CompanionAttachTabPayload;
}): Promise<CompanionRuntimeState> {
  return sendCompanionAction({
    ...(params.stateDir ? { stateDir: params.stateDir } : {}),
    action: "attach-tab",
    payload: params.attachment,
  });
}

export function detachCompanionTab(params?: {
  stateDir?: string;
}): Promise<CompanionRuntimeState> {
  return sendCompanionAction({
    ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
    action: "detach-tab",
  });
}

export function updateCompanionTabContext(params: {
  stateDir?: string;
  attachment: CompanionUpdateTabContextPayload;
}): Promise<CompanionRuntimeState> {
  return sendCompanionAction({
    ...(params.stateDir ? { stateDir: params.stateDir } : {}),
    action: "update-tab-context",
    payload: params.attachment,
  });
}

export function requestCompanionTabSnapshot(params?: {
  stateDir?: string;
}): Promise<CompanionRuntimeState> {
  return sendCompanionAction({
    ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
    action: "request-tab-snapshot",
  });
}

export function importCompanionAsset(params: {
  stateDir?: string;
  asset: CompanionImportAssetPayload;
}): Promise<CompanionAssetManifestEntry> {
  return sendCompanionAction({
    ...(params.stateDir ? { stateDir: params.stateDir } : {}),
    action: "import-asset",
    payload: params.asset,
  });
}

export function activateCompanionAsset(params: {
  stateDir?: string;
  assetId: string;
}): Promise<CompanionRuntimeState> {
  return sendCompanionAction({
    ...(params.stateDir ? { stateDir: params.stateDir } : {}),
    action: "activate-asset",
    payload: {
      assetId: params.assetId,
    },
  });
}

export function requestCompanionCameraCapture(params?: {
  stateDir?: string;
}): Promise<CompanionBinaryCapture | null> {
  return sendCompanionAction({
    ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
    action: "request-camera-capture",
  });
}

export function requestCompanionScreenCapture(params?: {
  stateDir?: string;
}): Promise<CompanionBinaryCapture | null> {
  return sendCompanionAction({
    ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
    action: "request-screen-capture",
  });
}

export type {
  CompanionAssetManifestEntry,
  CompanionBinaryCapture,
  CompanionBrowserAttachment,
  CompanionInputSnapshot,
  CompanionInputSnapshotPayload,
  CompanionPermissionCapability,
  CompanionPermissionDecision,
  CompanionRuntimeState,
};
