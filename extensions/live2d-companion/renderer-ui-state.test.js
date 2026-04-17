import { describe, expect, it } from "vitest";
import { buildAssetLibraryView, buildSetupChecklist, createCompanionUiState, reduceCompanionUiState, } from "./renderer/ui-state.js";
function createAsset(params) {
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
function createRuntimeState(overrides = {}) {
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
});
