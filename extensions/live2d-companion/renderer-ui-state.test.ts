import { describe, expect, it } from "vitest";
import { createDefaultCompanionProfile } from "./companion-profile.js";
import {
  buildAssetLibraryView,
  buildCompanionProfilePatch,
  buildSetupChecklist,
  createCompanionProfileDraft,
  createCompanionUiState,
  reduceCompanionUiState,
} from "./renderer/ui-state.js";
import type { CompanionAssetManifestEntry, CompanionRuntimeState } from "./runtime-api.js";

function createAsset(params: {
  id: string;
  fileName: string;
  assetType?: CompanionAssetManifestEntry["assetType"];
  importedAt?: number;
  rightsAcknowledged?: boolean;
}): CompanionAssetManifestEntry {
  return {
    id: params.id,
    assetType: params.assetType ?? "vrm",
    fileName: params.fileName,
    sourcePath: `C:/avatars/${params.fileName}`,
    resolvedPath: `C:/avatars/${params.fileName}`,
    importMode: "local-reference",
    hashSha256: `${params.id}-hash`,
    importedAt: params.importedAt ?? 1,
    licenseMemo: "local use",
    rightsAcknowledged: params.rightsAcknowledged ?? true,
    rightsAcknowledgedAt: params.rightsAcknowledged === false ? null : Date.now(),
    remoteUploadForbidden: true,
  };
}

function createRuntimeState(overrides: Partial<CompanionRuntimeState> = {}): CompanionRuntimeState {
  return {
    visible: true,
    agentId: "main",
    ttsProvider: "voicevox",
    permissions: {
      mic: {
        capability: "mic",
        decision: "denied",
        source: "default",
        updatedAt: 1,
      },
      camera: {
        capability: "camera",
        decision: "denied",
        source: "default",
        updatedAt: 1,
      },
      screen: {
        capability: "screen",
        decision: "denied",
        source: "default",
        updatedAt: 1,
      },
      "tab-follow": {
        capability: "tab-follow",
        decision: "denied",
        source: "default",
        updatedAt: 1,
      },
    },
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
      sttBackend: "local-voice-whisper",
      ttsBackend: "voicevox",
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
    profile: {
      version: 1,
      displayName: "OpenClaw Companion",
      characterPrompt: "",
      greeting: "",
      mood: "neutral",
      voiceProfile: null,
      relationship: {
        level: 0,
        label: "new",
        updatedAt: null,
      },
      updatedAt: 1,
    },
    activeAssetId: null,
    activeAsset: null,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("renderer ui state helpers", () => {
  it("builds the setup checklist from asset and permission state", () => {
    const activeAsset = createAsset({
      id: "asset-active",
      fileName: "hakua.vrm",
      rightsAcknowledged: true,
    });
    const checklist = buildSetupChecklist({
      runtimeState: createRuntimeState({
        activeAssetId: activeAsset.id,
        activeAsset,
        permissions: {
          ...createRuntimeState().permissions,
          mic: {
            capability: "mic",
            decision: "granted",
            source: "user",
            updatedAt: 2,
          },
        },
      }),
      assets: [activeAsset],
    });

    expect(checklist.map((item) => item.id)).toEqual([
      "import-avatar",
      "confirm-rights",
      "enable-mic",
      "optional-camera",
      "optional-browser-follow",
    ]);
    expect(checklist.map((item) => item.complete)).toEqual([true, true, true, false, false]);
    expect(checklist[3]?.optional).toBe(true);
    expect(checklist[4]?.optional).toBe(true);
  });

  it("keeps asset library order and marks the active asset", () => {
    const first = createAsset({
      id: "asset-first",
      fileName: "first.vrm",
      importedAt: 10,
    });
    const second = createAsset({
      id: "asset-second",
      fileName: "second.fbx",
      assetType: "fbx",
      importedAt: 20,
    });

    const library = buildAssetLibraryView([first, second], second.id);

    expect(library.map((entry) => entry.id)).toEqual([first.id, second.id]);
    expect(library.map((entry) => entry.isActive)).toEqual([false, true]);
  });

  it("clears the active dialog when the panel closes", () => {
    const initial = createCompanionUiState({
      onboardingSeen: false,
      autoExpanded: true,
    });

    const withDialog = reduceCompanionUiState(initial, {
      type: "dialog/open",
      dialog: {
        kind: "permission",
        capability: "mic",
        title: "Microphone access",
        message: "Allow local microphone use",
      },
    });
    const closed = reduceCompanionUiState(withDialog, { type: "panel/collapse" });

    expect(withDialog.panelExpanded).toBe(true);
    expect(withDialog.activeDialog?.kind).toBe("permission");
    expect(closed.panelExpanded).toBe(false);
    expect(closed.activeDialog).toBeNull();
    expect(closed.onboardingSeen).toBe(true);
  });

  it("builds profile drafts and clamps the relationship patch", () => {
    const draft = createCompanionProfileDraft({
      version: 1,
      displayName: "Hakua",
      characterPrompt: "Local-first companion",
      greeting: "Welcome back",
      mood: "happy",
      voiceProfile: "VOICEVOX:8",
      relationship: {
        level: 42,
        label: "familiar",
        updatedAt: 123,
      },
      updatedAt: 456,
    });

    expect(draft).toMatchObject({
      displayName: "Hakua",
      mood: "happy",
      relationshipLevel: 42,
      relationshipLabel: "familiar",
    });

    const patch = buildCompanionProfilePatch({
      ...draft,
      voiceProfile: " ",
      relationshipLevel: 140,
    });

    expect(patch).toMatchObject({
      displayName: "Hakua",
      voiceProfile: null,
      relationship: {
        level: 100,
        label: "familiar",
      },
    });
  });
});
