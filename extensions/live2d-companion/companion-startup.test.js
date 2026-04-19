import { describe, expect, it } from "vitest";
import { buildCompanionDiscoveryEntries, isSupportedCompanionModelPath, selectStartupCompanionAssetId, shouldAutoExpandCompanionPanel, sortCompanionModelCandidates, } from "./companion-startup.js";
function createAsset(params) {
    return {
        id: params.id,
        assetType: params.fileName.endsWith(".fbx") ? "fbx" : "vrm",
        fileName: params.fileName,
        sourcePath: `C:/avatars/${params.fileName}`,
        resolvedPath: `C:/avatars/${params.fileName}`,
        importMode: "local-reference",
        hashSha256: `${params.id}-hash`,
        importedAt: 1,
        licenseMemo: "local use",
        rightsAcknowledged: params.rightsAcknowledged ?? true,
        rightsAcknowledgedAt: params.rightsAcknowledged === false ? null : 1,
        remoteUploadForbidden: true,
    };
}
describe("companion startup helpers", () => {
    it("builds discovery entries from config and repo-local roots", () => {
        const repoRoot = "C:/repo";
        expect(buildCompanionDiscoveryEntries({
            repoRoot,
            configuredAvatarPath: "assets/NFD/Hakua/FBX/FBX/Hakua.fbx",
            configuredModelPath: "auto",
        })).toEqual([
            "C:\\repo\\assets\\NFD\\Hakua\\FBX\\FBX\\Hakua.fbx",
            "C:\\repo\\assets",
            "C:\\repo\\models",
        ]);
    });
    it("prefers repo assets and FBX or VRM before fallback model directories", () => {
        expect(sortCompanionModelCandidates([
            "C:/repo/models/placeholder/placeholder.model3.json",
            "C:/repo/assets/NFD/Hakua/FBX/FBX/Hakua.fbx",
            "C:/repo/assets/NFD/Hakua/FBX/FBX/Hakua_Head_ForMARUBODY.fbx",
            "C:/repo/assets/Avatar.vrm",
        ])).toEqual([
            "C:\\repo\\assets\\NFD\\Hakua\\FBX\\FBX\\Hakua.fbx",
            "C:\\repo\\assets\\NFD\\Hakua\\FBX\\FBX\\Hakua_Head_ForMARUBODY.fbx",
            "C:\\repo\\assets\\Avatar.vrm",
            "C:\\repo\\models\\placeholder\\placeholder.model3.json",
        ]);
    });
    it("restores the cached active asset when it is still present", () => {
        const first = createAsset({ id: "first", fileName: "hakua.fbx" });
        const second = createAsset({ id: "second", fileName: "backup.vrm" });
        expect(selectStartupCompanionAssetId({
            assets: [first, second],
            cachedActiveAssetId: second.id,
        })).toBe(second.id);
    });
    it("falls back to the first acknowledged asset when the cache is stale", () => {
        const pending = createAsset({
            id: "pending",
            fileName: "pending.fbx",
            rightsAcknowledged: false,
        });
        const ready = createAsset({ id: "ready", fileName: "ready.vrm" });
        expect(selectStartupCompanionAssetId({
            assets: [pending, ready],
            cachedActiveAssetId: "missing",
        })).toBe(ready.id);
    });
    it("keeps the panel open until a usable asset exists", () => {
        expect(shouldAutoExpandCompanionPanel({
            onboardingSeen: true,
            activeAssetId: null,
            assetCount: 0,
        })).toBe(true);
        expect(shouldAutoExpandCompanionPanel({
            onboardingSeen: true,
            activeAssetId: "asset-1",
            assetCount: 1,
        })).toBe(false);
    });
    it("accepts the supported avatar file formats only", () => {
        expect(isSupportedCompanionModelPath("Hakua.fbx")).toBe(true);
        expect(isSupportedCompanionModelPath("Hakua.vrm")).toBe(true);
        expect(isSupportedCompanionModelPath("Hakua.model3.json")).toBe(true);
        expect(isSupportedCompanionModelPath("Hakua.png")).toBe(false);
    });
});
